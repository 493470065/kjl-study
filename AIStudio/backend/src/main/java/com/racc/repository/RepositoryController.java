package com.racc.repository;

import com.racc.common.dto.FileNode;
import com.racc.repository.entity.CodeRepositoryEntity;
import com.racc.repository.entity.RepoModuleEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 仓库管理接口
 *
 * 前端 API：repository.ts
 * - GET    /api/repositories?search=&tag=          → 仓库列表
 * - POST   /api/repositories                       → 新建
 * - GET    /api/repositories/{id}                  → 详情
 * - PUT    /api/repositories/{id}                  → 编辑
 * - DELETE /api/repositories/{id}                  → 删除
 * - GET    /api/repositories/tags/all              → 所有业务标记
 * - GET    /api/repositories/{repoId}/modules      → 子模块列表
 * - POST   /api/repositories/{repoId}/modules      → 新增子模块
 * - PUT    /api/repositories/modules/{id}/toggle   → 启用/禁用
 * - POST   /api/repositories/seed                  → 预置数据
 * - PUT    /api/repositories/{id}/claude-md        → 更新 CLAUDE.md
 * - GET    /api/repositories/{id}/files            → 文件树
 * - GET    /api/repositories/{id}/files/**         → 文件内容
 * - PUT    /api/repositories/{id}/files/**         → 保存文件
 */
@RestController
@RequestMapping("/api/repositories")
public class RepositoryController {

    private final RepositoryService repositoryService;

    public RepositoryController(RepositoryService repositoryService) {
        this.repositoryService = repositoryService;
    }

    // ==================== 仓库 CRUD ====================

    @GetMapping
    public ResponseEntity<List<CodeRepositoryEntity>> listRepositories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag) {
        return ResponseEntity.ok(repositoryService.listRepositories(search, tag));
    }

    @PostMapping
    public ResponseEntity<?> createRepository(@RequestBody CodeRepositoryEntity entity) {
        try {
            return ResponseEntity.ok(repositoryService.createRepository(entity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRepository(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(repositoryService.getRepository(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRepository(@PathVariable Long id, @RequestBody CodeRepositoryEntity entity) {
        try {
            return ResponseEntity.ok(repositoryService.updateRepository(id, entity));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRepository(@PathVariable Long id) {
        repositoryService.deleteRepository(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 业务标记 ====================

    @GetMapping("/tags/all")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(repositoryService.getAllTags());
    }

    // ==================== 子模块 ====================

    @GetMapping("/{repoId}/modules")
    public ResponseEntity<List<RepoModuleEntity>> getModules(@PathVariable Long repoId) {
        return ResponseEntity.ok(repositoryService.getModules(repoId));
    }

    @PostMapping("/{repoId}/modules")
    public ResponseEntity<List<RepoModuleEntity>> saveModules(@PathVariable Long repoId,
                                                               @RequestBody List<RepoModuleEntity> modules) {
        return ResponseEntity.ok(repositoryService.saveModules(repoId, modules));
    }

    @PutMapping("/modules/{id}/toggle")
    public ResponseEntity<?> toggleModule(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(repositoryService.toggleModule(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 预置数据 ====================

    @PostMapping("/seed")
    public ResponseEntity<?> seed() {
        repositoryService.seed();
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== CLAUDE.md ====================

    @PutMapping("/{id}/claude-md")
    public ResponseEntity<?> saveClaudeMd(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String claudeMd = body.get("claudeMd");
        if (claudeMd == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "claudeMd 不能为空"));
        }
        repositoryService.saveClaudeMd(id, claudeMd);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 文件操作 ====================

    @GetMapping("/{id}/files")
    public ResponseEntity<List<FileNode>> getFileTree(@PathVariable Long id) {
        return ResponseEntity.ok(repositoryService.getFileTree(id));
    }

    /**
     * 读取文件内容。URL 模式：/api/repositories/{id}/files/{path}
     * 使用 /** 捕获多级路径，通过 HttpServletRequest 提取文件路径。
     */
    @GetMapping("/{id}/files/**")
    public ResponseEntity<?> readFile(@PathVariable Long id, HttpServletRequest request) {
        String filePath = resolveFilePath(request);
        try {
            return ResponseEntity.ok(repositoryService.readFile(id, filePath));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 保存文件内容。URL 模式：/api/repositories/{id}/files/{path}
     */
    @PutMapping("/{id}/files/**")
    public ResponseEntity<?> writeFile(@PathVariable Long id, @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        String filePath = resolveFilePath(request);
        String content = body.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "content 不能为空"));
        }
        try {
            repositoryService.writeFile(id, filePath, content);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 从请求 URI 中提取 /files/ 之后的路径部分
     */
    private String resolveFilePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        String relative = contextPath != null ? uri.substring(contextPath.length()) : uri;
        int idx = relative.indexOf("/files/");
        if (idx < 0) return "";
        return relative.substring(idx + "/files/".length());
    }
}