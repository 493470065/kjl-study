package com.racc.llm.repository;

import com.racc.llm.entity.LlmProviderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LlmProviderRepository extends JpaRepository<LlmProviderEntity, Long> {
    List<LlmProviderEntity> findByEnabledTrueOrderByDisplayName();
    Optional<LlmProviderEntity> findByIsDefaultTrue();
    Optional<LlmProviderEntity> findByName(String name);
    boolean existsByName(String name);
    List<LlmProviderEntity> findByModelNameAndEnabledTrue(String modelName);
}