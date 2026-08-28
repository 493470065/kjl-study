package com.racc.userconfig.controller;

import com.racc.user.UserRepository;
import com.racc.userconfig.service.UserConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户个人配置接口。
 * GET  /api/user/config/llm  → 当前用户 LLM 配置
 * POST /api/user/config/llm  → 保存 LLM 配置
 * GET  /api/user/config/tfs  → 当前用户 TFS 配置
 * POST /api/user/config/tfs  → 保存 TFS 配置
 */
@RestController
@RequestMapping("/api/user/config")
public class UserConfigController {

    private final UserConfigService userConfigService;
    private final UserRepository userRepository;

    public UserConfigController(UserConfigService userConfigService,
                                UserRepository userRepository) {
        this.userConfigService = userConfigService;
        this.userRepository = userRepository;
    }

    // ========== LLM 配置 ==========

    @GetMapping("/llm")
    public ResponseEntity<?> getLlmConfig() {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        return ResponseEntity.ok(userConfigService.getLlmConfig(userId));
    }

    @PostMapping("/llm")
    public ResponseEntity<?> saveLlmConfig(@RequestBody Map<String, Object> body) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        userConfigService.saveLlmConfig(userId, body);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ========== TFS 配置 ==========

    @GetMapping("/tfs")
    public ResponseEntity<?> getTfsConfig() {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        return ResponseEntity.ok(userConfigService.getTfsConfig(userId));
    }

    @PostMapping("/tfs")
    public ResponseEntity<?> saveTfsConfig(@RequestBody Map<String, Object> body) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        userConfigService.saveTfsConfig(userId, body);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ========== 辅助 ==========

    /**
     * 从 SecurityContextHolder 获取当前登录用户名，再查询 userId。
     */
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