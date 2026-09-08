package com.racc.userpref.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户个人偏好配置（通用 KV）。每个用户每个 key 一行，值存 JSON 原文。
 * 前端配置如需求看板、知识库列显隐等通过 /api/user/prefs/{key} 存取。
 */
@Entity
@Table(name = "user_preference",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "pref_key"}))
public class UserPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "pref_key", nullable = false, length = 64)
    private String prefKey;

    @Column(name = "pref_value", columnDefinition = "TEXT")
    private String prefValue;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPrefKey() { return prefKey; }
    public void setPrefKey(String prefKey) { this.prefKey = prefKey; }

    public String getPrefValue() { return prefValue; }
    public void setPrefValue(String prefValue) { this.prefValue = prefValue; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
