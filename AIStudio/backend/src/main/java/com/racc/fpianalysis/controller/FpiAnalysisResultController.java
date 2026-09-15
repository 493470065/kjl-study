package com.racc.fpianalysis.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import com.racc.fpianalysis.service.FpiAnalysisResultService;
import com.racc.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 合理性设计分析结果缓存接口。
 * GET    /api/fpi-analysis/{lineKey}/{fpCode} → {"value": {...}|null}
 * PUT    /api/fpi-analysis/{lineKey}/{fpCode} ← body: {resultMd, skillName, dataFingerprint, fpSnapshot, fpName, execDurationMs}
 * DELETE /api/fpi-analysis/{lineKey}/{fpCode}
 * 数据按登录用户隔离（userId 从 SecurityContextHolder 解析）。
 */
@RestController
@RequestMapping("/api/fpi-analysis")
public class FpiAnalysisResultController {

    private final FpiAnalysisResultService service;
    private final UserRepository userRepository;

    public FpiAnalysisResultController(FpiAnalysisResultService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> get(@PathVariable String lineKey, @PathVariable String fpCode) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            FpiAnalysisResultEntity e = service.get(userId, lineKey, fpCode);
            // Map.of 不允许 null 值：value 为 null 时用 HashMap 承载（无记录 → {"value":null}）
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("value", toDto(e));
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> save(@PathVariable String lineKey, @PathVariable String fpCode,
                                  @RequestBody JsonNode body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            service.save(userId, lineKey, fpCode,
                    textOrNull(body, "fpName"),
                    textOrNull(body, "skillName"),
                    textOrNull(body, "resultMd"),
                    textOrNull(body, "dataFingerprint"),
                    textOrNull(body, "fpSnapshot"),
                    longOrNull(body, "execDurationMs"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> remove(@PathVariable String lineKey, @PathVariable String fpCode) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            service.remove(userId, lineKey, fpCode);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private Map<String, Object> toDto(FpiAnalysisResultEntity e) {
        if (e == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("fpName", e.getFpName());
        m.put("skillName", e.getSkillName());
        m.put("resultMd", e.getResultMd());
        m.put("dataFingerprint", e.getDataFingerprint());
        m.put("fpSnapshot", e.getFpSnapshot());
        m.put("execDurationMs", e.getExecDurationMs());
        m.put("createdAt", e.getCreatedAt() == null ? null : e.getCreatedAt().toString());
        m.put("updatedAt", e.getUpdatedAt() == null ? null : e.getUpdatedAt().toString());
        return m;
    }

    private static String textOrNull(JsonNode body, String field) {
        return body == null || !body.hasNonNull(field) ? null : body.get(field).asText();
    }

    private static Long longOrNull(JsonNode body, String field) {
        return body == null || !body.hasNonNull(field) ? null : body.get(field).asLong();
    }

    /** 与 UserPreferenceController 一致：从 SecurityContextHolder 取当前用户名再查 userId。 */
    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = String.valueOf(auth.getPrincipal());
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}
