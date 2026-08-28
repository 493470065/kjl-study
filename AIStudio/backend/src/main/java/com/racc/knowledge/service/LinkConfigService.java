package com.racc.knowledge.service;

import com.racc.knowledge.entity.LinkConfigEntity;
import com.racc.knowledge.repository.LinkConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 链接配置服务（持久化链接库）。
 * 负责配置的增删改查，并编排单条/批量抓取：抓取成功后更新 lastStatus / lastFetchedAt。
 */
@Service
@Transactional
public class LinkConfigService {

    private static final Logger log = LoggerFactory.getLogger(LinkConfigService.class);

    private final LinkConfigRepository repository;
    private final LinkFetchService linkFetchService;

    public LinkConfigService(LinkConfigRepository repository, LinkFetchService linkFetchService) {
        this.repository = repository;
        this.linkFetchService = linkFetchService;
    }

    // ==================== CRUD ====================

    @Transactional(readOnly = true)
    public List<LinkConfigEntity> listConfigs(Boolean enabled) {
        if (enabled == null) return repository.findAll();
        return repository.findByEnabled(enabled);
    }

    @Transactional(readOnly = true)
    public LinkConfigEntity getConfig(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("链接配置不存在: " + id));
    }

    public LinkConfigEntity createConfig(Map<String, Object> body) {
        LinkConfigEntity cfg = new LinkConfigEntity();
        applyBody(cfg, body);
        cfg.setCreatedAt(LocalDateTime.now());
        cfg.setUpdatedAt(LocalDateTime.now());
        cfg.setLastStatus("never");
        return repository.save(cfg);
    }

    public LinkConfigEntity updateConfig(Long id, Map<String, Object> body) {
        LinkConfigEntity cfg = getConfig(id);
        applyBody(cfg, body);
        cfg.setUpdatedAt(LocalDateTime.now());
        return repository.save(cfg);
    }

    public void deleteConfig(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("链接配置不存在: " + id);
        }
        repository.deleteById(id);
    }

    private void applyBody(LinkConfigEntity cfg, Map<String, Object> body) {
        if (body.get("name") != null) cfg.setName(String.valueOf(body.get("name")));
        if (body.get("url") != null) cfg.setUrl(String.valueOf(body.get("url")));
        if (body.get("fetchMode") != null) cfg.setFetchMode(String.valueOf(body.get("fetchMode")));
        if (body.get("category") != null) cfg.setCategory(String.valueOf(body.get("category")));
        if (body.get("tags") != null) cfg.setTags(String.valueOf(body.get("tags")));
        if (body.get("productLine") != null) cfg.setProductLine(String.valueOf(body.get("productLine")));
        if (body.get("module") != null) cfg.setModule(String.valueOf(body.get("module")));
        if (body.get("functionPoint") != null) cfg.setFunctionPoint(String.valueOf(body.get("functionPoint")));
        if (body.get("enabled") != null) {
            Object v = body.get("enabled");
            cfg.setEnabled(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(String.valueOf(v)));
        }
    }

    // ==================== 抓取编排 ====================

    /**
     * 抓取单条配置，回填状态。
     */
    public LinkConfigEntity fetchOne(Long id) {
        LinkConfigEntity cfg = getConfig(id);
        if (!cfg.isEnabled()) {
            cfg.setLastStatus("skipped");
            cfg.setLastMessage("配置已禁用，跳过抓取");
            return repository.save(cfg);
        }
        try {
            linkFetchService.fetchAndIngest(cfg.getUrl(), cfg.getFetchMode(),
                    cfg.getCategory(), cfg.getTags(),
                    cfg.getProductLine(), cfg.getModule(), cfg.getFunctionPoint());
            cfg.setLastStatus("success");
            cfg.setLastMessage("抓取成功");
            cfg.setLastFetchedAt(LocalDateTime.now());
        } catch (Exception e) {
            cfg.setLastStatus("failed");
            cfg.setLastMessage(e.getMessage());
            log.warn("链接抓取失败 url={} : {}", cfg.getUrl(), e.getMessage());
        }
        return repository.save(cfg);
    }

    /**
     * 批量抓取全部启用配置。
     */
    public Map<String, Object> fetchAll() {
        List<LinkConfigEntity> cfgs = repository.findByEnabled(true);
        int success = 0, failed = 0;
        for (LinkConfigEntity cfg : cfgs) {
            LinkConfigEntity updated = fetchOne(cfg.getId());
            if ("success".equals(updated.getLastStatus())) success++;
            else failed++;
        }
        return Map.of("total", cfgs.size(), "success", success, "failed", failed);
    }
}
