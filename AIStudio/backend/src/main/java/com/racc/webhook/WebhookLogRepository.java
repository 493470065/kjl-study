package com.racc.webhook;

import com.racc.webhook.entity.WebhookLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WebhookLogRepository extends JpaRepository<WebhookLogEntity, Long> {
    Page<WebhookLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<WebhookLogEntity> findByWebhookConfigIdOrderByCreatedAtDesc(Long webhookConfigId);
}