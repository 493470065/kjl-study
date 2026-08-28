package com.racc.config;

import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Neo4j Driver 配置
 * <p>
 * 仅当 spring.neo4j.uri 非空时创建 Driver Bean。
 * URI 为空时图谱功能降级（Service 中 @Autowired(required=false) 处理）。
 */
@Configuration
public class Neo4jConfig {

    private static final Logger log = LoggerFactory.getLogger(Neo4jConfig.class);

    @Bean
    @ConditionalOnExpression("'${spring.neo4j.uri:}' != ''")
    public Driver neo4jDriver(@Value("${spring.neo4j.uri:}") String uri,
                              @Value("${spring.neo4j.authentication.username:neo4j}") String username,
                              @Value("${spring.neo4j.authentication.password:}") String password) {
        log.info("Neo4j URI 已配置，初始化 Driver: {}", uri);
        return GraphDatabase.driver(uri, AuthTokens.basic(username, password));
    }
}