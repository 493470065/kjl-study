package com.racc.knowledge.repository;

import com.racc.knowledge.entity.LinkConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 链接配置 Repository（持久化链接库）。
 */
public interface LinkConfigRepository extends JpaRepository<LinkConfigEntity, Long> {

    @Query("SELECT c FROM LinkConfigEntity c WHERE (:enabled IS NULL OR c.enabled = :enabled) ORDER BY c.updatedAt DESC")
    List<LinkConfigEntity> findByEnabled(@Param("enabled") Boolean enabled);
}
