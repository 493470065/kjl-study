package com.racc.repository;

import com.racc.repository.entity.CodeRepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CodeRepositoryRepository extends JpaRepository<CodeRepositoryEntity, Long> {

    @Query("SELECT DISTINCT r.businessTags FROM CodeRepositoryEntity r WHERE r.businessTags IS NOT NULL AND r.businessTags <> ''")
    List<String> findAllBusinessTags();

    @Query("SELECT r FROM CodeRepositoryEntity r WHERE "
         + "(:search IS NULL OR r.name LIKE %:search% OR r.displayName LIKE %:search%) "
         + "ORDER BY r.updatedAt DESC")
    List<CodeRepositoryEntity> search(@Param("search") String search);
}