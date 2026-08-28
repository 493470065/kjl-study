package com.racc.repository.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 代码仓库
 */
@Entity
@Table(name = "code_repositories")
public class CodeRepositoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(name = "tfs_path", length = 500)
    private String tfsPath;

    @Column(length = 64)
    private String branch;

    @Column(name = "business_tags", length = 500)
    private String businessTags;

    @Column(name = "project_name", length = 128)
    private String projectName;

    @Column(name = "repo_id", length = 64)
    private String repoId;

    @Column(name = "ops_app_id", length = 64)
    private String opsAppId;

    @Column(name = "product_line", length = 128)
    private String productLine;

    @Column(name = "product_line_id")
    private Long productLineId;

    @Column(name = "product_line_name", length = 128)
    private String productLineName;

    @Column(name = "product_line_ids", length = 500)
    private String productLineIds;

    @Column(name = "product_line_names", length = 500)
    private String productLineNames;

    @Column(length = 500)
    private String description;

    @Column(name = "claude_md", columnDefinition = "LONGTEXT")
    @Lob
    private String claudeMd;

    @Column(name = "docs_path", length = 500)
    private String docsPath;

    @Column(name = "scan_enabled")
    private Boolean scanEnabled = true;

    @Column(name = "last_scanned_commit_id", length = 64)
    private String lastScannedCommitId;

    @Column(name = "last_scanned_at")
    private LocalDateTime lastScannedAt;

    @Column(name = "created_at")
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

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getTfsPath() { return tfsPath; }
    public void setTfsPath(String tfsPath) { this.tfsPath = tfsPath; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getBusinessTags() { return businessTags; }
    public void setBusinessTags(String businessTags) { this.businessTags = businessTags; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getRepoId() { return repoId; }
    public void setRepoId(String repoId) { this.repoId = repoId; }

    public String getOpsAppId() { return opsAppId; }
    public void setOpsAppId(String opsAppId) { this.opsAppId = opsAppId; }

    public String getProductLine() { return productLine; }
    public void setProductLine(String productLine) { this.productLine = productLine; }

    public Long getProductLineId() { return productLineId; }
    public void setProductLineId(Long productLineId) { this.productLineId = productLineId; }

    public String getProductLineName() { return productLineName; }
    public void setProductLineName(String productLineName) { this.productLineName = productLineName; }

    public String getProductLineIds() { return productLineIds; }
    public void setProductLineIds(String productLineIds) { this.productLineIds = productLineIds; }

    public String getProductLineNames() { return productLineNames; }
    public void setProductLineNames(String productLineNames) { this.productLineNames = productLineNames; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getClaudeMd() { return claudeMd; }
    public void setClaudeMd(String claudeMd) { this.claudeMd = claudeMd; }

    public String getDocsPath() { return docsPath; }
    public void setDocsPath(String docsPath) { this.docsPath = docsPath; }

    public Boolean getScanEnabled() { return scanEnabled; }
    public void setScanEnabled(Boolean scanEnabled) { this.scanEnabled = scanEnabled; }

    public String getLastScannedCommitId() { return lastScannedCommitId; }
    public void setLastScannedCommitId(String lastScannedCommitId) { this.lastScannedCommitId = lastScannedCommitId; }

    public LocalDateTime getLastScannedAt() { return lastScannedAt; }
    public void setLastScannedAt(LocalDateTime lastScannedAt) { this.lastScannedAt = lastScannedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}