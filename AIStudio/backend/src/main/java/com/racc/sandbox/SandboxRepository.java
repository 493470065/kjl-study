package com.racc.sandbox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SandboxRepository extends JpaRepository<SandboxEntity, Long> {

    Optional<SandboxEntity> findByName(String name);

    Optional<SandboxEntity> findByTaskId(String taskId);

    List<SandboxEntity> findByStatus(String status);

    long countByStatus(String status);
}
