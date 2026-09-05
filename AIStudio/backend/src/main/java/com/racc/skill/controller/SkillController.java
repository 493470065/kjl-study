package com.racc.skill.controller;

import com.racc.skill.dto.*;
import com.racc.skill.service.SkillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 技能管理接口
 *
 * 前端 API：skill.ts
 * 端点：
 *   GET    /api/skills                              → 列表
 *   GET    /api/skills/{name}                       → 详情
 *   POST   /api/skills                              → 新建
 *   DELETE /api/skills/{name}                       → 删除
 *   POST   /api/skills/{name}/pull                  → git pull
 *   GET    /api/skills/{name}/git-info              → Git 信息
 *   POST   /api/skills/{name}/disable               → 禁用
 *   POST   /api/skills/{name}/enable                → 启用
 *   POST   /api/skills/{name}/enable-copy           → 允许复制
 *   POST   /api/skills/{name}/disable-copy          → 禁止复制
 *   GET    /api/skills/{name}/files/{path}          → 读取文件
 *   POST   /api/skills/{name}/files/{path}          → 写入文件
 *   DELETE /api/skills/{name}/files/{path}          → 删除文件
 *   POST   /api/skills/{name}/exec           → 执行技能脚本
 *   POST   /api/skills/clone                        → 从 Git 克隆
 *   POST   /api/skills/upload                       → 上传 zip
 */
@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SkillController.class);

    private final SkillService skillService;
    private final com.racc.skill.service.SkillExecService skillExecService;

    public SkillController(SkillService skillService, com.racc.skill.service.SkillExecService skillExecService) {
        this.skillService = skillService;
        this.skillExecService = skillExecService;
    }

    // ==================== 列表 & 详情 ====================

    /** GET /api/skills — 技能列表 */
    @GetMapping
    public ResponseEntity<List<SkillSummary>> listSkills() {
        return ResponseEntity.ok(skillService.listSkills());
    }

    /** GET /api/skills/{name} — 技能详情 */
    @GetMapping("/{name}")
    public ResponseEntity<?> getSkillDetail(@PathVariable String name) {
        try {
            return ResponseEntity.ok(skillService.getSkillDetail(name));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 创建 & 删除 ====================

    /** POST /api/skills — 新建技能 */
    @PostMapping
    public ResponseEntity<?> createSkill(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "name 不能为空"));
        }
        try {
            return ResponseEntity.ok(skillService.createSkill(name));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/skills/{name} — 删除技能 */
    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteSkill(@PathVariable String name) {
        try {
            skillService.deleteSkill(name);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 执行 ====================

    /** POST /api/skills/{name}/exec — 执行技能脚本（返回 stdout/stderr/exitCode，stdout 可解析为 JSON 时填充 data） */
    @PostMapping("/{name}/exec")
    public ResponseEntity<?> execSkill(@PathVariable String name,
                                       @RequestBody(required = false) SkillExecRequest request) {
        try {
            return ResponseEntity.ok(skillExecService.exec(name, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("技能执行失败: {}", name, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "技能执行失败: " + e.getMessage()));
        }
    }

    // ==================== Git 操作 ====================

    /** POST /api/skills/{name}/pull — git pull */
    @PostMapping("/{name}/pull")
    public ResponseEntity<?> pullSkill(@PathVariable String name) {
        try {
            return ResponseEntity.ok(skillService.pullSkill(name));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/skills/{name}/git-info — Git 信息 */
    @GetMapping("/{name}/git-info")
    public ResponseEntity<?> getGitInfo(@PathVariable String name) {
        try {
            return ResponseEntity.ok(skillService.getGitInfo(name));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 开关控制 ====================

    /** POST /api/skills/{name}/disable — 禁用 */
    @PostMapping("/{name}/disable")
    public ResponseEntity<?> disableSkill(@PathVariable String name) {
        return toggleSkill(name, "disable");
    }

    /** POST /api/skills/{name}/enable — 启用 */
    @PostMapping("/{name}/enable")
    public ResponseEntity<?> enableSkill(@PathVariable String name) {
        return toggleSkill(name, "enable");
    }

    /** POST /api/skills/{name}/enable-copy — 允许复制 */
    @PostMapping("/{name}/enable-copy")
    public ResponseEntity<?> enableCopySkill(@PathVariable String name) {
        return toggleSkill(name, "enable-copy");
    }

    /** POST /api/skills/{name}/disable-copy — 禁止复制 */
    @PostMapping("/{name}/disable-copy")
    public ResponseEntity<?> disableCopySkill(@PathVariable String name) {
        return toggleSkill(name, "disable-copy");
    }

    private ResponseEntity<?> toggleSkill(String name, String action) {
        try {
            skillService.toggleSkill(name, action);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 文件操作 ====================

    /**
     * GET /api/skills/{name}/files/** — 读取文件
     * 使用 /** 捕获多级路径（Spring PathPattern 不支持 {path:.*} 跨段匹配）
     */
    @GetMapping("/{name}/files/**")
    public ResponseEntity<?> readFile(@PathVariable String name, HttpServletRequest request) {
        String path = extractFilePath(request);
        try {
            return ResponseEntity.ok(skillService.readFile(name, path));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/skills/{name}/files/** — 写入文件
     */
    @PostMapping("/{name}/files/**")
    public ResponseEntity<?> writeFile(@PathVariable String name, HttpServletRequest request,
                                       @RequestBody Map<String, String> body) {
        String path = extractFilePath(request);
        String content = body.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "content 不能为空"));
        }
        try {
            skillService.writeFile(name, path, content);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/skills/{name}/files/** — 删除文件
     */
    @DeleteMapping("/{name}/files/**")
    public ResponseEntity<?> deleteFile(@PathVariable String name, HttpServletRequest request) {
        String path = extractFilePath(request);
        try {
            skillService.deleteFile(name, path);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 从请求 URI 中截取 "/files/" 之后的原始路径（保留多级目录与中文，未解码）
     */
    private String extractFilePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        int idx = uri.indexOf("/files/");
        if (idx < 0) return "";
        return uri.substring(idx + "/files/".length());
    }

    // ==================== 克隆 ====================

    /** POST /api/skills/clone — 从 Git 克隆 */
    @PostMapping("/clone")
    public ResponseEntity<?> cloneSkill(@RequestBody CloneSkillRequest req) {
        if (req.getGitUrl() == null || req.getGitUrl().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "gitUrl 不能为空"));
        }
        try {
            return ResponseEntity.ok(skillService.cloneSkill(req.getGitUrl(), req.getName(), req.getBranch()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== 上传 ====================

    /** POST /api/skills/upload — 上传 zip */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadSkill(@RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "name", required = false) String name) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "文件不能为空"));
        }
        try {
            return ResponseEntity.ok(skillService.uploadSkill(name, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}