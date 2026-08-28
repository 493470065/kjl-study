package com.racc.agent.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Agent 配置表。
 * 定义系统中可用的 Agent 配置信息，包括能力、工具、系统提示词等。
 */
@Entity
@Table(name = "agent_config_details")
public class AgentConfigDetailEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String capabilities;

    @Column(columnDefinition = "LONGTEXT")
    private String tools;

    @Column(length = 32)
    private String status = "idle";

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "system_prompt", columnDefinition = "LONGTEXT")
    private String systemPrompt;

    @Column(columnDefinition = "LONGTEXT")
    private String skills;

    @Column(length = 128)
    private String model;

    @Column(length = 256)
    private String directory;

    @Column(name = "preferred_skills", columnDefinition = "LONGTEXT")
    private String preferredSkills;

    /** 关联的 MCP Server 名称（JSON 数组），运行时注入其工具并路由调用 */
    @Column(name = "mcp_servers", length = 1000)
    private String mcpServers;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCapabilities() { return capabilities; }
    public void setCapabilities(String capabilities) { this.capabilities = capabilities; }

    public String getTools() { return tools; }
    public void setTools(String tools) { this.tools = tools; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getDirectory() { return directory; }
    public void setDirectory(String directory) { this.directory = directory; }

    public String getPreferredSkills() { return preferredSkills; }
    public void setPreferredSkills(String preferredSkills) { this.preferredSkills = preferredSkills; }

    public String getMcpServers() { return mcpServers; }
    public void setMcpServers(String mcpServers) { this.mcpServers = mcpServers; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}