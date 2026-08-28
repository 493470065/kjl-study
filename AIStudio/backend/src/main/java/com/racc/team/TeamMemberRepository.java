package com.racc.team;

import com.racc.team.entity.TeamMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMemberEntity, Long> {
    List<TeamMemberEntity> findByWorkspaceId(Long workspaceId);
    Optional<TeamMemberEntity> findByWorkspaceIdAndUsername(Long workspaceId, String username);
    long countByWorkspaceId(Long workspaceId);
    void deleteByWorkspaceId(Long workspaceId);
}