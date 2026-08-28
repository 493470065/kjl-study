package com.racc.mcp;

import com.racc.mcp.entity.McpServerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface McpServerRepository extends JpaRepository<McpServerEntity, Long> {
    Optional<McpServerEntity> findByName(String name);
}