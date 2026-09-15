package com.racc.fpianalysis.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 合理性设计分析结果缓存（每用户每条线每功能点一行，覆盖式保存最近一次）。
 * 前端在「合理性设计」抽屉展示最近一次分析结果；仅人工点击执行分析时覆盖更新。
 */
@Entity
@Table(name = "fpi_analysis_result",
       uniqueConstraints = @UniqueConstraint(name = "uk_fpi_result",
                                             columnNames = {"user_id", "line_key", "fp_code"}))
public class FpiAnalysisResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 条线：inpatient / outpatient / emergency */
    @Column(name = "line_key", nullable = false, length = 32)
    private String lineKey;

    @Column(name = "fp_code", nullable = false, length = 128)
    private String fpCode;

    /** 功能点名称（保存时的快照，展示用） */
    @Column(name = "fp_name", length = 255)
    private String fpName;

    @Column(name = "skill_name", length = 128)
    private String skillName;

    /** 分析结果 Markdown 原文（技能 stdout） */
    @Column(name = "result_md", columnDefinition = "LONGTEXT")
    private String resultMd;

    /** 分析时的归集数据指纹（工单 id 集合 hash），打开抽屉时与当前数据比对 */
    @Column(name = "data_fingerprint", length = 255)
    private String dataFingerprint;

    /** 分析时传给技能的 fp 对象 JSON 快照 */
    @Column(name = "fp_snapshot", columnDefinition = "LONGTEXT")
    private String fpSnapshot;

    @Column(name = "exec_duration_ms")
    private Long execDurationMs;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getLineKey() { return lineKey; }
    public void setLineKey(String lineKey) { this.lineKey = lineKey; }
    public String getFpCode() { return fpCode; }
    public void setFpCode(String fpCode) { this.fpCode = fpCode; }
    public String getFpName() { return fpName; }
    public void setFpName(String fpName) { this.fpName = fpName; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public String getResultMd() { return resultMd; }
    public void setResultMd(String resultMd) { this.resultMd = resultMd; }
    public String getDataFingerprint() { return dataFingerprint; }
    public void setDataFingerprint(String dataFingerprint) { this.dataFingerprint = dataFingerprint; }
    public String getFpSnapshot() { return fpSnapshot; }
    public void setFpSnapshot(String fpSnapshot) { this.fpSnapshot = fpSnapshot; }
    public Long getExecDurationMs() { return execDurationMs; }
    public void setExecDurationMs(Long execDurationMs) { this.execDurationMs = execDurationMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
