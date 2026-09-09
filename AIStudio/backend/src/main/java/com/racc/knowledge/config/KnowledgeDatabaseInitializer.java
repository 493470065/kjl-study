package com.racc.knowledge.config;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * 知识库全文索引初始化（MySQL 版）。
 * 在 knowledge_documents 表上创建 FULLTEXT 索引（ngram 分词器，对中文友好）。
 *
 * 说明：
 * 1. 原 SQLite 实现使用 FTS5 虚拟表 knowledge_fts，切换 MySQL 后由引擎内置的
 *    FULLTEXT 索引替代——索引随数据增删改自动维护，无需手动同步影子表。
 * 2. ngram 分词器（ngram_token_size=2，见 F:\mysql\my.ini）支持中日韩文本；
 *    短于 2 字的中文查询由 KnowledgeService 的 LIKE 降级兜底。
 * 3. 必须在 JPA ddl-auto 建表之后执行，故实现为 CommandLineRunner。
 */
@Component
public class KnowledgeDatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeDatabaseInitializer.class);
    private static final String INDEX_NAME = "ft_knowledge_documents";

    private final DataSource dataSource;

    public KnowledgeDatabaseInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection();
             Statement st = conn.createStatement()) {
            boolean exists;
            try (ResultSet rs = st.executeQuery(
                    "SELECT COUNT(*) FROM information_schema.statistics "
                  + "WHERE table_schema = DATABASE() AND table_name = 'knowledge_documents' "
                  + "AND index_name = '" + INDEX_NAME + "'")) {
                exists = rs.next() && rs.getInt(1) > 0;
            }
            if (!exists) {
                // ngram 分词器：MySQL 8.0 内置，无需安装插件
                st.execute("ALTER TABLE knowledge_documents ADD FULLTEXT INDEX " + INDEX_NAME
                        + " (title, content, module, function_point, tags) WITH PARSER ngram");
                log.info("知识库 FULLTEXT(ngram) 全文索引创建完成");
            } else {
                log.info("知识库 FULLTEXT 全文索引已存在，跳过创建");
            }

            // 列表分页 / 枚举下拉的覆盖索引。缺了这些索引，2.4w 行带 LONGTEXT 的表会全表扫描
            // （实测列表 36s、count 12.5s），加上后均为亚秒级。
            ensureIndex(st, "idx_kd_source_updated",
                    "ALTER TABLE knowledge_documents ADD INDEX idx_kd_source_updated (source_type, updated_at DESC)");
            ensureIndex(st, "idx_kd_source_category",
                    "ALTER TABLE knowledge_documents ADD INDEX idx_kd_source_category (source_type, category)");
            ensureIndex(st, "idx_kd_source_module",
                    "ALTER TABLE knowledge_documents ADD INDEX idx_kd_source_module (source_type, module)");
            ensureIndex(st, "idx_kd_source_fp",
                    "ALTER TABLE knowledge_documents ADD INDEX idx_kd_source_fp (source_type, function_point)");
            ensureIndex(st, "idx_kd_source_pl",
                    "ALTER TABLE knowledge_documents ADD INDEX idx_kd_source_pl (source_type, product_line)");
        } catch (Exception e) {
            log.warn("知识库索引初始化失败（检索将降级为 LIKE 模糊匹配）：{}", e.getMessage());
        }
    }

    /** 索引不存在则创建（幂等） */
    private void ensureIndex(Statement st, String indexName, String ddl) throws Exception {
        try (ResultSet rs = st.executeQuery(
                "SELECT COUNT(*) FROM information_schema.statistics "
              + "WHERE table_schema = DATABASE() AND table_name = 'knowledge_documents' "
              + "AND index_name = '" + indexName + "'")) {
            if (rs.next() && rs.getInt(1) > 0) return;
        }
        try {
            st.execute(ddl);
            log.info("知识库索引 {} 创建完成", indexName);
        } catch (Exception e) {
            log.warn("知识库索引 {} 创建失败：{}", indexName, e.getMessage());
        }
    }
}
