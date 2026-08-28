package com.racc.agent.controller;

import com.racc.agent.service.AgentConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Agent 配置接口。
 * 路由前缀：/api/agents/config
 *
 * 端点列表：
 * - GET    /api/agents/config          → 列表
 * - GET    /api/agents/config/{name}   → 详情
 * - POST   /api/agents/config          → 新建
 * - PUT    /api/agents/config/{name}   → 修改
 * - DELETE /api/agents/config/{name}   → 删除
 * - POST   /api/agents/config/reload   → 重载
 */
@RestController
@RequestMapping("/api/agents/config")
public class AgentConfigController {

    private final AgentConfigService service;

    public AgentConfigController(AgentConfigService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> listConfigs() {
        return ResponseEntity.ok(service.listConfigs());
    }

    @GetMapping("/{name}")
    public ResponseEntity<?> getConfig(@PathVariable String name) {
        try {
            return ResponseEntity.ok(service.getConfig(name));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createConfig(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.createConfig(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{name}")
    public ResponseEntity<?> updateConfig(@PathVariable String name, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.updateConfig(name, body));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteConfig(@PathVariable String name) {
        try {
            service.deleteConfig(name);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reload")
    public ResponseEntity<?> reloadConfigs() {
        return ResponseEntity.ok(service.reloadConfigs());
    }
}