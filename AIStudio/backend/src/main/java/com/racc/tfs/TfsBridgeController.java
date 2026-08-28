package com.racc.tfs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletResponse;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PushbackInputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * TFS 桥接：需求看板 /api/tfs/*。返回透传 MCP 工具 JSON（与 formatWorkItem 对齐，前端零改动）。
 * 项目无全局异常处理：每端点 try-catch，失败返回 {error} + 502/404。
 */
@RestController
@RequestMapping("/api/tfs")
public class TfsBridgeController {

    private static final Logger log = LoggerFactory.getLogger(TfsBridgeController.class);

    private final TfsBridgeService bridge;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /** status 探测缓存：避免每次打开看板都 spawn node 进程 */
    private record StatusCache(long ts, Map<String, Object> body) {}
    private volatile StatusCache statusCache;
    private static final long STATUS_TTL_MS = 60_000L;

    public TfsBridgeController(TfsBridgeService bridge, ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.bridge = bridge;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    // ---------- 1) status：恒 200 ----------
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        StatusCache c = statusCache;
        if (c != null && System.currentTimeMillis() - c.ts < STATUS_TTL_MS) {
            return ResponseEntity.ok(c.body);
        }
        Map<String, Object> body;
        try {
            // 注意：list_projects 是 MCP Server 本地数据，只探测桥接链路（进程+握手），不探测 TFS 连通性
            bridge.callToolJson("list_projects", Map.of());
            body = Map.of("available", true, "message", "TFS 桥接就绪");
        } catch (Exception e) {
            body = Map.of("available", false, "message", e.getMessage());
        }
        statusCache = new StatusCache(System.currentTimeMillis(), body);
        return ResponseEntity.ok(body);
    }

    // ---------- 2) projects ----------
    @GetMapping("/projects")
    public ResponseEntity<JsonNode> projects() {
        try {
            return ResponseEntity.ok(bridge.callToolJson("list_projects", Map.of()));
        } catch (Exception e) {
            return error(502, e);
        }
    }

    // ---------- 3) query：两个 Tab 共用 ----------
    @GetMapping("/query")
    public ResponseEntity<JsonNode> query(@RequestParam String queryId,
                                          @RequestParam(required = false) String project) {
        try {
            Map<String, Object> args = new LinkedHashMap<>();
            args.put("queryId", queryId);   // UUID 含横线，不会被参数清洗误转数值
            if (project != null && !project.isBlank()) args.put("project", project);
            return ResponseEntity.ok(bridge.callToolJson("run_stored_query", args)); // 数组透传
        } catch (Exception e) {
            return error(502, e);
        }
    }

