package com.racc.pipeline.repository;

import com.racc.pipeline.entity.PipelineArtifactEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineArtifactRepository extends JpaRepository<PipelineArtifactEntity, Long> {

    List<PipelineArtifactEntity> findByPipelineIdOrderByCreatedAt(Long pipelineId);

    void deleteByPipelineId(Long pipelineId);
}