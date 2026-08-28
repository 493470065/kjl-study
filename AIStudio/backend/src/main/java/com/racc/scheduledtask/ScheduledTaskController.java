package com.racc.scheduledtask;

import com.racc.scheduledtask.entity.ScheduledTaskEntity;
import com.racc.scheduledtask.entity.TaskLogEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 定时任务管理接口
 *  GET  /api/scheduled-tasks           → 任务列表
 *  PUT  /api/scheduled-tasks/{id}      → 编辑任务（cron/启用/禁用等）
 *  POST /api/scheduled-tasks/{id}/trigger → 手动触发
 *  GET  /api/scheduled-tasks/logs      → 执行记录（?taskKey=）
 *  GET  /api/scheduled-tasks/cache-status → 缓存状态
 */
@RestController
@RequestMapping("/api/scheduled-tasks")
public class ScheduledTaskController {

    private final ScheduledTaskService service;

    public ScheduledTaskController(ScheduledTaskService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ScheduledTaskEntity>> listTasks() {
        return ResponseEntity.ok(service.listTasks());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduledTaskEntity> updateTask(@PathVariable Long id,
                                                           @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateTask(id, body));
    }

    @PostMapping("/{id}/trigger")
    public ResponseEntity<TaskLogEntity> triggerTask(@PathVariable Long id) {
        return ResponseEntity.ok(service.triggerTask(id));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<TaskLogEntity>> listLogs(@RequestParam(required = false) String taskKey) {
        return ResponseEntity.ok(service.listLogs(taskKey));
    }

    @GetMapping("/cache-status")
    public ResponseEntity<Map<String, Object>> getCacheStatus() {
        return ResponseEntity.ok(service.getCacheStatus());
    }
}