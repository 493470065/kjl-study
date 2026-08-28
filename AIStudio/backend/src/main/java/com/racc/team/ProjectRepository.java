package com.racc.team;

import com.racc.team.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    List<ProjectEntity> findByWorkspaceId(Long workspaceId);
    long countByWorkspaceId(Long workspaceId);
    void deleteByWorkspaceId(Long workspaceId);
}