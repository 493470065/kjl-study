package com.racc.knowledge.controller;

import com.racc.knowledge.entity.LinkConfigEntity;
import com.racc.knowledge.service.LinkConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 链接配置管理接口（持久化链接库）。
 * 路由前缀：/api/knowledge/links
 *
 * - GET    /api/knowledge/links?enabled=          → 配置列表
 * - POST   /api/knowledge/links                   → 新增配置
 * - PUT    /api/knowledge/links/{id}              → 更新配置
 * - DELETE /api/knowledge/links/{id}             → 删除配置
 * - POST   /api/knowledge/links/{id}/fetch       → 抓取单条
 * - POST   /api/knowledge/links/fetch-all        → 批量抓取全部启用项
 */
@RestController
@RequestMapping("/api/knowledge/links")
public class LinkConfigController {

    private final LinkConfigService linkConfigService;

    public LinkConfigController(LinkConfigService linkConfigService) {
        this.linkConfigService = linkConfigService;
    }

    @GetMapping
    public ResponseEntity<List<LinkConfigEntity>> list(
            @RequestParam(required = false) Boolean enabled) {
        return ResponseEntity.ok(linkConfigService.listConfigs(enabled));
    }

    @PostMapping
    public ResponseEntity<LinkConfigEntity> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(linkConfigService.createConfig(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LinkConfigEntity> update(@PathVariable Long id,
                                                    @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(linkConfigService.updateConfig(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        linkConfigService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/fetch")
    public ResponseEntity<LinkConfigEntity> fetchOne(@PathVariable Long id) {
        return ResponseEntity.ok(linkConfigService.fetchOne(id));
    }

    @PostMapping("/fetch-all")
    public ResponseEntity<Map<String, Object>> fetchAll() {
        return ResponseEntity.ok(linkConfigService.fetchAll());
    }
}
