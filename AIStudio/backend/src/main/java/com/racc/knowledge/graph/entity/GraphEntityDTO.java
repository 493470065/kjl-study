package com.racc.knowledge.graph.entity;

/**
 * 知识图谱实体 DTO，对应前端 GraphEntity 接口
 */
public class GraphEntityDTO {

    private long id;
    private String name;
    private String type;        // CONCEPT | RULE | MODULE | INTERFACE | CLASS | METHOD | FIELD | DOCUMENT | WIKI_PAGE
    private String description;

    public GraphEntityDTO() {
    }

    public GraphEntityDTO(long id, String name, String type, String description) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}