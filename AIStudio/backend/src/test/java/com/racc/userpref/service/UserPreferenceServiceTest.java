package com.racc.userpref.service;

import com.racc.userpref.entity.UserPreferenceEntity;
import com.racc.userpref.repository.UserPreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserPreferenceServiceTest {

    private UserPreferenceRepository repository;
    private UserPreferenceService service;

    @BeforeEach
    void setUp() {
        repository = mock(UserPreferenceRepository.class);
        service = new UserPreferenceService(repository);
    }

    // ---------- getPref ----------

    @Test
    void getPref_无记录_返回null() {
        when(repository.findByUserIdAndPrefKey(1L, "reqboard.config.v1")).thenReturn(Optional.empty());
        assertNull(service.getPref(1L, "reqboard.config.v1"));
    }

    @Test
    void getPref_有记录_返回JSON原文() {
        UserPreferenceEntity e = new UserPreferenceEntity();
        e.setUserId(1L);
        e.setPrefKey("reqboard.config.v1");
        e.setPrefValue("{\"queryIds\":{}}");
        when(repository.findByUserIdAndPrefKey(1L, "reqboard.config.v1")).thenReturn(Optional.of(e));
        assertEquals("{\"queryIds\":{}}", service.getPref(1L, "reqboard.config.v1"));
    }

    // ---------- savePref ----------

    @Test
    void savePref_无记录_新建() {
        when(repository.findByUserIdAndPrefKey(1L, "kv_column_visibility")).thenReturn(Optional.empty());
        service.savePref(1L, "kv_column_visibility", "{\"title\":true}");
        ArgumentCaptor<UserPreferenceEntity> captor = ArgumentCaptor.forClass(UserPreferenceEntity.class);
        verify(repository).save(captor.capture());
        assertEquals(1L, captor.getValue().getUserId());
        assertEquals("kv_column_visibility", captor.getValue().getPrefKey());
        assertEquals("{\"title\":true}", captor.getValue().getPrefValue());
    }

    @Test
    void savePref_有记录_覆盖且不新建行() {
        UserPreferenceEntity existing = new UserPreferenceEntity();
        existing.setUserId(1L);
        existing.setPrefKey("kv_column_visibility");
        existing.setPrefValue("{\"title\":true}");
        when(repository.findByUserIdAndPrefKey(1L, "kv_column_visibility")).thenReturn(Optional.of(existing));
        service.savePref(1L, "kv_column_visibility", "{\"title\":false}");
        ArgumentCaptor<UserPreferenceEntity> captor = ArgumentCaptor.forClass(UserPreferenceEntity.class);
        verify(repository).save(captor.capture());
        assertSame(existing, captor.getValue()); // upsert：复用原行
        assertEquals("{\"title\":false}", captor.getValue().getPrefValue());
    }

    // ---------- key 白名单 ----------

    @Test
    void validateKey_合法key通过() {
        assertDoesNotThrow(() -> UserPreferenceService.validateKey("reqboard.config.v1"));
        assertDoesNotThrow(() -> UserPreferenceService.validateKey("kv_column_visibility"));
        assertDoesNotThrow(() -> UserPreferenceService.validateKey("skills.collapsed.v1"));
    }

    @Test
    void validateKey_非法字符_抛出IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> UserPreferenceService.validateKey("a/b"));
        assertThrows(IllegalArgumentException.class, () -> UserPreferenceService.validateKey("a b"));
        assertThrows(IllegalArgumentException.class, () -> UserPreferenceService.validateKey(""));
        assertThrows(IllegalArgumentException.class, () -> UserPreferenceService.validateKey("k".repeat(65)));
    }

    // ---------- 保存时 key 校验生效 ----------

    @Test
    void savePref_非法key_抛出异常且不落库() {
        assertThrows(IllegalArgumentException.class,
                () -> service.savePref(1L, "bad/key", "{}"));
        verify(repository, never()).save(any());
    }

    // ---------- 读取时 key 校验生效 ----------

    @Test
    void getPref_非法key_抛出IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> service.getPref(1L, "bad/key"));
        verify(repository, never()).findByUserIdAndPrefKey(any(), any());
    }
}
