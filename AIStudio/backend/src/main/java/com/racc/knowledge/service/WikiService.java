package com.racc.knowledge.service;

import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.entity.WikiPageEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import com.racc.knowledge.repository.WikiPageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Wiki 页面管理服务。
 * 支持从知识库文档生成 Wiki 页面（含 LLM 生成与模拟数据兜底）。
 */
@Service
@Transactional
public class WikiService {

    private final WikiPageRepository wikiRepository;
    private final KnowledgeDocumentRepository documentRepository;

    public WikiService(WikiPageRepository wikiRepository,
                       KnowledgeDocumentRepository documentRepository) {
        this.wikiRepository = wikiRepository;
        this.documentRepository = documentRepository;
    }

    // ==================== 列表 ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listByDocument(Long documentId) {
        List<WikiPageEntity> pages = wikiRepository.findBySourceDocumentIdOrderByCreatedAtDesc(documentId);
        return pages.stream().map(this::toWikiMap).toList();
    }

    // ==================== 详情 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getById(Long id) {
        WikiPageEntity entity = wikiRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Wiki 页面不存在: " + id));
        return toWikiMap(entity);
    }

    // ==================== 生成 ====================

    public Map<String, Object> generateForDocument(Long documentId) {
        KnowledgeDocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new NoSuchElementException("文档不存在: " + documentId));

        // 检查是否已有 Wiki 页面，有则返回第一条
        List<WikiPageEntity> existing = wikiRepository.findBySourceDocumentIdOrderByCreatedAtDesc(documentId);
        if (!existing.isEmpty()) {
            return toWikiMap(existing.get(0));
        }

        // 生成模拟数据（LLM 未配置时兜底）
        WikiPageEntity entity = generateMockWiki(doc);
        entity = wikiRepository.save(entity);
        return toWikiMap(entity);
    }

    // ==================== 重新生成 ====================

    public Map<String, Object> regenerate(Long id) {
        WikiPageEntity existing = wikiRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Wiki 页面不存在: " + id));

        KnowledgeDocumentEntity doc = documentRepository.findById(existing.getSourceDocumentId())
                .orElseThrow(() -> new NoSuchElementException("源文档不存在: " + existing.getSourceDocumentId()));

        // 标记为 GENERATING
        existing.setStatus("GENERATING");
        wikiRepository.save(existing);

        // 用模拟数据覆盖（实际场景调用 LLM）
        WikiPageEntity newPage = generateMockWiki(doc);
        existing.setTitle(newPage.getTitle());
        existing.setSummary(newPage.getSummary());
        existing.setKeyConcepts(newPage.getKeyConcepts());
        existing.setSections(newPage.getSections());
        existing.setStatus("GENERATED");
        existing.setUpdatedAt(LocalDateTime.now());

        wikiRepository.save(existing);
        return toWikiMap(existing);
    }

    // ==================== 删除 ====================

    public void delete(Long id) {
        if (!wikiRepository.existsById(id)) {
            throw new NoSuchElementException("Wiki 页面不存在: " + id);
        }
        wikiRepository.deleteById(id);
    }

    // ==================== 内部方法 ====================

    /**
     * 生成模拟 Wiki 数据。
     * 当 LLM 未配置时的兜底方案，从文档内容中提取关键信息生成结构化的 Wiki 页面。
     */
    private WikiPageEntity generateMockWiki(KnowledgeDocumentEntity doc) {
        WikiPageEntity wiki = new WikiPageEntity();

        // 标题沿用文档标题
        wiki.setTitle(doc.getTitle());
        wiki.setSourceDocumentId(doc.getId());

        // 摘要：取 contentPreview 或前 300 字
        String content = doc.getContent() != null ? doc.getContent() : "";
        String summary = doc.getContentPreview() != null ? doc.getContentPreview()
                : (content.length() > 300 ? content.substring(0, 300) + "..." : content);
        wiki.setSummary(summary);

        // 关键概念：从文档内容提取关键词片段
        wiki.setKeyConcepts(extractKeyConcepts(content));

        // 章节：从文档中按段落或标题拆分
        wiki.setSections(generateSections(doc.getTitle(), content));

        wiki.setStatus("GENERATED");
        wiki.setCreatedAt(LocalDateTime.now());
        wiki.setUpdatedAt(LocalDateTime.now());

        return wiki;
    }

    /**
     * 从文档内容中提取关键概念。
     * 简单策略：取前 5 个不重复的句子（含句号/冒号）作为关键概念。
     */
    private String extractKeyConcepts(String content) {
        if (content == null || content.isBlank()) return "暂无关键概念";

        List<String> concepts = new ArrayList<>();
        String[] sentences = content.split("[。；\\n]");
        for (String sentence : sentences) {
            String trimmed = sentence.trim();
            if (trimmed.length() > 10 && trimmed.length() < 100 && concepts.size() < 5) {
                concepts.add(trimmed);
            }
            if (concepts.size() >= 5) break;
        }
        return concepts.isEmpty() ? "暂无关键概念" : String.join("；", concepts);
    }

    /**
     * 生成模拟章节 JSON。
     * 格式：[{heading, content}]
     */
    private String generateSections(String title, String content) {
        List<Map<String, String>> sections = new ArrayList<>();

        // 概述章节
        Map<String, String> overview = new LinkedHashMap<>();
        overview.put("heading", "概述");
        overview.put("content", title + " 是知识库中的一份文档。" +
                (content.length() > 100 ? content.substring(0, 100) + "……" : content));
        sections.add(overview);

        // 详细内容章节
        Map<String, String> details = new LinkedHashMap<>();
        details.put("heading", "详细内容");
        details.put("content", content.length() > 500 ? content.substring(0, 500) + "……" : content);
        sections.add(details);

        // 应用场景章节
        Map<String, String> application = new LinkedHashMap<>();
        application.put("heading", "应用场景");
        application.put("content", "该文档内容可应用于病历书写、知识检索、智能问答等场景。");
        sections.add(application);

        // 转为 JSON 字符串
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < sections.size(); i++) {
            Map<String, String> sec = sections.get(i);
            json.append("{\"heading\":\"")
                .append(escapeJson(sec.get("heading")))
                .append("\",\"content\":\"")
                .append(escapeJson(sec.get("content")))
                .append("\"}");
            if (i < sections.size() - 1) json.append(",");
        }
        json.append("]");
        return json.toString();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private Map<String, Object> toWikiMap(WikiPageEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("title", entity.getTitle());
        map.put("summary", entity.getSummary());
        map.put("keyConcepts", entity.getKeyConcepts());
        map.put("sections", entity.getSections());
        map.put("sourceDocumentId", entity.getSourceDocumentId());
        map.put("status", entity.getStatus());
        map.put("createdAt", entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        map.put("updatedAt", entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
        return map;
    }
}