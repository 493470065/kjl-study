package com.racc.evaluation.repository;

import com.racc.evaluation.entity.EvaluationDatasetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationDatasetRepository extends JpaRepository<EvaluationDatasetEntity, Long> {
}