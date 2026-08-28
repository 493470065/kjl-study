package com.racc.productline;

import com.racc.common.dto.FileNode;
import com.racc.productline.entity.ProductLineEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 产品线管理接口
 *
 * 前端 API：productLine.ts
 * - GET    /api/product-lines?search=          → 列表
 * - POST   /api/product-lines                  → 新建
 * - GET    /api/product-lines/{id}             → 详情
 * - PUT    /api/product-lines/{id}             → 编辑
 * - DELETE /api/product-lines/{id}             → 删除
 * - PUT    /api/product-lines/{id}/claude-md   → 更新 CLAUDE.md
 * - POST   /api/product-lines/seed             → 预置数据
 * - GET    /api/product-lines/{id}/files       → 文件树
 * - GET    /api/product-lines/{id}/files/**    → 文件内容
 * - PUT    /api/product-lines/{id}/files/**    → 保存文件
 */
@RestController
@RequestMapping("/api/product-lines")
public class ProductLineController {

    private final ProductLineService productLineService;

    public ProductLineController(ProductLineService productLineService) {
        this.productLineService = productLineService;
    }

    // ==================== 产品线 CRUD ====================

    @GetMapping
    public ResponseEntity<List<ProductLineEntity>> listProductLines(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productLineService.listProductLines(search));
    }

    @PostMapping
    public ResponseEntity<?> createProductLine(@RequestBody ProductLineEntity entity) {
        try {
            return ResponseEntity.ok(productLineService.createProductLine(entity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductLine(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productLineService.getProductLine(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProductLine(@PathVariable Long id, @RequestBody ProductLineEntity entity) {
        try {
            return ResponseEntity.ok(productLineService.updateProductLine(id, entity));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProductLine(@PathVariable Long id) {
        productLineService.deleteProductLine(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== CLAUDE.md ====================

    @PutMapping("/{id}/claude-md")
    public ResponseEntity<?> saveClaudeMd(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String claudeMd = body.get("claudeMd");
        if (claudeMd == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "claudeMd 不能为空"));
        }
        productLineService.saveClaudeMd(id, claudeMd);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 预置数据 ====================

    @PostMapping("/seed")
    public ResponseEntity<?> seed() {
        productLineService.seed();
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==================== 文件操作 ====================

    @GetMapping("/{id}/files")
    public ResponseEntity<List<FileNode>> getFileTree(@PathVariable Long id) {
        return ResponseEntity.ok(productLineService.getFileTree(id));
    }

    @GetMapping("/{id}/files/**")
    public ResponseEntity<?> readFile(@PathVariable Long id, HttpServletRequest request) {
        String filePath = resolveFilePath(request);
        try {
            return ResponseEntity.ok(productLineService.readFile(id, filePath));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/files/**")
    public ResponseEntity<?> writeFile(@PathVariable Long id, @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        String filePath = resolveFilePath(request);
        String content = body.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "content 不能为空"));
        }
        try {
            productLineService.writeFile(id, filePath, content);
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