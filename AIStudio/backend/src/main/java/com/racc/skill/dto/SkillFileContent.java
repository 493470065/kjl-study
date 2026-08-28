package com.racc.skill.dto;

/**
 * 文件读写响应
 */
public class SkillFileContent {

    private String path;
    private String content;

    public SkillFileContent() {}

    public SkillFileContent(String path, String content) {
        this.path = path;
        this.content = content;
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}