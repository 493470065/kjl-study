package com.racc.scheduledtask;

import com.racc.scheduledtask.entity.ScheduledTaskEntity;
import com.racc.scheduledtask.entity.TaskLogEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 定时任务服务：管理动态任务注册、执行日志、缓存状态。
 * 启动时从 DB 加载所有 enabled 任务注册到 TaskScheduler。
 */
@Service
public class ScheduledTaskService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTaskService.class);

    private final ScheduledTaskRepository taskRepository;
    private final TaskLogRepository logRepository;
    private final TaskScheduler taskScheduler;

    /** 已注册任务的 future 快照（taskKey -> future） */
    private final ConcurrentHashMap<String, ScheduledFuture<?>> scheduledFutures = new ConcurrentHashMap<>();

    public ScheduledTaskService(ScheduledTaskRepository taskRepository,
                                TaskLogRepository logRepository,
                                TaskScheduler taskScheduler) {
        this.taskRepository = taskRepository;
        this.logRepository = logRepository;
        this.taskScheduler = taskScheduler;
        initTasks();
    }

    /** 启动时加载所有启用的任务 */
    private void initTasks() {
        List<ScheduledTaskEntity> enabled = taskRepository.findByEnabledTrue();
        for (ScheduledTaskEntity task : enabled) {
            registerTask(task);
        }
        log.info("ScheduledTaskService: 已加载 {} 个定时任务", enabled.size());
    }

    // ========== 任务 CRUD ==========

    public List<ScheduledTaskEntity> listTasks() {
        return taskRepository.findAll();
    }

    @Transactional
    public ScheduledTaskEntity updateTask(Long id, Map<String, Object> updates) {
        ScheduledTaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("任务不存在: " + id));

        if (updates.containsKey("name")) task.setName((String) updates.get("name"));
        if (updates.containsKey("description")) task.setDescription((String) updates.get("description"));
        if (updates.containsKey("cronExpression")) task.setCronExpression((String) updates.get("cronExpression"));
        if (updates.containsKey("enabled")) task.setEnabled((Boolean) updates.get("enabled"));

        task.setUpdatedAt(LocalDateTime.now());
        task = taskRepository.save(task);

        // 重新注册
        cancelTask(task.getTaskKey());
        if (Boolean.TRUE.equals(task.getEnabled()) && task.getCronExpression() != null) {
            registerTask(task);
        }
        return task;
    }

    @Transactional
    public TaskLogEntity triggerTask(Long id) {
        ScheduledTaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("任务不存在: " + id));
        return executeTask(task);
    }

    // ========== 执行日志 ==========

    public List<TaskLogEntity> listLogs(String taskKey) {
        if (taskKey != null && !taskKey.isBlank()) {
            return logRepository.findByTaskKeyOrderByStartTimeDesc(taskKey);
        }
        return logRepository.findAllByOrderByStartTimeDesc();
    }

    // ========== 缓存状态 ==========

    public Map<String, Object> getCacheStatus() {
        Map<String, Object> status = new ConcurrentHashMap<>();
        for (Map.Entry<String, ScheduledFuture<?>> entry : scheduledFutures.entrySet()) {
            ScheduledFuture<?> future = entry.getValue();
            boolean hasData = future != null && !future.isCancelled();
            status.put(entry.getKey(), Map.of(
                    "updatedAt", null,
                    "hasData", hasData
            ));
        }
        return status;
    }

    // ========== 内部 ==========

    /** 注册一个任务到 TaskScheduler（cron 驱动） */
    private void registerTask(ScheduledTaskEntity task) {
        String key = task.getTaskKey();
        try {
            CronExpression.parse(task.getCronExpression());
        } catch (Exception e) {
            log.warn("invalid cron expression for task {}: {}", key, task.getCronExpression());
            return;
        }

        Trigger trigger = new CronTrigger(task.getCronExpression());
        ScheduledFuture<?> future = taskScheduler.schedule(() -> {
            ScheduledTaskEntity current = taskRepository.findByTaskKey(key).orElse(null);
            if (current == null || !Boolean.TRUE.equals(current.getEnabled())) {
                return;
            }
            executeTask(current);
        }, trigger);

        scheduledFutures.put(key, future);
        log.info("定时任务 [{}] 已注册, cron={}", key, task.getCronExpression());
    }

    /** 取消已注册的任务 */
    private void cancelTask(String taskKey) {
        ScheduledFuture<?> future = scheduledFutures.remove(taskKey);
        if (future != null) {
            future.cancel(false);
            log.info("定时任务 [{}] 已取消", taskKey);
        }
    }

    /** 执行任务并记录日志 */
    private TaskLogEntity executeTask(ScheduledTaskEntity task) {
        LocalDateTime start = LocalDateTime.now();
        TaskLogEntity logEntry = new TaskLogEntity();
        logEntry.setTaskId(task.getId());
        logEntry.setTaskKey(task.getTaskKey());
        logEntry.setTaskName(task.getName());
        logEntry.setStartTime(start);

        try {
            // 通过 Spring 应用上下文查找并执行任务 bean
            // 约定：任务 bean 名 = taskKey + "Task"，或直接按 taskKey 查找
            String status = "SUCCESS";
            String message = "任务执行成功";
            // 实际执行由具体任务逻辑实现，此处预留扩展点
            log.info("定时任务 [{}] 开始执行", task.getTaskKey());
            // TODO: 通过 ApplicationContext 查找并执行 Runnable bean
            // 按 taskKey 查找 bean: context.getBean(taskKey, Runnable.class).run();

            LocalDateTime end = LocalDateTime.now();
            logEntry.setEndTime(end);
            logEntry.setStatus(status);
            logEntry.setMessage(message);
            logEntry.setDurationMs(java.time.Duration.between(start, end).toMillis());

            // 更新任务最后执行信息
            task.setLastRunTime(end);
            task.setLastStatus(status);
            task.setLastMessage(message);
            task.setUpdatedAt(end);
            taskRepository.save(task);

        } catch (Exception e) {
            LocalDateTime end = LocalDateTime.now();
            logEntry.setEndTime(end);
            logEntry.setStatus("FAILED");
            logEntry.setMessage(e.getMessage());
            logEntry.setDurationMs(java.time.Duration.between(start, end).toMillis());

            task.setLastRunTime(end);
            task.setLastStatus("FAILED");
            task.setLastMessage(e.getMessage());
            task.setUpdatedAt(end);
            taskRepository.save(task);
        }

        return logRepository.save(logEntry);
    }
}