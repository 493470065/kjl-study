package com.racc.knowledge.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 链接配置实体（持久化链接库）。
 * 用户可在「链接配置」中保存一组待抓取链接及其元数据（分类/标签/产品/模块/功能点），
 * 支持单条或批量重新抓取；抓取的文档以 sourceType='link' 入库。
 */
@Entity
@Table(name = "knowledge_link_configs")
public class LinkConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 2048)
    private String url;

    /** 抓取模式：auto=自动提取正文，raw=保留原始 HTML 文本 */
    @Column(name = "fetch_mode", length = 20)
    private String fetchMode = "auto";

    @Column(length = 100)
    private String category;

    @Column(length = 500)
    private String tags;

    @Column(name = "product_line", length = 100)
    private String productLine;

    @Column(name = "module", length = 100)
    private String module;

    @Column(name = "function_point", length = 100)
    private String functionPoint;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /** 最近一次抓取状态：success / failed / pending / never */
    @Column(name = "last_status", length = 20)
    private String lastStatus = "never";

    @Column(name = "last_message", length = 500)
    private String lastMessage;

    @Column(name = "last_fetched_at")
    private LocalDateTime lastFetchedAt;

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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getFetchMode() { return fetchMode; }
    public void setFetchMode(String fetchMode) { this.fetchMode = fetchMode; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getProductLine() { return productLine; }
    public void setProductLine(String productLine) { this.productLine = productLine; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getFunctionPoint() { return functionPoint; }
    public void setFunctionPoint(String functionPoint) { this.functionPoint = functionPoint; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getLastStatus() { return lastStatus; }
    public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getLastFetchedAt() { return lastFetchedAt; }
    public void setLastFetchedAt(LocalDateTime lastFetchedAt) { this.lastFetchedAt = lastFetchedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
