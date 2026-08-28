package com.racc.knowledge.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 知识库文档实体。
 * 与前端 KnowledgeDocument 接口对齐。
 * 对应 SQLite 表 knowledge_documents，并配合 FTS5 虚拟表 knowledge_fts 实现全文检索。
 */
@Entity
@Table(name = "knowledge_documents")
public class KnowledgeDocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    @Lob
    private String content;

    @Column(name = "content_preview", length = 500)
    private String contentPreview;

    @Column(length = 100)
    private String category;

    @Column(length = 500)
    private String tags;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "product_line", length = 100)
    private String productLine;

    /** 模块（产品线下的二级分类），用于上下文检索与动态列 */
    @Column(name = "module", length = 100)
    private String module;

    /** 功能点（模块下的三级分类），用于上下文检索与动态列 */
    @Column(name = "function_point", length = 100)
    private String functionPoint;

    /** 来源链接（link 类型文档的原始 URL） */
    @Column(name = "source_url", length = 1024)
    private String sourceUrl;

    /** 扩展字段 JSON（任意 key-value 元数据，用于列表字段自动调整） */
    @Column(name = "extra_fields", columnDefinition = "LONGTEXT")
    @Lob
    private String extraFields;

    /** 向量嵌入 JSON 数组（float[]），用于语义检索；无 LLM 时为 null */
    @Column(name = "embedding", columnDefinition = "LONGTEXT")
    @Lob
    private String embedding;

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

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getContentPreview() { return contentPreview; }
    public void setContentPreview(String contentPreview) { this.contentPreview = contentPreview; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getProductLine() { return productLine; }
    public void setProductLine(String productLine) { this.productLine = productLine; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getFunctionPoint() { return functionPoint; }
    public void setFunctionPoint(String functionPoint) { this.functionPoint = functionPoint; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getExtraFields() { return extraFields; }
    public void setExtraFields(String extraFields) { this.extraFields = extraFields; }

    public String getEmbedding() { return embedding; }
    public void setEmbedding(String embedding) { this.embedding = embedding; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}