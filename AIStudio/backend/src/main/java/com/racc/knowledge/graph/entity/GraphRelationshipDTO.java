package com.racc.knowledge.graph.entity;

/**
 * 知识图谱关系 DTO，对应前端 GraphRelationship 接口
 */
public class GraphRelationshipDTO {

    private long id;
    private String type;
    private String relType;
    private String description;
    private long startNodeId;
    private long endNodeId;

    public GraphRelationshipDTO() {
    }

    public GraphRelationshipDTO(long id, String type, String relType, String description,
                                long startNodeId, long endNodeId) {
        this.id = id;
        this.type = type;
        this.relType = relType;
        this.description = description;
        this.startNodeId = startNodeId;
        this.endNodeId = endNodeId;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRelType() {
        return relType;
    }

    public void setRelType(String relType) {
        this.relType = relType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public long getStartNodeId() {
        return startNodeId;
    }

    public void setStartNodeId(long startNodeId) {
        this.startNodeId = startNodeId;
    }

    public long getEndNodeId() {
        return endNodeId;
    }

    public void setEndNodeId(long endNodeId) {
        this.endNodeId = endNodeId;
    }
}