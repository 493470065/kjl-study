package com.racc.knowledge.service;

import com.racc.common.dto.PageResult;
import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import com.racc.knowledge.repository.WikiPageRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import jakarta.persistence.TypedQuery;
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
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
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
        category = blankToNull(category);
        sourceType = blankToNull(sourceType);
        productLine = blankToNull(productLine);
        module = blankToNull(module);
        functionPoint = blankToNull(functionPoint);
        keyword = blankToNull(keyword);
        // 条件动态拼接：keyword 为空时**不拼** content LIKE —— 否则优化器会强制回表读
        // content(LONGTEXT) 逐行求值，代码扫描(2.3w 行) count 实测 12.5s。
        Map<String, Object> params = new LinkedHashMap<>();
        StringBuilder cond = new StringBuilder();
        if (category != null) { cond.append(" AND d.category = :category"); params.put("category", category); }
        if (sourceType != null) { cond.append(" AND d.sourceType = :sourceType"); params.put("sourceType", sourceType); }
        if (productLine != null) { cond.append(" AND d.productLine = :productLine"); params.put("productLine", productLine); }
        if (module != null) { cond.append(" AND d.module = :module"); params.put("module", module); }
        if (functionPoint != null) { cond.append(" AND d.functionPoint = :functionPoint"); params.put("functionPoint", functionPoint); }
        if (keyword != null) {
            cond.append(" AND (d.title LIKE :kw OR d.content LIKE :kw OR d.module LIKE :kw"
                      + " OR d.functionPoint LIKE :kw OR d.tags LIKE :kw)");
            params.put("kw", "%" + keyword + "%");
        }
        String where = cond.length() == 0 ? "" : " WHERE " + cond.substring(5);

        TypedQuery<Long> countQuery = entityManager.createQuery(
                "SELECT COUNT(d) FROM KnowledgeDocumentEntity d" + where, Long.class);
        params.forEach(countQuery::setParameter);
        long total = countQuery.getSingleResult();

        // 列表不取 content / embedding（LONGTEXT）：列表页只展示元信息，正文由 /{id} 详情接口按需取
        TypedQuery<Tuple> listQuery = entityManager.createQuery(
                "SELECT d.id AS id, d.title AS title, d.contentPreview AS contentPreview, "
              + "d.category AS category, d.tags AS tags, d.sourceType AS sourceType, "
              + "d.fileName AS fileName, d.productLine AS productLine, d.module AS module, "
              + "d.functionPoint AS functionPoint, d.sourceUrl AS sourceUrl, "
              + "d.extraFields AS extraFields, d.createdAt AS createdAt, d.updatedAt AS updatedAt "
              + "FROM KnowledgeDocumentEntity d" + where + " ORDER BY d.updatedAt DESC", Tuple.class);
        params.forEach(listQuery::setParameter);
        List<Tuple> rows = listQuery.setFirstResult(p * s).setMaxResults(s).getResultList();

        List<Map<String, Object>> content = rows.stream()
                .map(this::toSummaryMap)
                .collect(Collectors.toList());

        int totalPages = (int) Math.ceil((double) total / s);
        return new PageResult<>(content, total, totalPages, p);
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
        invalidateMetadataCaches();
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
            invalidateMetadataCaches();
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
        invalidateMetadataCaches();
        return toDocumentMap(entity);
    }

    // ==================== 删除 ====================

    public void deleteDocument(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("文档不存在: " + id);
        }
        repository.deleteById(id);
        invalidateMetadataCaches();
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

    private final java.util.concurrent.atomic.AtomicBoolean reindexRunning = new java.util.concurrent.atomic.AtomicBoolean(false);

    /**
     * 重新索引 = 为缺失向量的文档异步补算嵌入（本地向量化兜底，无外部依赖）。
     * 立即返回，进度通过 /status 的 vectorizedDocuments 观察。
     * MySQL FULLTEXT 索引由存储引擎自动维护，无需重建。
     */
    public Map<String, Object> reindex() {
        if (!reindexRunning.compareAndSet(false, true)) {
            return Map.of("started", false, "message", "向量化任务进行中，请稍后");
        }
        List<Long> pendingIds = repository.findIdsWithoutEmbedding();
        Thread worker = new Thread(() -> {
            try {
                final int BATCH = 500;
                for (int i = 0; i < pendingIds.size(); i += BATCH) {
                    List<Long> ids = pendingIds.subList(i, Math.min(i + BATCH, pendingIds.size()));
                    List<KnowledgeDocumentEntity> batch = repository.findAllById(ids);
                    for (KnowledgeDocumentEntity e : batch) {
                        String content = e.getContent();
                        if (content == null || content.isBlank()) continue; // 空文档无法向量化，跳过
                        e.setEmbedding(EmbeddingService.toJson(embeddingService.embed(content)));
                    }
                    repository.saveAll(batch);
                }
            } catch (Exception ex) {
                log.warn("向量化补算任务异常：{}", ex.getMessage(), ex);
            } finally {
                // 后台刷新计数缓存，避免状态接口在线全表扫描大文本列
                try { docCountCache = new DocCountCache(repository.count(), repository.countByEmbeddingIsNotNull()); }
                catch (Exception ignore) { }
                reindexRunning.set(false);
            }
        }, "knowledge-vectorize");
        worker.setDaemon(true);
        worker.start();
        return Map.of("started", true, "pending", pendingIds.size());
    }

    // ==================== 状态 ====================

    /** 文档计数缓存（total + 已向量化）：embedding 大文本列全表扫描慢（~10s），由状态首查/重新索引完成后刷新 */
    private static final class DocCountCache {
        final long total;
        final long vectorized;
        DocCountCache(long total, long vectorized) { this.total = total; this.vectorized = vectorized; }
    }
    private volatile DocCountCache docCountCache;

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus() {
        // 向量检索是否启用：远程 EmbeddingModel 或本地向量化兜底任一可用即 true（本地兜底恒可用）
        boolean vectorSearchEnabled = embeddingService.isAvailable();
        DocCountCache cached = docCountCache;
        long totalDocuments;
        long vectorizedDocuments;
        if (cached != null) {
            totalDocuments = cached.total;
            vectorizedDocuments = cached.vectorized;
        } else {
            totalDocuments = repository.count();
            vectorizedDocuments = repository.countByEmbeddingIsNotNull();
            docCountCache = new DocCountCache(totalDocuments, vectorizedDocuments); // 查询后即缓存
        }

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
        status.put("vectorProvider", embeddingService.providerName());
        status.put("vectorizedDocuments", vectorizedDocuments);
        status.put("wikiTotal", wikiTotal);
        status.put("wikiByStatus", wikiByStatus);
        status.put("graphStats", graphStats);
        return status;
    }

    // ==================== 枚举列表 ====================

    /** 枚举下拉缓存（60s TTL）：切 Tab / 反复筛选时避免重复扫表；写操作后主动失效 */
    private static final long ENUM_CACHE_TTL_MS = 60_000L;
    private static final class EnumCacheEntry {
        final long at; final Object value;
        EnumCacheEntry(long at, Object value) { this.at = at; this.value = value; }
    }
    private final Map<String, EnumCacheEntry> enumCache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    private <T> T cachedEnum(String key, Supplier<T> loader) {
        EnumCacheEntry e = enumCache.get(key);
        if (e != null && System.currentTimeMillis() - e.at < ENUM_CACHE_TTL_MS) {
            return (T) e.value;
        }
        T value = loader.get();
        enumCache.put(key, new EnumCacheEntry(System.currentTimeMillis(), value));
        return value;
    }

    /** 文档增删改后调用：清空枚举 / 列描述 / 计数缓存，保证下拉与统计及时反映新数据 */
    public void invalidateMetadataCaches() {
        enumCache.clear();
        columnsCache = null;
        docCountCache = null;
    }

    @Transactional(readOnly = true)
    public List<String> listCategories(String sourceType) {
        return cachedEnum("cat:" + sourceType,
                () -> repository.findDistinctCategories(blankToNull(sourceType)));
    }

    @Transactional(readOnly = true)
    public List<String> listSourceTypes() {
        return cachedEnum("st", repository::findDistinctSourceTypes);
    }

    @Transactional(readOnly = true)
    public List<Map<String, String>> listProductLines(String sourceType) {
        List<String> names = cachedEnum("pl:" + sourceType,
                () -> repository.findDistinctProductLines(blankToNull(sourceType)));
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
        return cachedEnum("mod:" + sourceType,
                () -> repository.findDistinctModules(blankToNull(sourceType)));
    }

    @Transactional(readOnly = true)
    public List<String> listFunctionPoints(String sourceType) {
        return cachedEnum("fp:" + sourceType,
                () -> repository.findDistinctFunctionPoints(blankToNull(sourceType)));
    }

    /** 列扫描结果缓存（10min TTL）：该接口需全表投影扫描（约 4~5s），写操作后由 invalidateMetadataCaches 主动失效 */
    private volatile Map<String, Object> columnsCache;
    private volatile long columnsCacheAt;

    /**
     * 动态列描述：只取 5 个短文本列做全表投影扫描（严禁 findAll()——content/embedding 均为
     * LONGTEXT，全量物化 2 万+ 行大字段会挂起），返回实际存在的字段列与标签集合，
     * 供前端列表"按实际字段/标签自动调整"。
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Map<String, Object> listColumns() {
        Map<String, Object> cached = columnsCache;
        if (cached != null && System.currentTimeMillis() - columnsCacheAt < 600_000L) {
            return cached;
        }
        LinkedHashSet<String> dynamic = new LinkedHashSet<>();
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        boolean hasModule = false, hasFunctionPoint = false, hasSourceUrl = false;

        for (KnowledgeDocumentRepository.ColumnRow row : repository.findColumnRows()) {
            if (row.getModule() != null && !row.getModule().isBlank()) hasModule = true;
            if (row.getFunctionPoint() != null && !row.getFunctionPoint().isBlank()) hasFunctionPoint = true;
            if (row.getSourceUrl() != null && !row.getSourceUrl().isBlank()) hasSourceUrl = true;
            if (row.getTags() != null && !row.getTags().isBlank()) {
                for (String t : row.getTags().split("[,，]")) {
                    String tt = t.trim();
                    if (!tt.isEmpty()) tags.add(tt);
                }
            }
            if (row.getExtraFields() != null && !row.getExtraFields().isBlank()) {
                try {
                    Map<String, Object> extra = OBJECT_MAPPER.readValue(row.getExtraFields(), Map.class);
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
        columnsCache = result;
        columnsCacheAt = System.currentTimeMillis();
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
                appendFtsToken(sb, sub);
            }
        }
        return sb.toString();
    }

    /**
     * 追加单个检索词到布尔表达式。ngram 分词器把整段 CJK 长词（如"会诊申请流程"）按短语匹配，
     * 实测极易 0 召回（随后触发 LIKE 全表扫描，单词可达 ~19s）。故将连续 CJK 段拆成相邻
     * 2-gram（如"会诊 诊申 申请 请流 流程"）做 OR 召回：实测毫秒级且召回更全。
     * 纯 ASCII 段/单字 CJK 保持原样，避免改变标识符类检索语义。
     */
    private void appendFtsToken(StringBuilder sb, String token) {
        if (token == null || token.isEmpty()) return;
        if (token.length() >= 2 && containsCjk(token)) {
            int i = 0;
            while (i < token.length()) {
                boolean cjkSeg = isCjkChar(token.charAt(i));
                int j = i;
                while (j < token.length() && isCjkChar(token.charAt(j)) == cjkSeg) j++;
                String seg = token.substring(i, j);
                if (cjkSeg) {
                    if (seg.length() >= 2) {
                        for (int k = 0; k + 2 <= seg.length(); k++) {
                            appendFtsTerm(sb, seg.substring(k, k + 2));
                        }
                    } else {
                        appendFtsTerm(sb, seg); // 单字 CJK：ngram 无索引，保留原样（与旧行为一致）
                    }
                } else {
                    appendFtsTerm(sb, seg);
                }
                i = j;
            }
        } else {
            appendFtsTerm(sb, token);
        }
    }

    private void appendFtsTerm(StringBuilder sb, String term) {
        if (sb.length() > 0) sb.append(" ");
        sb.append(term);
    }

    private boolean isCjkChar(char c) {
        return (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF)
            || (c >= 0x3040 && c <= 0x30FF) || (c >= 0xAC00 && c <= 0xD7AF);
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
            if (isCjkChar(s.charAt(i))) return true;
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
        flattenExtraFields(map, entity.getExtraFields());
        return map;
    }

    /**
     * 列表专用：与 toDocumentMap 字段一致，但**不含 content**（LONGTEXT）。
     * 列表页 20 行原本要传 0.3~11.7MB，去掉正文后仅数 KB。
     * 详情 / 编辑走 /{id} 接口单独取正文，不受影响。
     */
    private Map<String, Object> toSummaryMap(Tuple row) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", row.get("id"));
        map.put("title", row.get("title"));
        map.put("content", null); // 列表不返回正文，按需由详情接口获取
        map.put("contentPreview", row.get("contentPreview"));
        map.put("category", row.get("category"));
        map.put("tags", row.get("tags"));
        map.put("sourceType", row.get("sourceType"));
        map.put("fileName", row.get("fileName"));
        map.put("productLine", row.get("productLine"));
        map.put("module", row.get("module"));
        map.put("functionPoint", row.get("functionPoint"));
        map.put("sourceUrl", row.get("sourceUrl"));
        map.put("extraFields", row.get("extraFields"));
        Object createdAt = row.get("createdAt");
        Object updatedAt = row.get("updatedAt");
        map.put("createdAt", createdAt != null ? createdAt.toString() : null);
        map.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);
        flattenExtraFields(map, (String) row.get("extraFields"));
        return map;
    }

    /** 摊平 extraFields 动态字段为 field_xxx 顶层键（列表与详情共用） */
    @SuppressWarnings("unchecked")
    private void flattenExtraFields(Map<String, Object> map, String extraFields) {
        if (extraFields == null || extraFields.isBlank()) return;
        try {
            Map<String, Object> extra = OBJECT_MAPPER.readValue(extraFields, Map.class);
            for (Map.Entry<String, Object> e : extra.entrySet()) {
                map.put("field_" + e.getKey(), e.getValue());
            }
        } catch (Exception ignored) {
            // 非法 JSON 忽略
        }
    }
}