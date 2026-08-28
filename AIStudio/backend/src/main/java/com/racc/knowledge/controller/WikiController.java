package com.racc.knowledge.controller;

import com.racc.knowledge.service.WikiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Wiki 页面管理接口。
 *
 * 前端 API：wiki.ts
 * 路由前缀：/api/knowledge/wiki
 *
 * 端点列表：
 * - GET    /api/knowledge/wiki?documentId=               → Wiki 列表
 * - GET    /api/knowledge/wiki/{id}                      → Wiki 详情
 * - POST   /api/knowledge/wiki/generate/{documentId}     → 触发生成
 * - POST   /api/knowledge/wiki/{id}/regenerate           → 重新生成
 * - DELETE /api/knowledge/wiki/{id}                      → 删除
 */
@RestController
@RequestMapping("/api/knowledge/wiki")
public class WikiController {

    private final WikiService wikiService;

    public WikiController(WikiService wikiService) {
        this.wikiService = wikiService;
    }

    /**
     * 按源文档列出 Wiki 页面。
     */
    @GetMapping
    public ResponseEntity<?> listByDocument(@RequestParam("documentId") Long documentId) {
        List<Map<String, Object>> pages = wikiService.listByDocument(documentId);
        return ResponseEntity.ok(pages);
    }

    /**
     * 获取 Wiki 页面详情。
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(wikiService.getById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 为指定文档生成 Wiki 页面。
     * LLM 未配置时返回模拟数据。
     */
    @PostMapping("/generate/{documentId}")
    public ResponseEntity<?> generateForDocument(@PathVariable Long documentId) {
        try {
            return ResponseEntity.ok(wikiService.generateForDocument(documentId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 重新生成 Wiki 页面。
     */
    @PostMapping("/{id}/regenerate")
    public ResponseEntity<?> regenerate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(wikiService.regenerate(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 删除 Wiki 页面。
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            wikiService.delete(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}