package com.racc.pipeline.repository;

import com.racc.pipeline.entity.PipelineLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineLogRepository extends JpaRepository<PipelineLogEntity, Long> {

    List<PipelineLogEntity> findByPipelineIdOrderByCreatedAtAsc(Long pipelineId);

    void deleteByPipelineId(Long pipelineId);
}