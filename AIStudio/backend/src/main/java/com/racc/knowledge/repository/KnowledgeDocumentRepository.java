package com.racc.knowledge.repository;

import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 知识库文档 Repository。
 * 分页 / 筛选查询使用 JPA QL；全文检索通过 {@link #searchFtsIds(String, int)} native query 实现
 * （MySQL FULLTEXT + ngram 分词器）。
 */
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocumentEntity, Long> {

    // ==================== 筛选 + 分页 ====================

    @Query("SELECT d FROM KnowledgeDocumentEntity d WHERE "
         + "(:category IS NULL OR d.category = :category) AND "
         + "(:sourceType IS NULL OR d.sourceType = :sourceType) AND "
         + "(:productLine IS NULL OR d.productLine = :productLine) AND "
         + "(:module IS NULL OR d.module = :module) AND "
         + "(:functionPoint IS NULL OR d.functionPoint = :functionPoint) AND "
         + "(:keyword IS NULL OR d.title LIKE %:keyword% OR d.content LIKE %:keyword% "
         + " OR d.module LIKE %:keyword% OR d.functionPoint LIKE %:keyword% OR d.tags LIKE %:keyword%) "
         + "ORDER BY d.updatedAt DESC")
    Page<KnowledgeDocumentEntity> findByFilters(@Param("category") String category,
                                                 @Param("sourceType") String sourceType,
                                                 @Param("productLine") String productLine,
                                                 @Param("module") String module,
                                                 @Param("functionPoint") String functionPoint,
                                                 @Param("keyword") String keyword,
                                                 Pageable pageable);

    // ==================== 全文检索（MySQL FULLTEXT） ====================

    /**
     * 使用 MySQL FULLTEXT 索引（ngram 分词）进行布尔模式检索。
     * matchExpr 为已构造好的 AGAINST 布尔模式表达式（如 "关键词1 关键词2"，词间为 OR 语义）。
     * 返回匹配的知识库文档 id，按相关度排序。
     * 依赖 ft_knowledge_documents 全文索引（KnowledgeDatabaseInitializer 启动时创建）。
     */
    @Query(value = "SELECT id FROM knowledge_documents "
                 + "WHERE MATCH(title, content, module, function_point, tags) AGAINST (?1 IN BOOLEAN MODE) "
                 + "ORDER BY MATCH(title, content, module, function_point, tags) AGAINST (?1 IN BOOLEAN MODE) DESC "
                 + "LIMIT ?2", nativeQuery = true)
    List<Long> searchFtsIds(String matchExpr, int limit);

    // ==================== 统计 & 枚举 ====================

    @Query("SELECT DISTINCT d.category FROM KnowledgeDocumentEntity d WHERE d.category IS NOT NULL AND d.category <> '' "
         + "AND (:sourceType IS NULL OR d.sourceType = :sourceType) ORDER BY d.category")
    List<String> findDistinctCategories(@Param("sourceType") String sourceType);

    @Query("SELECT DISTINCT d.sourceType FROM KnowledgeDocumentEntity d WHERE d.sourceType IS NOT NULL AND d.sourceType <> '' ORDER BY d.sourceType")
    List<String> findDistinctSourceTypes();

    @Query("SELECT DISTINCT d.productLine FROM KnowledgeDocumentEntity d WHERE d.productLine IS NOT NULL AND d.productLine <> '' "
         + "AND (:sourceType IS NULL OR d.sourceType = :sourceType) ORDER BY d.productLine")
    List<String> findDistinctProductLines(@Param("sourceType") String sourceType);

    @Query("SELECT DISTINCT d.module FROM KnowledgeDocumentEntity d WHERE d.module IS NOT NULL AND d.module <> '' "
         + "AND (:sourceType IS NULL OR d.sourceType = :sourceType) ORDER BY d.module")
    List<String> findDistinctModules(@Param("sourceType") String sourceType);

    @Query("SELECT DISTINCT d.functionPoint FROM KnowledgeDocumentEntity d WHERE d.functionPoint IS NOT NULL AND d.functionPoint <> '' "
         + "AND (:sourceType IS NULL OR d.sourceType = :sourceType) ORDER BY d.functionPoint")
    List<String> findDistinctFunctionPoints(@Param("sourceType") String sourceType);

    /** 仅取带嵌入向量的文档（用于语义检索的候选集） */
    @Query("SELECT d FROM KnowledgeDocumentEntity d WHERE d.embedding IS NOT NULL AND d.embedding <> ''")
    List<KnowledgeDocumentEntity> findAllWithEmbedding();
}