package com.racc.skill.dto;

import java.util.List;

/**
 * 技能执行结果
 */
public class SkillExecResult {

    private boolean success;
    private Integer exitCode;
    private String entry;
    private String stdout;
    private String stderr;
    private long durationMs;
    private boolean timedOut;
    /** stdout 可解析为 JSON（对象/数组）时填充，供数据源类调用直接消费 */
    private Object data;
    private List<String> detectedEntries;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }
    public String getEntry() { return entry; }
    public void setEntry(String entry) { this.entry = entry; }
    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }
    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public boolean isTimedOut() { return timedOut; }
    public void setTimedOut(boolean timedOut) { this.timedOut = timedOut; }
    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
    public List<String> getDetectedEntries() { return detectedEntries; }
    public void setDetectedEntries(List<String> detectedEntries) { this.detectedEntries = detectedEntries; }
}
