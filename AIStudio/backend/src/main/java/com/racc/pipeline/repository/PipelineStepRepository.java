package com.racc.pipeline.repository;

import com.racc.pipeline.entity.PipelineStepEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineStepRepository extends JpaRepository<PipelineStepEntity, Long> {

    List<PipelineStepEntity> findByPipelineIdOrderBySeqNo(Long pipelineId);

    long countByPipelineId(Long pipelineId);

    void deleteByPipelineId(Long pipelineId);
}