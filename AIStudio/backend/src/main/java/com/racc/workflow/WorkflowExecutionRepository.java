package com.racc.workflow;

import com.racc.workflow.entity.WorkflowExecutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowExecutionRepository extends JpaRepository<WorkflowExecutionEntity, Long> {
    List<WorkflowExecutionEntity> findByWorkflowIdOrderByStartedAtDesc(Long workflowId);
    List<WorkflowExecutionEntity> findAllByOrderByStartedAtDesc();
}