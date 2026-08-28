package com.racc.webhook;

import com.racc.webhook.entity.WebhookConfigEntity;
import com.racc.webhook.entity.WebhookLogEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Webhook 服务：配置管理、发送、重试
 */
@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final WebhookConfigRepository configRepository;
    private final WebhookLogRepository logRepository;
    private final RestTemplate restTemplate;

    public WebhookService(WebhookConfigRepository configRepository,
                          WebhookLogRepository logRepository,
                          RestTemplate restTemplate) {
        this.configRepository = configRepository;
        this.logRepository = logRepository;
        this.restTemplate = restTemplate;
    }

    // ========== 配置管理 ==========

    public List<WebhookConfigEntity> listConfigs() {
        return configRepository.findAll();
    }

    @Transactional
    public WebhookConfigEntity createConfig(WebhookConfigEntity config) {
        // 获取当前用户名
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null
                && !"anonymousUser".equals(auth.getPrincipal())) {
            config.setCreatedBy(String.valueOf(auth.getPrincipal()));
        }
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        return configRepository.save(config);
    }

    @Transactional
    public WebhookConfigEntity updateConfig(Long id, Map<String, Object> updates) {
        WebhookConfigEntity config = configRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Webhook 配置不存在: " + id));

        if (updates.containsKey("name")) config.setName((String) updates.get("name"));
        if (updates.containsKey("url")) config.setUrl((String) updates.get("url"));
        if (updates.containsKey("secret")) config.setSecret((String) updates.get("secret"));
        if (updates.containsKey("events")) config.setEvents((String) updates.get("events"));
        if (updates.containsKey("enabled")) config.setEnabled((Boolean) updates.get("enabled"));
        if (updates.containsKey("retryCount")) config.setRetryCount((Integer) updates.get("retryCount"));
        if (updates.containsKey("timeoutMs")) config.setTimeoutMs((Integer) updates.get("timeoutMs"));

        config.setUpdatedAt(LocalDateTime.now());
        return configRepository.save(config);
    }

    @Transactional
    public void deleteConfig(Long id) {
        if (!configRepository.existsById(id)) {
            throw new RuntimeException("Webhook 配置不存在: " + id);
        }
        configRepository.deleteById(id);
    }

    // ========== 测试发送 ==========

    @Transactional
    public WebhookLogEntity testWebhook(Long id) {
        WebhookConfigEntity config = configRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Webhook 配置不存在: " + id));

        Map<String, Object> testPayload = Map.of(
                "event", "test",
                "message", "This is a test webhook from RACC Platform",
                "timestamp", LocalDateTime.now().toString()
        );

        return sendWebhook(config, "test", testPayload);
    }

    // ========== 日志查询 ==========

    public Page<WebhookLogEntity> listLogs(int page, int size) {
        return logRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public List<WebhookLogEntity> listLogsByConfig(Long configId) {
        return logRepository.findByWebhookConfigIdOrderByCreatedAtDesc(configId);
    }

    // ========== 重试 ==========

    @Transactional
    public WebhookLogEntity retryLog(Long logId) {
        WebhookLogEntity logEntry = logRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Webhook 日志不存在: " + logId));

        WebhookConfigEntity config = configRepository.findById(logEntry.getWebhookConfigId())
                .orElseThrow(() -> new RuntimeException("Webhook 配置已不存在"));

        // 解析 payload 重新发送
        Map<String, Object> payload = Map.of(
                "event", logEntry.getEventType(),
                "data", logEntry.getPayload()
        );

        return sendWebhook(config, logEntry.getEventType(), payload);
    }

    // ========== 内部发送逻辑 ==========

    /**
     * 发送 webhook 并记录日志（含重试逻辑）
     */
    @Transactional
    public WebhookLogEntity sendWebhook(WebhookConfigEntity config, String eventType, Object payload) {
        WebhookLogEntity logEntry = new WebhookLogEntity();
        logEntry.setWebhookConfigId(config.getId());
        logEntry.setWebhookName(config.getName());
        logEntry.setEventType(eventType);
        logEntry.setPayload(payload instanceof String ? (String) payload : payload.toString());
        logEntry.setStatus("PENDING");
        logEntry.setCreatedAt(LocalDateTime.now());

        String payloadJson = payload instanceof String ? (String) payload : payload.toString();
        int maxRetry = config.getRetryCount() != null ? config.getRetryCount() : 0;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (config.getSecret() != null && !config.getSecret().isBlank()) {
                String signature = signPayload(payloadJson, config.getSecret());
                headers.set("X-Hub-Signature-256", "sha256=" + signature);
                headers.set("X-RACC-Signature", signature);
            }

            HttpEntity<String> request = new HttpEntity<>(payloadJson, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(config.getUrl(), request, String.class);

            logEntry.setStatus("SUCCESS");
            logEntry.setResponseCode(response.getStatusCode().value());
            logEntry.setResponseBody(response.getBody());
            logEntry.setSentAt(LocalDateTime.now());
            logEntry.setRetryCount(0);
            log.info("Webhook [{}] 发送成功 -> {} ({}), status={}",
                    config.getName(), config.getUrl(), eventType, response.getStatusCode());

        } catch (Exception e) {
            logEntry.setStatus("FAILED");
            logEntry.setErrorMessage(e.getMessage());
            logEntry.setSentAt(LocalDateTime.now());

            // 重试逻辑
            if (maxRetry > 0) {
                for (int i = 0; i < maxRetry; i++) {
                    try {
                        log.info("Webhook [{}] 重试 {}/{}", config.getName(), i + 1, maxRetry);
                        Thread.sleep(1000L * (i + 1)); // 递增间隔

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        HttpEntity<String> request = new HttpEntity<>(payloadJson, headers);

                        ResponseEntity<String> response = restTemplate.postForEntity(
                                config.getUrl(), request, String.class);

                        logEntry.setStatus("SUCCESS");
                        logEntry.setResponseCode(response.getStatusCode().value());
                        logEntry.setResponseBody(response.getBody());
                        logEntry.setRetryCount(i + 1);
                        log.info("Webhook [{}] 重试 {} 成功", config.getName(), i + 1);
                        break;

                    } catch (Exception retryEx) {
                        logEntry.setErrorMessage(retryEx.getMessage());
                        logEntry.setRetryCount(i + 1);
                        log.warn("Webhook [{}] 重试 {}/{} 失败: {}",
                                config.getName(), i + 1, maxRetry, retryEx.getMessage());
                    }
                }
            }
        }

        return logRepository.save(logEntry);
    }

    /** 用 HMAC-SHA256 签名 payload */
    private String signPayload(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 not available", e);
        }
    }
}