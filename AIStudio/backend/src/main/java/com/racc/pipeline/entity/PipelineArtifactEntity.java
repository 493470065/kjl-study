package com.racc.pipeline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pipeline 成果物
 */
@Entity
@Table(name = "pipeline_artifacts")
public class PipelineArtifactEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pipeline_id", nullable = false)
    private Long pipelineId;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "artifact_type", nullable = false, length = 64)
    private String artifactType;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String summary;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String content;

    @Column(name = "repo_id")
    private Long repoId;

    @Column(length = 128)
    private String branch;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getArtifactType() { return artifactType; }
    public void setArtifactType(String artifactType) { this.artifactType = artifactType; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Long getRepoId() { return repoId; }
    public void setRepoId(Long repoId) { this.repoId = repoId; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}