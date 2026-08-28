package com.racc.auth;

import com.racc.user.entity.UserEntity;
import com.racc.user.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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

    public AuthController(UserRepository users, JwtService jwt, PasswordEncoder encoder) {
        this.users = users;
        this.jwt = jwt;
        this.encoder = encoder;
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

    static Map<String, Object> toUserInfo(UserEntity user) {
        Map<String, Object> info = new HashMap<>();
        info.put("username", user.getUsername());
        info.put("displayName", user.getDisplayName());
        info.put("role", user.getRole());
        String menus = user.getAllowedMenus();
        info.put("allowedMenus", "*".equals(menus) ? "*" : menus.split(","));
        info.put("empNo", user.getEmpNo());
        return info;
    }
}
