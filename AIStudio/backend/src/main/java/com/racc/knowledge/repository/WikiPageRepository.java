package com.racc.knowledge.repository;

import com.racc.knowledge.entity.WikiPageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Wiki 页面 Repository。
 */
public interface WikiPageRepository extends JpaRepository<WikiPageEntity, Long> {

    List<WikiPageEntity> findBySourceDocumentIdOrderByCreatedAtDesc(Long sourceDocumentId);

    long countBySourceDocumentId(Long sourceDocumentId);
}