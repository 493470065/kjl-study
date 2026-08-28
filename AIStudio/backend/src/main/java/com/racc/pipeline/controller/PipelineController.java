package com.racc.pipeline.controller;

import com.racc.pipeline.dto.ConfirmRequest;
import com.racc.pipeline.dto.StartPipelineRequest;
import com.racc.pipeline.dto.WorkflowNodeRequest;
import com.racc.pipeline.entity.*;
import com.racc.pipeline.service.PipelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Pipeline 执行接口
 *
 * 前端 API：pipeline.ts
 * 端点：
 *   POST   /api/pipeline/start                          → 启动
 *   GET    /api/pipeline                                → 列表
 *   GET    /api/pipeline/{id}                           → 详情
 *   POST   /api/pipeline/{id}/retry                     → 重试
 *   DELETE /api/pipeline/{id}                           → 删除
 *   GET    /api/pipeline/{id}/logs                      → 日志
 *   GET    /api/pipeline/{id}/steps                     → 执行步骤
 *   POST   /api/pipeline/{id}/confirm                   → 确认
 *   GET    /api/pipeline/{id}/changes                   → 文件变更
 *   GET    /api/pipeline/{id}/artifacts                 → 成果物
 *   POST   /api/pipeline/{id}/workflow/retry-node       → 重试工作流节点
 *   POST   /api/pipeline/{id}/workflow/continue         → 补充输入继续
 */
@RestController
@RequestMapping("/api/pipeline")
public class PipelineController {

    private final PipelineService pipelineService;

    public PipelineController(PipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    /** POST /api/pipeline/start — 启动 Pipeline（自动化任务） */
    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestBody StartPipelineRequest req) {
        try {
            return ResponseEntity.ok(pipelineService.start(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/pipeline — 列表 */
    @GetMapping
    public ResponseEntity<List<PipelineTaskEntity>> list() {
        return ResponseEntity.ok(pipelineService.listAll());
    }

    /** GET /api/pipeline/{id} — 详情 */
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pipelineService.getById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/pipeline/{id}/retry — 重试 */
    @PostMapping("/{id}/retry")
    public ResponseEntity<?> retry(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pipelineService.retry(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/pipeline/{id} — 删除 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(@PathVariable Long id) {
        pipelineService.delete(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** GET /api/pipeline/{id}/logs — 日志 */
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<PipelineLogEntity>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getLogs(id));
    }

    /** GET /api/pipeline/{id}/steps — 执行步骤 */
    @GetMapping("/{id}/steps")
    public ResponseEntity<List<PipelineStepEntity>> getSteps(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getSteps(id));
    }

    /** POST /api/pipeline/{id}/confirm — 确认（WAITING_CONFIRM 状态） */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id, @RequestBody ConfirmRequest req) {
        try {
            return ResponseEntity.ok(pipelineService.confirm(id, req));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/pipeline/{id}/changes — 文件变更 */
    @GetMapping("/{id}/changes")
    public ResponseEntity<List<PipelineFileChangeEntity>> getChanges(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getChanges(id));
    }

    /** GET /api/pipeline/{id}/artifacts — 成果物 */
    @GetMapping("/{id}/artifacts")
    public ResponseEntity<List<PipelineArtifactEntity>> getArtifacts(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getArtifacts(id));
    }

    /** POST /api/pipeline/{id}/workflow/retry-node — 重试工作流节点 */
    @PostMapping("/{id}/workflow/retry-node")
    public ResponseEntity<?> retryWorkflowNode(@PathVariable Long id, @RequestBody WorkflowNodeRequest req) {
        try {
            return ResponseEntity.ok(pipelineService.retryWorkflowNode(id, req.getNodeId()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/pipeline/{id}/workflow/continue — 补充输入继续 */
    @PostMapping("/{id}/workflow/continue")
    public ResponseEntity<?> continueWorkflowNode(@PathVariable Long id, @RequestBody WorkflowNodeRequest req) {
        try {
            return ResponseEntity.ok(pipelineService.continueWorkflowNode(id, req.getNodeId(), req.getSupplementalInput()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}