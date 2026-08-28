package com.racc.pipeline.dto;

/**
 * 工作流节点操作请求
 */
public class WorkflowNodeRequest {

    private String nodeId;
    private String supplementalInput;

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public String getSupplementalInput() { return supplementalInput; }
    public void setSupplementalInput(String supplementalInput) { this.supplementalInput = supplementalInput; }
}