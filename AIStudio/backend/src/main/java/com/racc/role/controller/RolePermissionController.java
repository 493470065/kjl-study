package com.racc.role.controller;

import com.racc.role.service.RolePermissionService;
import com.racc.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 角色（定义 + 菜单权限）接口。
 * GET    /api/role-permissions        → 所有角色（含术语、内置标记、菜单）
 * POST   /api/role-permissions        → 新增自定义角色
 * PUT    /api/role-permissions/{role} → 更新角色术语/说明/排序/菜单
 * DELETE /api/role-permissions/{role} → 删除自定义角色（内置角色、被用户引用的角色禁止删除）
 */
@RestController
@RequestMapping("/api/role-permissions")
public class RolePermissionController {

    private final RolePermissionService service;
    private final UserRepository users;

    public RolePermissionController(RolePermissionService service, UserRepository users) {
        this.service = service;
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAllRolePermissions());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.createRole(body == null ? Map.of() : body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{role}")
    public ResponseEntity<?> update(@PathVariable String role, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.updateRole(role, body == null ? Map.of() : body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{role}")
    public ResponseEntity<?> delete(@PathVariable String role) {
        String key = role == null ? "" : role.trim().toUpperCase();
        long used = users.countByRole(key);
        if (used > 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "该角色下仍有 " + used + " 个用户，请先调整这些用户的角色"));
        }
        try {
            service.deleteRole(role);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
