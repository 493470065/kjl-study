package com.racc.userpref.controller;

import com.fasterxml.jackson.databind.node.NullNode;
import com.racc.user.UserRepository;
import com.racc.userpref.service.UserPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户个人偏好配置接口（通用 KV）。
 * GET /api/user/prefs/{key}  → {"value": <json|null>}
 * PUT /api/user/prefs/{key}  → body 为 JSON 原文，原样存取
 */
@RestController
@RequestMapping("/api/user/prefs")
public class UserPreferenceController {

    private final UserPreferenceService userPreferenceService;
    private final UserRepository userRepository;

    public UserPreferenceController(UserPreferenceService userPreferenceService,
                                    UserRepository userRepository) {
        this.userPreferenceService = userPreferenceService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getPref(@PathVariable String key) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        try {
            String value = userPreferenceService.getPref(userId, key);
            // Jackson NullNode：Map 中带 null 语义，确保无值时序列化为 {"value":null}（与原设计的 JSONObject.NULL 等价）
            return ResponseEntity.ok(Map.of("value", value == null ? NullNode.getInstance() : value));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{key}")
    public ResponseEntity<?> savePref(@PathVariable String key, @RequestBody String body) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        try {
            userPreferenceService.savePref(userId, key, body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** 从 SecurityContextHolder 获取当前登录用户名，再查询 userId（与 UserConfigController 一致）。 */
    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = String.valueOf(auth.getPrincipal());
        return userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElse(null);
    }
}
