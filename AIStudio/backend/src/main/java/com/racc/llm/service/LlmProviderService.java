package com.racc.llm.service;

import com.racc.llm.entity.LlmProviderEntity;
import com.racc.llm.entity.LlmProviderUserEntity;
import com.racc.llm.repository.LlmProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * LLM Provider 服务。
 */
@Service
@Transactional
public class LlmProviderService {

    private final LlmProviderRepository repository;

    public LlmProviderService(LlmProviderRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listProviders() {
        List<LlmProviderEntity> all = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (LlmProviderEntity entity : all) {
            result.add(toProviderMap(entity));
        }
        return result;
    }

    public Map<String, Object> createProvider(Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Provider name 不能为空");
        }
        if (repository.existsByName(name)) {
            throw new IllegalArgumentException("Provider name 已存在");
        }

        LlmProviderEntity entity = new LlmProviderEntity();
        entity.setName(name.trim());
        entity.setDisplayName((String) body.getOrDefault("displayName", name));
        entity.setProviderType((String) body.getOrDefault("providerType", "openai"));
        entity.setBaseUrl((String) body.getOrDefault("baseUrl", ""));
        entity.setModelName((String) body.get("modelName"));
        entity.setApiKey(trimToNull((String) body.get("apiKey")));
        if (body.containsKey("enabled")) {
            entity.setEnabled((Boolean) body.get("enabled"));
        }
        entity.setIsDefault(false);
        entity.setCreatedAt(LocalDateTime.now());

        entity = repository.save(entity);
        return toProviderMap(entity);
    }

    public Map<String, Object> updateProvider(Long id, Map<String, Object> body) {
        LlmProviderEntity entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Provider 不存在"));

        if (body.containsKey("name")) {
            String newName = (String) body.get("name");
            if (newName != null && !newName.isBlank() && !newName.equals(entity.getName())) {
                if (repository.existsByName(newName)) {
                    throw new IllegalArgumentException("Provider name 已存在");
                }
                entity.setName(newName.trim());
            }
        }
        if (body.containsKey("displayName")) {
            entity.setDisplayName((String) body.get("displayName"));
        }
        if (body.containsKey("providerType")) {
            entity.setProviderType((String) body.get("providerType"));
        }
        if (body.containsKey("baseUrl")) {
            entity.setBaseUrl((String) body.get("baseUrl"));
        }
        if (body.containsKey("modelName")) {
            entity.setModelName((String) body.get("modelName"));
        }
        // API Key：留空/未传表示保留原值，传新值则覆盖
        if (body.containsKey("apiKey")) {
            String newKey = trimToNull((String) body.get("apiKey"));
            if (newKey != null) {
                entity.setApiKey(newKey);
            }
        }
        if (body.containsKey("enabled")) {
            entity.setEnabled((Boolean) body.get("enabled"));
        }

        entity = repository.save(entity);
        return toProviderMap(entity);
    }

    public void deleteProvider(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Provider 不存在");
        }
        repository.deleteById(id);
    }

    public Map<String, Object> activateProvider(Long id) {
        // 将所有 provider 的 isDefault 设为 false
        List<LlmProviderEntity> all = repository.findAll();
        for (LlmProviderEntity e : all) {
            if (Boolean.TRUE.equals(e.getIsDefault())) {
                e.setIsDefault(false);
                repository.save(e);
            }
        }
        // 设置当前 provider 为默认
        LlmProviderEntity entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Provider 不存在"));
        entity.setIsDefault(true);
        entity = repository.save(entity);
        return toProviderMap(entity);
    }

    private Map<String, Object> toProviderMap(LlmProviderEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("name", entity.getName());
        map.put("displayName", entity.getDisplayName());
        map.put("providerType", entity.getProviderType());
        map.put("baseUrl", entity.getBaseUrl());
        map.put("modelName", entity.getModelName());
        // API Key 不明文返回：只返回脱敏值与是否已配置
        map.put("hasApiKey", entity.getApiKey() != null && !entity.getApiKey().isBlank());
        map.put("apiKeyMasked", maskApiKey(entity.getApiKey()));
        map.put("enabled", entity.getEnabled());
        map.put("isDefault", entity.getIsDefault());
        map.put("createdAt", entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);

        // 关联的用户权限
        List<Map<String, Object>> usersList = new ArrayList<>();
        if (entity.getUsers() != null) {
            for (LlmProviderUserEntity user : entity.getUsers()) {
                Map<String, Object> userMap = new LinkedHashMap<>();
                userMap.put("username", user.getUsername());
                userMap.put("displayName", user.getDisplayName());
                userMap.put("modelName", user.getModelName());
                userMap.put("enabled", user.getEnabled());
                usersList.add(userMap);
            }
        }
        map.put("users", usersList);
        return map;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** API Key 脱敏：保留前 4 位与后 4 位，中间以 **** 代替 */
    private static String maskApiKey(String key) {
        if (key == null || key.isBlank()) return "";
        if (key.length() <= 8) return "********";
        return key.substring(0, 4) + "********" + key.substring(key.length() - 4);
    }
}