package com.racc.userpref.service;

import com.racc.userpref.entity.UserPreferenceEntity;
import com.racc.userpref.repository.UserPreferenceRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * 用户个人偏好配置服务（通用 KV）。
 * 值为前端 JSON 原文，后端不感知业务结构——新增配置类型无需改后端。
 */
@Service
public class UserPreferenceService {

    private static final Pattern KEY_PATTERN = Pattern.compile("[a-zA-Z0-9._-]{1,64}");

    private final UserPreferenceRepository repository;
    /** 自代理：并发冲突重试必须经代理进入新事务/新 Session，同类直调注解不生效。 */
    private final UserPreferenceService self;

    public UserPreferenceService(UserPreferenceRepository repository, @Lazy UserPreferenceService self) {
        this.repository = repository;
        this.self = self;
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

    /**
     * upsert：并发 PUT 同 key 时第二个提交会撞 (user_id, pref_key) 唯一约束。
     * 捕获 DataIntegrityViolationException 后重查改走更新。
     * 关键：重试必须经代理进入 REQUIRES_NEW 事务——否则异常已标记当前 Session 回滚
     * （HHH000099: null id ... don't flush the Session after an exception occurs），
     * 同 Session 内的补偿更新依然失败，前端看到 500。
     */
    public void savePref(Long userId, String key, String jsonValue) {
        validateKey(key);
        try {
            self.doSavePref(userId, key, jsonValue);
        } catch (DataIntegrityViolationException e) {
            self.doSavePref(userId, key, jsonValue);
        }
    }

    /** 经 self 代理调用才生效：REQUIRES_NEW 保证重试在全新 Session 中执行。 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doSavePref(Long userId, String key, String jsonValue) {
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
