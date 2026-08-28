package com.racc.audit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 任务执行审计记录。
 * 记录后台任务（如需求分析、代码生成等）的执行状态。
 */
@Entity
@Table(name = "audit_task_executions")
public class AuditTaskExecutionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_type", nullable = false, length = 64)
    private String taskType;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(length = 64)
    private String username;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}