package com.racc.agent.repository;

import com.racc.agent.entity.AgentConfigDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgentConfigDetailRepository extends JpaRepository<AgentConfigDetailEntity, Long> {

    Optional<AgentConfigDetailEntity> findByName(String name);

    boolean existsByName(String name);

    void deleteByName(String name);
}