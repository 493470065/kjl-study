package com.racc.journal.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.journal.entity.ProjectJournalEntity;
import com.racc.journal.repository.ProjectJournalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 项目工作台数据快照接口（通用 JSON 文档存储）。
 *
 * GET  /api/journal/{scope}              → { bucket: 已解析的 JSON 载荷, ... }（未写入的 bucket 不返回）
 * GET  /api/journal/{scope}/{bucket}     → 该 bucket 的 JSON 载荷（无数据返回 []）
 * PUT  /api/journal/{scope}/{bucket}     → 整包覆盖写入（请求体即 JSON 数组/对象）
 */
@RestController
@RequestMapping("/api/journal")
public class ProjectJournalController {

    private static final Logger log = LoggerFactory.getLogger(ProjectJournalController.class);

    private final ProjectJournalRepository repository;
    private final ObjectMapper objectMapper;

    public ProjectJournalController(ProjectJournalRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /** scope/bucket 白名单校验：仅允许字母数字与连字符，防止路径滥用 */
    private static String sanitize(String raw) {
        if (raw == null || !raw.matches("[A-Za-z0-9_-]{1,64}")) {
            throw new IllegalArgumentException("非法标识: " + raw);
        }
        return raw;
    }

    @Transactional(readOnly = true)
    @GetMapping("/{scope}")
    public ResponseEntity<Map<String, Object>> loadAll(@PathVariable String scope) {
        String sc = sanitize(scope);
        Map<String, Object> result = new LinkedHashMap<>();
        for (ProjectJournalEntity e : repository.findByScope(sc)) {
            try {
                result.put(e.getBucket(), objectMapper.readTree(e.getPayload()));
            } catch (Exception ex) {
                log.warn("journal 载荷解析失败 scope={} bucket={}：{}", sc, e.getBucket(), ex.getMessage());
            }
        }
        return ResponseEntity.ok(result);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{scope}/{bucket}")
    public ResponseEntity<JsonNode> load(@PathVariable String scope, @PathVariable String bucket) {
        return repository.findByScopeAndBucket(sanitize(scope), sanitize(bucket))
                .map(e -> {
                    try {
                        return ResponseEntity.ok(objectMapper.readTree(e.getPayload()));
                    } catch (Exception ex) {
                        throw new RuntimeException("载荷解析失败: " + ex.getMessage(), ex);
                    }
                })
                .orElseGet(() -> ResponseEntity.ok(objectMapper.createArrayNode()));
    }

    @Transactional
    @PutMapping("/{scope}/{bucket}")
    public ResponseEntity<Map<String, Object>> save(@PathVariable String scope, @PathVariable String bucket,
                                                    @RequestBody JsonNode body) {
        String sc = sanitize(scope);
        String bk = sanitize(bucket);
        ProjectJournalEntity e = repository.findByScopeAndBucket(sc, bk).orElseGet(() -> {
            ProjectJournalEntity n = new ProjectJournalEntity();
            n.setScope(sc);
            n.setBucket(bk);
            return n;
        });
        try {
            e.setPayload(objectMapper.writeValueAsString(body));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "载荷序列化失败: " + ex.getMessage()));
        }
        e.setUpdatedAt(LocalDateTime.now());
        repository.save(e);
        return ResponseEntity.ok(Map.of("saved", true, "bucket", bk, "updatedAt", e.getUpdatedAt().toString()));
    }
}
