package com.racc.userconfig.service;

import com.racc.llm.service.LlmProviderUserSyncService;
import com.racc.user.UserRepository;
import com.racc.user.entity.UserLlmConfigEntity;
import com.racc.user.repository.UserLlmConfigRepository;
import com.racc.userconfig.entity.UserTfsConfigEntity;
import com.racc.userconfig.repository.UserTfsConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 用户个人配置服务（LLM 配置 + TFS 配置）。
 */
@Service
@Transactional
public class UserConfigService {

    private final UserLlmConfigRepository llmConfigRepository;
    private final UserTfsConfigRepository tfsConfigRepository;
    private final UserRepository userRepository;
    private final LlmProviderUserSyncService providerUserSyncService;

    public UserConfigService(UserLlmConfigRepository llmConfigRepository,
                             UserTfsConfigRepository tfsConfigRepository,
                             UserRepository userRepository,
                             LlmProviderUserSyncService providerUserSyncService) {
        this.llmConfigRepository = llmConfigRepository;
        this.tfsConfigRepository = tfsConfigRepository;
        this.userRepository = userRepository;
        this.providerUserSyncService = providerUserSyncService;
    }

    // ========== LLM 配置 ==========

    @Transactional(readOnly = true)
    public Map<String, Object> getLlmConfig(Long userId) {
        UserLlmConfigEntity config = llmConfigRepository.findByUserId(userId).orElse(null);
        if (config == null) {
            return Map.of("enabled", false);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", config.getId());
        result.put("userId", config.getUserId());
        result.put("providerId", config.getProviderId());
        result.put("modelName", config.getModelName());
        result.put("apiKey", config.getApiKey());
        result.put("enabled", config.getEnabled());
        return result;
    }

    public void saveLlmConfig(Long userId, Map<String, Object> body) {
        UserLlmConfigEntity config = llmConfigRepository.findByUserId(userId).orElseGet(() -> {
            UserLlmConfigEntity e = new UserLlmConfigEntity();
            e.setUserId(userId);
            e.setCreatedAt(LocalDateTime.now());
            return e;
        });

        if (body.containsKey("providerId")) {
            Object pid = body.get("providerId");
            config.setProviderId(pid instanceof Number ? ((Number) pid).longValue() : null);
        }
        if (body.containsKey("modelName")) {
            config.setModelName((String) body.get("modelName"));
        }
        if (body.containsKey("apiKey")) {
            config.setApiKey((String) body.get("apiKey"));
        }
        if (body.containsKey("enabled")) {
            config.setEnabled((Boolean) body.get("enabled"));
        }
        config.setUpdatedAt(LocalDateTime.now());
        llmConfigRepository.save(config);

        // 同步「LLM 管理」卡片的用户名单：以最新个人配置重建该用户的 Provider 绑定
        userRepository.findById(userId).ifPresent(user ->
                providerUserSyncService.syncBinding(user.getUsername(), user.getDisplayName(),
                        config.getProviderId(), config.getModelName(),
                        Boolean.TRUE.equals(config.getEnabled()) && Boolean.TRUE.equals(user.getEnabled())));
    }

    // ========== TFS 配置 ==========

    @Transactional(readOnly = true)
    public Map<String, Object> getTfsConfig(Long userId) {
        UserTfsConfigEntity config = tfsConfigRepository.findByUserId(userId).orElse(null);
        if (config == null) {
            return Map.of("enabled", false);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", config.getId());
        result.put("userId", config.getUserId());
        result.put("tfsServerUrl", config.getTfsServerUrl());
        result.put("personalAccessToken", config.getPersonalAccessToken());
        result.put("gitUsername", config.getGitUsername());
        result.put("gitPassword", config.getGitPassword());
        result.put("wxpUsercode", config.getWxpUsercode());
        result.put("wxpPassword", config.getWxpPassword());
        result.put("enabled", config.getEnabled());
        return result;
    }

    public void saveTfsConfig(Long userId, Map<String, Object> body) {
        UserTfsConfigEntity config = tfsConfigRepository.findByUserId(userId).orElseGet(() -> {
            UserTfsConfigEntity e = new UserTfsConfigEntity();
            e.setUserId(userId);
            e.setCreatedAt(LocalDateTime.now());
            return e;
        });

        if (body.containsKey("tfsServerUrl")) {
            config.setTfsServerUrl((String) body.get("tfsServerUrl"));
        }
        if (body.containsKey("personalAccessToken")) {
            config.setPersonalAccessToken((String) body.get("personalAccessToken"));
        }
        if (body.containsKey("gitUsername")) {
            config.setGitUsername((String) body.get("gitUsername"));
        }
        if (body.containsKey("gitPassword")) {
            config.setGitPassword((String) body.get("gitPassword"));
        }
        if (body.containsKey("wxpUsercode")) {
            config.setWxpUsercode((String) body.get("wxpUsercode"));
        }
        if (body.containsKey("wxpPassword")) {
            config.setWxpPassword((String) body.get("wxpPassword"));
        }
        if (body.containsKey("enabled")) {
            config.setEnabled((Boolean) body.get("enabled"));
        }
        config.setUpdatedAt(LocalDateTime.now());
        tfsConfigRepository.save(config);
    }
}