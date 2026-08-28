package com.racc.knowledge.graph.entity;

import java.util.List;

/**
 * 可视化数据 DTO，对应前端 GraphData 接口
 */
public class GraphData {

    private List<GraphEntityDTO> nodes;
    private List<GraphRelationshipDTO> edges;

    public GraphData() {
    }

    public GraphData(List<GraphEntityDTO> nodes, List<GraphRelationshipDTO> edges) {
        this.nodes = nodes;
        this.edges = edges;
    }

    public List<GraphEntityDTO> getNodes() {
        return nodes;
    }

    public void setNodes(List<GraphEntityDTO> nodes) {
        this.nodes = nodes;
    }

    public List<GraphRelationshipDTO> getEdges() {
        return edges;
    }

    public void setEdges(List<GraphRelationshipDTO> edges) {
        this.edges = edges;
    }
}