package com.racc.knowledge.controller;

import com.racc.knowledge.service.ScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 代码扫描接口。
 *
 * 前端 API：scan.ts
 * 路由前缀：/api/knowledge/scan
 *
 * 端点列表：
 * - POST /api/knowledge/scan/preview  → 预览扫描结果
 * - POST /api/knowledge/scan          → 执行扫描并导入
 */
@RestController
@RequestMapping("/api/knowledge/scan")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    /**
     * 预览扫描：返回目录中所有可导入的文件列表。
     * 请求体：{ directory: "/path/to/scan" }
     */
    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody Map<String, String> body) {
        String directory = body.get("directory");
        if (directory == null || directory.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "directory 不能为空"));
        }
        try {
            return ResponseEntity.ok(scanService.previewScan(directory));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "扫描失败: " + e.getMessage()));
        }
    }

    /**
     * 执行扫描：读取目录中的文件内容并导入知识库。
     * 请求体：{ directory: "/path/to/scan", category: "可选分类" }
     */
    @PostMapping
    public ResponseEntity<?> scan(@RequestBody Map<String, String> body) {
        String directory = body.get("directory");
        String category = body.get("category");
        if (directory == null || directory.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "directory 不能为空"));
        }
        try {
            return ResponseEntity.ok(scanService.executeScan(directory, category));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "导入失败: " + e.getMessage()));
        }
    }
}