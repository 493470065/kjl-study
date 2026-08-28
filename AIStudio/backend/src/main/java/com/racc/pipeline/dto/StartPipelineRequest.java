package com.racc.pipeline.dto;

import java.util.Map;

/**
 * 启动 Pipeline 请求
 */
public class StartPipelineRequest {

    private Long tfsWorkItemId;
    private String projectId;
    private String skillName;
    private Long productLineId;
    private String repoIds;
    private Long workflowDefinitionId;

    /** 任务类型 code（对应 automate_task_types.code；自定义任务不传） */
    private String taskType;
    /** 任务类型表单提交的启动参数 */
    private Map<String, Object> params;

    public Long getTfsWorkItemId() { return tfsWorkItemId; }
    public void setTfsWorkItemId(Long tfsWorkItemId) { this.tfsWorkItemId = tfsWorkItemId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public Long getProductLineId() { return productLineId; }
    public void setProductLineId(Long productLineId) { this.productLineId = productLineId; }

    public String getRepoIds() { return repoIds; }
    public void setRepoIds(String repoIds) { this.repoIds = repoIds; }

    public Long getWorkflowDefinitionId() { return workflowDefinitionId; }
    public void setWorkflowDefinitionId(Long workflowDefinitionId) { this.workflowDefinitionId = workflowDefinitionId; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public Map<String, Object> getParams() { return params; }
    public void setParams(Map<String, Object> params) { this.params = params; }
}