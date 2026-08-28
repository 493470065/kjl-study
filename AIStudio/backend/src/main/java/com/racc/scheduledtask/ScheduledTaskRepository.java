package com.racc.scheduledtask;

import com.racc.scheduledtask.entity.ScheduledTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduledTaskRepository extends JpaRepository<ScheduledTaskEntity, Long> {
    Optional<ScheduledTaskEntity> findByTaskKey(String taskKey);
    List<ScheduledTaskEntity> findByEnabledTrue();
}