package com.racc.audit;

import com.racc.audit.entity.AuditToolInvocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditToolInvocationRepository extends JpaRepository<AuditToolInvocationEntity, Long> {

    List<AuditToolInvocationEntity> findByUsernameOrderByCreatedAtDesc(String username);

    List<AuditToolInvocationEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AuditToolInvocationEntity a WHERE a.createdAt >= :since")
    Long countTotalSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditToolInvocationEntity a WHERE a.createdAt >= :since AND a.success = false")
    Long countFailedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(AVG(a.latencyMs), 0) FROM AuditToolInvocationEntity a WHERE a.createdAt >= :since AND a.latencyMs IS NOT NULL")
    Double avgLatencySince(@Param("since") LocalDateTime since);
}