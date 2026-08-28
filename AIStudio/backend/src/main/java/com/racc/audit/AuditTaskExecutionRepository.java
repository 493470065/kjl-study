package com.racc.audit;

import com.racc.audit.entity.AuditTaskExecutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditTaskExecutionRepository extends JpaRepository<AuditTaskExecutionEntity, Long> {

    List<AuditTaskExecutionEntity> findByUsernameOrderByCreatedAtDesc(String username);

    List<AuditTaskExecutionEntity> findByTaskTypeOrderByCreatedAtDesc(String taskType);

    List<AuditTaskExecutionEntity> findAllByOrderByCreatedAtDesc();
}