package com.racc.monitor;

import com.racc.audit.AuditLlmCallRepository;
import com.racc.audit.AuditToolInvocationRepository;
import com.racc.llm.entity.LlmProviderEntity;
import com.racc.llm.repository.LlmProviderRepository;
import com.racc.monitor.entity.AgentConfigEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 运行时监控服务。
 * 聚合系统指标、Agent 状态、供应商状态、错误统计。
 */
@Service
@Transactional(readOnly = true)
public class MonitorService {

    private final AgentConfigRepository agentConfigRepo;
    private final LlmProviderRepository llmProviderRepo;
    private final AuditLlmCallRepository auditLlmCallRepo;
    private final AuditToolInvocationRepository auditToolInvocationRepo;

    public MonitorService(AgentConfigRepository agentConfigRepo,
                          LlmProviderRepository llmProviderRepo,
                          AuditLlmCallRepository auditLlmCallRepo,
                          AuditToolInvocationRepository auditToolInvocationRepo) {
        this.agentConfigRepo = agentConfigRepo;
        this.llmProviderRepo = llmProviderRepo;
        this.auditLlmCallRepo = auditLlmCallRepo;
        this.auditToolInvocationRepo = auditToolInvocationRepo;
    }

    public Map<String, Object> getDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // 1. Agents
        List<AgentConfigEntity> agents = agentConfigRepo.findAll();
        List<Map<String, Object>> agentList = agents.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", String.valueOf(a.getId()));
            m.put("name", a.getName());
            m.put("status", a.getStatus());
            m.put("currentTaskId", a.getCurrentTaskId());
            m.put("runningTime", a.getRunningTime() != null
                    ? formatDuration(a.getRunningTime()) : null);
            m.put("tokenUsed", a.getTokenUsed());
            m.put("errorCount", a.getErrorCount());
            return m;
        }).collect(Collectors.toList());
        dashboard.put("agents", agentList);

        // 2. Providers
        List<LlmProviderEntity> providers = llmProviderRepo.findAll();
        List<Map<String, Object>> providerList = providers.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("providerType", p.getProviderType());
            m.put("modelName", p.getModelName());
            m.put("baseUrl", p.getBaseUrl());
            m.put("enabled", p.getEnabled());
            m.put("isDefault", p.getIsDefault());
            m.put("reachable", false);
            return m;
        }).collect(Collectors.toList());
        dashboard.put("providers", providerList);

        // 3. System metrics
        dashboard.put("system", collectSystemMetrics());

        // 4. Error stats (last 24h)
        dashboard.put("errors", collectErrorStats());

        // 5. Timestamp
        dashboard.put("timestamp", LocalDateTime.now().toString());

        return dashboard;
    }

    private Map<String, Object> collectSystemMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        // JVM Memory
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        Map<String, Object> jvmMemory = new LinkedHashMap<>();
        jvmMemory.put("max", heapUsage.getMax());
        jvmMemory.put("used", heapUsage.getUsed());
        jvmMemory.put("committed", heapUsage.getCommitted());
        jvmMemory.put("init", heapUsage.getInit());
        metrics.put("jvmMemory", jvmMemory);

        // CPU Usage via OSHI
        try {
            oshi.hardware.CentralProcessor processor = new oshi.SystemInfo()
                    .getHardware().getProcessor();
            double cpuLoad = processor.getSystemCpuLoad(1000) * 100;
            Map<String, Object> cpuUsage = new LinkedHashMap<>();
            cpuUsage.put("percent", Math.round(cpuLoad * 10.0) / 10.0);
            cpuUsage.put("logicalCores", processor.getLogicalProcessorCount());
            cpuUsage.put("physicalCores", processor.getPhysicalProcessorCount());
            metrics.put("cpuUsage", cpuUsage);
        } catch (Exception e) {
            Map<String, Object> cpuUsage = new LinkedHashMap<>();
            cpuUsage.put("percent", 0.0);
            cpuUsage.put("error", "OSHI 不可用: " + e.getMessage());
            metrics.put("cpuUsage", cpuUsage);
        }

        // Uptime
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        metrics.put("uptime", formatDuration(uptimeMs));

        // Status
        metrics.put("status", "UP");

        return metrics;
    }

    private Map<String, Object> collectErrorStats() {
        LocalDateTime since = LocalDateTime.now().minus(24, ChronoUnit.HOURS);

        Long totalLlmCalls = auditLlmCallRepo.countTotalSince(since);
        Long failedLlmCalls = auditLlmCallRepo.countFailedSince(since);
        Double avgLlmLatency = auditLlmCallRepo.avgLatencySince(since);
        Long totalToolCalls = auditToolInvocationRepo.countTotalSince(since);
        Long failedToolCalls = auditToolInvocationRepo.countFailedSince(since);
        Double avgToolLatency = auditToolInvocationRepo.avgLatencySince(since);

        Map<String, Object> errors = new LinkedHashMap<>();
        errors.put("totalLlmCalls", totalLlmCalls != null ? totalLlmCalls : 0L);
        errors.put("failedLlmCalls", failedLlmCalls != null ? failedLlmCalls : 0L);
        errors.put("llmErrorRate", totalLlmCalls != null && totalLlmCalls > 0
                ? Math.round((double) failedLlmCalls / totalLlmCalls * 1000.0) / 10.0 : 0.0);
        errors.put("avgLlmLatency", avgLlmLatency != null ? Math.round(avgLlmLatency) : 0L);
        errors.put("totalToolCalls", totalToolCalls != null ? totalToolCalls : 0L);
        errors.put("failedToolCalls", failedToolCalls != null ? failedToolCalls : 0L);
        errors.put("toolErrorRate", totalToolCalls != null && totalToolCalls > 0
                ? Math.round((double) failedToolCalls / totalToolCalls * 1000.0) / 10.0 : 0.0);
        errors.put("avgToolLatency", avgToolLatency != null ? Math.round(avgToolLatency) : 0L);
        return errors;
    }

    private String formatDuration(long ms) {
        long hours = ms / 3600000;
        long minutes = (ms % 3600000) / 60000;
        long seconds = (ms % 60000) / 1000;
        if (hours > 0) {
            return hours + "h " + minutes + "m " + seconds + "s";
        } else if (minutes > 0) {
            return minutes + "m " + seconds + "s";
        } else {
            return seconds + "s";
        }
    }
}