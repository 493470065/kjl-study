package com.racc.userpref.service;

import com.racc.userpref.entity.UserPreferenceEntity;
import com.racc.userpref.repository.UserPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * 用户个人偏好配置服务（通用 KV）。
 * 值为前端 JSON 原文，后端不感知业务结构——新增配置类型无需改后端。
 */
@Service
@Transactional
public class UserPreferenceService {

    private static final Pattern KEY_PATTERN = Pattern.compile("[a-zA-Z0-9._-]{1,64}");

    private final UserPreferenceRepository repository;

    public UserPreferenceService(UserPreferenceRepository repository) {
        this.repository = repository;
    }

    /** key 白名单：仅字母数字点下划线连字符，≤64 位。非法抛 IllegalArgumentException。 */
    public static void validateKey(String key) {
        if (key == null || !KEY_PATTERN.matcher(key).matches()) {
            throw new IllegalArgumentException("非法配置 key: " + key);
        }
    }

    @Transactional(readOnly = true)
    public String getPref(Long userId, String key) {
        validateKey(key);
        return repository.findByUserIdAndPrefKey(userId, key)
                .map(UserPreferenceEntity::getPrefValue)
                .orElse(null);
    }

    public void savePref(Long userId, String key, String jsonValue) {
        validateKey(key);
        UserPreferenceEntity entity = repository.findByUserIdAndPrefKey(userId, key)
                .orElseGet(() -> {
                    UserPreferenceEntity e = new UserPreferenceEntity();
                    e.setUserId(userId);
                    e.setPrefKey(key);
                    return e;
                });
        entity.setPrefValue(jsonValue);
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
    }
}
