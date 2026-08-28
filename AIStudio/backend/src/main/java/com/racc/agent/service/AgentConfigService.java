package com.racc.agent.service;

import com.racc.agent.entity.AgentConfigDetailEntity;
import com.racc.agent.repository.AgentConfigDetailRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Agent 配置服务。
 */
@Service
@Transactional
public class AgentConfigService {

    private final AgentConfigDetailRepository repository;

    public AgentConfigService(AgentConfigDetailRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listConfigs() {
        List<AgentConfigDetailEntity> all = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (AgentConfigDetailEntity entity : all) {
            result.add(toMap(entity));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConfig(String name) {
        AgentConfigDetailEntity entity = repository.findByName(name)
                .orElseThrow(() -> new NoSuchElementException("Agent config 不存在: " + name));
        return toMap(entity);
    }

    public Map<String, Object> createConfig(Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Agent name 不能为空");
        }
        if (repository.existsByName(name)) {
            throw new IllegalArgumentException("Agent name 已存在: " + name);
        }

        AgentConfigDetailEntity entity = new AgentConfigDetailEntity();
        entity.setName(name.trim());
        entity.setDescription((String) body.get("description"));
        entity.setCapabilities(toJsonArray(body.get("capabilities")));
        entity.setTools(toJsonArray(body.get("tools")));
        entity.setStatus((String) body.getOrDefault("status", "idle"));
        entity.setEnabled(body.containsKey("enabled") ? (Boolean) body.get("enabled") : true);
        entity.setSystemPrompt((String) body.get("systemPrompt"));
        entity.setSkills(toJsonObject(body.get("skills")));
        entity.setModel((String) body.get("model"));
        entity.setDirectory((String) body.get("directory"));
        entity.setPreferredSkills(toJsonArray(body.get("preferredSkills")));
        entity.setMcpServers(toJsonArray(body.get("mcpServers")));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        entity = repository.save(entity);
        return toMap(entity);
    }

    public Map<String, Object> updateConfig(String name, Map<String, Object> body) {
        AgentConfigDetailEntity entity = repository.findByName(name)
                .orElseThrow(() -> new NoSuchElementException("Agent config 不存在: " + name));

        // 部分更新：仅更新请求体中出现的字段（name 为主键，不可修改）
        if (body.containsKey("description")) entity.setDescription((String) body.get("description"));
        if (body.containsKey("capabilities")) entity.setCapabilities(toJsonArray(body.get("capabilities")));
        if (body.containsKey("tools")) entity.setTools(toJsonArray(body.get("tools")));
        if (body.containsKey("status")) entity.setStatus((String) body.get("status"));
        if (body.containsKey("enabled")) entity.setEnabled((Boolean) body.get("enabled"));
        if (body.containsKey("systemPrompt")) entity.setSystemPrompt((String) body.get("systemPrompt"));
        if (body.containsKey("skills")) entity.setSkills(toJsonObject(body.get("skills")));
        if (body.containsKey("model")) entity.setModel((String) body.get("model"));
        if (body.containsKey("directory")) entity.setDirectory((String) body.get("directory"));
        if (body.containsKey("preferredSkills")) entity.setPreferredSkills(toJsonArray(body.get("preferredSkills")));
        if (body.containsKey("mcpServers")) entity.setMcpServers(toJsonArray(body.get("mcpServers")));
        entity.setUpdatedAt(LocalDateTime.now());

        entity = repository.save(entity);
        return toMap(entity);
    }

    public void deleteConfig(String name) {
        if (!repository.existsByName(name)) {
            throw new NoSuchElementException("Agent config 不存在: " + name);
        }
        repository.deleteByName(name);
    }

    public Map<String, Object> reloadConfigs() {
        // 模拟重载：重新读取所有配置
        List<AgentConfigDetailEntity> all = repository.findAll();
        for (AgentConfigDetailEntity entity : all) {
            entity.setUpdatedAt(LocalDateTime.now());
            entity.setStatus("reloaded");
            repository.save(entity);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Agent 配置已重载");
        result.put("count", all.size());
        return result;
    }

    // ---------- helpers ----------

    private Map<String, Object> toMap(AgentConfigDetailEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", entity.getName());
        map.put("description", entity.getDescription());
        map.put("capabilities", parseJsonArray(entity.getCapabilities()));
        map.put("tools", parseJsonArray(entity.getTools()));
        map.put("status", entity.getStatus());
        map.put("enabled", entity.getEnabled());
        map.put("systemPrompt", entity.getSystemPrompt());
        map.put("skills", parseJsonObject(entity.getSkills()));
        map.put("model", entity.getModel());
        map.put("directory", entity.getDirectory());
        map.put("preferredSkills", parseJsonArray(entity.getPreferredSkills()));
        map.put("mcpServers", parseJsonArray(entity.getMcpServers()));
        return map;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            // 简单解析：去掉 [ ] 按逗号分割
            String trimmed = json.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                String inner = trimmed.substring(1, trimmed.length() - 1);
                if (inner.isBlank()) return List.of();
                String[] parts = inner.split(",");
                List<String> result = new ArrayList<>();
                for (String part : parts) {
                    String p = part.trim();
                    if (p.startsWith("\"") && p.endsWith("\"")) {
                        p = p.substring(1, p.length() - 1);
                    }
                    result.add(p);
                }
                return result;
            }
        } catch (Exception ignored) {}
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parseJsonObject(String json) {
        if (json == null || json.isBlank()) return Map.of();
        // 简单解析：支持 {"key":"value"} 格式
        try {
            String trimmed = json.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                String inner = trimmed.substring(1, trimmed.length() - 1);
                if (inner.isBlank()) return Map.of();
                Map<String, String> result = new LinkedHashMap<>();
                String[] pairs = inner.split(",");
                for (String pair : pairs) {
                    String[] kv = pair.split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].trim();
                        String val = kv[1].trim();
                        if (key.startsWith("\"") && key.endsWith("\"")) key = key.substring(1, key.length() - 1);
                        if (val.startsWith("\"") && val.endsWith("\"")) val = val.substring(1, val.length() - 1);
                        result.put(key, val);
                    }
                }
                return result;
            }
        } catch (Exception ignored) {}
        return Map.of();
    }

    private String toJsonArray(Object value) {
        if (value == null) return null;
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(list.get(i)).append("\"");
            }
            sb.append("]");
            return sb.toString();
        }
        if (value instanceof String) {
            String s = (String) value;
            if (s.startsWith("[")) return s;
            return "[\"" + s + "\"]";
        }
        return null;
    }

    private String toJsonObject(Object value) {
        if (value == null) return null;
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(entry.getKey()).append("\":");
                sb.append("\"").append(entry.getValue()).append("\"");
            }
            sb.append("}");
            return sb.toString();
        }
        if (value instanceof String) {
            return (String) value;
        }
        return null;
    }
}