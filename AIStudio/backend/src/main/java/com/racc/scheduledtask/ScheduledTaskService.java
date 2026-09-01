package com.racc.scheduledtask;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.pipeline.dto.StartPipelineRequest;
import com.racc.pipeline.service.PipelineService;
import com.racc.scheduledtask.entity.ScheduledTaskEntity;
import com.racc.scheduledtask.entity.TaskLogEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
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
 * 执行约定：taskKey 以 automate: 开头 → 触发对应自动化任务类型的一次 pipeline 执行；
 * 其余 taskKey 暂无执行体，记 SKIPPED。
 */
@Service
public class ScheduledTaskService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTaskService.class);

    /** taskKey 前缀：后接自动化任务类型 code（见 automate 模块） */
    public static final String AUTOMATE_PREFIX = "automate:";

    private final ScheduledTaskRepository taskRepository;
    private final TaskLogRepository logRepository;
    private final TaskScheduler taskScheduler;
    private final PipelineService pipelineService;
    private final ObjectMapper objectMapper;

    /** 已注册任务的 future 快照（taskKey -> future） */
    private final ConcurrentHashMap<String, ScheduledFuture<?>> scheduledFutures = new ConcurrentHashMap<>();

    public ScheduledTaskService(ScheduledTaskRepository taskRepository,
                                TaskLogRepository logRepository,
                                TaskScheduler taskScheduler,
                                PipelineService pipelineService,
                                ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.logRepository = logRepository;
        this.taskScheduler = taskScheduler;
        this.pipelineService = pipelineService;
        this.objectMapper = objectMapper;
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
    public ScheduledTaskEntity createTask(Map<String, Object> body) {
        String taskKey = trimOrNull((String) body.get("taskKey"));
        if (taskKey == null || !taskKey.matches("[A-Za-z0-9_:-]+")) {
            throw new IllegalArgumentException("任务标识仅允许字母、数字、下划线、中划线、冒号（automate:<code> 约定）");
        }
        if (taskRepository.findByTaskKey(taskKey).isPresent()) {
            throw new IllegalArgumentException("任务标识已存在: " + taskKey);
        }
        String name = trimOrNull((String) body.get("name"));
        if (name == null) {
            throw new IllegalArgumentException("任务名称不能为空");
        }
        String cron = trimOrNull((String) body.get("cronExpression"));
        if (cron == null) {
            throw new IllegalArgumentException("Cron 表达式不能为空");
        }
        try {
            CronExpression.parse(cron);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cron 表达式不合法（需为 Spring 6 位格式）: " + cron);
        }

        ScheduledTaskEntity task = new ScheduledTaskEntity();
        task.setTaskKey(taskKey);
        task.setName(name);
        task.setDescription(trimOrNull((String) body.get("description")));
        task.setCronExpression(cron);
        String paramsJson = trimOrNull((String) body.get("paramsJson"));
        validateParamsJson(paramsJson);
        task.setParamsJson(paramsJson);
        task.setEnabled(body.get("enabled") == null || Boolean.TRUE.equals(body.get("enabled")));
        task = taskRepository.save(task);

        if (Boolean.TRUE.equals(task.getEnabled())) {
            registerTask(task);
        }
        log.info("定时任务 [{}]({}) 已创建, cron={}, enabled={}", taskKey, name, cron, task.getEnabled());
        return task;
    }

    private static String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** 校验执行参数 JSON（须为对象），空值跳过 */
    private void validateParamsJson(String paramsJson) {
        if (paramsJson != null) {
            parseParams(paramsJson);
        }
    }

    /** 解析执行参数 JSON；空视为空对象 */
    private Map<String, Object> parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(paramsJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("执行参数 JSON 不合法（需为对象）: " + e.getMessage());
        }
    }

    /** 以 system 身份执行（调度线程无登录用户），执行完恢复原上下文 */
    private <T> T withSystemUser(java.util.function.Supplier<T> action) {
        var previous = SecurityContextHolder.getContext().getAuthentication();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("system", null, List.of()));
        try {
            return action.get();
        } finally {
            SecurityContextHolder.getContext().setAuthentication(previous);
        }
    }

    @Transactional
    public ScheduledTaskEntity updateTask(Long id, Map<String, Object> updates) {
        ScheduledTaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("任务不存在: " + id));

        if (updates.containsKey("name")) task.setName((String) updates.get("name"));
        if (updates.containsKey("description")) task.setDescription((String) updates.get("description"));
        if (updates.containsKey("cronExpression")) task.setCronExpression((String) updates.get("cronExpression"));
        if (updates.containsKey("paramsJson")) {
            String paramsJson = trimOrNull((String) updates.get("paramsJson"));
            validateParamsJson(paramsJson);
            task.setParamsJson(paramsJson);
        }
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

    @Transactional
    public void deleteTask(Long id) {
        ScheduledTaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("任务不存在: " + id));
        cancelTask(task.getTaskKey());
        taskRepository.delete(task);
        log.info("定时任务 [{}] 已删除", task.getTaskKey());
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
            String status;
            String message;
            String key = task.getTaskKey();
            if (key != null && key.startsWith(AUTOMATE_PREFIX)) {
                // 自动化任务桥接：发起一次对应任务类型的 pipeline 执行
                String typeCode = key.substring(AUTOMATE_PREFIX.length());
                StartPipelineRequest req = new StartPipelineRequest();
                req.setTaskType(typeCode);
                req.setParams(parseParams(task.getParamsJson()));
                Long pipelineId = withSystemUser(() -> pipelineService.start(req).getId());
                status = "SUCCESS";
                message = "已启动自动化任务: 类型=" + typeCode + ", 执行实例=" + pipelineId + "（进度见自动化管理）";
            } else {
                // 约定外的 taskKey 暂无执行体，如实记为跳过
                status = "SKIPPED";
                message = "无执行体（taskKey 需以 automate: 开头或等待扩展注册）";
            }
            log.info("定时任务 [{}] 执行完成: {} - {}", key, status, message);

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