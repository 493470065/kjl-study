package com.racc.skill.dto;

import java.util.List;

/**
 * 技能文件树节点，对齐前端 FileTreeNode 接口
 */
public class SkillFileTreeNode {

    private String name;
    private String type; // "file" | "directory"
    private String path;
    private List<SkillFileTreeNode> children;

    public SkillFileTreeNode() {}

    public SkillFileTreeNode(String name, String type, String path, List<SkillFileTreeNode> children) {
        this.name = name;
        this.type = type;
        this.path = path;
        this.children = children;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public List<SkillFileTreeNode> getChildren() { return children; }
    public void setChildren(List<SkillFileTreeNode> children) { this.children = children; }
}