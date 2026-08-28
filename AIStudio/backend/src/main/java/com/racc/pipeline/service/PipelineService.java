package com.racc.pipeline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.automate.entity.AutomateTaskTypeEntity;
import com.racc.automate.service.AutomateTaskTypeService;
import com.racc.pipeline.dto.ConfirmRequest;
import com.racc.pipeline.dto.StartPipelineRequest;
import com.racc.pipeline.dto.WorkflowNodeRequest;
import com.racc.pipeline.entity.*;
import com.racc.pipeline.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Pipeline 执行服务
 *
 * Pipeline 状态机：
 *   PENDING → RUNNING → WAITING_CONFIRM → PAUSED_ON_FAILURE → COMPLETED / FAILED / CANCELLED
 */
@Service
@Transactional
public class PipelineService {

    private static final Logger log = LoggerFactory.getLogger(PipelineService.class);

    private final PipelineTaskRepository taskRepo;
    private final PipelineStepRepository stepRepo;
    private final PipelineFileChangeRepository fileChangeRepo;
    private final PipelineArtifactRepository artifactRepo;
    private final PipelineLogRepository logRepo;
    private final AutomateTaskTypeService taskTypeService;
    private final PipelineExecutionService executionService;
    private final ObjectMapper objectMapper;

    public PipelineService(PipelineTaskRepository taskRepo,
                           PipelineStepRepository stepRepo,
                           PipelineFileChangeRepository fileChangeRepo,
                           PipelineArtifactRepository artifactRepo,
                           PipelineLogRepository logRepo,
                           AutomateTaskTypeService taskTypeService,
                           PipelineExecutionService executionService,
                           ObjectMapper objectMapper) {
        this.taskRepo = taskRepo;
        this.stepRepo = stepRepo;
        this.fileChangeRepo = fileChangeRepo;
        this.artifactRepo = artifactRepo;
        this.logRepo = logRepo;
        this.taskTypeService = taskTypeService;
        this.executionService = executionService;
        this.objectMapper = objectMapper;
    }

    // ==================== 状态常量 ====================

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_WAITING_CONFIRM = "WAITING_CONFIRM";
    public static final String STATUS_PAUSED_ON_FAILURE = "PAUSED_ON_FAILURE";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    // ==================== CRUD ====================

