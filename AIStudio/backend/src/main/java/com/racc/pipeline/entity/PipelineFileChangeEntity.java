package com.racc.pipeline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pipeline 文件变更记录
 */
@Entity
@Table(name = "pipeline_file_changes")
public class PipelineFileChangeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pipeline_id", nullable = false)
    private Long pipelineId;

    @Column(name = "repo_id")
    private Long repoId;

    @Column(length = 128)
    private String branch;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "change_type", nullable = false, length = 32)
    private String changeType;

    @Column(name = "old_content", columnDefinition = "LONGTEXT")
    @Lob
    private String oldContent;

    @Column(name = "new_content", columnDefinition = "LONGTEXT")
    @Lob
    private String newContent;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String summary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public Long getRepoId() { return repoId; }
    public void setRepoId(Long repoId) { this.repoId = repoId; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }

    public String getOldContent() { return oldContent; }
    public void setOldContent(String oldContent) { this.oldContent = oldContent; }

    public String getNewContent() { return newContent; }
    public void setNewContent(String newContent) { this.newContent = newContent; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}