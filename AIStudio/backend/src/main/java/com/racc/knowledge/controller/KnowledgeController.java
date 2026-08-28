package com.racc.knowledge.controller;

import com.racc.common.dto.PageResult;
import com.racc.knowledge.service.KnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 知识库文档管理接口。
 *
 * 前端 API：knowledge.ts
 * 路由前缀：/api/knowledge
 *
 * 端点列表：
 * - GET    /api/knowledge?category=&sourceType=&productLine=&page=&size=  → 分页列表
 * - GET    /api/knowledge/{id}                                           → 文档详情
 * - POST   /api/knowledge                                                → 上传文档（JSON body 或 multipart/form-data）
 * - PUT    /api/knowledge/{id}                                           → 更新文档
 * - DELETE /api/knowledge/{id}                                           → 删除文档
 * - GET    /api/knowledge/search?q=&topK=&mode=                          → 搜索
 * - POST   /api/knowledge/reindex                                        → 重新索引
 * - GET    /api/knowledge/status                                         → 知识库状态
 * - GET    /api/knowledge/categories?sourceType=                         → 分类列表
 * - GET    /api/knowledge/source-types                                   → 来源类型列表
 * - GET    /api/knowledge/product-lines?sourceType=                      → 产品线列表
 */
@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    // ==================== 分页列表 ====================

    @GetMapping
    public ResponseEntity<PageResult<Map<String, Object>>> listDocuments(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String productLine,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String functionPoint,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                knowledgeService.listDocuments(category, sourceType, productLine,
                        module, functionPoint, keyword, page, size));
    }

    // ==================== 详情 ====================

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(knowledgeService.getDocument(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 上传 ====================

    /**
     * 上传文档（JSON body）
     */
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> uploadDocumentJson(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(knowledgeService.uploadDocument(body));
    }

    /**
     * 上传文档（multipart/form-data）
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> uploadDocumentFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String productLine,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String functionPoint,
            @RequestParam(required = false) String extraFields) {
        return ResponseEntity.ok(
                knowledgeService.uploadDocumentFile(file, category, tags, sourceType, productLine,
                        module, functionPoint, extraFields));
    }
    // ==================== 更新 ====================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(knowledgeService.updateDocument(id, body));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 删除 ====================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        try {
            knowledgeService.deleteDocument(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 搜索 ====================

    @GetMapping("/search")
    public ResponseEntity<?> searchDocuments(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "10") int topK,
            @RequestParam(defaultValue = "default") String mode,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String productLine,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String functionPoint) {
        return ResponseEntity.ok(knowledgeService.searchDocuments(query, topK, mode,
                category, sourceType, productLine, module, functionPoint));
    }

    // ==================== 重新索引 ====================

    @PostMapping("/reindex")
    public ResponseEntity<?> reindex() {
        return ResponseEntity.ok(knowledgeService.reindex());
    }

    // ==================== 状态 ====================

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(knowledgeService.getStatus());
    }

    // ==================== 枚举列表 ====================

    @GetMapping("/categories")
    public ResponseEntity<List<String>> listCategories(
            @RequestParam(required = false) String sourceType) {
        return ResponseEntity.ok(knowledgeService.listCategories(sourceType));
    }

    @GetMapping("/source-types")
    public ResponseEntity<List<String>> listSourceTypes() {
        return ResponseEntity.ok(knowledgeService.listSourceTypes());
    }

    @GetMapping("/product-lines")
    public ResponseEntity<List<Map<String, String>>> listProductLines(
            @RequestParam(required = false) String sourceType) {
        return ResponseEntity.ok(knowledgeService.listProductLines(sourceType));
    }

    @GetMapping("/modules")
    public ResponseEntity<List<String>> listModules(
            @RequestParam(required = false) String sourceType) {
        return ResponseEntity.ok(knowledgeService.listModules(sourceType));
    }

    @GetMapping("/function-points")
    public ResponseEntity<List<String>> listFunctionPoints(
            @RequestParam(required = false) String sourceType) {
        return ResponseEntity.ok(knowledgeService.listFunctionPoints(sourceType));
    }

    /**
     * 动态列描述：基于全量文档实际存在的字段与标签，供前端列表自动调整列。
     */
    @GetMapping("/columns")
    public ResponseEntity<Map<String, Object>> listColumns() {
        return ResponseEntity.ok(knowledgeService.listColumns());
    }
}