    @Transactional(readOnly = true)
    public List<PipelineTaskEntity> listAll() {
        return taskRepo.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public PipelineTaskEntity getById(Long id) {
        return taskRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Pipeline 不存在: " + id));
    }

    /**
     * 启动 Pipeline（自动化任务统一入口）
     * - 指定 taskType 时：校验类型有效性与表单参数，绑定解析到 skill/workflow
     * - 保存后在事务提交后异步提交执行器（避免 worker 先于提交读不到任务行）
     */
    public PipelineTaskEntity start(StartPipelineRequest req) {
        String username = currentUsername();
        Map<String, Object> params = req.getParams() != null ? req.getParams() : Map.of();

        PipelineTaskEntity task = new PipelineTaskEntity();
        task.setTfsWorkItemId(req.getTfsWorkItemId());
        task.setProjectId(req.getProjectId());
        task.setSkillName(req.getSkillName());
        task.setProductLineId(req.getProductLineId());
        task.setRepoIds(req.getRepoIds());
        task.setWorkflowDefinitionId(req.getWorkflowDefinitionId());

        if (req.getTaskType() != null && !req.getTaskType().isBlank()) {
            AutomateTaskTypeEntity type = taskTypeService.getByCode(req.getTaskType());
            if (!Boolean.TRUE.equals(type.getEnabled())) {
                throw new IllegalArgumentException("任务类型已停用: " + type.getName());
            }
            taskTypeService.validateParams(type, params);
            task.setTaskType(type.getCode());
            task.setModel(type.getModel());
            // 绑定解析：类型配置提供 skill / workflow
            if (type.getSkillName() != null && !type.getSkillName().isBlank()) {
                task.setSkillName(type.getSkillName());
            }
            if (type.getWorkflowDefinitionId() != null) {
                task.setWorkflowDefinitionId(type.getWorkflowDefinitionId());
            }
            // 特殊键 tfsWorkItemId 映射到实体列
            Object wid = params.get("tfsWorkItemId");
            if (wid != null && task.getTfsWorkItemId() == null) {
                try {
                    task.setTfsWorkItemId(Long.valueOf(String.valueOf(wid)));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("tfsWorkItemId 必须是数字: " + wid);
                }
            }
        }
        if (!params.isEmpty()) {
            try {
                task.setParamsJson(objectMapper.writeValueAsString(params));
            } catch (Exception e) {
                throw new IllegalArgumentException("启动参数序列化失败: " + e.getMessage());
            }
        }

        task.setStatus(STATUS_PENDING);
        task.setRetryCount(0);
        task.setCreatedBy(username);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        task = taskRepo.save(task);

        addLog(task.getId(), "INFO", "任务已创建，已提交执行器"
                + (task.getTaskType() != null ? "（类型: " + task.getTaskType() + "）" : ""));

        // 事务提交后再提交执行器，确保 worker 能读到任务行
        final Long taskId = task.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    executionService.submit(taskId, username);
                }
            });
        } else {
            executionService.submit(taskId, username);
        }

        return task;
    }

    /**
     * 重试 Pipeline（从 FAILED 或 PAUSED_ON_FAILURE 重新提交执行器）
     */
    public PipelineTaskEntity retry(Long id) {
        PipelineTaskEntity task = getById(id);
        if (!STATUS_FAILED.equals(task.getStatus()) && !STATUS_PAUSED_ON_FAILURE.equals(task.getStatus())) {
            throw new IllegalStateException(
                    "Pipeline 状态不匹配: 期望 FAILED 或 PAUSED_ON_FAILURE，当前 " + task.getStatus());
        }

        task.setStatus(STATUS_PENDING);
        task.setError(null);
        task.setRetryCount(task.getRetryCount() + 1);
        task.setUpdatedAt(LocalDateTime.now());
        task = taskRepo.save(task);

        addLog(task.getId(), "INFO", "任务重试 (第 " + task.getRetryCount() + " 次)，已提交执行器");

        final Long taskId = task.getId();
        final String username = currentUsername();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    executionService.submit(taskId, username);
                }
            });
        } else {
            executionService.submit(taskId, username);
        }
        return task;
    }

    /**
     * 删除 Pipeline 及其关联数据
     */
    public void delete(Long id) {
        stepRepo.deleteByPipelineId(id);
        fileChangeRepo.deleteByPipelineId(id);
        artifactRepo.deleteByPipelineId(id);
        logRepo.deleteByPipelineId(id);
        taskRepo.deleteById(id);
    }

    // ==================== 日志 ====================

    @Transactional(readOnly = true)
    public List<PipelineLogEntity> getLogs(Long pipelineId) {
        return logRepo.findByPipelineIdOrderByCreatedAtAsc(pipelineId);
    }

    // ==================== 执行步骤 ====================

    @Transactional(readOnly = true)
    public List<PipelineStepEntity> getSteps(Long pipelineId) {
        return stepRepo.findByPipelineIdOrderBySeqNo(pipelineId);
    }

    // ==================== 确认 ====================

    /**
     * 确认/拒绝（WAITING_CONFIRM 状态）
     */
    public PipelineTaskEntity confirm(Long id, ConfirmRequest req) {
        PipelineTaskEntity task = getById(id);
        assertState(task, STATUS_WAITING_CONFIRM);

        if (Boolean.TRUE.equals(req.getApproved())) {
            task.setStatus(STATUS_RUNNING);
            task.setConfirmMessage(req.getComment());
            addLog(task.getId(), "INFO", "已确认通过: " + (req.getComment() != null ? req.getComment() : "无备注"));
        } else {
            task.setStatus(STATUS_CANCELLED);
            task.setConfirmMessage(req.getComment());
            addLog(task.getId(), "WARN", "已拒绝: " + (req.getComment() != null ? req.getComment() : "无备注"));
        }
        task.setUpdatedAt(LocalDateTime.now());
        return taskRepo.save(task);
    }

    // ==================== 文件变更 ====================

    @Transactional(readOnly = true)
    public List<PipelineFileChangeEntity> getChanges(Long pipelineId) {
        return fileChangeRepo.findByPipelineIdOrderByCreatedAt(pipelineId);
    }

    // ==================== 成果物 ====================

    @Transactional(readOnly = true)
    public List<PipelineArtifactEntity> getArtifacts(Long pipelineId) {
        return artifactRepo.findByPipelineIdOrderByCreatedAt(pipelineId);
    }

    // ==================== 工作流节点操作 ====================

    /**
     * 重试工作流节点
     */
    public PipelineTaskEntity retryWorkflowNode(Long id, String nodeId) {
        PipelineTaskEntity task = getById(id);
        assertState(task, STATUS_PAUSED_ON_FAILURE);

        task.setStatus(STATUS_RUNNING);
        task.setError(null);
        task.setUpdatedAt(LocalDateTime.now());
        task = taskRepo.save(task);

        addLog(task.getId(), "INFO", "工作流节点重试: " + nodeId);
        return task;
    }

    /**
     * 补充输入继续工作流
     */
    public PipelineTaskEntity continueWorkflowNode(Long id, String nodeId, String supplementalInput) {
        PipelineTaskEntity task = getById(id);
        assertState(task, STATUS_WAITING_CONFIRM);

        task.setStatus(STATUS_RUNNING);
        task.setUpdatedAt(LocalDateTime.now());
        task = taskRepo.save(task);

        addLog(task.getId(), "INFO", "工作流节点继续: " + nodeId
                + (supplementalInput != null ? " (补充输入: " + supplementalInput + ")" : ""));
        return task;
    }

    // ==================== 内部 Helper ====================

    private void addLog(Long pipelineId, String level, String message) {
        PipelineLogEntity logEntry = new PipelineLogEntity();
        logEntry.setPipelineId(pipelineId);
        logEntry.setLevel(level);
        logEntry.setMessage(message);
        logEntry.setCreatedAt(LocalDateTime.now());
        logRepo.save(logEntry);
    }

    private void assertState(PipelineTaskEntity task, String expected) {
        if (!expected.equals(task.getStatus())) {
            throw new IllegalStateException(
                    "Pipeline 状态不匹配: 期望 " + expected + "，当前 " + task.getStatus());
        }
    }

    private String currentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
                : null;
        return principal instanceof String ? (String) principal : "anonymous";
    }
}