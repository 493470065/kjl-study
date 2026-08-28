package com.racc.pipeline.repository;

import com.racc.pipeline.entity.PipelineTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineTaskRepository extends JpaRepository<PipelineTaskEntity, Long> {

    List<PipelineTaskEntity> findAllByOrderByCreatedAtDesc();
}