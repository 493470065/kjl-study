package com.racc.knowledge.graph.entity;

import java.util.Map;

/**
 * 统计信息 DTO，对应前端 GraphStats 接口
 */
public class GraphStats {

    private long entityCount;
    private long relationshipCount;
    private Map<String, Long> entityTypes;
    private Map<String, Long> relationshipTypes;

    public GraphStats() {
    }

    public GraphStats(long entityCount, long relationshipCount,
                      Map<String, Long> entityTypes,
                      Map<String, Long> relationshipTypes) {
        this.entityCount = entityCount;
        this.relationshipCount = relationshipCount;
        this.entityTypes = entityTypes;
        this.relationshipTypes = relationshipTypes;
    }

    public long getEntityCount() {
        return entityCount;
    }

    public void setEntityCount(long entityCount) {
        this.entityCount = entityCount;
    }

    public long getRelationshipCount() {
        return relationshipCount;
    }

    public void setRelationshipCount(long relationshipCount) {
        this.relationshipCount = relationshipCount;
    }

    public Map<String, Long> getEntityTypes() {
        return entityTypes;
    }

    public void setEntityTypes(Map<String, Long> entityTypes) {
        this.entityTypes = entityTypes;
    }

    public Map<String, Long> getRelationshipTypes() {
        return relationshipTypes;
    }

    public void setRelationshipTypes(Map<String, Long> relationshipTypes) {
        this.relationshipTypes = relationshipTypes;
    }
}