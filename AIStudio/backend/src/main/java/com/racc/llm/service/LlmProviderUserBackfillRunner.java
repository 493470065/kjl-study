package com.racc.llm.service;

import com.racc.user.UserRepository;
import com.racc.user.entity.UserEntity;
import com.racc.user.entity.UserLlmConfigEntity;
import com.racc.user.repository.UserLlmConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 启动回填：将存量「个人 LLM 配置 → llm_provider_users 绑定」对齐一次，
 * 使历史上已配置过 Provider 的用户立即出现在「LLM 管理」卡片的"用户"名单中。
 */
@Component
public class LlmProviderUserBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LlmProviderUserBackfillRunner.class);

    private final UserLlmConfigRepository llmConfigRepository;
    private final UserRepository userRepository;
    private final LlmProviderUserSyncService syncService;

    public LlmProviderUserBackfillRunner(UserLlmConfigRepository llmConfigRepository,
                                         UserRepository userRepository,
                                         LlmProviderUserSyncService syncService) {
        this.llmConfigRepository = llmConfigRepository;
        this.userRepository = userRepository;
        this.syncService = syncService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int synced = 0;
        for (UserLlmConfigEntity config : llmConfigRepository.findAll()) {
            if (config.getProviderId() == null) {
                continue;
            }
            Optional<UserEntity> user = userRepository.findById(config.getUserId());
            if (user.isEmpty()) {
                continue;
            }
            UserEntity u = user.get();
            syncService.syncBinding(u.getUsername(), u.getDisplayName(),
                    config.getProviderId(), config.getModelName(),
                    Boolean.TRUE.equals(config.getEnabled()) && Boolean.TRUE.equals(u.getEnabled()));
            synced++;
        }
        log.info("LLM Provider 用户绑定回填完成：共同步 {} 条", synced);
    }
}
