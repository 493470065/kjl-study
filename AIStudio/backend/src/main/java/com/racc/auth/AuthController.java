package com.racc.auth;

import com.racc.role.service.RolePermissionService;
import com.racc.user.entity.UserEntity;
import com.racc.user.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证接口（对齐参考平台契约）：
 *  POST /api/auth/login          {username,password} → {token,user}
 *  GET  /api/auth/me             → {displayName,role,allowedMenus[],username,empNo}
 *  PUT  /api/auth/password       {oldPassword,newPassword}
 *  GET  /api/auth/token          → 个人 API 令牌
 *  POST /api/auth/token/regenerate
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final JwtService jwt;
    private final PasswordEncoder encoder;
    private final RolePermissionService rolePermissions;

    public AuthController(UserRepository users, JwtService jwt, PasswordEncoder encoder,
                          RolePermissionService rolePermissions) {
        this.users = users;
        this.jwt = jwt;
        this.encoder = encoder;
        this.rolePermissions = rolePermissions;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名或密码为空"));
        }
        UserEntity user = users.findByUsername(username).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getEnabled())
                || !encoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "用户名或密码错误"));
        }
        String token = jwt.generateToken(user.getUsername(), user.getRole());
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", toUserInfo(user));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        UserEntity user = currentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录或登录已过期"));
        }
        return ResponseEntity.ok(toUserInfo(user));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        UserEntity user = currentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录或登录已过期"));
        }
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "参数无效或新密码过短（≥6位）"));
        }
        if (!encoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "原密码错误"));
        }
        user.setPassword(encoder.encode(newPassword));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        users.save(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/token")
    public ResponseEntity<?> apiToken() {
        UserEntity user = currentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录或登录已过期"));
        }
        // 个人 API 令牌：直接复用 JWT（24h），与登录 token 同源
        return ResponseEntity.ok(Map.of("token", jwt.generateToken(user.getUsername(), user.getRole())));
    }

    @PostMapping("/token/regenerate")
    public ResponseEntity<?> regenerateToken() {
        return apiToken();
    }

    // ---------- helpers ----------

    private UserEntity currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return users.findByUsername(String.valueOf(auth.getPrincipal())).orElse(null);
    }

    /**
     * 用户信息：菜单权限来自「角色配置」而非用户自身的 allowed_menus 字段，
     * 即「用户通过角色配置显示哪些菜单」。用户表的 allowedMenus 保留为个人兜底，
     * 仅当角色无配置时回退使用。
     */
    Map<String, Object> toUserInfo(UserEntity user) {
        Map<String, Object> info = new HashMap<>();
        info.put("username", user.getUsername());
        info.put("displayName", user.getDisplayName());
        info.put("role", user.getRole());
        info.put("roleLabel", rolePermissions.resolveRoleLabel(user.getRole()));
        Object menus = rolePermissions.resolveMenusForRole(user.getRole());
        if (menus instanceof String) {
            info.put("allowedMenus", menus);
        } else if (menus instanceof java.util.Collection<?> c && !c.isEmpty()) {
            info.put("allowedMenus", menus);
        } else {
            // 角色无配置：回退到用户自身的 allowedMenus（历史数据兼容）
            String own = user.getAllowedMenus();
            info.put("allowedMenus", "*".equals(own) ? "*"
                    : (own == null || own.isBlank() ? Collections.emptyList() : own.split(",")));
        }
        info.put("empNo", user.getEmpNo());
        return info;
    }
}
