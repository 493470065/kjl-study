package com.racc.role.entity;

import jakarta.persistence.*;

/**
 * 角色权限配置表。存储各角色（ADMIN/USER）的 allowedMenus 配置。
 * allowedMenus 为 "*"（全部）或 JSON 数组字符串。
 */
@Entity
@Table(name = "role_permissions")
public class RolePermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 16)
    private String role;

    /** "*" 或 JSON 数组字符串，如 "[\"/\", \"/chat\", \"/users\"]" */
    @Column(name = "allowed_menus", length = 2000)
    private String allowedMenus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAllowedMenus() { return allowedMenus; }
    public void setAllowedMenus(String allowedMenus) { this.allowedMenus = allowedMenus; }
}