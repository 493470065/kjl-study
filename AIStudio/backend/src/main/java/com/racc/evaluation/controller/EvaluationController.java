package com.racc.evaluation.controller;

import com.racc.evaluation.service.EvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 评估接口。
 * 路由前缀：/api/evaluation
 *
 * 端点列表：
 * - GET    /api/evaluation/evaluators              → 评估器列表
 * - POST   /api/evaluation/evaluate                → 执行评估
 * - GET    /api/evaluation/results                 → 结果列表
 * - GET    /api/evaluation/results/stats           → 统计
 * - DELETE /api/evaluation/results                 → 清空
 * - GET    /api/evaluation/datasets                → 数据集列表
 * - POST   /api/evaluation/datasets                → 创建数据集
 * - GET    /api/evaluation/datasets/{id}           → 数据集详情
 * - DELETE /api/evaluation/datasets/{id}           → 删除数据集
 * - POST   /api/evaluation/datasets/{id}/run       → 运行数据集
 */
@RestController
@RequestMapping("/api/evaluation")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    // ==================== 评估器 ====================

    @GetMapping("/evaluators")
    public ResponseEntity<?> getEvaluators() {
        return ResponseEntity.ok(evaluationService.getEvaluators());
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluate(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(evaluationService.evaluate(body));
    }

    // ==================== 结果 ====================

    @GetMapping("/results")
    public ResponseEntity<?> getResults() {
        return ResponseEntity.ok(evaluationService.getResults());
    }

    @GetMapping("/results/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(evaluationService.getStats());
    }

    @DeleteMapping("/results")
    public ResponseEntity<?> clearResults() {
        evaluationService.clearResults();
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 数据集 ====================

    @GetMapping("/datasets")
    public ResponseEntity<?> getDatasets() {
        return ResponseEntity.ok(evaluationService.getDatasets());
    }

    @PostMapping("/datasets")
    public ResponseEntity<?> createDataset(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(evaluationService.createDataset(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/datasets/{id}")
    public ResponseEntity<?> getDataset(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(evaluationService.getDataset(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/datasets/{id}")
    public ResponseEntity<?> deleteDataset(@PathVariable Long id) {
        try {
            evaluationService.deleteDataset(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/datasets/{id}/run")
    public ResponseEntity<?> runDataset(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(evaluationService.runDataset(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}