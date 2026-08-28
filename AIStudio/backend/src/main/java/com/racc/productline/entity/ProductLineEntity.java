package com.racc.productline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 产品线
 */
@Entity
@Table(name = "product_lines")
public class ProductLineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(length = 500)
    private String description;

    @Column(name = "claude_md", columnDefinition = "LONGTEXT")
    @Lob
    private String claudeMd;

    @Column(name = "docs_path", length = 500)
    private String docsPath;

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getClaudeMd() { return claudeMd; }
    public void setClaudeMd(String claudeMd) { this.claudeMd = claudeMd; }

    public String getDocsPath() { return docsPath; }
    public void setDocsPath(String docsPath) { this.docsPath = docsPath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}