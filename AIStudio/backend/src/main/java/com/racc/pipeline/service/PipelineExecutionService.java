package com.racc.pipeline.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.agent.service.AgentRuntimeService;
import com.racc.pipeline.entity.PipelineArtifactEntity;
import com.racc.pipeline.entity.PipelineLogEntity;
import com.racc.pipeline.entity.PipelineStepEntity;
import com.racc.pipeline.entity.PipelineTaskEntity;
import com.racc.pipeline.repository.PipelineArtifactRepository;
import com.racc.pipeline.repository.PipelineLogRepository;
import com.racc.pipeline.repository.PipelineStepRepository;
import com.racc.pipeline.repository.PipelineTaskRepository;
import com.racc.skill.dto.SkillDetail;
import com.racc.skill.service.SkillService;
import com.racc.tfs.TfsBridgeService;
import com.racc.workflow.WorkflowService;
import com.racc.workflow.entity.WorkflowEntity;
import com.racc.workflow.entity.WorkflowExecutionEntity;
import com.racc.workflow.entity.WorkflowNodeEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 自动化任务执行引擎。
 *
 * 由 PipelineService.start()/retry() 在事务提交后（afterCommit）调用 submit()，
 * 在有界线程池中异步执行：
 * - 绑定工作流的任务 → 调 WorkflowService.executeWorkflow（阻塞，自带事务），
 *   回写 workflow_execution_id，并把节点记录同步为 pipeline_steps
 * - 绑定技能的任务   → 加载 SKILL.md + 启动参数（尽力而为抓取 TFS 工作项）组装提示词，
 *   调 AgentRuntimeService.executeSkillHeadless 真实执行，产出写入 pipeline_artifacts 与
 *   {racc.pipeline.dir}/{taskId}/output.md
 *
 * worker 不加 @Transactional：每次落库走独立短事务，LLM/工作流等长操作不占写事务。
 */
@Service
public class PipelineExecutionService {

    private static final Logger log = LoggerFactory.getLogger(PipelineExecutionService.class);

    private final PipelineTaskRepository taskRepo;
    private final PipelineStepRepository stepRepo;
    private final PipelineLogRepository logRepo;
    private final PipelineArtifactRepository artifactRepo;
    private final WorkflowService workflowService;
    private final AgentRuntimeService agentRuntimeService;
    private final SkillService skillService;
    private final TfsBridgeService tfsBridgeService;
    private final ObjectMapper objectMapper;

    @Value("${racc.pipeline.dir:data/pipeline}")
    private String pipelineDir;

    /** 有界执行池：Hikari 连接有限（10），并发必须小；队列满直接拒绝并置失败 */
    private final ThreadPoolExecutor pool;

    public PipelineExecutionService(PipelineTaskRepository taskRepo,
                                    PipelineStepRepository stepRepo,
                                    PipelineLogRepository logRepo,
                                    PipelineArtifactRepository artifactRepo,
                                    WorkflowService workflowService,
                                    AgentRuntimeService agentRuntimeService,
                                    SkillService skillService,
                                    TfsBridgeService tfsBridgeService,
                                    ObjectMapper objectMapper) {
        this.taskRepo = taskRepo;
        this.stepRepo = stepRepo;
        this.logRepo = logRepo;
        this.artifactRepo = artifactRepo;
        this.workflowService = workflowService;
        this.agentRuntimeService = agentRuntimeService;
        this.skillService = skillService;
        this.tfsBridgeService = tfsBridgeService;
        this.objectMapper = objectMapper;

        AtomicInteger seq = new AtomicInteger(1);
        ThreadFactory factory = r -> {
            Thread t = new Thread(r, "automate-exec-" + seq.getAndIncrement());
            t.setDaemon(true);
            return t;
        };
        this.pool = new ThreadPoolExecutor(2, 4, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(50), factory, new ThreadPoolExecutor.AbortPolicy());
    }

    /** 提交任务到执行池（须在任务行已提交的事务之后调用） */
    public void submit(Long taskId, String username) {
        try {
            pool.execute(() -> run(taskId, username));
        } catch (RejectedExecutionException e) {
            log.warn("执行器繁忙，任务 {} 被拒绝", taskId);
            markFailed(taskId, "执行器繁忙，请稍后重试");
        }
    }

