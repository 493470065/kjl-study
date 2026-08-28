package com.racc.pipeline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pipeline 任务
 */
@Entity
@Table(name = "pipeline_tasks")
public class PipelineTaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tfs_work_item_id")
    private Long tfsWorkItemId;

    @Column(name = "tfs_title", length = 500)
    private String tfsTitle;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(name = "current_stage", length = 64)
    private String currentStage;

    /** PENDING / RUNNING / WAITING_CONFIRM / PAUSED_ON_FAILURE / COMPLETED / FAILED / CANCELLED */
    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String error;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "skill_name", length = 128)
    private String skillName;

    @Column(name = "product_line_id")
    private Long productLineId;

    /** 逗号分隔的 repo id 列表 */
    @Column(name = "repo_ids", length = 500)
    private String repoIds;

    @Column(name = "confirm_message", length = 500)
    private String confirmMessage;

    @Column(name = "execution_log", columnDefinition = "LONGTEXT")
    @Lob
    private String executionLog;

    @Column
    private Boolean interactive = false;

    @Column(name = "workflow_definition_id")
    private Long workflowDefinitionId;

    @Column(name = "workflow_execution_id")
    private Long workflowExecutionId;

    @Column(name = "workflow_pause_mode", length = 64)
    private String workflowPauseMode;

    /** 任务类型 code（对应 automate_task_types.code；自定义任务为 null） */
    @Column(name = "task_type", length = 64)
    private String taskType;

    /** 本任务使用的 LLM 模型（启动时从任务类型快照；为空=全局模型） */
    @Column(length = 128)
    private String model;

    /** 启动参数 JSON（任务类型表单提交值） */
    @Column(name = "params_json", columnDefinition = "LONGTEXT")
    @Lob
    private String paramsJson;

    @Column(name = "created_by", length = 64)
    private String createdBy;

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

    public Long getTfsWorkItemId() { return tfsWorkItemId; }
    public void setTfsWorkItemId(Long tfsWorkItemId) { this.tfsWorkItemId = tfsWorkItemId; }

    public String getTfsTitle() { return tfsTitle; }
    public void setTfsTitle(String tfsTitle) { this.tfsTitle = tfsTitle; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public Long getProductLineId() { return productLineId; }
    public void setProductLineId(Long productLineId) { this.productLineId = productLineId; }

    public String getRepoIds() { return repoIds; }
    public void setRepoIds(String repoIds) { this.repoIds = repoIds; }

    public String getConfirmMessage() { return confirmMessage; }
    public void setConfirmMessage(String confirmMessage) { this.confirmMessage = confirmMessage; }

    public String getExecutionLog() { return executionLog; }
    public void setExecutionLog(String executionLog) { this.executionLog = executionLog; }

    public Boolean getInteractive() { return interactive; }
    public void setInteractive(Boolean interactive) { this.interactive = interactive; }

    public Long getWorkflowDefinitionId() { return workflowDefinitionId; }
    public void setWorkflowDefinitionId(Long workflowDefinitionId) { this.workflowDefinitionId = workflowDefinitionId; }

    public Long getWorkflowExecutionId() { return workflowExecutionId; }
    public void setWorkflowExecutionId(Long workflowExecutionId) { this.workflowExecutionId = workflowExecutionId; }

    public String getWorkflowPauseMode() { return workflowPauseMode; }
    public void setWorkflowPauseMode(String workflowPauseMode) { this.workflowPauseMode = workflowPauseMode; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getParamsJson() { return paramsJson; }
    public void setParamsJson(String paramsJson) { this.paramsJson = paramsJson; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}