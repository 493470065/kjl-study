package com.racc.monitor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Agent 配置表。
 * 定义系统中可用的 Agent 实例及其运行状态。
 */
@Entity
@Table(name = "agent_configs")
public class AgentConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(length = 64)
    private String status = "idle";

    @Column(name = "current_task_id", length = 64)
    private String currentTaskId;

    @Column(name = "running_time")
    private Long runningTime;

    @Column(name = "token_used")
    private Long tokenUsed = 0L;

    @Column(name = "error_count")
    private Integer errorCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrentTaskId() { return currentTaskId; }
    public void setCurrentTaskId(String currentTaskId) { this.currentTaskId = currentTaskId; }

    public Long getRunningTime() { return runningTime; }
    public void setRunningTime(Long runningTime) { this.runningTime = runningTime; }

    public Long getTokenUsed() { return tokenUsed; }
    public void setTokenUsed(Long tokenUsed) { this.tokenUsed = tokenUsed; }

    public Integer getErrorCount() { return errorCount; }
    public void setErrorCount(Integer errorCount) { this.errorCount = errorCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}