    private void run(Long taskId, String username) {
        PipelineTaskEntity task = taskRepo.findById(taskId).orElse(null);
        if (task == null) {
            log.warn("任务不存在，跳过执行: {}", taskId);
            return;
        }
        try {
            task.setStatus("RUNNING");
            taskRepo.save(task);
            addStepDone(task.getId(), "PIPELINE_START", "任务开始执行", null);
            addLog(taskId, "INFO", "开始执行（发起人: " + username + "）");

            if (task.getWorkflowDefinitionId() != null) {
                executeWorkflowBranch(task);
            } else if (task.getSkillName() != null && !task.getSkillName().isBlank()) {
                executeSkillBranch(task);
            } else {
                throw new IllegalStateException("任务未绑定工作流或技能，无法执行（自定义任务请选择工作流）");
            }
        } catch (Exception e) {
            log.error("任务 {} 执行失败: {}", taskId, e.getMessage(), e);
            LocalDateTime now = LocalDateTime.now();
            addStep(taskId, "ERROR", "执行失败: " + truncate(e.getMessage(), 200), null, "FAILED", now, now);
            markFailed(taskId, e.getMessage());
        }
    }

    // ==================== 工作流分支 ====================

    private void executeWorkflowBranch(PipelineTaskEntity task) {
        WorkflowEntity wf = workflowService.getWorkflow(task.getWorkflowDefinitionId());
        if (!Boolean.TRUE.equals(wf.getEnabled())) {
            throw new IllegalStateException("工作流已停用: " + wf.getName());
        }

        addStepDone(task.getId(), "CONTEXT_BUILD", "组装工作流上下文", null);
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("input", buildInputText(task));
        if (task.getTfsWorkItemId() != null) {
            context.put("tfsWorkItemId", task.getTfsWorkItemId());
        }
        context.putAll(parseParams(task.getParamsJson()));

        addLog(task.getId(), "INFO", "调用工作流: " + wf.getName());
        // 阻塞执行（工作流引擎自带事务）；AGENT 节点无 message 时取 context["input"]
        WorkflowExecutionEntity exec = workflowService.executeWorkflow(wf.getId(), context);

        task.setWorkflowExecutionId(exec.getId());
        taskRepo.save(task);

        // 节点记录同步为 pipeline_steps（详情"执行步骤"可见节点级进度）
        List<WorkflowNodeEntity> nodes = workflowService.getExecutionNodes(exec.getId());
        for (WorkflowNodeEntity n : nodes) {
            String stepStatus = "COMPLETED".equals(n.getStatus()) ? "SUCCESS" : n.getStatus();
            String detail = n.getError() != null ? n.getError() : truncate(n.getOutput(), 2000);
            addStep(task.getId(), "WORKFLOW_NODE",
                    n.getType() + " 节点 " + n.getNodeId(), detail, stepStatus,
                    n.getStartedAt(), n.getCompletedAt());
        }

        String status = exec.getStatus();
        if ("COMPLETED".equals(status)) {
            addStepDone(task.getId(), "PIPELINE_COMPLETE", "工作流执行完成", null);
            addLog(task.getId(), "INFO", "工作流执行完成");
            markCompleted(task.getId());
        } else if ("CANCELLED".equals(status)) {
            PipelineTaskEntity fresh = taskRepo.findById(task.getId()).orElse(task);
            fresh.setStatus("CANCELLED");
            taskRepo.save(fresh);
            addLog(task.getId(), "WARN", "工作流执行被取消");
        } else {
            throw new IllegalStateException("工作流执行失败: " + truncate(exec.getResult(), 500));
        }
    }

    // ==================== Skill 分支 ====================

