package com.racc.knowledge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 多语专项资料自动入库服务：调用本机 kdocs-cli 拉取多语专项相关文档正文，
 * 以 sourceType=ml-special、category=多语专项 写入知识库（供 AI 阶段评估 RAG 检索）。
 *
 * 抽取策略（按文档类型自动路由）：
 *  - .otl  智能文档  → otl block-query 读根块，递归收集文本
 *  - .xlsx 表格      → sheet get-range-data 读前 N 行拼为文本
 *  - .pom  在线文字  → 暂无可用抽取通道，降级收录元数据（标题+摘要+链接）
 *
 * 幂等：按 (sourceType, title) 查重，已存在则先删后建（embedding/FTS 由 uploadDocument 自动重建）。
 * 前置：本机已安装 kdocs-cli 且已完成授权（kdocs-cli auth login）。
 */
@Service
public class MlDocsSyncService {

    private static final Logger log = LoggerFactory.getLogger(MlDocsSyncService.class);

    private static final String SOURCE_TYPE = "ml-special";
    private static final String CATEGORY = "多语专项";
    private static final String TAGS = "AI评估,多语专项,260330";

    /** 固定同步清单：多语专项核心资料（分享链接 ID + 标题 + 内容摘要） */
    private record DocSpec(String linkId, String title, String summary) {}

    private static final List<DocSpec> DOCS = List.of(
            new DocSpec("cbxysrydp6nH", "多语专项各条线任务跟踪表", "各条线任务分配与进度总表；多语专项里程碑/甘特图的数据来源与核对基准。"),
            new DocSpec("ctxxw9YWrqwN", "多语言技术对接方案", "多语产品对接文档：技术方案、接入方式与各条线改造要点。"),
            new DocSpec("cleqEEMGx6qW", "规划单圣保罗医院模块清单-V1.0", "越南项目上线产品清单（圣保罗医院模块规划）。"),
            new DocSpec("cuhQGt34FZSI", "如何识别代码仓库是否为原生产品", "代码仓库原生产品识别方法，合并前判断仓库归属与基线用。"),
            new DocSpec("ca7Owm2byuru", "多语分支策略", "多语分支管理策略：分支模型、合并规则与公版防污染约定。")
    );

    private final KnowledgeService knowledgeService;
    private final KnowledgeDocumentRepository repository;
    private final ObjectMapper om = new ObjectMapper();

    public MlDocsSyncService(KnowledgeService knowledgeService, KnowledgeDocumentRepository repository) {
        this.knowledgeService = knowledgeService;
        this.repository = repository;
    }

