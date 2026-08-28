package com.racc.role.service;

import com.racc.role.entity.RolePermissionEntity;
import com.racc.role.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 角色权限服务。
 */
@Service
@Transactional
public class RolePermissionService {

    private final RolePermissionRepository repository;

    public RolePermissionService(RolePermissionRepository repository) {
        this.repository = repository;
    }

    /**
     * 获取所有角色权限配置。
     * 返回数组格式：前端期望 [{role: "ADMIN", allowedMenus: "*"}, {role: "USER", allowedMenus: [...]}]
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllRolePermissions() {
        List<RolePermissionEntity> all = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (RolePermissionEntity entity : all) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("role", entity.getRole());
            String menus = entity.getAllowedMenus();
            if ("*".equals(menus)) {
                item.put("allowedMenus", "*");
            } else if (menus != null && !menus.isBlank()) {
                // 尝试解析 JSON 数组，否则按逗号分割
                if (menus.startsWith("[")) {
                    try {
                        // 简单去掉方括号和引号
                        String trimmed = menus.substring(1, menus.length() - 1);
                        if (trimmed.isBlank()) {
                            item.put("allowedMenus", Collections.emptyList());
                        } else {
                            String[] parts = trimmed.split(",");
                            List<String> list = new ArrayList<>();
                            for (String p : parts) {
                                list.add(p.trim().replaceAll("^\"|\"$", ""));
                            }
                            item.put("allowedMenus", list);
                        }
                    } catch (Exception e) {
                        item.put("allowedMenus", Arrays.asList(menus.split(",")));
                    }
                } else {
                    item.put("allowedMenus", Arrays.asList(menus.split(",")));
                }
            } else {
                item.put("allowedMenus", Collections.emptyList());
            }
            result.add(item);
        }
        return result;
    }

    /**
     * 更新指定角色的 allowedMenus。
     */
    public Map<String, Object> updateRolePermission(String role, List<String> allowedMenus) {
        RolePermissionEntity entity = repository.findByRole(role.toUpperCase())
                .orElseGet(() -> {
                    RolePermissionEntity e = new RolePermissionEntity();
                    e.setRole(role.toUpperCase());
                    return e;
                });

        // 存储为 JSON 数组字符串
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < allowedMenus.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(allowedMenus.get(i)).append("\"");
        }
        sb.append("]");
        entity.setAllowedMenus(sb.toString());
        repository.save(entity);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("role", entity.getRole());
        result.put("allowedMenus", allowedMenus);
        return result;
    }
}