package com.racc.automate.controller;

import com.racc.automate.entity.AutomateTaskTypeEntity;
import com.racc.automate.service.AutomateTaskTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 自动化任务类型管理接口
 *
 * 端点：
 *   GET    /api/automate/task-types?enabledOnly=true  → 列表
 *   POST   /api/automate/task-types                   → 新建
 *   PUT    /api/automate/task-types/{id}              → 编辑
 *   DELETE /api/automate/task-types/{id}              → 删除
 */
@RestController
@RequestMapping("/api/automate/task-types")
public class AutomateTaskTypeController {

    private final AutomateTaskTypeService service;

    public AutomateTaskTypeController(AutomateTaskTypeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AutomateTaskTypeEntity>> list(
            @RequestParam(defaultValue = "false") boolean enabledOnly) {
        return ResponseEntity.ok(service.list(enabledOnly));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.create(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.update(id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
