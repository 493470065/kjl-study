package com.racc.systemconfig;

import com.racc.systemconfig.entity.SystemConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SystemConfigRepository extends JpaRepository<SystemConfigEntity, Long> {
    List<SystemConfigEntity> findByConfigGroup(String configGroup);
    List<SystemConfigEntity> findByConfigGroupOrderByConfigKeyAsc(String configGroup);
}