    private void executeSkillBranch(PipelineTaskEntity task) {
        if (!agentRuntimeService.isLlmEnabled()) {
            throw new IllegalStateException("LLM 未配置或已停用（请在 LLM Provider 页面配置，或检查 LLM_ENABLED 环境变量）");
        }

        // 1. 加载技能
        Long skillStepId = addStep(task.getId(), "SKILL_LOAD", "加载技能 " + task.getSkillName(), null);
        SkillDetail skill;
        try {
            skill = skillService.getSkillDetail(task.getSkillName());
        } catch (Exception e) {
            failStep(skillStepId, e.getMessage());
            throw new IllegalStateException("技能加载失败: " + task.getSkillName() + " — " + e.getMessage());
        }
        if (skill == null || skill.getContent() == null || skill.getContent().isBlank()) {
            failStep(skillStepId, "技能不存在或内容为空");
            throw new IllegalStateException("技能不存在或内容为空: " + task.getSkillName());
        }
        completeStep(skillStepId);

        // 2. 组装上下文（参数 + 尽力而为的 TFS 工作项内容）
        Long ctxStepId = addStep(task.getId(), "CONTEXT_BUILD", "组装执行上下文", null);
        Map<String, Object> params = parseParams(task.getParamsJson());
        StringBuilder user = new StringBuilder();
        user.append("请执行技能【").append(task.getSkillName()).append("】。\n\n启动参数：\n");
        if (params.isEmpty()) {
            user.append("（无）\n");
        } else {
            params.forEach((k, v) -> user.append("- ").append(k).append(": ").append(v).append("\n"));
        }
        if (task.getTfsWorkItemId() != null) {
            appendTfsContext(task, user);
        }
        user.append("\n\n请严格按照技能说明完成任务。如需读取资料文件请使用提供的工具。")
            .append("完成后，请在最终回复中直接输出完整成果物正文（Markdown 格式）。");
        completeStep(ctxStepId);

        // 3. LLM 真实执行（含工具调用循环）
        Long llmStepId = addStep(task.getId(), "LLM_CALL", "调用 LLM 执行技能（可能耗时数分钟）", null);
        addLog(task.getId(), "INFO", "开始 LLM 调用（技能: " + task.getSkillName() + "）");
        String output;
        try {
            output = agentRuntimeService.executeSkillHeadless(
                    task.getSkillName(),
                    "你是自动化任务执行器，负责按照指定技能完成研发自动化任务并产出成果物。",
                    user.toString(),
                    task.getCreatedBy(),
                    task.getModel());
        } catch (Exception e) {
            failStep(llmStepId, e.getMessage());
            throw e;
        }
        completeStep(llmStepId);
        addLog(task.getId(), "INFO", "LLM 调用完成，输出长度 " + output.length());

        // 4. 成果物落库 + 写文件
        try {
            Path dir = Paths.get(pipelineDir, String.valueOf(task.getId()));
            Files.createDirectories(dir);
            Path out = dir.resolve("output.md");
            Files.writeString(out, output, StandardCharsets.UTF_8);

            PipelineArtifactEntity artifact = new PipelineArtifactEntity();
            artifact.setPipelineId(task.getId());
            artifact.setFilePath(out.toString());
            artifact.setArtifactType("GENERATED");
            artifact.setSummary(truncate(output, 200));
            artifact.setContent(output);
            artifactRepo.save(artifact);
            addLog(task.getId(), "INFO", "成果物已生成: " + out);
        } catch (Exception e) {
            log.warn("成果物写入失败（不影响任务完成）: {}", e.getMessage());
            addLog(task.getId(), "WARN", "成果物写入失败: " + e.getMessage());
        }

        addStepDone(task.getId(), "PIPELINE_COMPLETE", "任务执行完成", null);
        markCompleted(task.getId());
    }

    /** 尽力而为抓取 TFS 工作项：成功→回填标题并注入上下文；失败→WARN 降级 */
    private void appendTfsContext(PipelineTaskEntity task, StringBuilder user) {
        try {
            JsonNode wi = tfsBridgeService.callToolJson("get_work_item",
                    Map.of("id", task.getTfsWorkItemId()));
            String title = firstNonBlank(wi.path("title"), wi.path("Title"), wi.path("标题"));
            String desc = firstNonBlank(wi.path("description"), wi.path("Description"), wi.path("描述"));
            if (title != null && !title.isBlank() && (task.getTfsTitle() == null || task.getTfsTitle().isBlank())) {
                task.setTfsTitle(title);
                taskRepo.save(task);
            }
            user.append("\n【TFS 工作项 #").append(task.getTfsWorkItemId()).append("】\n");
            if (title != null && !title.isBlank()) user.append("标题: ").append(title).append("\n");
            if (desc != null && !desc.isBlank()) user.append("描述: ").append(truncate(desc, 3000)).append("\n");
            addLog(task.getId(), "INFO", "已获取 TFS 工作项" + (title != null ? ": " + title : ""));
        } catch (Exception e) {
            log.warn("TFS 工作项获取失败，降级为仅传需求号: {}", e.getMessage());
            addLog(task.getId(), "WARN", "TFS 工作项获取失败，降级为仅传需求号: " + truncate(e.getMessage(), 200));
            user.append("\n【TFS 工作项 #").append(task.getTfsWorkItemId())
                .append("】（详情获取失败，如需请自行通过工具查询）\n");
        }
    }

