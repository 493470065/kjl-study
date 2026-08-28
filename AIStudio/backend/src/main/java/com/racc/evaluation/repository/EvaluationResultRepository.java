package com.racc.evaluation.repository;

import com.racc.evaluation.entity.EvaluationResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EvaluationResultRepository extends JpaRepository<EvaluationResultEntity, Long> {

    List<EvaluationResultEntity> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtAfter(LocalDateTime since);
}