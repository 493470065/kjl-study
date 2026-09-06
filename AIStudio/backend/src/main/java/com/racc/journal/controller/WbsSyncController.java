package com.racc.journal.controller;

import com.racc.journal.service.WbsSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 多语专项 WBS 同步接口。
 *
 * POST /api/i18n/wbs-sync
 * → 调用本机 kdocs-cli 拉取「多语专项各条线任务跟踪表」主表，
 *   解析为一/二级里程碑列表 { milestones: [...] }，前端覆盖本地 wbs-* 数据。
 */
@RestController
@RequestMapping("/api/i18n")
public class WbsSyncController {

    private final WbsSyncService service;

    public WbsSyncController(WbsSyncService service) {
        this.service = service;
    }

    @PostMapping("/wbs-sync")
    public ResponseEntity<?> sync() {
        try {
            List<Map<String, Object>> milestones = service.syncMilestones();
            return ResponseEntity.ok(Map.of("milestones", milestones));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
