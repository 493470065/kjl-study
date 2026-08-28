package com.racc.skill.dto;

/**
 * 克隆技能请求
 */
public class CloneSkillRequest {

    private String gitUrl;
    private String name;
    private String branch;

    public String getGitUrl() { return gitUrl; }
    public void setGitUrl(String gitUrl) { this.gitUrl = gitUrl; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
}