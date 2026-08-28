package com.racc.team;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 团队协作接口：工作空间 + 项目
 *
 * 前端 API：team.ts
 * - GET    /api/workspaces                          → 工作空间列表
 * - POST   /api/workspaces                          → 新建 {name,description}
 * - PUT    /api/workspaces/{id}                     → 编辑
 * - DELETE /api/workspaces/{id}                     → 删除
 * - GET    /api/workspaces/{id}/members             → 成员列表
 * - POST   /api/workspaces/{id}/members             → 添加成员 {username,role}
 * - PUT    /api/workspaces/{id}/members/{memberId}  → 更新角色
 * - DELETE /api/workspaces/{id}/members/{memberId}  → 移除成员
 * - GET    /api/projects?workspaceId=               → 项目列表
 * - POST   /api/projects                            → 新建 {name,description,workspaceId}
 * - PUT    /api/projects/{id}                       → 编辑
 * - DELETE /api/projects/{id}                       → 删除
 */
@RestController
@RequestMapping("/api")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // ==================== 工作空间 ====================

    @GetMapping("/workspaces")
    public ResponseEntity<List<Map<String, Object>>> listWorkspaces() {
        return ResponseEntity.ok(teamService.listWorkspaces());
    }

    @PostMapping("/workspaces")
    public ResponseEntity<Map<String, Object>> createWorkspace(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "名称不能为空"));
        }
        return ResponseEntity.ok(teamService.createWorkspace(name, body.get("description")));
    }

    @PutMapping("/workspaces/{id}")
    public ResponseEntity<Map<String, Object>> updateWorkspace(@PathVariable Long id,
                                                                @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateWorkspace(id, body.get("name"), body.get("description")));
    }

    @DeleteMapping("/workspaces/{id}")
    public ResponseEntity<?> deleteWorkspace(@PathVariable Long id) {
        teamService.deleteWorkspace(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 成员 ====================

    @GetMapping("/workspaces/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> listMembers(@PathVariable("id") Long workspaceId) {
        return ResponseEntity.ok(teamService.listMembers(workspaceId));
    }

    @PostMapping("/workspaces/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable("id") Long workspaceId,
                                       @RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名不能为空"));
        }
        try {
            return ResponseEntity.ok(teamService.addMember(workspaceId, username, body.get("role")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/workspaces/{id}/members/{memberId}")
    public ResponseEntity<?> updateMember(@PathVariable("id") Long workspaceId,
                                          @PathVariable Long memberId,
                                          @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "角色不能为空"));
        }
        try {
            return ResponseEntity.ok(teamService.updateMember(workspaceId, memberId, role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/workspaces/{id}/members/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable("id") Long workspaceId,
                                          @PathVariable Long memberId) {
        teamService.removeMember(workspaceId, memberId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 项目 ====================

    @GetMapping("/projects")
    public ResponseEntity<List<Map<String, Object>>> listProjects(@RequestParam(required = false) Long workspaceId) {
        return ResponseEntity.ok(teamService.listProjects(workspaceId));
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "名称不能为空"));
        }
        String description = (String) body.get("description");
        Long workspaceId = body.get("workspaceId") != null
                ? ((Number) body.get("workspaceId")).longValue() : null;
        if (workspaceId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "workspaceId 不能为空"));
        }
        try {
            return ResponseEntity.ok(teamService.createProject(name, description, workspaceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(teamService.updateProject(id, body.get("name"), body.get("description")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        teamService.deleteProject(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}