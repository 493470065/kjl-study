package com.racc.userconfig.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户 TFS 配置表。对应用户个人配置中的 TFS 设置。
 * 通过 userId 与 users 表关联。
 */
@Entity
@Table(name = "user_tfs_config")
public class UserTfsConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tfs_server_url", length = 512)
    private String tfsServerUrl;

    @Column(name = "personal_access_token", length = 512)
    private String personalAccessToken;

    @Column(name = "git_username", length = 128)
    private String gitUsername;

    @Column(name = "git_password", length = 512)
    private String gitPassword;

    @Column(name = "wxp_usercode", length = 64)
    private String wxpUsercode;

    @Column(name = "wxp_password", length = 512)
    private String wxpPassword;

    @Column(nullable = false)
    private Boolean enabled = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTfsServerUrl() { return tfsServerUrl; }
    public void setTfsServerUrl(String tfsServerUrl) { this.tfsServerUrl = tfsServerUrl; }

    public String getPersonalAccessToken() { return personalAccessToken; }
    public void setPersonalAccessToken(String personalAccessToken) { this.personalAccessToken = personalAccessToken; }

    public String getGitUsername() { return gitUsername; }
    public void setGitUsername(String gitUsername) { this.gitUsername = gitUsername; }

    public String getGitPassword() { return gitPassword; }
    public void setGitPassword(String gitPassword) { this.gitPassword = gitPassword; }

    public String getWxpUsercode() { return wxpUsercode; }
    public void setWxpUsercode(String wxpUsercode) { this.wxpUsercode = wxpUsercode; }

    public String getWxpPassword() { return wxpPassword; }
    public void setWxpPassword(String wxpPassword) { this.wxpPassword = wxpPassword; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}