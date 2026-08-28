package com.racc.team;

import com.racc.team.entity.ProjectEntity;
import com.racc.team.entity.TeamMemberEntity;
import com.racc.team.entity.WorkspaceEntity;
import com.racc.user.UserRepository;
import com.racc.user.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 团队协作服务（工作空间 + 项目）
 */
@Service
@Transactional
public class TeamService {

    private final WorkspaceRepository workspaceRepo;
    private final TeamMemberRepository memberRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

    public TeamService(WorkspaceRepository workspaceRepo, TeamMemberRepository memberRepo,
                       ProjectRepository projectRepo, UserRepository userRepo) {
        this.workspaceRepo = workspaceRepo;
        this.memberRepo = memberRepo;
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
    }

    // ==================== 工作空间 ====================

    public List<Map<String, Object>> listWorkspaces() {
        List<WorkspaceEntity> list = workspaceRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (WorkspaceEntity w : list) {
            result.add(toWorkspaceMap(w));
        }
        return result;
    }

    public Map<String, Object> createWorkspace(String name, String description) {
        WorkspaceEntity entity = new WorkspaceEntity();
        entity.setName(name);
        entity.setDescription(description);
        entity.setCreatedBy(currentUsername());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        workspaceRepo.save(entity);

        // 创建者自动成为 OWNER
        TeamMemberEntity owner = new TeamMemberEntity();
        owner.setWorkspaceId(entity.getId());
        owner.setUsername(currentUsername());
        owner.setDisplayName(getDisplayName(currentUsername()));
        owner.setRole("OWNER");
        owner.setJoinedAt(LocalDateTime.now());
        memberRepo.save(owner);

        return toWorkspaceMap(entity);
    }

    public Map<String, Object> updateWorkspace(Long id, String name, String description) {
        WorkspaceEntity entity = workspaceRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("工作空间不存在: " + id));
        if (name != null) entity.setName(name);
        if (description != null) entity.setDescription(description);
        entity.setUpdatedAt(LocalDateTime.now());
        workspaceRepo.save(entity);
        return toWorkspaceMap(entity);
    }

    public void deleteWorkspace(Long id) {
        memberRepo.deleteByWorkspaceId(id);
        projectRepo.deleteByWorkspaceId(id);
        workspaceRepo.deleteById(id);
    }

    // ==================== 成员 ====================

    public List<Map<String, Object>> listMembers(Long workspaceId) {
        List<TeamMemberEntity> members = memberRepo.findByWorkspaceId(workspaceId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (TeamMemberEntity m : members) {
            result.add(toMemberMap(m));
        }
        return result;
    }

    public Map<String, Object> addMember(Long workspaceId, String username, String role) {
        // 检查用户是否存在
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("用户不存在: " + username));

        // 检查是否已在空间内
        Optional<TeamMemberEntity> existing = memberRepo.findByWorkspaceIdAndUsername(workspaceId, username);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("该用户已是团队成员");
        }

        TeamMemberEntity member = new TeamMemberEntity();
        member.setWorkspaceId(workspaceId);
        member.setUsername(username);
        member.setDisplayName(user.getDisplayName());
        member.setRole(role != null ? role : "MEMBER");
        member.setJoinedAt(LocalDateTime.now());
        memberRepo.save(member);
        return toMemberMap(member);
    }

    public Map<String, Object> updateMember(Long workspaceId, Long memberId, String role) {
        TeamMemberEntity member = memberRepo.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("团队成员不存在: " + memberId));
        if (!member.getWorkspaceId().equals(workspaceId)) {
            throw new IllegalArgumentException("成员不属于该工作空间");
        }
        member.setRole(role);
        memberRepo.save(member);
        return toMemberMap(member);
    }

    public void removeMember(Long workspaceId, Long memberId) {
        TeamMemberEntity member = memberRepo.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("团队成员不存在: " + memberId));
        if (!member.getWorkspaceId().equals(workspaceId)) {
            throw new IllegalArgumentException("成员不属于该工作空间");
        }
        memberRepo.delete(member);
    }

    // ==================== 项目 ====================

    public List<Map<String, Object>> listProjects(Long workspaceId) {
        List<ProjectEntity> list;
        if (workspaceId != null) {
            list = projectRepo.findByWorkspaceId(workspaceId);
        } else {
            list = projectRepo.findAll();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (ProjectEntity p : list) {
            result.add(toProjectMap(p));
        }
        return result;
    }

    public Map<String, Object> createProject(String name, String description, Long workspaceId) {
        workspaceRepo.findById(workspaceId)
                .orElseThrow(() -> new NoSuchElementException("工作空间不存在: " + workspaceId));

        ProjectEntity entity = new ProjectEntity();
        entity.setName(name);
        entity.setDescription(description);
        entity.setWorkspaceId(workspaceId);
        entity.setCreatedBy(currentUsername());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        projectRepo.save(entity);
        return toProjectMap(entity);
    }

    public Map<String, Object> updateProject(Long id, String name, String description) {
        ProjectEntity entity = projectRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("项目不存在: " + id));
        if (name != null) entity.setName(name);
        if (description != null) entity.setDescription(description);
        entity.setUpdatedAt(LocalDateTime.now());
        projectRepo.save(entity);
        return toProjectMap(entity);
    }

    public void deleteProject(Long id) {
        projectRepo.deleteById(id);
    }

    // ==================== helpers ====================

    private Map<String, Object> toWorkspaceMap(WorkspaceEntity w) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", w.getId());
        map.put("name", w.getName());
        map.put("description", w.getDescription());
        map.put("createdBy", w.getCreatedBy());
        map.put("createdAt", w.getCreatedAt() != null ? w.getCreatedAt().toString() : null);
        map.put("memberCount", memberRepo.countByWorkspaceId(w.getId()));
        map.put("projectCount", projectRepo.countByWorkspaceId(w.getId()));
        return map;
    }

    private Map<String, Object> toMemberMap(TeamMemberEntity m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        // 从 UserEntity 获取 userId
        UserEntity user = userRepo.findByUsername(m.getUsername()).orElse(null);
        map.put("userId", user != null ? user.getId() : null);
        map.put("username", m.getUsername());
        map.put("displayName", m.getDisplayName());
        map.put("role", m.getRole());
        map.put("joinedAt", m.getJoinedAt() != null ? m.getJoinedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toProjectMap(ProjectEntity p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("name", p.getName());
        map.put("description", p.getDescription());
        map.put("workspaceId", p.getWorkspaceId());
        map.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        return map;
    }

    private String getDisplayName(String username) {
        return userRepo.findByUsername(username)
                .map(UserEntity::getDisplayName)
                .orElse(username);
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return "anonymous";
        }
        return String.valueOf(auth.getPrincipal());
    }
}