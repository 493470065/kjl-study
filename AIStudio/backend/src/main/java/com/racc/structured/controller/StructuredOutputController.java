package com.racc.structured.controller;

import com.racc.structured.service.StructuredOutputService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 结构化输出接口。
 * 路由前缀：/api/structured
 *
 * 端点列表：
 * - POST /api/structured/analyze-requirement  → 结构化需求分析
 * - POST /api/structured/analyze-code         → 代码分析
 * - GET  /api/structured/schemas              → JSON Schema
 */
@RestController
@RequestMapping("/api/structured")
public class StructuredOutputController {

    private final StructuredOutputService service;

    public StructuredOutputController(StructuredOutputService service) {
        this.service = service;
    }

    @PostMapping("/analyze-requirement")
    public ResponseEntity<?> analyzeRequirement(@RequestBody Map<String, Object> body) {
        String requirement = (String) body.getOrDefault("requirement", "");
        String context = (String) body.get("context");
        return ResponseEntity.ok(service.analyzeRequirement(requirement, context));
    }

    @PostMapping("/analyze-code")
    public ResponseEntity<?> analyzeCode(@RequestBody Map<String, Object> body) {
        String code = (String) body.getOrDefault("code", "");
        String fileName = (String) body.get("fileName");
        String context = (String) body.get("context");
        return ResponseEntity.ok(service.analyzeCode(code, fileName, context));
    }

    @GetMapping("/schemas")
    public ResponseEntity<?> getSchemas() {
        return ResponseEntity.ok(service.getSchemas());
    }
}