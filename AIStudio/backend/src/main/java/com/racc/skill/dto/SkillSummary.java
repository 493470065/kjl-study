package com.racc.skill.dto;

/**
 * 技能概要信息，对齐前端 SkillSummary 接口
 */
public class SkillSummary {

    private String name;
    private String description;
    private String version;
    private String commitId;
    private String directory;
    private Integer stageCount;
    private Integer referenceCount;
    private Boolean disabled = false;
    private Boolean copyEnabled = false;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getCommitId() { return commitId; }
    public void setCommitId(String commitId) { this.commitId = commitId; }

    public String getDirectory() { return directory; }
    public void setDirectory(String directory) { this.directory = directory; }

    public Integer getStageCount() { return stageCount; }
    public void setStageCount(Integer stageCount) { this.stageCount = stageCount; }

    public Integer getReferenceCount() { return referenceCount; }
    public void setReferenceCount(Integer referenceCount) { this.referenceCount = referenceCount; }

    public Boolean getDisabled() { return disabled; }
    public void setDisabled(Boolean disabled) { this.disabled = disabled; }

    public Boolean getCopyEnabled() { return copyEnabled; }
    public void setCopyEnabled(Boolean copyEnabled) { this.copyEnabled = copyEnabled; }
}