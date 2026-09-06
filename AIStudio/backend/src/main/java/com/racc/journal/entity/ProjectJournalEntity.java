package com.racc.journal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 项目工作台数据快照（通用键值文档）。
 * 以 (scope, bucket) 定位一份 JSON 数组载荷，由前端整包读写：
 * - scope：项目标识（如 ml-special = 多语专项）
 * - bucket：数据分类（milestones 里程碑 / docs 重要文档 / weeks 每周总结 / evals AI评估记录）
 * 前端整包读取与覆盖写，避免逐条 CRUD 的表结构维护成本。
 */
@Entity
@Table(name = "project_journal", uniqueConstraints = {
    @UniqueConstraint(name = "uk_journal_scope_bucket", columnNames = {"scope", "bucket"})
})
public class ProjectJournalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String scope;

    @Column(nullable = false, length = 64)
    private String bucket;

    /** JSON 数组字符串（前端负责结构，后端仅透传存储） */
    @Column(name = "payload", nullable = false, columnDefinition = "LONGTEXT")
    private String payload;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