    // ==================== 状态与记录 Helper ====================

    private void markCompleted(Long taskId) {
        taskRepo.findById(taskId).ifPresent(task -> {
            task.setStatus("COMPLETED");
            taskRepo.save(task);
        });
        addLog(taskId, "INFO", "任务执行完成");
    }

    private void markFailed(Long taskId, String error) {
        taskRepo.findById(taskId).ifPresent(task -> {
            task.setStatus("FAILED");
            task.setError(error != null && !error.isBlank() ? truncate(error, 2000) : "未知错误");
            taskRepo.save(task);
        });
        addLog(taskId, "ERROR", "执行失败: " + truncate(error, 500));
    }

    private Long addStep(Long pipelineId, String type, String title, String detail) {
        return addStep(pipelineId, type, title, detail, "RUNNING", LocalDateTime.now(), null);
    }

    /** 记录瞬时完成的步骤（生命周期类步骤，无持续过程） */
    private Long addStepDone(Long pipelineId, String type, String title, String detail) {
        LocalDateTime now = LocalDateTime.now();
        return addStep(pipelineId, type, title, detail, "SUCCESS", now, now);
    }

    private Long addStep(Long pipelineId, String type, String title, String detail,
                         String status, LocalDateTime startedAt, LocalDateTime completedAt) {
        PipelineStepEntity step = new PipelineStepEntity();
        step.setPipelineId(pipelineId);
        step.setSeqNo((int) stepRepo.countByPipelineId(pipelineId) + 1);
        step.setType(type);
        step.setStatus(status);
        step.setTitle(truncate(title, 250));
        step.setDetail(detail);
        step.setStartedAt(startedAt != null ? startedAt : LocalDateTime.now());
        step.setCompletedAt(completedAt);
        return stepRepo.save(step).getId();
    }

    private void completeStep(Long stepId) {
        stepRepo.findById(stepId).ifPresent(step -> {
            step.setStatus("SUCCESS");
            step.setCompletedAt(LocalDateTime.now());
            stepRepo.save(step);
        });
    }

    private void failStep(Long stepId, String error) {
        stepRepo.findById(stepId).ifPresent(step -> {
            step.setStatus("FAILED");
            step.setDetail(truncate(error, 2000));
            step.setCompletedAt(LocalDateTime.now());
            stepRepo.save(step);
        });
    }

    private void addLog(Long pipelineId, String level, String message) {
        try {
            PipelineLogEntity entry = new PipelineLogEntity();
            entry.setPipelineId(pipelineId);
            entry.setLevel(level);
            entry.setMessage(truncate(message, 1900));
            logRepo.save(entry);
        } catch (Exception e) {
            log.warn("写入任务日志失败: {}", e.getMessage());
        }
    }

    // ==================== 工具方法 ====================

    /** 组装发给工作流/技能的启动文本 */
    private String buildInputText(PipelineTaskEntity task) {
        StringBuilder sb = new StringBuilder();
        sb.append("执行自动化任务");
        if (task.getTaskType() != null) sb.append("（类型: ").append(task.getTaskType()).append("）");
        if (task.getTfsWorkItemId() != null) {
            sb.append("，TFS 需求 #").append(task.getTfsWorkItemId());
            if (task.getTfsTitle() != null && !task.getTfsTitle().isBlank()) {
                sb.append("「").append(task.getTfsTitle()).append("」");
            }
        }
        Map<String, Object> params = parseParams(task.getParamsJson());
        if (!params.isEmpty()) {
            sb.append("\n启动参数：\n");
            params.forEach((k, v) -> sb.append("- ").append(k).append(": ").append(v).append("\n"));
        }
        return sb.toString();
    }

    private Map<String, Object> parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(paramsJson, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception e) {
            log.warn("任务参数 JSON 解析失败: {}", e.getMessage());
            return Map.of();
        }
    }

    private String firstNonBlank(JsonNode... nodes) {
        for (JsonNode n : nodes) {
            if (n != null && !n.isMissingNode() && n.isValueNode()) {
                String v = n.asText("");
                if (!v.isBlank()) return v;
            }
        }
        return null;
    }

    private String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max) + "...(截断)";
    }
}
