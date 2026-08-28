package com.racc.user.service;

import com.racc.llm.entity.LlmProviderEntity;
import com.racc.llm.repository.LlmProviderRepository;
import com.racc.user.UserRepository;
import com.racc.user.entity.UserEntity;
import com.racc.user.entity.UserLlmConfigEntity;
import com.racc.user.repository.UserLlmConfigRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户管理服务。
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserLlmConfigRepository llmConfigRepository;
    private final LlmProviderRepository llmProviderRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       UserLlmConfigRepository llmConfigRepository,
                       LlmProviderRepository llmProviderRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.llmConfigRepository = llmConfigRepository;
        this.llmProviderRepository = llmProviderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 获取用户列表，含 LLM 配置信息。
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserInfoMap)
                .collect(Collectors.toList());
    }

    /**
     * 新增用户。
     */
    public Map<String, Object> createUser(Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("密码长度不能少于6位");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }

        UserEntity user = new UserEntity();
        user.setUsername(username.trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName((String) body.getOrDefault("displayName", ""));
        user.setEmpNo((String) body.getOrDefault("empNo", ""));
        user.setRole((String) body.getOrDefault("role", "USER"));
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // 处理 allowedMenus
        Object menus = body.get("allowedMenus");
        if (menus instanceof String) {
            user.setAllowedMenus((String) menus);
        } else if (menus instanceof List) {
            user.setAllowedMenus(String.join(",", (List<String>) menus));
        }

        user = userRepository.save(user);
        return toUserInfoMap(user);
    }

    /**
     * 编辑用户。
     */
    public Map<String, Object> updateUser(Long id, Map<String, Object> body) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("用户不存在"));

        if (body.containsKey("username")) {
            String newUsername = (String) body.get("username");
            if (newUsername != null && !newUsername.isBlank()
                    && !newUsername.equals(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new IllegalArgumentException("用户名已存在");
                }
                user.setUsername(newUsername.trim());
            }
        }
        if (body.containsKey("displayName")) {
            user.setDisplayName((String) body.get("displayName"));
        }
        if (body.containsKey("empNo")) {
            user.setEmpNo((String) body.get("empNo"));
        }
        if (body.containsKey("role")) {
            user.setRole((String) body.get("role"));
        }
        if (body.containsKey("enabled")) {
            user.setEnabled((Boolean) body.get("enabled"));
        }
        if (body.containsKey("password")) {
            String pwd = (String) body.get("password");
            if (pwd != null && !pwd.isBlank()) {
                user.setPassword(passwordEncoder.encode(pwd));
            }
        }
        if (body.containsKey("allowedMenus")) {
            Object menus = body.get("allowedMenus");
            if (menus instanceof String) {
                user.setAllowedMenus((String) menus);
            } else if (menus instanceof List) {
                user.setAllowedMenus(String.join(",", (List<String>) menus));
            }
        }

        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return toUserInfoMap(user);
    }

    /**
     * 删除用户（admin 用户不可删除）。
     */
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("用户不存在"));
        if ("admin".equals(user.getUsername())) {
            throw new IllegalArgumentException("不能删除 admin 用户");
        }
        // 同时删除关联的 LLM 配置
        llmConfigRepository.findByUserId(id).ifPresent(llmConfigRepository::delete);
        userRepository.delete(user);
    }

    /**
     * 重置密码。
     */
    public void resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("密码长度不能少于6位");
        }
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("用户不存在"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * 查看用户 LLM 配置。
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserLlmConfig(Long userId) {
        UserLlmConfigEntity config = llmConfigRepository.findByUserId(userId).orElse(null);
        if (config == null) {
            return Collections.emptyMap();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", config.getId());
        result.put("userId", config.getUserId());
        result.put("providerId", config.getProviderId());
        result.put("modelName", config.getModelName());
        result.put("apiKey", config.getApiKey());
        result.put("enabled", config.getEnabled());

        // 补充 provider 名称
        if (config.getProviderId() != null) {
            llmProviderRepository.findById(config.getProviderId()).ifPresent(provider ->
                    result.put("providerName", provider.getDisplayName()));
        }
        return result;
    }

    // ========== 内部工具 ==========

    /**
     * 将 UserEntity 转换为前端所需的 UserInfo 格式。
     * 包含 llmProvider / llmModel 字段。
     */
    private Map<String, Object> toUserInfoMap(UserEntity user) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("displayName", user.getDisplayName());
        info.put("empNo", user.getEmpNo());
        info.put("role", user.getRole());
        info.put("enabled", user.getEnabled());
        String menus = user.getAllowedMenus();
        if ("*".equals(menus)) {
            info.put("allowedMenus", "*");
        } else if (menus != null && !menus.isBlank()) {
            info.put("allowedMenus", Arrays.asList(menus.split(",")));
        } else {
            info.put("allowedMenus", Collections.emptyList());
        }
        info.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        info.put("updatedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null);

        // 查询 LLM 配置
        llmConfigRepository.findByUserId(user.getId()).ifPresent(config -> {
            info.put("llmProvider", config.getProviderId() != null
                    ? llmProviderRepository.findById(config.getProviderId())
                            .map(LlmProviderEntity::getDisplayName).orElse(null)
                    : null);
            info.put("llmModel", config.getModelName());
        });

        return info;
    }
}