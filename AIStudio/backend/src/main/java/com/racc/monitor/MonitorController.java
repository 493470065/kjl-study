package com.racc.monitor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 运行时监控接口。
 * 聚合展示系统指标、Agent/Provider 状态、错误统计。
 *
 * 前端 API 路径：/api/monitor
 */
@RestController
@RequestMapping("/api/monitor")
public class MonitorController {

    private final MonitorService service;

    public MonitorController(MonitorService service) {
        this.service = service;
    }

    /** GET /api/monitor/dashboard — 运行时监控仪表盘 */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(service.getDashboard());
    }
}