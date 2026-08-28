package com.racc.knowledge.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Wiki 页面实体。
 * 由 LLM 从知识库文档自动生成，包含摘要、关键概念、结构化章节等。
 * 与前端 WikiPage 接口对齐。
 */
@Entity
@Table(name = "wiki_pages")
public class WikiPageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String summary;

    @Column(name = "key_concepts", length = 2000)
    private String keyConcepts;

    /** JSON 字符串，格式：[{heading, content}] */
    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String sections;

    @Column(name = "source_document_id", nullable = false)
    private Long sourceDocumentId;

    /** GENERATED / GENERATING / FAILED / GRAPH_READY */
    @Column(length = 32)
    private String status = "GENERATED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ===== getters / setters =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getKeyConcepts() { return keyConcepts; }
    public void setKeyConcepts(String keyConcepts) { this.keyConcepts = keyConcepts; }

    public String getSections() { return sections; }
    public void setSections(String sections) { this.sections = sections; }

    public Long getSourceDocumentId() { return sourceDocumentId; }
    public void setSourceDocumentId(Long sourceDocumentId) { this.sourceDocumentId = sourceDocumentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}