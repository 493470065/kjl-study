package com.racc.role.controller;

import com.racc.role.service.RolePermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 角色权限接口。
 * GET  /api/role-permissions       → 所有角色权限
 * PUT  /api/role-permissions/{role} → 更新角色权限
 */
@RestController
@RequestMapping("/api/role-permissions")
public class RolePermissionController {

    private final RolePermissionService service;

    public RolePermissionController(RolePermissionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAllRolePermissions());
    }

    @PutMapping("/{role}")
    public ResponseEntity<?> update(@PathVariable String role, @RequestBody Map<String, List<String>> body) {
        List<String> allowedMenus = body.get("allowedMenus");
        if (allowedMenus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "allowedMenus 不能为空"));
        }
        return ResponseEntity.ok(service.updateRolePermission(role, allowedMenus));
    }
}