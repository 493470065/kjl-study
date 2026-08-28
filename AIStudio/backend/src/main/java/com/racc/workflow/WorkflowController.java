package com.racc.workflow;

import com.racc.workflow.entity.WorkflowEntity;
import com.racc.workflow.entity.WorkflowExecutionEntity;
import com.racc.workflow.entity.WorkflowNodeEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 工作流管理接口
 *  GET    /api/workflows                   → 列表
 *  POST   /api/workflows                   → 新建
 *  GET    /api/workflows/{id}              → 详情
 *  PUT    /api/workflows/{id}              → 编辑
 *  DELETE /api/workflows/{id}              → 删除
 *  POST   /api/workflows/{id}/execute      → 执行
 *  GET    /api/workflows/executions        → 执行记录列表
 *  GET    /api/workflows/executions/{id}   → 执行记录详情
 *  POST   /api/workflows/executions/{id}/cancel → 取消执行
 *  GET    /api/workflows/executions/{executionId}/nodes → 执行节点
 */
@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService service;

    public WorkflowController(WorkflowService service) {
        this.service = service;
    }

    // ========== 工作流 CRUD ==========

    @GetMapping
    public ResponseEntity<List<WorkflowEntity>> listWorkflows() {
        return ResponseEntity.ok(service.listWorkflows());
    }

    @PostMapping
    public ResponseEntity<WorkflowEntity> createWorkflow(@RequestBody WorkflowEntity entity) {
        return ResponseEntity.ok(service.createWorkflow(entity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowEntity> getWorkflow(@PathVariable Long id) {
        return ResponseEntity.ok(service.getWorkflow(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowEntity> updateWorkflow(@PathVariable Long id,
                                                         @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateWorkflow(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteWorkflow(@PathVariable Long id) {
        service.deleteWorkflow(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ========== 执行 ==========

    @PostMapping("/{id}/execute")
    public ResponseEntity<WorkflowExecutionEntity> executeWorkflow(@PathVariable Long id,
                                                                   @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> context = body != null ? (Map<String, Object>) body.get("context") : null;
        return ResponseEntity.ok(service.executeWorkflow(id, context));
    }

    // ========== 执行记录 ==========

    @GetMapping("/executions")
    public ResponseEntity<List<WorkflowExecutionEntity>> listExecutions() {
        return ResponseEntity.ok(service.listExecutions());
    }

    @GetMapping("/executions/{id}")
    public ResponseEntity<WorkflowExecutionEntity> getExecution(@PathVariable Long id) {
        return ResponseEntity.ok(service.getExecution(id));
    }

    @PostMapping("/executions/{id}/cancel")
    public ResponseEntity<Map<String, Boolean>> cancelExecution(@PathVariable Long id) {
        service.cancelExecution(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/executions/{executionId}/nodes")
    public ResponseEntity<List<WorkflowNodeEntity>> getExecutionNodes(@PathVariable Long executionId) {
        return ResponseEntity.ok(service.getExecutionNodes(executionId));
    }
}