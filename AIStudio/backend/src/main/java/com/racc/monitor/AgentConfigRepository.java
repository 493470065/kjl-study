package com.racc.monitor;

import com.racc.monitor.entity.AgentConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgentConfigRepository extends JpaRepository<AgentConfigEntity, Long> {

    Optional<AgentConfigEntity> findByName(String name);
}