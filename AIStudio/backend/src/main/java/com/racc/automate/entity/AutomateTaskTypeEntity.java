package com.racc.automate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 自动化任务类型：统一入口的任务模板。
 * 每个类型绑定一个 Skill 或一个工作流（二选一），并定义启动表单（formSchema）。
 */
@Entity
@Table(name = "automate_task_types")
public class AutomateTaskTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 类型编码，唯一（如 req-analysis） */
    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(length = 500)
    private String description;

    /** 展示用 emoji 或图标名 */
    @Column(length = 32)
    private String icon;

    /** 绑定的技能名（与 workflowDefinitionId 二选一） */
    @Column(name = "skill_name", length = 128)
    private String skillName;

    /** 绑定的工作流定义 ID（与 skillName 二选一） */
    @Column(name = "workflow_definition_id")
    private Long workflowDefinitionId;

    /** 指定 LLM 模型（对应 llm_providers.model_name；为空走全局模型） */
    @Column(length = 128)
    private String model;

    /**
     * 启动表单定义（JSON 数组）：
     * [{key, label, type:"number|text|textarea|select", required, options?, default?, placeholder?}]
     * 特殊键 tfsWorkItemId：映射到 pipeline_tasks.tfs_work_item_id 并触发 TFS 抓取
     */
    @Column(name = "form_schema", columnDefinition = "LONGTEXT")
    @Lob
    private String formSchema;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public Long getWorkflowDefinitionId() { return workflowDefinitionId; }
    public void setWorkflowDefinitionId(Long workflowDefinitionId) { this.workflowDefinitionId = workflowDefinitionId; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getFormSchema() { return formSchema; }
    public void setFormSchema(String formSchema) { this.formSchema = formSchema; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
