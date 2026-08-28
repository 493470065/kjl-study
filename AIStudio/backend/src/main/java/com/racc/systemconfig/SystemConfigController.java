package com.racc.systemconfig;

import com.racc.systemconfig.entity.SystemConfigEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 系统配置接口。
 * 按分组管理键值对配置，支持运行时动态修改。
 *
 * 前端 API 路径：/api/system/config（此处路径为 /system/config，由 WebConfig 或网关统一前缀）
 */
@RestController
@RequestMapping("/api/system/config")
public class SystemConfigController {

    private final SystemConfigService service;

    public SystemConfigController(SystemConfigService service) {
        this.service = service;
    }

    /** GET /api/system/config?group= — 按分组查询配置列表 */
    @GetMapping
    public ResponseEntity<List<SystemConfigEntity>> listConfigs(
            @RequestParam(required = false) String group) {
        return ResponseEntity.ok(service.listByGroup(group));
    }

    /** GET /api/system/config/map?group= — 按分组查询配置 Map */
    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getConfigMap(
            @RequestParam(required = false) String group) {
        return ResponseEntity.ok(service.getConfigMap(group));
    }

    /** POST /api/system/config — 新增/编辑配置 */
    @PostMapping
    public ResponseEntity<SystemConfigEntity> saveConfig(@RequestBody SystemConfigEntity config) {
        return ResponseEntity.ok(service.save(config));
    }

    /** POST /api/system/config/batch — 批量保存 */
    @PostMapping("/batch")
    public ResponseEntity<List<SystemConfigEntity>> batchSave(@RequestBody List<SystemConfigEntity> configs) {
        return ResponseEntity.ok(service.batchSave(configs));
    }

    /** DELETE /api/system/config/{id} — 删除 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}