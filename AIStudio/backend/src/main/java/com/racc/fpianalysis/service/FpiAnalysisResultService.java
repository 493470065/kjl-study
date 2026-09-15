package com.racc.fpianalysis.service;

import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import com.racc.fpianalysis.repository.FpiAnalysisResultRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 合理性设计分析结果缓存服务。
 * 每用户每条线每功能点仅存最近一次分析结果，save 为覆盖式 upsert；
 * 并发 PUT 撞 (user_id, line_key, fp_code) 唯一约束时经 self 代理进入 REQUIRES_NEW 重试
 * （同 UserPreferenceService 手法，避免同 Session 补偿更新失败）。
 */
@Service
public class FpiAnalysisResultService {

    /** 条线白名单（与前端 LINE_KEYS 一致） */
    private static final Set<String> LINE_KEYS = Set.of("inpatient", "outpatient", "emergency");

    private final FpiAnalysisResultRepository repository;
    /** 自代理：并发冲突重试必须经代理进入新事务/新 Session，同类直调注解不生效。 */
    private final FpiAnalysisResultService self;

    public FpiAnalysisResultService(FpiAnalysisResultRepository repository, @Lazy FpiAnalysisResultService self) {
        this.repository = repository;
        this.self = self;
    }

    public static void validateLineKey(String lineKey) {
        if (lineKey == null || !LINE_KEYS.contains(lineKey)) {
            throw new IllegalArgumentException("非法条线: " + lineKey);
        }
    }

    public static void validateFpCode(String fpCode) {
        if (fpCode == null || fpCode.isBlank() || fpCode.length() > 128) {
            throw new IllegalArgumentException("非法功能点编码");
        }
    }

    @Transactional(readOnly = true)
    public FpiAnalysisResultEntity get(Long userId, String lineKey, String fpCode) {
        validateLineKey(lineKey);
        validateFpCode(fpCode);
        return repository.findByUserIdAndLineKeyAndFpCode(userId, lineKey, fpCode).orElse(null);
    }

    /** 覆盖式保存最近一次分析结果；并发冲突重试见类注释。 */
    public void save(Long userId, String lineKey, String fpCode, String fpName, String skillName,
                     String resultMd, String dataFingerprint, String fpSnapshot, Long execDurationMs) {
        validateLineKey(lineKey);
        validateFpCode(fpCode);
        try {
            self.doSave(userId, lineKey, fpCode, fpName, skillName, resultMd, dataFingerprint, fpSnapshot, execDurationMs);
        } catch (DataIntegrityViolationException e) {
            self.doSave(userId, lineKey, fpCode, fpName, skillName, resultMd, dataFingerprint, fpSnapshot, execDurationMs);
        }
    }

    /** 经 self 代理调用才生效：REQUIRES_NEW 保证重试在全新 Session 中执行。 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doSave(Long userId, String lineKey, String fpCode, String fpName, String skillName,
                       String resultMd, String dataFingerprint, String fpSnapshot, Long execDurationMs) {
        FpiAnalysisResultEntity entity = repository.findByUserIdAndLineKeyAndFpCode(userId, lineKey, fpCode)
                .orElseGet(() -> {
                    FpiAnalysisResultEntity e = new FpiAnalysisResultEntity();
                    e.setUserId(userId);
                    e.setLineKey(lineKey);
                    e.setFpCode(fpCode);
                    return e;
                });
        entity.setFpName(fpName);
        entity.setSkillName(skillName);
        entity.setResultMd(resultMd);
        entity.setDataFingerprint(dataFingerprint);
        entity.setFpSnapshot(fpSnapshot);
        entity.setExecDurationMs(execDurationMs);
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
    }

    @Transactional
    public void remove(Long userId, String lineKey, String fpCode) {
        validateLineKey(lineKey);
        validateFpCode(fpCode);
        repository.deleteByUserIdAndLineKeyAndFpCode(userId, lineKey, fpCode);
    }
}
