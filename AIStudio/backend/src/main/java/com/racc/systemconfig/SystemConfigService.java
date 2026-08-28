package com.racc.systemconfig;

import com.racc.systemconfig.entity.SystemConfigEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 系统配置服务。
 * 支持按分组查询、增删改、批量保存。
 */
@Service
@Transactional
public class SystemConfigService {

    private final SystemConfigRepository repository;

    public SystemConfigService(SystemConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SystemConfigEntity> listByGroup(String group) {
        if (group == null || group.isBlank()) {
            return repository.findAll();
        }
        return repository.findByConfigGroupOrderByConfigKeyAsc(group);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getConfigMap(String group) {
        List<SystemConfigEntity> configs = listByGroup(group);
        Map<String, String> map = new HashMap<>();
        for (SystemConfigEntity c : configs) {
            map.put(c.getConfigKey(), c.getConfigValue());
        }
        return map;
    }

    public SystemConfigEntity save(SystemConfigEntity config) {
        if (config.getId() != null) {
            Optional<SystemConfigEntity> existing = repository.findById(config.getId());
            if (existing.isPresent()) {
                SystemConfigEntity entity = existing.get();
                entity.setConfigKey(config.getConfigKey());
                entity.setConfigValue(config.getConfigValue());
                entity.setDescription(config.getDescription());
                entity.setConfigGroup(config.getConfigGroup());
                entity.setUpdatedAt(LocalDateTime.now());
                return repository.save(entity);
            }
        }
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        return repository.save(config);
    }

    public List<SystemConfigEntity> batchSave(List<SystemConfigEntity> configs) {
        for (SystemConfigEntity config : configs) {
            save(config);
        }
        return configs;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}