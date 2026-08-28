package com.racc.repository.entity;

import jakarta.persistence.*;

/**
 * 仓库子模块
 */
@Entity
@Table(name = "repo_modules")
public class RepoModuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "repo_id", nullable = false)
    private Long repoId;

    @Column(name = "module_name", nullable = false, length = 128)
    private String moduleName;

    @Column(name = "module_type", nullable = false, length = 64)
    private String moduleType;

    @Column(length = 64)
    private String iteration;

    @Column(name = "parent_module", length = 128)
    private String parentModule;

    @Column(nullable = false)
    private Boolean enabled = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRepoId() { return repoId; }
    public void setRepoId(Long repoId) { this.repoId = repoId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public String getModuleType() { return moduleType; }
    public void setModuleType(String moduleType) { this.moduleType = moduleType; }

    public String getIteration() { return iteration; }
    public void setIteration(String iteration) { this.iteration = iteration; }

    public String getParentModule() { return parentModule; }
    public void setParentModule(String parentModule) { this.parentModule = parentModule; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}