package com.racc.automate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.automate.entity.AutomateTaskTypeEntity;
import com.racc.automate.repository.AutomateTaskTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 自动化任务类型管理：CRUD + 启动参数校验
 */
@Service
public class AutomateTaskTypeService {

    private static final Logger log = LoggerFactory.getLogger(AutomateTaskTypeService.class);

    private final AutomateTaskTypeRepository repo;
    private final ObjectMapper objectMapper;

    public AutomateTaskTypeService(AutomateTaskTypeRepository repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    public List<AutomateTaskTypeEntity> list(boolean enabledOnly) {
        return enabledOnly ? repo.findByEnabledTrueOrderBySortOrderAsc() : repo.findAllByOrderBySortOrderAsc();
    }

    public AutomateTaskTypeEntity getByCode(String code) {
        return repo.findByCode(code)
                .orElseThrow(() -> new NoSuchElementException("任务类型不存在: " + code));
    }

    @Transactional
    public AutomateTaskTypeEntity create(Map<String, Object> body) {
        AutomateTaskTypeEntity entity = new AutomateTaskTypeEntity();
        applyUpdates(entity, body, true);
        if (repo.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("类型编码已存在: " + entity.getCode());
        }
        return repo.save(entity);
    }

    @Transactional
    public AutomateTaskTypeEntity update(Long id, Map<String, Object> body) {
        AutomateTaskTypeEntity entity = repo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("任务类型不存在: " + id));
        applyUpdates(entity, body, false);
        return repo.save(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NoSuchElementException("任务类型不存在: " + id);
        }
        repo.deleteById(id);
    }

    /**
     * 按 formSchema 校验启动参数：required 字段必须有非空值
     */
    public void validateParams(AutomateTaskTypeEntity type, Map<String, Object> params) {
        List<Map<String, Object>> fields = parseSchema(type.getFormSchema());
        for (Map<String, Object> field : fields) {
            boolean required = Boolean.TRUE.equals(field.get("required"));
            if (!required) continue;
            Object value = params != null ? params.get(String.valueOf(field.get("key"))) : null;
            if (value == null || String.valueOf(value).isBlank()) {
                throw new IllegalArgumentException("缺少必填参数: " + field.getOrDefault("label", field.get("key")));
            }
        }
    }

    public List<Map<String, Object>> parseSchema(String formSchema) {
        if (formSchema == null || formSchema.isBlank()) return List.of();
        try {
            return objectMapper.readValue(formSchema, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.warn("任务类型 formSchema 解析失败: {}", e.getMessage());
            return List.of();
        }
    }

    private void applyUpdates(AutomateTaskTypeEntity entity, Map<String, Object> body, boolean isCreate) {
        if (body == null) throw new IllegalArgumentException("请求体不能为空");

        if (isCreate) {
            String code = asString(body.get("code"));
            if (code == null || code.isBlank()) throw new IllegalArgumentException("code 不能为空");
            entity.setCode(code.trim());
        }

        if (body.containsKey("name")) {
            String name = asString(body.get("name"));
            if (name == null || name.isBlank()) throw new IllegalArgumentException("name 不能为空");
            entity.setName(name.trim());
        } else if (isCreate) {
            throw new IllegalArgumentException("name 不能为空");
        }

        if (body.containsKey("description")) entity.setDescription(asString(body.get("description")));
        if (body.containsKey("icon")) entity.setIcon(asString(body.get("icon")));
        if (body.containsKey("model")) {
            String model = asString(body.get("model"));
            entity.setModel(model != null && !model.isBlank() ? model.trim() : null);
        }

        // 绑定：skill 与 workflow 二选一（传 null 表示清空该绑定）
        if (body.containsKey("skillName")) entity.setSkillName(asString(body.get("skillName")));
        if (body.containsKey("workflowDefinitionId")) {
            Object wfId = body.get("workflowDefinitionId");
            entity.setWorkflowDefinitionId(wfId == null ? null : Long.valueOf(String.valueOf(wfId)));
        }
        if (isCreate) {
            boolean hasSkill = entity.getSkillName() != null && !entity.getSkillName().isBlank();
            boolean hasWorkflow = entity.getWorkflowDefinitionId() != null;
            if (!hasSkill && !hasWorkflow) {
                throw new IllegalArgumentException("必须绑定一个技能或一个工作流");
            }
        }

        if (body.containsKey("formSchema")) {
            Object schema = body.get("formSchema");
            if (schema == null) {
                entity.setFormSchema(null);
            } else if (schema instanceof String s) {
                validateSchemaJson(s);
                entity.setFormSchema(s);
            } else {
                try {
                    String json = objectMapper.writeValueAsString(schema);
                    entity.setFormSchema(json);
                } catch (Exception e) {
                    throw new IllegalArgumentException("formSchema 序列化失败: " + e.getMessage());
                }
            }
        }

        if (body.containsKey("enabled")) entity.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        if (body.containsKey("sortOrder")) {
            Object so = body.get("sortOrder");
            entity.setSortOrder(so == null ? 0 : Integer.valueOf(String.valueOf(so)));
        }
    }

    private void validateSchemaJson(String json) {
        try {
            List<Map<String, Object>> fields = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> f : fields) {
                Object key = f.get("key");
                if (key == null || String.valueOf(key).isBlank()) {
                    throw new IllegalArgumentException("formSchema 字段缺少 key");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("formSchema 不是合法的 JSON 数组: " + e.getMessage());
        }
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
