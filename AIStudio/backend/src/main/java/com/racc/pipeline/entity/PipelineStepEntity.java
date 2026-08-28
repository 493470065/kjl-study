package com.racc.pipeline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pipeline 执行步骤
 */
@Entity
@Table(name = "pipeline_steps")
public class PipelineStepEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pipeline_id", nullable = false)
    private Long pipelineId;

    @Column(name = "seq_no", nullable = false)
    private Integer seqNo;

    @Column(length = 64)
    private String type;

    /** PENDING / RUNNING / COMPLETED / FAILED / SKIPPED */
    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(nullable = false, length = 256)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String detail;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String metadata;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}