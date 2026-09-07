package com.racc.scheduledtask;

import com.racc.scheduledtask.entity.ScheduledTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduledTaskRepository extends JpaRepository<ScheduledTaskEntity, Long> {
    /** 同一 taskKey 可对应多条定时任务（同类型多调度），故返回 List */
    List<ScheduledTaskEntity> findByTaskKey(String taskKey);
    List<ScheduledTaskEntity> findByEnabledTrue();
}