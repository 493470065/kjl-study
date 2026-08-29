package com.racc.sandbox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SandboxExecutionRepository extends JpaRepository<SandboxExecutionEntity, Long> {

    List<SandboxExecutionEntity> findBySandboxIdOrderBySeqNoDesc(Long sandboxId);

    long countBySandboxId(Long sandboxId);

    List<SandboxExecutionEntity> findBySandboxIdAndStatus(Long sandboxId, String status);

    List<SandboxExecutionEntity> findByStatus(String status);
}
