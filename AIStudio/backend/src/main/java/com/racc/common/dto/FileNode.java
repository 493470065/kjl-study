package com.racc.common.dto;

import java.util.List;

/**
 * 文件树节点 DTO，对齐前端 RepoFile / ProductLineFile 接口
 */
public class FileNode {

    private String path;
    private String name;
    private long size;
    private String type; // "file" | "directory"
    private List<FileNode> children;

    public FileNode() {}

    public FileNode(String path, String name, long size, String type, List<FileNode> children) {
        this.path = path;
        this.name = name;
        this.size = size;
        this.type = type;
        this.children = children;
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<FileNode> getChildren() { return children; }
    public void setChildren(List<FileNode> children) { this.children = children; }
}