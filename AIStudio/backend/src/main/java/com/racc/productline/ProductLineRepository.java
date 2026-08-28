package com.racc.productline;

import com.racc.productline.entity.ProductLineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductLineRepository extends JpaRepository<ProductLineEntity, Long> {

    @Query("SELECT p FROM ProductLineEntity p WHERE "
         + "(:search IS NULL OR p.name LIKE %:search% OR p.displayName LIKE %:search%) "
         + "ORDER BY p.updatedAt DESC")
    List<ProductLineEntity> search(@Param("search") String search);
}