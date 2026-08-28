package com.racc.workflow;

import com.racc.workflow.entity.WorkflowNodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowNodeRepository extends JpaRepository<WorkflowNodeEntity, Long> {
    List<WorkflowNodeEntity> findByExecutionIdOrderByIdAsc(Long executionId);
}