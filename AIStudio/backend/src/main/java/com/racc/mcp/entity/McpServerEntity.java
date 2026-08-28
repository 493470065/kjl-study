package com.racc.mcp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * MCP Server 配置实体
 */
@Entity
@Table(name = "mcp_servers")
public class McpServerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(name = "display_name", length = 128)
    private String displayName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 500)
    private String command;

    @Column(length = 2000)
    private String args;

    @Column(name = "work_dir", length = 500)
    private String workDir;

    @Column(name = "env_vars", length = 2000)
    private String envVars;

    @Column(nullable = false, length = 32)
    private String status = "STOPPED";

    @Column(name = "tool_count", nullable = false)
    private Integer toolCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public String getArgs() { return args; }
    public void setArgs(String args) { this.args = args; }

    public String getWorkDir() { return workDir; }
    public void setWorkDir(String workDir) { this.workDir = workDir; }

    public String getEnvVars() { return envVars; }
    public void setEnvVars(String envVars) { this.envVars = envVars; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getToolCount() { return toolCount; }
    public void setToolCount(Integer toolCount) { this.toolCount = toolCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}