package com.racc.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * 种子数据执行状态标记（key-value）。
 *
 * 用于保证 DataSeeder 的各类种子数据"只播种一次"：播种完成后写入标记，
 * 此后即使用户删除了被播种的记录（如默认 LLM Provider），重启也不会再补种，
 * 避免"删除的卡片重启后又出现"的问题。
 */
@Entity
@Table(name = "seed_state")
public class SeedStateEntity {

    @Id
    @Column(name = "seed_key", length = 100)
    private String seedKey;

    @Column(name = "seed_value", length = 255)
    private String seedValue;

    @Column(name = "seeded_at")
    private LocalDateTime seededAt;

    public String getSeedKey() { return seedKey; }
    public void setSeedKey(String seedKey) { this.seedKey = seedKey; }

    public String getSeedValue() { return seedValue; }
    public void setSeedValue(String seedValue) { this.seedValue = seedValue; }

    public LocalDateTime getSeededAt() { return seededAt; }
    public void setSeededAt(LocalDateTime seededAt) { this.seededAt = seededAt; }
}
