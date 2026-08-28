package com.racc.audit;

import com.racc.audit.entity.AuditLlmCallEntity;
import com.racc.audit.entity.AuditTaskExecutionEntity;
import com.racc.audit.entity.AuditToolInvocationEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 审计日志查询服务。
 * 数据由其他模块运行时写入，本服务只读查询。
 */
@Service
@Transactional(readOnly = true)
public class AuditService {

    private final AuditLlmCallRepository llmCallRepo;
    private final AuditToolInvocationRepository toolInvocationRepo;
    private final AuditTaskExecutionRepository taskExecutionRepo;

    public AuditService(AuditLlmCallRepository llmCallRepo,
                        AuditToolInvocationRepository toolInvocationRepo,
                        AuditTaskExecutionRepository taskExecutionRepo) {
        this.llmCallRepo = llmCallRepo;
        this.toolInvocationRepo = toolInvocationRepo;
        this.taskExecutionRepo = taskExecutionRepo;
    }

    // ========== Token Summary ==========

    public Map<String, Object> getTokenSummary(String username) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.atTime(LocalTime.MAX);

        LocalDateTime weekStart = today.with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("today", buildPeriodStats(dayStart, dayEnd, username));
        result.put("thisWeek", buildPeriodStats(weekStart, now, username));
        result.put("thisMonth", buildPeriodStats(monthStart, now, username));

        Long totalCalls = llmCallRepo.countByCreatedAtBetweenWithUser(dayStart, now, username);
        Long totalToolCalls = toolInvocationRepo.countTotalSince(dayStart);

        result.put("totalCalls", totalCalls != null ? totalCalls : 0L);
        result.put("totalToolCalls", totalToolCalls != null ? totalToolCalls : 0L);
        return result;
    }

    private Map<String, Object> buildPeriodStats(LocalDateTime start, LocalDateTime end, String username) {
        Long totalTokens = username != null && !username.isBlank()
                ? llmCallRepo.sumTotalTokensBetweenWithUser(start, end, username)
                : llmCallRepo.sumTotalTokensBetween(start, end);
        Long promptTokens = username != null && !username.isBlank()
                ? llmCallRepo.sumPromptTokensBetweenWithUser(start, end, username)
                : llmCallRepo.sumPromptTokensBetween(start, end);
        Long completionTokens = username != null && !username.isBlank()
                ? llmCallRepo.sumCompletionTokensBetweenWithUser(start, end, username)
                : llmCallRepo.sumCompletionTokensBetween(start, end);
        Long callCount = username != null && !username.isBlank()
                ? llmCallRepo.countByCreatedAtBetweenWithUser(start, end, username)
                : llmCallRepo.countByCreatedAtBetween(start, end);

        // 按用户聚合
        List<Object[]> rows = llmCallRepo.sumByUserBetween(start, end);
        List<Map<String, Object>> byUser = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("username", row[0]);
            u.put("totalTokens", row[1] != null ? row[1] : 0L);
            u.put("promptTokens", row[2] != null ? row[2] : 0L);
            u.put("completionTokens", row[3] != null ? row[3] : 0L);
            u.put("callCount", row[4] != null ? row[4] : 0L);
            byUser.add(u);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTokens", totalTokens != null ? totalTokens : 0L);
        stats.put("promptTokens", promptTokens != null ? promptTokens : 0L);
        stats.put("completionTokens", completionTokens != null ? completionTokens : 0L);
        stats.put("callCount", callCount != null ? callCount : 0L);
        stats.put("byUser", byUser);
        return stats;
    }

    // ========== Token Stats (Trend) ==========

    public List<Map<String, Object>> getTokenStats(String period, String username) {
        String effectiveUser = (username != null && !username.isBlank()) ? username : null;
        List<Object[]> rows;
        switch (period != null ? period : "day") {
            case "week":
                rows = llmCallRepo.tokenStatsByWeek(effectiveUser);
                break;
            case "month":
                rows = llmCallRepo.tokenStatsByMonth(effectiveUser);
                break;
            default:
                rows = llmCallRepo.tokenStatsByDate(effectiveUser);
                break;
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", row[0]);
            point.put("totalTokens", row[1] != null ? row[1] : 0L);
            point.put("promptTokens", row[2] != null ? row[2] : 0L);
            point.put("completionTokens", row[3] != null ? row[3] : 0L);
            point.put("callCount", row[4] != null ? row[4] : 0L);
            result.add(point);
        }
        return result;
    }

    // ========== LLM Calls ==========

    public List<AuditLlmCallEntity> getLlmCalls(String username, String date) {
        if (date != null && !date.isBlank()) {
            LocalDate d = LocalDate.parse(date);
            return llmCallRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(
                    d.atStartOfDay(), d.atTime(LocalTime.MAX));
        }
        if (username != null && !username.isBlank()) {
            return llmCallRepo.findByUsernameOrderByCreatedAtDesc(username);
        }
        return llmCallRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(
                LocalDate.now().atStartOfDay(), LocalDateTime.now());
    }

    // ========== Tool Invocations ==========

    public List<AuditToolInvocationEntity> getTools(String username, String date) {
        if (date != null && !date.isBlank()) {
            LocalDate d = LocalDate.parse(date);
            return toolInvocationRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(
                    d.atStartOfDay(), d.atTime(LocalTime.MAX));
        }
        if (username != null && !username.isBlank()) {
            return toolInvocationRepo.findByUsernameOrderByCreatedAtDesc(username);
        }
        return toolInvocationRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(
                LocalDate.now().atStartOfDay(), LocalDateTime.now());
    }

    // ========== Task Executions ==========

    public List<AuditTaskExecutionEntity> getTasks(String username, String taskType) {
        if (taskType != null && !taskType.isBlank()) {
            return taskExecutionRepo.findByTaskTypeOrderByCreatedAtDesc(taskType);
        }
        if (username != null && !username.isBlank()) {
            return taskExecutionRepo.findByUsernameOrderByCreatedAtDesc(username);
        }
        return taskExecutionRepo.findAllByOrderByCreatedAtDesc();
    }
}