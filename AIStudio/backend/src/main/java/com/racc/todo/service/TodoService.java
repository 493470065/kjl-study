package com.racc.todo.service;

import com.racc.todo.entity.TodoEntity;
import com.racc.todo.repository.TodoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 待办事项服务。所有读写均按 userId 隔离，保证每位用户只能看到与操作自己的待办。
 */
@Service
@Transactional
public class TodoService {

    private final TodoRepository repository;

    public TodoService(TodoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TodoEntity> list(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public TodoEntity create(Long userId, Map<String, Object> body) {
        TodoEntity e = new TodoEntity();
        e.setUserId(userId);
        e.setTitle((String) body.get("title"));
        applyFields(e, body);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e);
    }

    public TodoEntity update(Long userId, Long id, Map<String, Object> body) {
        TodoEntity e = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("待办不存在"));
        if (body.containsKey("title")) {
            e.setTitle((String) body.get("title"));
        }
        applyFields(e, body);
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e);
    }

    public void delete(Long userId, Long id) {
        TodoEntity e = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("待办不存在"));
        repository.delete(e);
    }

    /** 切换完成状态：未完成 → COMPLETED（记录完成时间）；已完成 → 回退为 PENDING */
    public TodoEntity toggle(Long userId, Long id) {
        TodoEntity e = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("待办不存在"));
        if ("COMPLETED".equals(e.getStatus())) {
            e.setStatus("PENDING");
            e.setCompletedAt(null);
        } else {
            e.setStatus("COMPLETED");
            e.setCompletedAt(LocalDateTime.now());
        }
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e);
    }

    /** 从请求体中有选择地更新可编辑字段 */
    private void applyFields(TodoEntity e, Map<String, Object> body) {
        if (body.containsKey("description")) {
            Object d = body.get("description");
            e.setDescription(d == null ? null : (String) d);
        }
        if (body.containsKey("status")) {
            Object s = body.get("status");
            if (s != null) e.setStatus((String) s);
        }
        if (body.containsKey("priority")) {
            Object p = body.get("priority");
            if (p != null) e.setPriority((String) p);
        }
        if (body.containsKey("dueDate")) {
            Object due = body.get("dueDate");
            if (due == null || "".equals(due)) {
                e.setDueDate(null);
            } else {
                e.setDueDate(parseDateTime(due.toString()));
            }
        }
    }

    /** 解析前端传来的日期：支持 yyyy-MM-dd、yyyy-MM-dd HH:mm、yyyy-MM-dd'T'HH:mm */
    private LocalDateTime parseDateTime(String s) {
        try {
            if (s.length() <= 10) {
                return LocalDate.parse(s).atStartOfDay();
            }
            return LocalDateTime.parse(s.replace(' ', 'T'));
        } catch (Exception ex) {
            return null;
        }
    }
}
