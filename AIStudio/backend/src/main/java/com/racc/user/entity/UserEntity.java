package com.racc.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户表。allowedMenus 为 "*"（全部）或逗号分隔路径列表，
 * 序列化到前端时拆为数组 —— 与参考平台 UserInfo 结构一致。
 */
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 64)
    private String displayName;

    @Column(name = "emp_no", length = 32)
    private String empNo;

    /** ADMIN | USER */
    @Column(nullable = false, length = 16)
    private String role = "USER";

    @Column(nullable = false)
    private Boolean enabled = true;

    /** "*" 或逗号分隔的菜单路径 */
    @Column(length = 2000)
    private String allowedMenus = "*";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmpNo() { return empNo; }
    public void setEmpNo(String empNo) { this.empNo = empNo; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public String getAllowedMenus() { return allowedMenus; }
    public void setAllowedMenus(String allowedMenus) { this.allowedMenus = allowedMenus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
