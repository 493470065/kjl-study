package com.racc.sandbox;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 沙箱接口。
 * 沙箱 = 受控命令执行环境（LOCAL 本地进程 / DOCKER 容器预留，不可用自动降级）。
 *
 * GET    /api/sandbox/status                    沙箱启用状态与引擎能力（含 enabled 兼容键）
 * GET    /api/sandbox                           沙箱列表（全量，倒序）
 * GET    /api/sandbox/active                    活跃沙箱列表（旧契约：每项含 taskId + status）
 * POST   /api/sandbox/create                    创建沙箱 {name 必填, taskId?, mode?, timeoutSeconds?}
 * POST   /api/sandbox/config                    更新运行时开关 {enabled?, dockerEnabled?}，写 system_configs 即时生效
 * POST   /api/sandbox/{id}/exec                 在沙箱内异步执行命令 {command 必填, timeoutSeconds?}
 * GET    /api/sandbox/{id}/executions           执行历史（不含 output 大字段）
 * GET    /api/sandbox/executions/{executionId}  执行详情（全量含 output）
 * DELETE /api/sandbox/{sandboxKey}              销毁沙箱（key 兼容：数字按沙箱 id，否则按 taskId）
 */
@RestController
@RequestMapping("/api/sandbox")
public class SandboxController {

    private final SandboxService service;

    public SandboxController(SandboxService service) {
        this.service = service;
    }

    /** GET /api/sandbox/status — 沙箱启用状态与引擎能力 */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(service.getStatus());
    }

    /** GET /api/sandbox — 沙箱列表 */
    @GetMapping
    public ResponseEntity<List<SandboxEntity>> listSandboxes() {
        return ResponseEntity.ok(service.listSandboxes());
    }

    /** GET /api/sandbox/active — 活跃沙箱列表（旧契约） */
    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> listActive() {
        return ResponseEntity.ok(service.listActive());
    }

    /** POST /api/sandbox/create — 创建沙箱 */
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String name = body.get("name") instanceof String s ? s : null;
            String taskId = body.get("taskId") instanceof String s ? s : null;
            String mode = body.get("mode") instanceof String s ? s : null;
            Integer timeoutSeconds = body.get("timeoutSeconds") instanceof Number n ? n.intValue() : null;
            return ResponseEntity.ok(service.createSandbox(name, taskId, mode, timeoutSeconds));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/sandbox/config — 更新运行时开关（写 system_configs，即时生效无需重启），返回最新完整状态 */
    @PostMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody Map<String, Object> body) {
        boolean changed = false;
        if (body.get("enabled") instanceof Boolean b) {
            service.setRuntimeEnabled(b);
            changed = true;
        }
        if (body.get("dockerEnabled") instanceof Boolean b) {
            service.setDockerRuntimeEnabled(b);
            changed = true;
        }
        if (!changed) {
            return ResponseEntity.badRequest().body(Map.of("error", "enabled 或 dockerEnabled 必须是布尔值"));
        }
        return ResponseEntity.ok(service.getStatus());
    }

    /** POST /api/sandbox/{id}/exec — 在沙箱内异步执行命令（立即返回执行记录） */
    @PostMapping("/{id}/exec")
    public ResponseEntity<?> exec(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String command = body.get("command") instanceof String s ? s : null;
            Integer timeoutSeconds = body.get("timeoutSeconds") instanceof Number n ? n.intValue() : null;
            return ResponseEntity.ok(service.execCommand(id, command, timeoutSeconds));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/sandbox/{id}/executions — 执行历史 */
    @GetMapping("/{id}/executions")
    public ResponseEntity<?> listExecutions(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.listExecutions(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/sandbox/executions/{executionId} — 执行详情（含 output） */
    @GetMapping("/executions/{executionId}")
    public ResponseEntity<?> getExecution(@PathVariable Long executionId) {
        try {
            return ResponseEntity.ok(service.getExecution(executionId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/sandbox/{sandboxKey} — 销毁沙箱（数字按沙箱 id，否则按 taskId） */
    @DeleteMapping("/{sandboxKey}")
    public ResponseEntity<?> destroySandbox(@PathVariable String sandboxKey) {
        try {
            service.destroySandboxByKey(sandboxKey);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