    /** 同步全部多语资料，返回每篇的处理结果 */
    public List<Map<String, Object>> syncAll() {
        List<Map<String, Object>> results = new ArrayList<>();
        for (DocSpec spec : DOCS) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("title", spec.title());
            try {
                Map<String, Object> info = getFileInfo(spec.linkId());
                String fileId = String.valueOf(info.get("id"));
                String name = String.valueOf(info.getOrDefault("name", spec.title()));
                String content = extract(name, fileId, spec);
                upsert(name, content, spec);
                r.put("ok", true);
                r.put("chars", content.length());
            } catch (Exception e) {
                log.warn("[多语入库] {} 失败: {}", spec.title(), e.toString());
                r.put("ok", false);
                r.put("error", e.getMessage());
            }
            results.add(r);
        }
        return results;
    }

    /** 按文档类型路由抽取 */
    private String extract(String name, String fileId, DocSpec spec) throws Exception {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".otl")) return extractOtl(fileId);
        if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".ksheet")) return extractSheet(fileId);
        // .pom（WPS 在线文字）等暂无可用抽取通道：降级为元数据收录
        return buildFallbackContent(name, spec);
    }

    /** otl 智能文档：读根块并递归收集所有文本 content */
    private String extractOtl(String fileId) throws Exception {
        JsonNode root = runCli(new String[]{resolveCli(), "otl", "block-query", "--silent"},
                om.writeValueAsString(Map.of("file_id", fileId, "params", Map.of("blockIds", List.of("doc")))));
        StringBuilder sb = new StringBuilder();
        collectText(root, sb);
        String text = sb.toString().replaceAll("\n{3,}", "\n\n").trim();
        if (text.isEmpty()) throw new IllegalStateException("otl 未抽取到正文");
        return text;
    }

    /** 递归收集 JSON 中所有名为 content 的文本字段（otl 块树的叶子文本） */
    private void collectText(JsonNode node, StringBuilder sb) {
        if (node == null) return;
        if (node.isObject()) {
            node.fields().forEachRemaining(e -> {
                if ("content".equals(e.getKey()) && e.getValue().isTextual()) {
                    String t = e.getValue().asText("").trim();
                    if (!t.isEmpty()) sb.append(t).append('\n');
                } else {
                    collectText(e.getValue(), sb);
                }
            });
        } else if (node.isArray()) {
            for (JsonNode c : node) collectText(c, sb);
        }
    }

    /** xlsx 表格：读前 60 行 × 13 列，按行拼接为文本 */
    private String extractSheet(String fileId) throws Exception {
        Map<String, Object> range = new LinkedHashMap<>();
        range.put("rowFrom", 1);
        range.put("rowTo", 60);
        range.put("colFrom", 0);
        range.put("colTo", 12);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("file_id", fileId);
        params.put("sheetId", 1);
        params.put("range", range);
        JsonNode root = runCli(new String[]{resolveCli(), "sheet", "get-range-data", "--silent"},
                om.writeValueAsString(params));
        JsonNode cells = root.path("detail").path("rangeData");
        if (cells.isMissingNode() || cells.isNull() || !cells.isArray()) {
            throw new IllegalStateException("表格无可用数据（rangeData 为空）");
        }
        Map<Long, String> grid = new HashMap<>();
        for (JsonNode c : cells) {
            String text = c.path("cellText").asText("").trim();
            int rf = c.path("rowFrom").asInt(), rt = c.path("rowTo").asInt();
            int cf = c.path("colFrom").asInt(), ct = c.path("colTo").asInt();
            for (int r = rf; r <= rt; r++) {
                for (int col = cf; col <= ct; col++) {
                    boolean origin = (r == rf && col == cf);
                    grid.put((long) r * 100 + col, origin ? text : "");
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int r = 1; r <= 60; r++) {
            StringBuilder row = new StringBuilder();
            for (int col = 0; col <= 12; col++) {
                String v = grid.getOrDefault((long) r * 100 + col, "").trim();
                if (!v.isEmpty()) row.append(v).append(" | ");
            }
            String line = row.toString().replaceAll("\\|\\s*$", "").trim();
            if (!line.isEmpty()) sb.append(line).append('\n');
        }
        String text = sb.toString().trim();
        if (text.isEmpty()) throw new IllegalStateException("表格未抽取到内容");
        return "（表格内容，按行展示）\n" + text;
    }

    /** 无法抽取正文时的降级内容：元数据 + 摘要 + 链接 */
    private String buildFallbackContent(String name, DocSpec spec) {
        return String.join("\n",
                "【文档概述】" + spec.summary(),
                "【文档类型】" + name + "（WPS 在线文字，暂不支持自动抽取正文）",
                "【原文链接】https://www.kdocs.cn/l/" + spec.linkId(),
                "【评估用途】该文档是多语专项" + CATEGORY + "的核心规范之一：涉及分支模型、合并规则与公版防污染约定；",
                "AI 阶段评估涉及合并合规与污染风险判断时，应提示评估人查阅原文链接核对细节。");
    }

    /** 幂等入库：按 (sourceType, title) 先删后建，embedding/FTS 由 uploadDocument 自动完成 */
    private void upsert(String name, String content, DocSpec spec) {
        String title = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
        List<KnowledgeDocumentEntity> existing = repository.findBySourceTypeAndTitle(SOURCE_TYPE, title);
        for (KnowledgeDocumentEntity e : existing) knowledgeService.deleteDocument(e.getId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", title);
        body.put("content", content);
        body.put("category", CATEGORY);
        body.put("sourceType", SOURCE_TYPE);
        body.put("tags", TAGS);
        body.put("fileName", name);
        body.put("sourceUrl", "https://www.kdocs.cn/l/" + spec.linkId());
        knowledgeService.uploadDocument(body);
    }

    /** link_id → 文件信息（drive_id/file_id/name） */
    private Map<String, Object> getFileInfo(String linkId) throws Exception {
        JsonNode data = runCli(new String[]{resolveCli(), "drive", "get-file-info", "--silent"},
                om.writeValueAsString(Map.of("link_id", linkId)));
        JsonNode d = data.path("data");
        if (d.isMissingNode() || d.isNull()) throw new IllegalStateException("获取文件信息失败");
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", d.path("id").asText(""));
        info.put("name", d.path("name").asText(""));
        info.put("drive_id", d.path("drive_id").asText(""));
        return info;
    }

    /** 解析 kdocs-cli 可执行文件路径（与 WbsSyncService 同策略） */
    private String resolveCli() {
        String env = System.getenv("KDOCS_CLI");
        if (env != null && !env.isBlank()) return env;
        String localAppData = System.getenv("LOCALAPPDATA");
        if (localAppData != null) {
            java.io.File f = new java.io.File(localAppData, "kdocs-cli/kdocs-cli.exe");
            if (f.exists()) return f.getAbsolutePath();
        }
        for (String dir : System.getenv("PATH").split(";")) {
            java.io.File f = new java.io.File(dir.trim(), "kdocs-cli.exe");
            if (f.exists()) return f.getAbsolutePath();
            java.io.File f2 = new java.io.File(dir.trim(), "kdocs-cli");
            if (f2.exists()) return f2.getAbsolutePath();
        }
        return "kdocs-cli";
    }

    /**
     * 调用 CLI 并解析 JSON 输出（code!=0 抛异常）。
     * JSON 参数经 stdin 传入：Windows 进程传参会剥掉内联 JSON 的双引号导致 CLI 解析失败。
     */
    private JsonNode runCli(String[] cmd, String jsonPayload) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(false);
        Process proc = pb.start();
        // 写 stdin
        Thread in = new Thread(() -> {
            try (var os = proc.getOutputStream()) {
                os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (Exception ignore) { }
        });
        in.start();
        StringBuilder out = new StringBuilder();
        StringBuilder err = new StringBuilder();
        Thread t1 = new Thread(() -> read(proc, out));
        Thread t2 = new Thread(() -> readErr(proc, err));
        t1.start();
        t2.start();
        if (!proc.waitFor(120, TimeUnit.SECONDS)) {
            proc.destroyForcibly();
            throw new IllegalStateException("kdocs-cli 调用超时: " + cmd[1] + " " + cmd[2]);
        }
        t1.join(5000);
        t2.join(5000);
        in.join(5000);
        int code = proc.exitValue();
        String outStr = out.toString();
        if (code != 0 || outStr.isEmpty()) {
            throw new IllegalStateException("kdocs-cli 调用失败(exit=" + code + ")：" + snippet(outStr + " " + err));
        }
        JsonNode root = om.readTree(outStr);
        if (root.path("code").asInt(0) != 0) {
            throw new IllegalStateException(root.path("code").asInt() == 400006
                    ? "金山文档 Token 已失效，请在本机执行 kdocs-cli auth login 重新授权"
                    : "kdocs-cli 错误码 " + root.path("code").asInt() + "：" + snippet(root.path("message").asText(outStr)));
        }
        return root;
    }

    private void read(Process p, StringBuilder sb) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignore) { }
    }

    private void readErr(Process p, StringBuilder sb) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getErrorStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignore) { }
    }

    private String snippet(String s) {
        s = s == null ? "" : s.replaceAll("\\s+", " ");
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }
}
