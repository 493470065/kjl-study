package com.racc.role.entity;

import jakarta.persistence.*;

/**
 * 角色定义 + 菜单权限配置表。
 * <p>
 * 一个角色一行：role 为角色编码（如 SUPER_ADMIN / ADMIN / USER 或自定义编码），
 * label 为界面显示的术语（可配置），allowedMenus 为 "*" 或 JSON 数组字符串。
 */
@Entity
@Table(name = "role_permissions")
public class RolePermissionEntity {

    /** 超级管理员：内置角色，固定拥有全部菜单，不可删除、菜单不可修改 */
    public static final String SUPER_ADMIN = "SUPER_ADMIN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 角色编码：大写英文 + 下划线，如 SUPER_ADMIN / ADMIN / USER / VIEWER */
    @Column(nullable = false, unique = true, length = 32)
    private String role;

    /** 角色术语（界面显示名），可配置，如「超级管理员」「只读访客」 */
    @Column(length = 32)
    private String label;

    /** 角色说明 */
    @Column(length = 200)
    private String description;

    /** 内置角色：不允许删除（SUPER_ADMIN / ADMIN / USER） */
    @Column(nullable = false)
    private Boolean builtin = false;

    /** 排序号，越小越靠前 */
    @Column(name = "sort_order")
    private Integer sortOrder = 99;

    /** "*" 或 JSON 数组字符串，如 "[\"/\", \"/chat\", \"/users\"]" */
    @Column(name = "allowed_menus", length = 4000)
    private String allowedMenus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getBuiltin() { return builtin; }
    public void setBuiltin(Boolean builtin) { this.builtin = builtin; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getAllowedMenus() { return allowedMenus; }
    public void setAllowedMenus(String allowedMenus) { this.allowedMenus = allowedMenus; }
}
