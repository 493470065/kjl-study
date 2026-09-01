package com.racc.llm.repository;

import com.racc.llm.entity.LlmProviderUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LlmProviderUserRepository extends JpaRepository<LlmProviderUserEntity, Long> {

    void deleteByUsername(String username);
}
