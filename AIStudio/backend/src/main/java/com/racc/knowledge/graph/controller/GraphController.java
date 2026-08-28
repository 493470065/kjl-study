package com.racc.knowledge.graph.controller;

import com.racc.knowledge.graph.entity.GraphData;
import com.racc.knowledge.graph.entity.GraphEntityDTO;
import com.racc.knowledge.graph.entity.GraphRelationshipDTO;
import com.racc.knowledge.graph.entity.GraphStats;
import com.racc.knowledge.graph.service.GraphService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 知识图谱接口
 * <p>
 *  GET    /api/knowledge/graph/entities              → 实体列表
 *  GET    /api/knowledge/graph/entities/{id}         → 实体详情
 *  GET    /api/knowledge/graph/entities/{id}/relationships → 关系列表
 *  GET    /api/knowledge/graph/visualize             → 可视化数据
 *  GET    /api/knowledge/graph/stats                 → 统计信息
 *  POST   /api/knowledge/graph/extract/{documentId}  → 文档抽取
 */
@RestController
@RequestMapping("/api/knowledge/graph")
public class GraphController {

    private static final Logger log = LoggerFactory.getLogger(GraphController.class);

    private final GraphService graphService;

    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    /**
     * 查询实体列表
     *
     * @param limit 数量限制（默认 100）
     * @param type  实体类型过滤（可选）
     */
    @GetMapping("/entities")
    public ResponseEntity<List<GraphEntityDTO>> listEntities(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String type) {
        log.debug("GET /api/knowledge/graph/entities?limit={}&type={}", limit, type);
        return ResponseEntity.ok(graphService.listEntities(limit, type));
    }

    /**
     * 查询实体详情
     */
    @GetMapping("/entities/{id}")
    public ResponseEntity<GraphEntityDTO> getEntityById(@PathVariable Long id) {
        log.debug("GET /api/knowledge/graph/entities/{}", id);
        return graphService.getEntityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 查询实体的关系列表（含多跳）
     *
     * @param maxHops 最大跳数（默认 1，仅直接关系）
     */
    @GetMapping("/entities/{id}/relationships")
    public ResponseEntity<List<GraphRelationshipDTO>> getRelationships(
            @PathVariable Long id,
            @RequestParam(required = false) Integer maxHops) {
        log.debug("GET /api/knowledge/graph/entities/{}/relationships?maxHops={}", id, maxHops);
        return ResponseEntity.ok(graphService.getRelationships(id, maxHops));
    }

    /**
     * 获取可视化数据（节点 + 边）
     */
    @GetMapping("/visualize")
    public ResponseEntity<GraphData> getVisualizationData(
            @RequestParam(required = false) Integer limit) {
        log.debug("GET /api/knowledge/graph/visualize?limit={}", limit);
        return ResponseEntity.ok(graphService.getVisualizationData(limit));
    }

    /**
     * 获取图谱统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<GraphStats> getStats() {
        log.debug("GET /api/knowledge/graph/stats");
        return ResponseEntity.ok(graphService.getStats());
    }

    /**
     * 从文档抽取实体/关系
     */
    @PostMapping("/extract/{documentId}")
    public ResponseEntity<Map<String, Object>> extractForDocument(@PathVariable Long documentId) {
        log.debug("POST /api/knowledge/graph/extract/{}", documentId);
        return ResponseEntity.ok(graphService.extractFromDocument(documentId));
    }
}