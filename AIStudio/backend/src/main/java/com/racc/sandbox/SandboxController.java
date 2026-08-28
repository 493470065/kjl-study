package com.racc.sandbox;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 沙箱接口。
 * 当前为占位实现，默认关闭。
 *
 * 前端 API 路径：/api/sandbox
 */
@RestController
@RequestMapping("/api/sandbox")
public class SandboxController {

    private final SandboxService service;

    public SandboxController(SandboxService service) {
        this.service = service;
    }

    /** GET /api/sandbox/status — 沙箱启用状态 */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(service.getStatus());
    }

    /** GET /api/sandbox/active — 活跃沙箱列表 */
    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> listActive() {
        return ResponseEntity.ok(service.listActive());
    }

    /** DELETE /api/sandbox/{taskId} — 销毁沙箱 */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> destroySandbox(@PathVariable String taskId) {
        service.destroySandbox(taskId);
        return ResponseEntity.ok().build();
    }
}