    // ---------- 4) 单个工作项 ----------
    @GetMapping("/work-items/{id}")
    public ResponseEntity<JsonNode> workItem(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bridge.callToolJson("get_work_item", Map.of("id", id)));
        } catch (Exception e) {
            return error(502, e);
        }
    }

    // ---------- 5) batch ----------
    // 路由说明：字面量 "batch" 优先于 {id} 模板，不会被 Long 解析误吞
    @GetMapping("/work-items/batch")
    public ResponseEntity<JsonNode> batch(@RequestParam String ids) {
        try {
            // callTool 参数清洗只转「顶层纯数字字符串」；"1,2,3" 会原样保留为字符串，
            // 故此处必须自行 split 成 List<Long>（MCP 侧 ids schema 是 number 数组）
            List<Long> idList = Arrays.stream(ids.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .toList();
            if (idList.isEmpty()) return ResponseEntity.ok(objectMapper.createArrayNode());
            return ResponseEntity.ok(bridge.callToolJson("get_work_items", Map.of("ids", idList)));
        } catch (NumberFormatException e) {
            return error(400, new IllegalArgumentException("ids 参数非法: " + ids));
        } catch (Exception e) {
            return error(502, e);
        }
    }

    // ---------- 6) 附件列表：url 改写为后端代理 ----------
    @GetMapping("/work-items/{id}/attachments")
    public ResponseEntity<JsonNode> attachments(@PathVariable Long id) {
        try {
            // list_attachments 返回包裹对象 {workItemId, attachmentCount, attachments:[...]}
            JsonNode root = bridge.callToolJson("list_attachments", Map.of("id", id));
            ArrayNode arr = objectMapper.createArrayNode();
            for (JsonNode a : root.path("attachments")) {
                int index = a.path("index").asInt();
                arr.addObject()
                        .put("index", index)
                        .put("name", a.path("name").asText(""))
                        // TFS 附件原始 URL 需 PAT，浏览器直开 401 → 改写为代理地址（同源相对路径）
                        .put("url", "/api/tfs/work-items/" + id + "/attachments/" + index + "/download");
            }
            return ResponseEntity.ok(arr);
        } catch (Exception e) {
            return error(502, e);
        }
    }

    // ---------- 7) 附件下载代理：RestTemplate + PAT 流式转发 ----------
    @GetMapping("/work-items/{id}/attachments/{index}/download")
    public void download(@PathVariable Long id, @PathVariable int index,
                         HttpServletResponse response) {
        try {
            JsonNode root = bridge.callToolJson("list_attachments", Map.of("id", id));
            JsonNode target = null;
            for (JsonNode a : root.path("attachments")) {
                if (a.path("index").asInt(-1) == index) { target = a; break; }
            }
            if (target == null || target.path("url").asText("").isBlank()) {
                response.sendError(404, "附件不存在: index=" + index);
                return;
            }
            String originalUrl = target.path("url").asText();
            String fileName = target.path("name").asText("attachment-" + index);

            var conn = bridge.readConnection();

            // 中文文件名：RFC 5987 filename* 双写
            String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
            response.setContentType("application/octet-stream");
            response.setHeader("Content-Disposition",
                    "attachment; filename=\"" + fileName.replaceAll("[\r\n\"]", "_")
                            + "\"; filename*=UTF-8''" + encoded);

            // 流式转发，不整块进内存。
            // 注意：TFS 2018 附件响应恒为 gzip 压缩且不带 Content-Encoding 头，
            // 需按魔数(0x1f 0x8b)探测并解压，否则浏览器存出坏文件
            restTemplate.execute(originalUrl, HttpMethod.GET,
                    req -> req.getHeaders().set("Authorization",
                            "Basic " + Base64.getEncoder().encodeToString(
                                    (":" + conn.pat()).getBytes(StandardCharsets.UTF_8))),
                    resp -> {
                        String ct = resp.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
                        if (ct != null) response.setContentType(ct);
                        try (InputStream raw = resp.getBody();
                             PushbackInputStream pb = new PushbackInputStream(raw, 2);
                             OutputStream out = response.getOutputStream()) {
                            int b1 = pb.read();
                            int b2 = pb.read();
                            if (b2 != -1) pb.unread(b2);
                            if (b1 != -1) pb.unread(b1);
                            InputStream src;
                            if (b1 == 0x1f && b2 == 0x8b) {
                                src = new java.util.zip.GZIPInputStream(pb); // 解压后长度未知，不设 Content-Length
                            } else {
                                long len = resp.getHeaders().getContentLength();
                                if (len > 0) response.setContentLengthLong(len);
                                src = pb;
                            }
                            src.transferTo(out);
                        }
                        return null;
                    });
        } catch (Exception e) {
            log.error("附件下载代理失败: workItem={}, index={}", id, index, e);
            try {
                if (!response.isCommitted()) response.sendError(502, "附件下载失败: " + e.getMessage());
            } catch (Exception ignored) { /* 响应已提交，只能断开 */ }
        }
    }

    // ---------- 8/9) create / update（P2：前端契约已定义，本页未用） ----------
    @PostMapping("/work-items")
    public ResponseEntity<JsonNode> create(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("System.Title", String.valueOf(body.getOrDefault("title", "")));
            putIfNotNull(fields, "System.Description", body.get("description"));
            putIfNotNull(fields, "System.AssignedTo", body.get("assignedTo"));
            putIfNotNull(fields, "Microsoft.VSTS.Common.Priority", body.get("priority"));
            putIfNotNull(fields, "System.Tags", body.get("tags"));
            Map<String, Object> args = new LinkedHashMap<>();
            args.put("project", body.get("project"));
            args.put("workItemType", body.get("type"));
            args.put("fields", fields);
            if (body.get("parentId") instanceof Number n) args.put("parentId", n.longValue());
            JsonNode result = bridge.callToolJson("create_work_item", args);
            return ResponseEntity.ok(result.path("workItem"));
        } catch (Exception e) {
            return error(502, e);
        }
    }

    @PutMapping("/work-items/{id}")
    public ResponseEntity<JsonNode> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> args = new LinkedHashMap<>();
            args.put("id", id);
            args.put("updates", body.getOrDefault("updates", Map.of()));
            if (body.get("comment") != null) args.put("comment", body.get("comment"));
            JsonNode result = bridge.callToolJson("update_work_item", args);
            return ResponseEntity.ok(result.path("workItem"));
        } catch (Exception e) {
            return error(502, e);
        }
    }

    private static void putIfNotNull(Map<String, Object> m, String k, Object v) {
        if (v != null && !String.valueOf(v).isBlank()) m.put(k, v);
    }

    private ResponseEntity<JsonNode> error(int code, Exception e) {
        log.warn("TFS 桥接失败: {}", e.getMessage());
        return ResponseEntity.status(code)
                .body(objectMapper.createObjectNode().put("error", e.getMessage()));
    }
}
