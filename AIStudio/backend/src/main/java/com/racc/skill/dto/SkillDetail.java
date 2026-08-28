package com.racc.skill.dto;

import java.util.List;
import java.util.Map;

/**
 * 技能详情，对齐前端 SkillDetail 接口
 */
public class SkillDetail {

    private String name;
    private String directory;
    private Map<String, Object> frontmatter;
    private String content;
    private List<SkillFileTreeNode> fileTree;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDirectory() { return directory; }
    public void setDirectory(String directory) { this.directory = directory; }

    public Map<String, Object> getFrontmatter() { return frontmatter; }
    public void setFrontmatter(Map<String, Object> frontmatter) { this.frontmatter = frontmatter; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<SkillFileTreeNode> getFileTree() { return fileTree; }
    public void setFileTree(List<SkillFileTreeNode> fileTree) { this.fileTree = fileTree; }
}