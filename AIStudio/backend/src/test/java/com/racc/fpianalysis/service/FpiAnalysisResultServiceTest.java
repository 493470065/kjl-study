package com.racc.fpianalysis.service;

import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import com.racc.fpianalysis.repository.FpiAnalysisResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FpiAnalysisResultServiceTest {

    private FpiAnalysisResultRepository repository;
    private FpiAnalysisResultService service;

    @BeforeEach
    void setUp() {
        repository = mock(FpiAnalysisResultRepository.class);
        // @Lazy 自代理：单测中传自身实例（save 内部经 self 调 doSave，同 UserPreferenceServiceTest 手法）
        service = new FpiAnalysisResultService(repository, null);
        // 反射注入 self=service 自身：构造时 self 尚不可用，字段赋值后回填
        org.springframework.test.util.ReflectionTestUtils.setField(service, "self", service);
    }

    // ---------- get ----------

    @Test
    void get_无记录_返回null() {
        when(repository.findByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001")).thenReturn(Optional.empty());
        assertNull(service.get(1L, "inpatient", "BLGL-001"));
    }

    @Test
    void get_有记录_返回实体() {
        FpiAnalysisResultEntity e = new FpiAnalysisResultEntity();
        e.setUserId(1L);
        e.setLineKey("inpatient");
        e.setFpCode("BLGL-001");
        e.setResultMd("# 报告");
        when(repository.findByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001")).thenReturn(Optional.of(e));
        assertSame(e, service.get(1L, "inpatient", "BLGL-001"));
    }

    // ---------- save ----------

    @Test
    void save_无记录_新建() {
        when(repository.findByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001")).thenReturn(Optional.empty());
        service.save(1L, "inpatient", "BLGL-001", "病案首页质控", "rationality-analysis-v1", "# 报告", "n5h123", "{\"total\":5}", 1200L);
        ArgumentCaptor<FpiAnalysisResultEntity> cap = ArgumentCaptor.forClass(FpiAnalysisResultEntity.class);
        verify(repository).save(cap.capture());
        FpiAnalysisResultEntity saved = cap.getValue();
        assertEquals(1L, saved.getUserId());
        assertEquals("inpatient", saved.getLineKey());
        assertEquals("BLGL-001", saved.getFpCode());
        assertEquals("病案首页质控", saved.getFpName());
        assertEquals("rationality-analysis-v1", saved.getSkillName());
        assertEquals("# 报告", saved.getResultMd());
        assertEquals("n5h123", saved.getDataFingerprint());
        assertEquals("{\"total\":5}", saved.getFpSnapshot());
        assertEquals(1200L, saved.getExecDurationMs());
        assertNotNull(saved.getUpdatedAt());
    }

    @Test
    void save_有记录_覆盖更新() {
        FpiAnalysisResultEntity existing = new FpiAnalysisResultEntity();
        existing.setUserId(1L);
        existing.setLineKey("inpatient");
        existing.setFpCode("BLGL-001");
        existing.setResultMd("旧结果");
        existing.setCreatedAt(java.time.LocalDateTime.now().minusDays(1));
        when(repository.findByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001")).thenReturn(Optional.of(existing));
        service.save(1L, "inpatient", "BLGL-001", "病案首页质控", "rationality-analysis-v1", "新结果", "n7h456", "{\"total\":7}", 1500L);
        ArgumentCaptor<FpiAnalysisResultEntity> cap = ArgumentCaptor.forClass(FpiAnalysisResultEntity.class);
        verify(repository).save(cap.capture());
        assertEquals("新结果", cap.getValue().getResultMd());
        assertEquals("n7h456", cap.getValue().getDataFingerprint());
    }

    // ---------- remove ----------

    @Test
    void remove_调用仓库删除() {
        service.remove(1L, "inpatient", "BLGL-001");
        verify(repository).deleteByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001");
    }

    // ---------- 校验 ----------

    @Test
    void save_非法lineKey_抛异常() {
        assertThrows(IllegalArgumentException.class,
                () -> service.save(1L, "other", "BLGL-001", null, null, "md", null, null, null));
    }

    @Test
    void save_超长fpCode_抛异常() {
        String longCode = "x".repeat(129);
        assertThrows(IllegalArgumentException.class,
                () -> service.save(1L, "inpatient", longCode, null, null, "md", null, null, null));
    }

    @Test
    void get_非法lineKey_抛异常() {
        assertThrows(IllegalArgumentException.class, () -> service.get(1L, "other", "BLGL-001"));
    }

    // ---------- 并发 upsert 重试 ----------

    @Test
    void save_撞唯一约束_经代理重试成功() {
        when(repository.findByUserIdAndLineKeyAndFpCode(1L, "inpatient", "BLGL-001")).thenReturn(Optional.empty());
        // self 指向 service 自身：save 第一次调 doSave 真实执行（查空→save→下次再查会撞约束由 mock 抛出），
        // 捕获 DataIntegrityViolationException 后走 catch 分支重试。这里用 spy 包装真实对象验证重试路径。
        FpiAnalysisResultService spyService = org.mockito.Mockito.spy(service);
        org.springframework.test.util.ReflectionTestUtils.setField(spyService, "self", spyService);
        doThrow(new DataIntegrityViolationException("dup"))
                .doNothing()
                .when(spyService).doSave(eq(1L), eq("inpatient"), eq("BLGL-001"), any(), any(), any(), any(), any(), any());
        spyService.save(1L, "inpatient", "BLGL-001", null, null, "md", null, null, null);
        verify(spyService, times(2)).doSave(eq(1L), eq("inpatient"), eq("BLGL-001"), any(), any(), any(), any(), any(), any());
    }
}
