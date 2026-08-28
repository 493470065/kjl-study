package com.racc.webhook;

import com.racc.webhook.entity.WebhookConfigEntity;
import com.racc.webhook.entity.WebhookLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Webhook 管理接口
 *  GET    /api/webhook/configs           → 配置列表
 *  POST   /api/webhook/configs           → 新建
 *  PUT    /api/webhook/configs/{id}      → 编辑
 *  DELETE /api/webhook/configs/{id}      → 删除
 *  POST   /api/webhook/configs/{id}/test → 测试发送
 *  GET    /api/webhook/logs              → 发送日志（分页）
 *  GET    /api/webhook/logs/{configId}   → 按配置查日志
 *  POST   /api/webhook/logs/{logId}/retry → 重试
 */
@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private final WebhookService service;

    public WebhookController(WebhookService service) {
        this.service = service;
    }

    // ========== 配置管理 ==========

    @GetMapping("/configs")
    public ResponseEntity<List<WebhookConfigEntity>> listConfigs() {
        return ResponseEntity.ok(service.listConfigs());
    }

    @PostMapping("/configs")
    public ResponseEntity<WebhookConfigEntity> createConfig(@RequestBody WebhookConfigEntity config) {
        return ResponseEntity.ok(service.createConfig(config));
    }

    @PutMapping("/configs/{id}")
    public ResponseEntity<WebhookConfigEntity> updateConfig(@PathVariable Long id,
                                                            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateConfig(id, body));
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteConfig(@PathVariable Long id) {
        service.deleteConfig(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/configs/{id}/test")
    public ResponseEntity<WebhookLogEntity> testWebhook(@PathVariable Long id) {
        return ResponseEntity.ok(service.testWebhook(id));
    }

    // ========== 日志 ==========

    @GetMapping("/logs")
    public ResponseEntity<Page<WebhookLogEntity>> listLogs(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listLogs(page, size));
    }

    @GetMapping("/logs/{configId}")
    public ResponseEntity<List<WebhookLogEntity>> listLogsByConfig(@PathVariable Long configId) {
        return ResponseEntity.ok(service.listLogsByConfig(configId));
    }

    @PostMapping("/logs/{logId}/retry")
    public ResponseEntity<WebhookLogEntity> retryLog(@PathVariable Long logId) {
        return ResponseEntity.ok(service.retryLog(logId));
    }
}