package com.racc.scheduledtask;

import com.racc.scheduledtask.entity.TaskLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskLogRepository extends JpaRepository<TaskLogEntity, Long> {
    List<TaskLogEntity> findByTaskKeyOrderByStartTimeDesc(String taskKey);
    List<TaskLogEntity> findAllByOrderByStartTimeDesc();
}