package com.racc.webhook;

import com.racc.webhook.entity.WebhookConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookConfigRepository extends JpaRepository<WebhookConfigEntity, Long> {
}