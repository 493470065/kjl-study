package com.racc.audit;

import com.racc.audit.entity.AuditLlmCallEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLlmCallRepository extends JpaRepository<AuditLlmCallEntity, Long> {

    List<AuditLlmCallEntity> findByUsernameOrderByCreatedAtDesc(String username);

    List<AuditLlmCallEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(a.totalTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end")
    Long sumTotalTokensBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(a.promptTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end")
    Long sumPromptTokensBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(a.completionTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end")
    Long sumCompletionTokensBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end")
    Long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a.username, COALESCE(SUM(a.totalTokens), 0), COALESCE(SUM(a.promptTokens), 0), COALESCE(SUM(a.completionTokens), 0), COUNT(a) " +
           "FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end GROUP BY a.username")
    List<Object[]> sumByUserBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(a.totalTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end " +
           "AND (:username IS NULL OR a.username = :username)")
    Long sumTotalTokensBetweenWithUser(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                       @Param("username") String username);

    @Query("SELECT COALESCE(SUM(a.promptTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end " +
           "AND (:username IS NULL OR a.username = :username)")
    Long sumPromptTokensBetweenWithUser(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                        @Param("username") String username);

    @Query("SELECT COALESCE(SUM(a.completionTokens), 0) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end " +
           "AND (:username IS NULL OR a.username = :username)")
    Long sumCompletionTokensBetweenWithUser(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                            @Param("username") String username);

    @Query("SELECT COUNT(a) FROM AuditLlmCallEntity a WHERE a.createdAt BETWEEN :start AND :end " +
           "AND (:username IS NULL OR a.username = :username)")
    Long countByCreatedAtBetweenWithUser(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                         @Param("username") String username);

    @Query("SELECT FUNCTION('DATE', a.createdAt), COALESCE(SUM(a.totalTokens), 0), COALESCE(SUM(a.promptTokens), 0), COALESCE(SUM(a.completionTokens), 0), COUNT(a) " +
           "FROM AuditLlmCallEntity a WHERE (:username IS NULL OR a.username = :username) " +
           "GROUP BY FUNCTION('DATE', a.createdAt) ORDER BY FUNCTION('DATE', a.createdAt) ASC")
    List<Object[]> tokenStatsByDate(@Param("username") String username);

    @Query("SELECT FUNCTION('strftime', '%Y-%m', a.createdAt), COALESCE(SUM(a.totalTokens), 0), COALESCE(SUM(a.promptTokens), 0), COALESCE(SUM(a.completionTokens), 0), COUNT(a) " +
           "FROM AuditLlmCallEntity a WHERE (:username IS NULL OR a.username = :username) " +
           "GROUP BY FUNCTION('strftime', '%Y-%m', a.createdAt) ORDER BY FUNCTION('strftime', '%Y-%m', a.createdAt) ASC")
    List<Object[]> tokenStatsByMonth(@Param("username") String username);

    @Query("SELECT FUNCTION('strftime', '%Y-%W', a.createdAt), COALESCE(SUM(a.totalTokens), 0), COALESCE(SUM(a.promptTokens), 0), COALESCE(SUM(a.completionTokens), 0), COUNT(a) " +
           "FROM AuditLlmCallEntity a WHERE (:username IS NULL OR a.username = :username) " +
           "GROUP BY FUNCTION('strftime', '%Y-%W', a.createdAt) ORDER BY FUNCTION('strftime', '%Y-%W', a.createdAt) ASC")
    List<Object[]> tokenStatsByWeek(@Param("username") String username);

    // 错误统计
    @Query("SELECT COUNT(a) FROM AuditLlmCallEntity a WHERE a.createdAt >= :since AND a.success = false")
    Long countFailedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLlmCallEntity a WHERE a.createdAt >= :since")
    Long countTotalSince(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(AVG(a.latencyMs), 0) FROM AuditLlmCallEntity a WHERE a.createdAt >= :since AND a.latencyMs IS NOT NULL")
    Double avgLatencySince(@Param("since") LocalDateTime since);
}