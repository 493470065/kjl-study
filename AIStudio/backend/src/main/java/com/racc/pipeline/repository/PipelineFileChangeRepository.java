package com.racc.pipeline.repository;

import com.racc.pipeline.entity.PipelineFileChangeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineFileChangeRepository extends JpaRepository<PipelineFileChangeEntity, Long> {

    List<PipelineFileChangeEntity> findByPipelineIdOrderByCreatedAt(Long pipelineId);

    void deleteByPipelineId(Long pipelineId);
}