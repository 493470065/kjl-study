package com.racc.todo.controller;

import com.racc.todo.entity.TodoEntity;
import com.racc.todo.service.TodoService;
import com.racc.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 待办事项接口（按当前登录用户隔离）。
 *  GET    /api/todos            → 当前用户全部待办
 *  POST   /api/todos            → 新增待办
 *  PUT    /api/todos/{id}       → 编辑待办
 *  DELETE /api/todos/{id}       → 删除待办
 *  PATCH  /api/todos/{id}/toggle → 切换完成状态
 */
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService service;
    private final UserRepository userRepository;

    public TodoController(TodoService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<TodoEntity>> list() {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(null);
        return ResponseEntity.ok(service.list(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        Object title = body.get("title");
        if (title == null || ((String) title).isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "标题不能为空"));
        }
        return ResponseEntity.ok(service.create(userId, body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            return ResponseEntity.ok(service.update(userId, id, body));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            service.delete(userId, id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            return ResponseEntity.ok(service.toggle(userId, id));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    /** 从 SecurityContextHolder 获取当前登录用户名，再查询 userId */
    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = String.valueOf(auth.getPrincipal());
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}
