package com.racc.pipeline.dto;

/**
 * 确认请求（WAITING_CONFIRM 状态）
 */
public class ConfirmRequest {

    private Boolean approved;
    private String comment;

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}