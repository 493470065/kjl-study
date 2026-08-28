package com.racc.llm.controller;

import com.racc.llm.service.LlmProviderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * LLM Provider 接口。
 *  GET    /api/llm/providers          → 列表
 *  POST   /api/llm/providers          → 新增
 *  PUT    /api/llm/providers/{id}     → 编辑
 *  DELETE /api/llm/providers/{id}     → 删除
 *  POST   /api/llm/providers/{id}/activate → 设为默认
 */
@RestController
@RequestMapping("/api/llm/providers")
public class LlmProviderController {

    private final LlmProviderService service;

    public LlmProviderController(LlmProviderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> listProviders() {
        return ResponseEntity.ok(service.listProviders());
    }

    @PostMapping
    public ResponseEntity<?> createProvider(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.createProvider(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProvider(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.updateProvider(id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProvider(@PathVariable Long id) {
        try {
            service.deleteProvider(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateProvider(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.activateProvider(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}