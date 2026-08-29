package com.racc.sandbox;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 沙箱实例。
 * 一个沙箱 = 一个受控命令执行环境（独立工作目录；DOCKER 模式下为独立容器）。
 */
@Entity
@Table(name = "sandboxes")
public class SandboxEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    /** 关联的自动化任务类型 code（automate_task_types.code，如 req-consolidation）；兼容历史数据中的流水线任务 ID */
    @Column(name = "task_id", length = 64)
    private String taskId;

    /** LOCAL / DOCKER */
    @Column(nullable = false, length = 16)
    private String mode = "LOCAL";

    /** CREATING / RUNNING / DESTROYED */
    @Column(nullable = false, length = 32)
    private String status = "CREATING";

    @Column(length = 500)
    private String workdir;

    @Column(name = "timeout_seconds", nullable = false)
    private Integer timeoutSeconds = 600;

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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getWorkdir() { return workdir; }
    public void setWorkdir(String workdir) { this.workdir = workdir; }

    public Integer getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(Integer timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
