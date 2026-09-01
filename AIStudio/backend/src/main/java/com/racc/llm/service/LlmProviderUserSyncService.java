package com.racc.llm.service;

import com.racc.llm.entity.LlmProviderUserEntity;
import com.racc.llm.repository.LlmProviderRepository;
import com.racc.llm.repository.LlmProviderUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户 ↔ Provider 绑定同步服务。
 * 以用户的个人 LLM 配置为准，重建 llm_provider_users 记录，
 * 供「LLM 管理」卡片的"用户"名单展示（每个用户同一时刻只绑定一个 Provider）。
 */
@Service
@Transactional
public class LlmProviderUserSyncService {

    private final LlmProviderUserRepository bindingRepository;
    private final LlmProviderRepository providerRepository;

    public LlmProviderUserSyncService(LlmProviderUserRepository bindingRepository,
                                      LlmProviderRepository providerRepository) {
        this.bindingRepository = bindingRepository;
        this.providerRepository = providerRepository;
    }

    /**
     * 按用户最新个人 LLM 配置重建绑定：providerId 为空则仅清除绑定。
     */
    public void syncBinding(String username, String displayName, Long providerId,
                            String modelName, boolean enabled) {
        bindingRepository.deleteByUsername(username);
        if (providerId == null) {
            return;
        }
        providerRepository.findById(providerId).ifPresent(provider -> {
            LlmProviderUserEntity binding = new LlmProviderUserEntity();
            binding.setProvider(provider);
            binding.setUsername(username);
            binding.setDisplayName(displayName);
            binding.setModelName(modelName);
            binding.setEnabled(enabled);
            bindingRepository.save(binding);
        });
    }

    /**
     * 清除用户绑定（用户删除、改名后迁移、个人配置清空时调用）。
     */
    public void deleteBinding(String username) {
        bindingRepository.deleteByUsername(username);
    }
}
