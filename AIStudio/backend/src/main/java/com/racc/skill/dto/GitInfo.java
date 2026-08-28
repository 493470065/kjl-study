package com.racc.skill.dto;

/**
 * Git 信息，对齐前端 GitInfo 接口
 */
public class GitInfo {

    private String lastCommit;
    private String remoteUrl;
    private String branch;

    public String getLastCommit() { return lastCommit; }
    public void setLastCommit(String lastCommit) { this.lastCommit = lastCommit; }

    public String getRemoteUrl() { return remoteUrl; }
    public void setRemoteUrl(String remoteUrl) { this.remoteUrl = remoteUrl; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
}