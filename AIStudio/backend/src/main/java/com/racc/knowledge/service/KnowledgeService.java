package com.racc.knowledge.service;

import com.racc.common.dto.PageResult;
import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import com.racc.knowledge.repository.WikiPageRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 知识库文档管理服务。
 * 涵盖文档的 CRUD、全文检索（MySQL FULLTEXT + ngram）、GraphRAG（降级兜底）、状态看板、枚举列表等。
 */
@Service
@Transactional
public class KnowledgeService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Logger log = LoggerFactory.getLogger(KnowledgeService.class);

    private final KnowledgeDocumentRepository repository;
    private final WikiPageRepository wikiRepository;
    private final EmbeddingService embeddingService;
    private final DocumentContentExtractor contentExtractor;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${racc.upload.dir:${racc.data-dir}/uploads}")
    private String uploadDir;

    @Value("${racc.data-dir:../data}")
    private String dataDir;

    public KnowledgeService(KnowledgeDocumentRepository repository,
                            WikiPageRepository wikiRepository,
                            EmbeddingService embeddingService,
                            DocumentContentExtractor contentExtractor) {
        this.repository = repository;
        this.wikiRepository = wikiRepository;
        this.embeddingService = embeddingService;
        this.contentExtractor = contentExtractor;
    }

    // ==================== 分页列表 ====================

    @Transactional(readOnly = true)
    public PageResult<Map<String, Object>> listDocuments(String category, String sourceType,
                                                         String productLine, String module,
                                                         String functionPoint, String keyword,
                                                         int page, int size) {
        int p = Math.max(page, 0);
        int s = Math.max(size, 1);
        Page<KnowledgeDocumentEntity> result = repository.findByFilters(
                blankToNull(category), blankToNull(sourceType), blankToNull(productLine),
                blankToNull(module), blankToNull(functionPoint), blankToNull(keyword),
                PageRequest.of(p, s));

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toDocumentMap)
                .collect(Collectors.toList());

        return new PageResult<>(content, result.getTotalElements(), result.getTotalPages(), result.getNumber());
    }

    // ==================== 详情 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getDocument(Long id) {
        KnowledgeDocumentEntity entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("文档不存在: " + id));
        return toDocumentMap(entity);
    }

    // ==================== 上传（JSON body） ====================

    public Map<String, Object> uploadDocument(Map<String, Object> body) {
        KnowledgeDocumentEntity entity = new KnowledgeDocumentEntity();
        entity.setTitle((String) body.getOrDefault("title", "未命名文档"));
        entity.setContent((String) body.get("content"));
        entity.setCategory((String) body.get("category"));
        entity.setTags((String) body.get("tags"));
        entity.setSourceType((String) body.getOrDefault("sourceType", "manual"));
        entity.setFileName((String) body.get("fileName"));
        entity.setProductLine((String) body.get("productLine"));
        entity.setModule((String) body.get("module"));
        entity.setFunctionPoint((String) body.get("functionPoint"));
        entity.setSourceUrl((String) body.get("sourceUrl"));
        entity.setExtraFields(coerceExtraFields(body.get("extraFields")));
        entity.setContentPreview(truncatePreview(entity.getContent()));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        // 计算向量（无 LLM 时返回 null，不影响入库）
        entity.setEmbedding(EmbeddingService.toJson(embeddingService.embed(entity.getContent())));

        entity = repository.save(entity);
        // 同步 FTS 索引
        rebuildFtsFor(entity.getId());
        return toDocumentMap(entity);
    }

    // ==================== 上传（MultipartFile） ====================

    public Map<String, Object> uploadDocumentFile(MultipartFile file, String category,
                                                   String tags, String sourceType, String productLine,
                                                   String module, String functionPoint, String extraFields) {
        try {
            String fileName = file.getOriginalFilename();
            if (fileName == null || fileName.isBlank()) {
                fileName = "unnamed";
            }

            // 读取内容
            byte[] bytes = file.getBytes();
            // Word/PDF 走正文提取；其余按纯文本读取
            String content = contentExtractor.isExtractable(fileName)
                    ? contentExtractor.extract(fileName, bytes)
                    : new String(bytes, StandardCharsets.UTF_8);

            // 保存到磁盘
            Path uploadPath = Paths.get(uploadDir).normalize();
            Files.createDirectories(uploadPath);
            String safeName = System.currentTimeMillis() + "_" + fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path targetPath = uploadPath.resolve(safeName);
            Files.write(targetPath, bytes);

            // 提取标题（取文件名除去扩展名）
            String title = fileName;
            int dot = fileName.lastIndexOf('.');
            if (dot > 0) title = fileName.substring(0, dot);

            KnowledgeDocumentEntity entity = new KnowledgeDocumentEntity();
            entity.setTitle(title);
            entity.setContent(content);
            entity.setContentPreview(truncatePreview(content));
            entity.setCategory(category);
            entity.setTags(tags);
            entity.setSourceType(sourceType != null ? sourceType : "upload");
            entity.setFileName(fileName);
            entity.setProductLine(productLine);
            entity.setModule(module);
            entity.setFunctionPoint(functionPoint);
            entity.setExtraFields(coerceExtraFields(extraFields));
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            entity.setEmbedding(EmbeddingService.toJson(embeddingService.embed(content)));

            entity = repository.save(entity);
            rebuildFtsFor(entity.getId());
            return toDocumentMap(entity);

        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    // ==================== 更新 ====================

    public Map<String, Object> updateDocument(Long id, Map<String, Object> body) {
        KnowledgeDocumentEntity entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("文档不存在: " + id));

        boolean contentChanged = false;
        if (body.containsKey("title")) {
            entity.setTitle((String) body.get("title"));
        }
        if (body.containsKey("content")) {
            entity.setContent((String) body.get("content"));
            entity.setContentPreview(truncatePreview((String) body.get("content")));
            contentChanged = true;
        }
        if (body.containsKey("category")) {
            entity.setCategory((String) body.get("category"));
        }
        if (body.containsKey("tags")) {
            entity.setTags((String) body.get("tags"));
        }
        if (body.containsKey("productLine")) {
            entity.setProductLine((String) body.get("productLine"));
        }
        if (body.containsKey("module")) {
            entity.setModule((String) body.get("module"));
        }
        if (body.containsKey("functionPoint")) {
            entity.setFunctionPoint((String) body.get("functionPoint"));
        }
        if (body.containsKey("sourceUrl")) {
            entity.setSourceUrl((String) body.get("sourceUrl"));
        }
        if (body.containsKey("extraFields")) {
            entity.setExtraFields(coerceExtraFields(body.get("extraFields")));
        }
        entity.setUpdatedAt(LocalDateTime.now());
        // 内容变化则重新向量化
        if (contentChanged) {
            entity.setEmbedding(EmbeddingService.toJson(embeddingService.embed(entity.getContent())));
        }

        entity = repository.save(entity);
        rebuildFtsFor(entity.getId());
        return toDocumentMap(entity);
    }

    // ==================== 删除 ====================

    public void deleteDocument(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("文档不存在: " + id);
        }
        repository.deleteById(id);
    }

    // ==================== 搜索 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> searchDocuments(String query, int topK, String mode,
                                                String category, String sourceType,
                                                String productLine, String module, String functionPoint) {
        int limit = Math.max(1, Math.min(topK, 100));
        String safeQuery = (query == null) ? "" : query.trim();

        boolean semantic = "semantic".equalsIgnoreCase(mode);
        List<Map<String, Object>> results;

        if (semantic && embeddingService.isAvailable()) {
            results = searchBySemantic(safeQuery, limit, category, sourceType, productLine, module, functionPoint);
        } else {
            if (semantic) {
                // 语义模式但无向量能力：降级为关键词检索，并在结果中标记
                Map<String, Object> degraded = new LinkedHashMap<>();
                results = searchByFts(safeQuery, buildFtsQuery(safeQuery), limit, category, sourceType, productLine, module, functionPoint);
                degraded.put("results", results);
                degraded.put("total", results.size());
                degraded.put("degraded", true);
                degraded.put("degradeReason", "未配置嵌入模型，已降级为关键词检索");
                if ("graphrag".equalsIgnoreCase(mode)) {
                    degraded.put("graphContexts", Collections.emptyList());
                    degraded.put("mergedContext", null);
                }
                return degraded;
            }
            results = searchByFts(safeQuery, buildFtsQuery(safeQuery), limit, category, sourceType, productLine, module, functionPoint);
        }

        if ("graphrag".equalsIgnoreCase(mode)) {
            Map<String, Object> graphResult = new LinkedHashMap<>();
            graphResult.put("results", results);
            graphResult.put("total", results.size());
            graphResult.put("graphContexts", Collections.emptyList());
            graphResult.put("mergedContext", null);
            if (semantic) graphResult.put("semantic", true);
            return graphResult;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("results", results);
        result.put("total", results.size());
        if (semantic) result.put("semantic", true);
        return result;
    }

    // ==================== 重新索引 ====================

    public Map<String, Object> reindex() {
        entityManager.flush();
        // MySQL FULLTEXT 索引由存储引擎随数据变更自动维护，无需像 SQLite FTS5 那样手工重建影子表。
        // 此处返回全量文档数，保持接口语义（前端"重建索引"按钮）。
        long processed = repository.count();
        return Map.of("processed", processed);
    }

    // ==================== 状态 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus() {
        long totalDocuments = repository.count();
        // 向量检索是否启用：取决于是否注入了可用的 EmbeddingModel（配置了 embedding 端点即 true）
        boolean vectorSearchEnabled = embeddingService.isAvailable();

        // Wiki 统计
        long wikiTotal = wikiRepository.count();
        List<Object[]> wikiStatusRows = entityManager.createQuery(
                "SELECT w.status, COUNT(w) FROM WikiPageEntity w GROUP BY w.status", Object[].class)
                .getResultList();
        Map<String, Object> wikiByStatus = new LinkedHashMap<>();
        for (Object[] row : wikiStatusRows) {
            wikiByStatus.put((String) row[0], row[1]);
        }

        Map<String, Object> graphStats = new LinkedHashMap<>();
        graphStats.put("nodes", 0);
        graphStats.put("edges", 0);
        graphStats.put("enabled", false);

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("totalDocuments", totalDocuments);
        status.put("vectorSearchEnabled", vectorSearchEnabled);
        status.put("wikiTotal", wikiTotal);
        status.put("wikiByStatus", wikiByStatus);
        status.put("graphStats", graphStats);
        return status;
    }

    // ==================== 枚举列表 ====================

    @Transactional(readOnly = true)
    public List<String> listCategories(String sourceType) {
        return repository.findDistinctCategories(blankToNull(sourceType));
    }

    @Transactional(readOnly = true)
    public List<String> listSourceTypes() {
        return repository.findDistinctSourceTypes();
    }

    @Transactional(readOnly = true)
    public List<Map<String, String>> listProductLines(String sourceType) {
        List<String> names = repository.findDistinctProductLines(blankToNull(sourceType));
        return names.stream().map(name -> {
            Map<String, String> item = new LinkedHashMap<>();
            item.put("name", name);
            // displayName 与 name 相同（无额外映射表）
            item.put("displayName", name);
            return item;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> listModules(String sourceType) {
        return repository.findDistinctModules(blankToNull(sourceType));
    }

    @Transactional(readOnly = true)
    public List<String> listFunctionPoints(String sourceType) {
        return repository.findDistinctFunctionPoints(blankToNull(sourceType));
    }

    /**
     * 动态列描述：扫描全量文档，返回实际存在的字段列与标签集合，供前端列表"按实际字段/标签自动调整"。
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Map<String, Object> listColumns() {
        List<KnowledgeDocumentEntity> all = repository.findAll();
        LinkedHashSet<String> dynamic = new LinkedHashSet<>();
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        boolean hasModule = false, hasFunctionPoint = false, hasSourceUrl = false;

        for (KnowledgeDocumentEntity e : all) {
            if (e.getModule() != null && !e.getModule().isBlank()) hasModule = true;
            if (e.getFunctionPoint() != null && !e.getFunctionPoint().isBlank()) hasFunctionPoint = true;
            if (e.getSourceUrl() != null && !e.getSourceUrl().isBlank()) hasSourceUrl = true;
            if (e.getTags() != null && !e.getTags().isBlank()) {
                for (String t : e.getTags().split("[,，]")) {
                    String tt = t.trim();
                    if (!tt.isEmpty()) tags.add(tt);
                }
            }
            if (e.getExtraFields() != null && !e.getExtraFields().isBlank()) {
                try {
                    Map<String, Object> extra = OBJECT_MAPPER.readValue(e.getExtraFields(), Map.class);
                    for (String k : extra.keySet()) {
                        if (k != null && !k.isBlank()) dynamic.add("field_" + k.trim());
                    }
                } catch (Exception ignored) { }
            }
        }

        List<String> columns = new ArrayList<>();
        if (hasModule) columns.add("module");
        if (hasFunctionPoint) columns.add("functionPoint");
        if (hasSourceUrl) columns.add("sourceUrl");
        columns.addAll(dynamic);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("columns", columns);
        result.put("tags", new ArrayList<>(tags));
        result.put("hasModule", hasModule);
        result.put("hasFunctionPoint", hasFunctionPoint);
        result.put("hasSourceUrl", hasSourceUrl);
        return result;
    }

    // ==================== 内部方法 ====================

    /**
     * 构造 MySQL FULLTEXT 布尔模式（IN BOOLEAN MODE）查询表达式。
     * 多个词以空格分隔——布尔模式下不带操作符的词为"可选"，整体呈 OR 语义并按相关度排序，
     * 与原 SQLite FTS5 的 OR 召回行为一致。
     * ngram 分词器不支持前缀通配符，故不做 "*" 前缀匹配；中文短词召回由 LIKE 降级兜底。
     * 注意：ngram 将 -/_/. 等标点视为词边界，标识符类词（如 MZBL-10-ZLXXY-004）必须先按这些
     * 分隔符拆成独立子词再做 OR 召回——直接拼接成单个长词会产生跨越边界的 n-gram（如 L1/0Z），
     * 导致布尔模式按短语匹配时 0 召回。
     */
    private String buildFtsQuery(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String[] terms = raw.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String term : terms) {
            // 去除布尔模式特殊操作符，防止语法错误/注入（- 为 NOT 操作符，从类中移除后改作分隔符拆分）
            String t = term.replaceAll("[+><()~*\":@^$]+", "").trim();
            if (t.isEmpty()) continue;
            for (String sub : t.split("[-_/\\\\.]+")) {
                if (sub.isEmpty()) continue;
                if (sb.length() > 0) sb.append(" ");
                sb.append(sub);
            }
        }
        return sb.toString();
    }

    /**
     * 上下文维度过滤（在内存中对候选文档集合做维度裁剪）。
     */
    private boolean matchContext(KnowledgeDocumentEntity e, String category, String sourceType,
                                 String productLine, String module, String functionPoint) {
        if (category != null && !category.isBlank() && !category.equals(e.getCategory())) return false;
        if (sourceType != null && !sourceType.isBlank() && !sourceType.equals(e.getSourceType())) return false;
        if (productLine != null && !productLine.isBlank() && !productLine.equals(e.getProductLine())) return false;
        if (module != null && !module.isBlank() && !module.equals(e.getModule())) return false;
        if (functionPoint != null && !functionPoint.isBlank() && !functionPoint.equals(e.getFunctionPoint())) return false;
        return true;
    }

    /**
     * 判断字符串是否包含 CJK（中日韩）字符。ngram 分词对超短中文词（单字）召回有限，
     * 含 CJK 的查询更易在全文索引下漏召回，需要退化为 LIKE 模糊匹配以保证召回率。
     */
    private boolean containsCjk(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF)
                || (c >= 0x3040 && c <= 0x30FF) || (c >= 0xAC00 && c <= 0xD7AF)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 关键词检索（MySQL FULLTEXT 布尔模式）+ 上下文维度过滤。
     * 当查询含 CJK 且全文索引未召回任何结果时，退化为 LIKE 模糊匹配（超短中文词 ngram 召回有限）。
     * 标识符类查询（如文档编号 MZBL-10-ZLXXY-004）优先 LIKE 字面匹配，保证精确召回且结果置顶。
     */
    private List<Map<String, Object>> searchByFts(String rawQuery, String matchExpr, int limit,
                                                  String category, String sourceType,
                                                  String productLine, String module, String functionPoint) {
        // 标识符类查询：ngram 布尔模式难以精确召回含分隔符的整体标识符，先走 LIKE 字面匹配
        if (isIdentifierLike(rawQuery)) {
            List<Map<String, Object>> exact = new ArrayList<>();
            for (KnowledgeDocumentEntity entity : likeEntities(rawQuery, limit * 5)) {
                if (matchContext(entity, category, sourceType, productLine, module, functionPoint)) {
                    exact.add(toSearchResult(entity, 1.0));
                    if (exact.size() >= limit) break;
                }
            }
            if (!exact.isEmpty()) return exact;
        }
        if (matchExpr == null || matchExpr.isBlank()) {
            return Collections.emptyList();
        }
        List<Long> ids;
        try {
            ids = repository.searchFtsIds(matchExpr, limit * 5); // 多取一些用于上下文过滤
        } catch (Exception e) {
            return searchByLike(rawQuery, limit);
        }
        if (ids.isEmpty() && containsCjk(rawQuery)) {
            // 中文查询 FTS5 未召回，退化为 LIKE 保证召回
            return searchByLike(rawQuery, limit);
        }
        if (ids.isEmpty()) return Collections.emptyList();

        List<KnowledgeDocumentEntity> entities = repository.findAllById(ids);
        Map<Long, KnowledgeDocumentEntity> entityMap = new LinkedHashMap<>();
        for (KnowledgeDocumentEntity en : entities) entityMap.put(en.getId(), en);

        List<Map<String, Object>> results = new ArrayList<>();
        for (Long id : ids) {
            KnowledgeDocumentEntity entity = entityMap.get(id);
            if (entity != null && matchContext(entity, category, sourceType, productLine, module, functionPoint)) {
                results.add(toSearchResult(entity, 1.0));
                if (results.size() >= limit) break;
            }
        }
        return results;
    }

    /**
     * 语义检索：对查询文本向量化，与已入库文档向量做余弦相似度排序，再叠加上下文过滤。
     */
    private List<Map<String, Object>> searchBySemantic(String query, int limit,
                                                       String category, String sourceType,
                                                       String productLine, String module, String functionPoint) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        float[] qVec = embeddingService.embed(query);
        if (qVec == null) return Collections.emptyList();

        List<KnowledgeDocumentEntity> candidates = repository.findAllWithEmbedding();
        List<Map<String, Object>> results = new ArrayList<>();
        for (KnowledgeDocumentEntity entity : candidates) {
            if (!matchContext(entity, category, sourceType, productLine, module, functionPoint)) continue;
            float[] dVec = EmbeddingService.fromJson(entity.getEmbedding());
            float sim = EmbeddingService.cosineSimilarity(qVec, dVec);
            if (sim <= 0) continue;
            results.add(toSearchResult(entity, sim));
        }
        results.sort((a, b) -> Double.compare(((Number) b.get("score")).doubleValue(),
                                               ((Number) a.get("score")).doubleValue()));
        return results.subList(0, Math.min(limit, results.size()));
    }

    private Map<String, Object> toSearchResult(KnowledgeDocumentEntity entity, double score) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("content", entity.getContentPreview() != null ? entity.getContentPreview() : "");
        item.put("title", entity.getTitle());
        item.put("category", entity.getCategory());
        item.put("score", score);
        item.put("documentId", entity.getId());
        item.put("sourceType", entity.getSourceType());
        item.put("productLine", entity.getProductLine());
        item.put("module", entity.getModule());
        item.put("functionPoint", entity.getFunctionPoint());
        return item;
    }

    /**
     * 判断查询是否为标识符类（含 - 或 _ 分隔符且不含 CJK），
     * 如文档编号 MZBL-10-ZLXXY-004——此类查询优先 LIKE 字面匹配以保证精确召回。
     */
    private boolean isIdentifierLike(String s) {
        if (s == null || containsCjk(s)) return false;
        return s.contains("-") || s.contains("_");
    }

    /**
     * LIKE 模糊匹配，返回实体列表（供 CJK 降级与标识符精确召回共用）。
     * 排序：标题命中的文档优先（编号类检索的目标文档通常在标题中），其次按更新时间倒序。
     */
    private List<KnowledgeDocumentEntity> likeEntities(String query, int limit) {
        String pattern = "%" + query.replace("%", "\\%").replace("_", "\\_") + "%";
        return entityManager.createQuery(
                "SELECT d FROM KnowledgeDocumentEntity d WHERE d.title LIKE :q OR d.content LIKE :q "
              + "OR d.module LIKE :q OR d.functionPoint LIKE :q OR d.tags LIKE :q "
              + "ORDER BY CASE WHEN d.title LIKE :q THEN 0 ELSE 1 END, d.updatedAt DESC",
                KnowledgeDocumentEntity.class)
                .setParameter("q", pattern)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * FTS5 不可用时的降级方案：LIKE 模糊匹配 + 上下文过滤。
     */
    private List<Map<String, Object>> searchByLike(String query, int limit) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (KnowledgeDocumentEntity entity : likeEntities(query, limit)) {
            results.add(toSearchResult(entity, 0.5));
        }
        return results;
    }

    private String truncatePreview(String content) {
        if (content == null) return null;
        return content.length() > 200 ? content.substring(0, 200) + "..." : content;
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /**
     * 将 extraFields 入参规范化为合法 JSON 字符串。
     * 支持：已为 JSON 字符串（校验后原样返回）、Map 对象（序列化）、CSV 字符串（k=v,k2=v2 形式）。
     * 非法或空时返回 null。
     */
    private String coerceExtraFields(Object raw) {
        if (raw == null) return null;
        try {
            if (raw instanceof Map) {
                return OBJECT_MAPPER.writeValueAsString(raw);
            }
            String s = raw.toString().trim();
            if (s.isEmpty()) return null;
            if (s.startsWith("{")) {
                // 校验 JSON 合法性
                OBJECT_MAPPER.readValue(s, Map.class);
                return s;
            }
            // CSV 形式：key=value,key2=value2
            Map<String, Object> map = new LinkedHashMap<>();
            for (String kv : s.split("[,，]")) {
                String[] parts = kv.split("=", 2);
                if (parts.length == 2 && !parts[0].trim().isEmpty()) {
                    map.put(parts[0].trim(), parts[1].trim());
                }
            }
            return map.isEmpty() ? null : OBJECT_MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 文档变更后同步全文索引。
     * MySQL FULLTEXT 索引随 DML 自动维护，此处为空实现（保留方法以维持调用点与日志语义）。
     */
    private void rebuildFtsFor(Long id) {
        // no-op：MySQL FULLTEXT 索引自动维护
    }

    /**
     * 将实体转为前端 Map。
     * 除标准字段外，额外摊平 extraFields（JSON）中的 key 作为动态字段，供列表列自动调整。
     */
    public Map<String, Object> toDocumentMap(KnowledgeDocumentEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("title", entity.getTitle());
        map.put("content", entity.getContent());
        map.put("contentPreview", entity.getContentPreview());
        map.put("category", entity.getCategory());
        map.put("tags", entity.getTags());
        map.put("sourceType", entity.getSourceType());
        map.put("fileName", entity.getFileName());
        map.put("productLine", entity.getProductLine());
        map.put("module", entity.getModule());
        map.put("functionPoint", entity.getFunctionPoint());
        map.put("sourceUrl", entity.getSourceUrl());
        map.put("extraFields", entity.getExtraFields());
        map.put("createdAt", entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        map.put("updatedAt", entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
        // 摊平动态字段，便于前端按字段自动生成列
        if (entity.getExtraFields() != null && !entity.getExtraFields().isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> extra = OBJECT_MAPPER.readValue(entity.getExtraFields(), Map.class);
                for (Map.Entry<String, Object> e : extra.entrySet()) {
                    map.put("field_" + e.getKey(), e.getValue());
                }
            } catch (Exception ignored) {
                // 非法 JSON 忽略
            }
        }
        return map;
    }
}