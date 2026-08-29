package com.racc.sandbox;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 沙箱执行记录。
 * 每次在沙箱内执行一条命令产生一条记录，命令输出全量落库。
 */
@Entity
@Table(name = "sandbox_executions")
public class SandboxExecutionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sandbox_id", nullable = false)
    private Long sandboxId;

    /** 沙箱内第几次执行（从 1 开始） */
    @Column(name = "seq_no", nullable = false)
    private Integer seqNo;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String command;

    /** RUNNING / SUCCESS / FAILED / TIMEOUT */
    @Column(nullable = false, length = 32)
    private String status = "RUNNING";

    @Column(name = "exit_code")
    private Integer exitCode;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String output;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

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

    public Long getSandboxId() { return sandboxId; }
    public void setSandboxId(Long sandboxId) { this.sandboxId = sandboxId; }

    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }

    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
