package com.racc.skill.dto;

/**
 * 技能执行请求
 *
 * POST /api/skills/{name}/exec
 */
public class SkillExecRequest {

    /** 脚本入口（相对技能目录，如 scripts/consolidate.js）；缺省时按 frontmatter entry: → scripts/ 自动探测 */
    private String entry;

    /** 脚本参数：JSON 数组（每个元素作为一个 CLI 参数）或任意对象（整体序列化为一个 JSON 字符串参数）；可为空 */
    private Object args;

    /** 超时毫秒数；缺省用 racc.skills.exec.timeout-ms（默认 120000） */
    private Integer timeoutMs;

    public String getEntry() { return entry; }
    public void setEntry(String entry) { this.entry = entry; }
    public Object getArgs() { return args; }
    public void setArgs(Object args) { this.args = args; }
    public Integer getTimeoutMs() { return timeoutMs; }
    public void setTimeoutMs(Integer timeoutMs) { this.timeoutMs = timeoutMs; }
}
