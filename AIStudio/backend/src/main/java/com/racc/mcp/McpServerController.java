package com.racc.mcp;

import com.racc.mcp.entity.McpServerEntity;
import com.racc.mcp.entity.McpToolInfo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * MCP Server 管理接口
 *  GET    /api/mcp/servers               → 列表
 *  GET    /api/mcp/servers/{id}          → 详情
 *  POST   /api/mcp/servers/upload        → 上传 zip
 *  POST   /api/mcp/servers/create        → 手动配置
 *  PUT    /api/mcp/servers/{id}          → 修改配置
 *  POST   /api/mcp/servers/{id}/start    → 启动
 *  POST   /api/mcp/servers/{id}/stop     → 停止
 *  DELETE /api/mcp/servers/{id}          → 删除
 *  GET    /api/mcp/servers/{id}/tools    → 工具列表
 *  POST   /api/mcp/servers/load-from-file → 从文件加载
 */
@RestController
@RequestMapping("/api/mcp/servers")
public class McpServerController {

    private final McpServerService service;

    public McpServerController(McpServerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<McpServerEntity>> listServers() {
        return ResponseEntity.ok(service.listServers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<McpServerEntity> getServer(@PathVariable Long id) {
        return ResponseEntity.ok(service.getServer(id));
    }

    @PostMapping("/upload")
    public ResponseEntity<McpServerEntity> uploadServer(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(service.uploadServer(name, file, displayName, description));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createServer(@RequestBody McpServerEntity entity) {
        if (entity.getName() == null || entity.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MCP Server 名称(name)不能为空"));
        }
        if (entity.getCommand() == null || entity.getCommand().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MCP Server 启动命令(command)不能为空"));
        }
        return ResponseEntity.ok(service.createServer(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<McpServerEntity> updateServer(@PathVariable Long id,
                                                        @RequestBody McpServerEntity patch) {
        try {
            return ResponseEntity.ok(service.updateServer(id, patch));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<McpServerEntity> startServer(@PathVariable Long id) {
        return ResponseEntity.ok(service.startServer(id));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<McpServerEntity> stopServer(@PathVariable Long id) {
        return ResponseEntity.ok(service.stopServer(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteServer(@PathVariable Long id) {
        service.deleteServer(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/tools")
    public ResponseEntity<List<McpToolInfo>> getServerTools(@PathVariable Long id) {
        return ResponseEntity.ok(service.getServerTools(id));
    }

    /** 连通性测试：真实拉起进程做 MCP 握手 + tools/list */
    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.testConnection(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage() == null ? "服务不存在" : e.getMessage()));
        }
    }

    @PostMapping("/load-from-file")
    public ResponseEntity<McpServerEntity> loadFromFile(@RequestBody Map<String, String> body) {
        String filePath = body.get("filePath");
        if (filePath == null || filePath.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.loadFromFile(filePath));
    }
}