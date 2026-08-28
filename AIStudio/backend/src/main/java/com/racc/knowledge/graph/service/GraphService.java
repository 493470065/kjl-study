package com.racc.knowledge.graph.service;

import com.racc.knowledge.graph.entity.GraphData;
import com.racc.knowledge.graph.entity.GraphEntityDTO;
import com.racc.knowledge.graph.entity.GraphRelationshipDTO;
import com.racc.knowledge.graph.entity.GraphStats;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 知识图谱服务
 * <p>
 * 所有方法均使用 try-catch 包裹 Neo4j 操作。
 * 当 Neo4j Driver 未注入（spring.neo4j.uri 为空）或连接失败时，自动降级返回空数据。
 */
@Service
public class GraphService {

    private static final Logger log = LoggerFactory.getLogger(GraphService.class);

    @Autowired(required = false)
    private Driver neo4jDriver;

    // ========== 实体查询 ==========

    /**
     * 查询实体列表，支持按类型过滤和数量限制
     */
    public List<GraphEntityDTO> listEntities(Integer limit, String type) {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，listEntities 返回空列表");
            return Collections.emptyList();
        }

        int effectiveLimit = (limit != null && limit > 0) ? limit : 100;

        try (Session session = neo4jDriver.session()) {
            String cypher = "MATCH (n:GraphEntity) "
                    + "WHERE ($type IS NULL OR n.type = $type) "
                    + "RETURN n "
                    + "ORDER BY n.id "
                    + "LIMIT $limit";

            Result result = session.run(cypher,
                    Map.of("type", type, "limit", effectiveLimit));

            List<GraphEntityDTO> entities = new ArrayList<>();
            while (result.hasNext()) {
                Record record = result.next();
                entities.add(nodeToEntity(record.get("n").asNode()));
            }
            return entities;

        } catch (Exception e) {
            log.warn("Neo4j 查询实体列表失败，降级返回空列表: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 根据 ID 查询单个实体
     */
    public Optional<GraphEntityDTO> getEntityById(Long id) {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，getEntityById 返回空");
            return Optional.empty();
        }

        try (Session session = neo4jDriver.session()) {
            String cypher = "MATCH (n:GraphEntity) WHERE id(n) = $id RETURN n";

            Result result = session.run(cypher, Map.of("id", id));

            if (result.hasNext()) {
                return Optional.of(nodeToEntity(result.next().get("n").asNode()));
            }
            return Optional.empty();

        } catch (Exception e) {
            log.warn("Neo4j 查询实体详情失败，降级返回空: {}", e.getMessage());
            return Optional.empty();
        }
    }

    // ========== 关系查询 ==========

    /**
     * 查询指定实体的关系列表，支持多跳
     */
    public List<GraphRelationshipDTO> getRelationships(Long entityId, Integer maxHops) {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，getRelationships 返回空列表");
            return Collections.emptyList();
        }

        int hops = (maxHops != null && maxHops >= 1) ? maxHops : 1;

        try (Session session = neo4jDriver.session()) {
            String cypher;
            Map<String, Object> params;

            if (hops == 1) {
                // 直接关系
                cypher = "MATCH (n:GraphEntity)-[r]-(connected:GraphEntity) "
                        + "WHERE id(n) = $id "
                        + "RETURN r, id(startNode(r)) AS startId, id(endNode(r)) AS endId";
                params = Map.of("id", entityId);
            } else {
                // 多跳关系，展开路径后去重
                cypher = "MATCH path = (n:GraphEntity {id: $id})-[*1..$maxHops]-(connected:GraphEntity) "
                        + "WHERE id(connected) <> $id "
                        + "UNWIND relationships(path) AS r "
                        + "RETURN DISTINCT r, id(startNode(r)) AS startId, id(endNode(r)) AS endId";
                params = Map.of("id", entityId, "maxHops", hops);
            }

            Result result = session.run(cypher, params);
            List<GraphRelationshipDTO> relationships = new ArrayList<>();
            while (result.hasNext()) {
                Record record = result.next();
                relationships.add(relToEntity(
                        record.get("r").asRelationship(),
                        record.get("startId").asLong(),
                        record.get("endId").asLong()
                ));
            }
            return relationships;

        } catch (Exception e) {
            log.warn("Neo4j 查询关系列表失败，降级返回空列表: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ========== 可视化数据 ==========

    /**
     * 获取可视化数据（节点 + 边）
     */
    public GraphData getVisualizationData(Integer limit) {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，getVisualizationData 返回空数据");
            return new GraphData(Collections.emptyList(), Collections.emptyList());
        }

        int effectiveLimit = (limit != null && limit > 0) ? limit : 100;

        try (Session session = neo4jDriver.session()) {

            // 查询节点
            String nodeCypher = "MATCH (n:GraphEntity) RETURN n ORDER BY n.id LIMIT $limit";
            Result nodeResult = session.run(nodeCypher, Map.of("limit", effectiveLimit));
            List<GraphEntityDTO> nodes = new ArrayList<>();
            while (nodeResult.hasNext()) {
                nodes.add(nodeToEntity(nodeResult.next().get("n").asNode()));
            }

            // 查询边（使用节点 ID 限制，避免返回过多无关关系）
            String edgeCypher = "MATCH (n:GraphEntity)-[r]-(m:GraphEntity) "
                    + "WHERE id(n) IN $ids AND id(m) IN $ids "
                    + "RETURN DISTINCT r, id(startNode(r)) AS startId, id(endNode(r)) AS endId";
            List<Long> nodeIds = nodes.stream().map(GraphEntityDTO::getId).collect(Collectors.toList());
            Result edgeResult = session.run(edgeCypher, Map.of("ids", nodeIds));
            List<GraphRelationshipDTO> edges = new ArrayList<>();
            while (edgeResult.hasNext()) {
                Record record = edgeResult.next();
                edges.add(relToEntity(
                        record.get("r").asRelationship(),
                        record.get("startId").asLong(),
                        record.get("endId").asLong()
                ));
            }

            return new GraphData(nodes, edges);

        } catch (Exception e) {
            log.warn("Neo4j 查询可视化数据失败，降级返回空数据: {}", e.getMessage());
            return new GraphData(Collections.emptyList(), Collections.emptyList());
        }
    }

    // ========== 统计 ==========

    /**
     * 获取图谱统计信息
     */
    public GraphStats getStats() {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，getStats 返回空统计");
            return emptyStats();
        }

        try (Session session = neo4jDriver.session()) {
            // 实体总数
            long entityCount = session.run("MATCH (n:GraphEntity) RETURN count(n) AS count")
                    .single().get("count").asLong();

            // 关系总数
            long relationshipCount = session.run("MATCH ()-[r]-() RETURN count(r) AS count")
                    .single().get("count").asLong();

            // 按实体类型分组
            Map<String, Long> entityTypes = new HashMap<>();
            Result entityTypeResult = session.run(
                    "MATCH (n:GraphEntity) RETURN n.type AS type, count(n) AS count GROUP BY type");
            while (entityTypeResult.hasNext()) {
                Record record = entityTypeResult.next();
                String type = record.get("type").asString();
                // type 可能为 null（未设置 type 属性的节点），用 "UNKNOWN" 兜底
                entityTypes.put(type != null ? type : "UNKNOWN", record.get("count").asLong());
            }

            // 按关系类型分组
            Map<String, Long> relationshipTypes = new HashMap<>();
            Result relTypeResult = session.run(
                    "MATCH ()-[r]-() RETURN type(r) AS type, count(r) AS count GROUP BY type(r)");
            while (relTypeResult.hasNext()) {
                Record record = relTypeResult.next();
                relationshipTypes.put(record.get("type").asString(), record.get("count").asLong());
            }

            return new GraphStats(entityCount, relationshipCount, entityTypes, relationshipTypes);

        } catch (Exception e) {
            log.warn("Neo4j 查询统计失败，降级返回空统计: {}", e.getMessage());
            return emptyStats();
        }
    }

    // ========== 文档抽取 ==========

    /**
     * 从文档抽取实体/关系（LLM 未配置时返回模拟数据）
     */
    public Map<String, Object> extractFromDocument(Long documentId) {
        if (neo4jDriver == null) {
            log.debug("Neo4j 未配置，extract 返回降级提示");
            return Map.of("processed", 0, "message", "Neo4j 未配置");
        }

        try {
            // TODO: 接入 LLM 服务进行实体/关系抽取
            // 当前未配置 LLM 时返回模拟数据
            // 后续接入: LlmService.extractEntities(documentContent) -> 解析结果 -> 写入 Neo4j

            // 模拟数据：写入一个测试实体
            try (Session session = neo4jDriver.session()) {
                String cypher = "CREATE (n:GraphEntity {id: $id, name: $name, type: $type, description: $desc}) "
                        + "RETURN id(n) AS nodeId";

                long nodeId = System.currentTimeMillis();
                Map<String, Object> params = Map.of(
                        "id", nodeId,
                        "name", "文档抽取_" + documentId,
                        "type", "DOCUMENT",
                        "desc", "从文档 " + documentId + " 自动抽取的实体（模拟数据）"
                );

                Result result = session.run(cypher, params);
                if (result.hasNext()) {
                    log.info("文档抽取模拟数据已写入 Neo4j, documentId={}, nodeId={}", documentId, nodeId);
                }
            }

            return Map.of(
                    "processed", 1,
                    "message", "抽取完成（模拟数据）"
            );

        } catch (Exception e) {
            log.warn("Neo4j 文档抽取失败，降级返回: {}", e.getMessage());
            return Map.of("processed", 0, "message", "抽取失败: " + e.getMessage());
        }
    }

    // ========== 内部辅助方法 ==========

    /**
     * 将 Neo4j Node 转为 DTO
     */
    private GraphEntityDTO nodeToEntity(Node node) {
        GraphEntityDTO dto = new GraphEntityDTO();
        dto.setId(node.id());
        dto.setName(getNodeProperty(node, "name", ""));
        dto.setType(getNodeProperty(node, "type", "CONCEPT"));
        dto.setDescription(getNodeProperty(node, "description", ""));
        return dto;
    }

    /**
     * 将 Neo4j Relationship 转为 DTO
     */
    private GraphRelationshipDTO relToEntity(Relationship rel, long startId, long endId) {
        GraphRelationshipDTO dto = new GraphRelationshipDTO();
        dto.setId(rel.id());
        dto.setType(rel.type());
        dto.setRelType(rel.type());
        dto.setDescription(getRelProperty(rel, "description", ""));
        dto.setStartNodeId(startId);
        dto.setEndNodeId(endId);
        return dto;
    }

    /**
     * 安全读取节点属性，属性不存在时返回默认值
     */
    private String getNodeProperty(Node node, String key, String defaultValue) {
        if (node.containsKey(key) && !node.get(key).isNull()) {
            return node.get(key).asString();
        }
        return defaultValue;
    }

    /**
     * 安全读取关系属性，属性不存在时返回默认值
     */
    private String getRelProperty(Relationship rel, String key, String defaultValue) {
        if (rel.containsKey(key) && !rel.get(key).isNull()) {
            return rel.get(key).asString();
        }
        return defaultValue;
    }

    /**
     * 返回空统计
     */
    private GraphStats emptyStats() {
        return new GraphStats(0, 0, Collections.emptyMap(), Collections.emptyMap());
    }
}