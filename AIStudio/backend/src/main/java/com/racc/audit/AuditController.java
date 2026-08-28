package com.racc.audit;

import com.racc.audit.entity.AuditLlmCallEntity;
import com.racc.audit.entity.AuditTaskExecutionEntity;
import com.racc.audit.entity.AuditToolInvocationEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 审计日志查询接口。
 * 数据由其他模块运行时写入，本接口只读查询。
 *
 * 前端 API 路径：/api/audit
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }

    /** GET /api/audit/token-summary?username= — Token 汇总统计 */
    @GetMapping("/token-summary")
    public ResponseEntity<Map<String, Object>> getTokenSummary(
            @RequestParam(required = false) String username) {
        return ResponseEntity.ok(service.getTokenSummary(username));
    }

    /** GET /api/audit/token-stats?period=&username= — Token 趋势数据 */
    @GetMapping("/token-stats")
    public ResponseEntity<List<Map<String, Object>>> getTokenStats(
            @RequestParam(required = false, defaultValue = "day") String period,
            @RequestParam(required = false) String username) {
        return ResponseEntity.ok(service.getTokenStats(period, username));
    }

    /** GET /api/audit/llm-calls?username=&date= — LLM 调用记录 */
    @GetMapping("/llm-calls")
    public ResponseEntity<List<AuditLlmCallEntity>> getLlmCalls(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(service.getLlmCalls(username, date));
    }

    /** GET /api/audit/tools?username=&date= — 工具调用记录 */
    @GetMapping("/tools")
    public ResponseEntity<List<AuditToolInvocationEntity>> getTools(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(service.getTools(username, date));
    }

    /** GET /api/audit/tasks?username=&taskType= — 任务执行记录 */
    @GetMapping("/tasks")
    public ResponseEntity<List<AuditTaskExecutionEntity>> getTasks(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String taskType) {
        return ResponseEntity.ok(service.getTasks(username, taskType));
    }
}