# 合理性设计分析结果缓存 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 需求归集「合理性设计」抽屉展示后端持久化的最近一次分析结果，仅人工点击「执行分析/重新分析」才重跑技能并覆盖存储，数据变化时显示过期横幅。

**Architecture:** 新后端模块 `com.racc.fpianalysis`（Entity/Repository/Service/Controller 四件套，仿 `com.racc.userpref`），MySQL 新表 `fpi_analysis_result`（唯一键 `user_id+line_key+fp_code`，upsert 覆盖）。前端 `RequirementCollectView.vue` 打开抽屉时 GET 缓存渲染、指纹比对出过期横幅、执行成功后 PUT 落库。

**Tech Stack:** Spring Boot 3 + JPA + MySQL 8（后端）；Vue3 + TS + Element Plus + axios（前端）；JUnit5 + Mockito（后端测试）。

**规格文档:** `docs/superpowers/specs/2026-09-15-fpi-analysis-cache-design.md`

**构建/测试命令约定（Windows + Git Bash）：**
- 后端测试：`cd /f/kjl-study/AIStudio/backend && source ../tools/env.sh && "$MVN_CMD" test -Dtest=FpiAnalysisResultServiceTest`（env.sh 导出 `JAVA_HOME` 与 `MVN_CMD=F:/kjl-study/AIStudio/tools/apache-maven-3.9.16/bin/mvn.cmd`）
- 前端类型检查：`cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit`（若项目无该脚本则以 `npm run build` 代替，先查 `package.json` scripts）
- 后端重启验证：`powershell "Get-NetTCPConnection -LocalPort 8091 -State Listen | Select -Exp OwningProcess -Unique | % { Stop-Process -Id $_ -Force }"` 停止后，`powershell -NoProfile -Command "Start-Process -FilePath 'F:\kjl-study\AIStudio\启动平台.bat' -WorkingDirectory 'F:\kjl-study\AIStudio'"` 重启（jar 需先重建：`cd /f/kjl-study/AIStudio && bash tools/start-backend.sh --build`，注意 --build 要求 8091 已停）

**工作目录**：本计划所有相对路径基于仓库根 `/f/kjl-study/`。

---

### Task 1: 数据库迁移脚本 + schema 同步

**Files:**
- Create: `AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql`
- Modify: `AIStudio/db/01_schema.sql`（文件末尾追加建表语句）

- [ ] **Step 1: 写迁移脚本**

创建 `AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql`：

```sql
-- 001: 合理性设计分析结果缓存表（每用户每条线每功能点仅存最近一次，覆盖式 upsert）
-- 对应设计: docs/superpowers/specs/2026-09-15-fpi-analysis-cache-design.md
CREATE TABLE IF NOT EXISTS `fpi_analysis_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '所属用户（跨设备跟随用户）',
  `line_key` varchar(32) NOT NULL COMMENT '条线：inpatient/outpatient/emergency',
  `fp_code` varchar(128) NOT NULL COMMENT '功能点编码',
  `fp_name` varchar(255) DEFAULT NULL COMMENT '功能点名称（展示用快照）',
  `skill_name` varchar(128) DEFAULT NULL COMMENT '执行的分析技能名',
  `result_md` longtext COMMENT '分析结果 Markdown 原文（stdout）',
  `data_fingerprint` varchar(255) DEFAULT NULL COMMENT '分析时归集数据指纹',
  `fp_snapshot` longtext COMMENT '分析时功能点统计快照 JSON（fp 字段原样）',
  `exec_duration_ms` bigint DEFAULT NULL COMMENT '技能执行耗时',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fpi_result` (`user_id`,`line_key`,`fp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

- [ ] **Step 2: 在本地库执行迁移验证幂等**

```bash
E:/KjlStudy/mysql/bin/mysql.exe -uroot -pracc123 racc < /f/kjl-study/AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql && E:/KjlStudy/mysql/bin/mysql.exe -uroot -pracc123 racc < /f/kjl-study/AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql && E:/KjlStudy/mysql/bin/mysql.exe -uroot -pracc123 -e "SHOW CREATE TABLE racc.fpi_analysis_result\G" | head -8
```
Expected: 两次执行均无报错（幂等），最后能打出表结构。

- [ ] **Step 3: 同步 01_schema.sql**

在 `AIStudio/db/01_schema.sql` 文件末尾追加与 Step 1 相同的 `DROP TABLE IF EXISTS` + `CREATE TABLE` 语句（保持该文件的导出风格，DROP 前置）：

```sql
DROP TABLE IF EXISTS `fpi_analysis_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fpi_analysis_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '所属用户（跨设备跟随用户）',
  `line_key` varchar(32) NOT NULL COMMENT '条线：inpatient/outpatient/emergency',
  `fp_code` varchar(128) NOT NULL COMMENT '功能点编码',
  `fp_name` varchar(255) DEFAULT NULL COMMENT '功能点名称（展示用快照）',
  `skill_name` varchar(128) DEFAULT NULL COMMENT '执行的分析技能名',
  `result_md` longtext COMMENT '分析结果 Markdown 原文（stdout）',
  `data_fingerprint` varchar(255) DEFAULT NULL COMMENT '分析时归集数据指纹',
  `fp_snapshot` longtext COMMENT '分析时功能点统计快照 JSON（fp 字段原样）',
  `exec_duration_ms` bigint DEFAULT NULL COMMENT '技能执行耗时',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fpi_result` (`user_id`,`line_key`,`fp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study && git add AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql AIStudio/db/01_schema.sql && git commit -m "feat(db): 新增 fpi_analysis_result 分析结果缓存表（001 迁移+schema 同步）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 后端 Entity + Repository

**Files:**
- Create: `AIStudio/backend/src/main/java/com/racc/fpianalysis/entity/FpiAnalysisResultEntity.java`
- Create: `AIStudio/backend/src/main/java/com/racc/fpianalysis/repository/FpiAnalysisResultRepository.java`

- [ ] **Step 1: 写 Entity**

创建 `AIStudio/backend/src/main/java/com/racc/fpianalysis/entity/FpiAnalysisResultEntity.java`（仿 `UserPreferenceEntity` 风格）：

```java
package com.racc.fpianalysis.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 合理性设计分析结果缓存（每用户每条线每功能点一行，覆盖式保存最近一次）。
 * 前端在「合理性设计」抽屉展示最近一次分析结果；仅人工点击执行分析时覆盖更新。
 */
@Entity
@Table(name = "fpi_analysis_result",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "line_key", "fp_code"}))
public class FpiAnalysisResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 条线：inpatient / outpatient / emergency */
    @Column(name = "line_key", nullable = false, length = 32)
    private String lineKey;

    @Column(name = "fp_code", nullable = false, length = 128)
    private String fpCode;

    /** 功能点名称（保存时的快照，展示用） */
    @Column(name = "fp_name", length = 255)
    private String fpName;

    @Column(name = "skill_name", length = 128)
    private String skillName;

    /** 分析结果 Markdown 原文（技能 stdout） */
    @Column(name = "result_md", columnDefinition = "LONGTEXT")
    private String resultMd;

    /** 分析时的归集数据指纹（工单 id 集合 hash），打开抽屉时与当前数据比对 */
    @Column(name = "data_fingerprint", length = 255)
    private String dataFingerprint;

    /** 分析时传给技能的 fp 对象 JSON 快照 */
    @Column(name = "fp_snapshot", columnDefinition = "LONGTEXT")
    private String fpSnapshot;

    @Column(name = "exec_duration_ms")
    private Long execDurationMs;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getLineKey() { return lineKey; }
    public void setLineKey(String lineKey) { this.lineKey = lineKey; }
    public String getFpCode() { return fpCode; }
    public void setFpCode(String fpCode) { this.fpCode = fpCode; }
    public String getFpName() { return fpName; }
    public void setFpName(String fpName) { this.fpName = fpName; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public String getResultMd() { return resultMd; }
    public void setResultMd(String resultMd) { this.resultMd = resultMd; }
    public String getDataFingerprint() { return dataFingerprint; }
    public void setDataFingerprint(String dataFingerprint) { this.dataFingerprint = dataFingerprint; }
    public String getFpSnapshot() { return fpSnapshot; }
    public void setFpSnapshot(String fpSnapshot) { this.fpSnapshot = fpSnapshot; }
    public Long getExecDurationMs() { return execDurationMs; }
    public void setExecDurationMs(Long execDurationMs) { this.execDurationMs = execDurationMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 写 Repository**

创建 `AIStudio/backend/src/main/java/com/racc/fpianalysis/repository/FpiAnalysisResultRepository.java`：

```java
package com.racc.fpianalysis.repository;

import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FpiAnalysisResultRepository extends JpaRepository<FpiAnalysisResultEntity, Long> {
    Optional<FpiAnalysisResultEntity> findByUserIdAndLineKeyAndFpCode(Long userId, String lineKey, String fpCode);
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /f/kjl-study/AIStudio/backend && source ../tools/env.sh && "$MVN_CMD" compile -q 2>&1 | tail -5
```
Expected: BUILD SUCCESS（无输出或仅警告）。

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study && git add AIStudio/backend/src/main/java/com/racc/fpianalysis/ && git commit -m "feat(fpianalysis): 分析结果缓存 Entity+Repository

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 后端 Service（TDD）

**Files:**
- Create: `AIStudio/backend/src/test/java/com/racc/fpianalysis/service/FpiAnalysisResultServiceTest.java`
- Create: `AIStudio/backend/src/main/java/com/racc/fpianalysis/service/FpiAnalysisResultService.java`

- [ ] **Step 1: 写失败测试**

创建 `AIStudio/backend/src/test/java/com/racc/fpianalysis/service/FpiAnalysisResultServiceTest.java`（仿 `UserPreferenceServiceTest` 的 Mockito 风格）：

```java
package com.racc.fpianalysis.service;

import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import com.racc.fpianalysis.repository.FpiAnalysisResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Map;
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
        // @Lazy 自代理：单测中直接传 this，save 内部经 self 调用 doSave
        service = new FpiAnalysisResultService(repository, service);
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
        // 第一次经 self.doSave 抛约束冲突，重试同参再走一遍成功
        doThrow(new DataIntegrityViolationException("dup"))
                .doNothing()
                .when(service).doSave(eq(1L), eq("inpatient"), eq("BLGL-001"), any(), any(), any(), any(), any(), any());
        service.save(1L, "inpatient", "BLGL-001", null, null, "md", null, null, null);
        verify(service, times(2)).doSave(eq(1L), eq("inpatient"), eq("BLGL-001"), any(), any(), any(), any(), any(), any());
    }
}
```

注意：并发重试测试依赖 `doSave` 为 public 方法（经代理调用），Service 中按此定义。

- [ ] **Step 2: 跑测试确认失败**

```bash
cd /f/kjl-study/AIStudio/backend && source ../tools/env.sh && "$MVN_CMD" test -Dtest=FpiAnalysisResultServiceTest 2>&1 | tail -15
```
Expected: COMPILATION ERROR（`FpiAnalysisResultService` 不存在）。

- [ ] **Step 3: 写 Service 实现**

创建 `AIStudio/backend/src/main/java/com/racc/fpianalysis/service/FpiAnalysisResultService.java`（复用 `UserPreferenceService` 的并发重试手法）：

```java
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
```

- [ ] **Step 4: Repository 补删除方法**

修改 `AIStudio/backend/src/main/java/com/racc/fpianalysis/repository/FpiAnalysisResultRepository.java`，在接口内追加：

```java
    void deleteByUserIdAndLineKeyAndFpCode(Long userId, String lineKey, String fpCode);
```

- [ ] **Step 5: 跑测试确认通过**

```bash
cd /f/kjl-study/AIStudio/backend && source ../tools/env.sh && "$MVN_CMD" test -Dtest=FpiAnalysisResultServiceTest 2>&1 | tail -12
```
Expected: `Tests run: 8, Failures: 0, Errors: 0, Skipped: 0` + BUILD SUCCESS。

- [ ] **Step 6: Commit**

```bash
cd /f/kjl-study && git add AIStudio/backend/src/main/java/com/racc/fpianalysis/ AIStudio/backend/src/test/java/com/racc/fpianalysis/ && git commit -m "feat(fpianalysis): 分析结果缓存 Service（upsert+并发重试，TDD 8 用例）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 后端 Controller

**Files:**
- Create: `AIStudio/backend/src/main/java/com/racc/fpianalysis/controller/FpiAnalysisResultController.java`

- [ ] **Step 1: 写 Controller**

创建 `AIStudio/backend/src/main/java/com/racc/fpianalysis/controller/FpiAnalysisResultController.java`（userId 解析与 `UserPreferenceController.resolveUserId` 完全一致）：

```java
package com.racc.fpianalysis.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import com.racc.fpianalysis.service.FpiAnalysisResultService;
import com.racc.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 合理性设计分析结果缓存接口。
 * GET    /api/fpi-analysis/{lineKey}/{fpCode} → {"value": {...}|null}
 * PUT    /api/fpi-analysis/{lineKey}/{fpCode} ← body: {resultMd, skillName, dataFingerprint, fpSnapshot, fpName, execDurationMs}
 * DELETE /api/fpi-analysis/{lineKey}/{fpCode}
 * 数据按登录用户隔离（userId 从 SecurityContextHolder 解析）。
 */
@RestController
@RequestMapping("/api/fpi-analysis")
public class FpiAnalysisResultController {

    private final FpiAnalysisResultService service;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FpiAnalysisResultController(FpiAnalysisResultService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> get(@PathVariable String lineKey, @PathVariable String fpCode) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            FpiAnalysisResultEntity e = service.get(userId, lineKey, fpCode);
            return ResponseEntity.ok(Map.of("value", toDto(e)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> save(@PathVariable String lineKey, @PathVariable String fpCode,
                                  @RequestBody JsonNode body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            service.save(userId, lineKey, fpCode,
                    textOrNull(body, "fpName"),
                    textOrNull(body, "skillName"),
                    textOrNull(body, "resultMd"),
                    textOrNull(body, "dataFingerprint"),
                    textOrNull(body, "fpSnapshot"),
                    longOrNull(body, "execDurationMs"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{lineKey}/{fpCode}")
    public ResponseEntity<?> remove(@PathVariable String lineKey, @PathVariable String fpCode) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        try {
            service.remove(userId, lineKey, fpCode);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private Map<String, Object> toDto(FpiAnalysisResultEntity e) {
        if (e == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("fpName", e.getFpName());
        m.put("skillName", e.getSkillName());
        m.put("resultMd", e.getResultMd());
        m.put("dataFingerprint", e.getDataFingerprint());
        m.put("fpSnapshot", e.getFpSnapshot());
        m.put("execDurationMs", e.getExecDurationMs());
        m.put("createdAt", e.getCreatedAt() == null ? null : e.getCreatedAt().toString());
        m.put("updatedAt", e.getUpdatedAt() == null ? null : e.getUpdatedAt().toString());
        return m;
    }

    private static String textOrNull(JsonNode body, String field) {
        return body == null || !body.hasNonNull(field) ? null : body.get(field).asText();
    }

    private static Long longOrNull(JsonNode body, String field) {
        return body == null || !body.hasNonNull(field) ? null : body.get(field).asLong();
    }

    /** 与 UserPreferenceController 一致：从 SecurityContextHolder 取当前用户名再查 userId。 */
    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = String.valueOf(auth.getPrincipal());
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}
```

- [ ] **Step 2: 编译验证**

```bash
cd /f/kjl-study/AIStudio/backend && source ../tools/env.sh && "$MVN_CMD" compile -q 2>&1 | tail -5
```
Expected: BUILD SUCCESS。

- [ ] **Step 3: Commit**

```bash
cd /f/kjl-study && git add AIStudio/backend/src/main/java/com/racc/fpianalysis/ && git commit -m "feat(fpianalysis): 分析结果缓存 Controller（GET/PUT/DELETE，按登录用户隔离）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 前端 API 封装

**Files:**
- Create: `AIStudio/frontend/src/api/fpiAnalysis.ts`

- [ ] **Step 1: 写 API 模块**

创建 `AIStudio/frontend/src/api/fpiAnalysis.ts`：

```ts
import http from './http'

/** 合理性设计分析结果缓存（后端 fpi_analysis_result，按登录用户隔离，每功能点存最近一次） */
export interface FpiAnalysisCache {
  fpName: string | null
  skillName: string | null
  resultMd: string | null
  dataFingerprint: string | null
  fpSnapshot: string | null
  execDurationMs: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface FpiAnalysisSavePayload {
  fpName?: string | null
  skillName?: string | null
  resultMd?: string | null
  dataFingerprint?: string | null
  fpSnapshot?: string | null
  execDurationMs?: number | null
}

export const fpiAnalysisApi = {
  /** 读取最近一次分析结果；无则 value 为 null。静默失败（后端不可达时降级为无缓存，由调用方提示） */
  async get(lineKey: string, fpCode: string): Promise<{ value: FpiAnalysisCache | null }> {
    const res = await http.get<{ value: FpiAnalysisCache | null }>(
      `/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`,
      { silent: true } as any   // silent: 本项目自定义请求标记，失败不出全局错误弹窗
    )
    return res.data
  },

  /** 保存/覆盖最近一次分析结果（失败仅告警，由调用方兜底提示，不阻断展示） */
  async save(lineKey: string, fpCode: string, payload: FpiAnalysisSavePayload): Promise<void> {
    await http.put(`/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`, payload, {
      silent: true
    } as any)
  },

  /** 删除该功能点的分析结果（预留） */
  async remove(lineKey: string, fpCode: string): Promise<void> {
    await http.delete(`/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`, {
      silent: true
    } as any)
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | tail -5
```
Expected: 无错误退出（若 vue-tsc 不可用则 `npm run build`，以 `package.json` scripts 实际为准）。此步可能因既有代码警告失败——只要**新增文件无报错**即可继续（对比 Task 前后输出）。

- [ ] **Step 3: Commit**

```bash
cd /f/kjl-study && git add AIStudio/frontend/src/api/fpiAnalysis.ts && git commit -m "feat(frontend): fpiAnalysisApi 缓存读写封装

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 前端视图接入（缓存读取 + 过期横幅 + 落库）

**Files:**
- Modify: `AIStudio/frontend/src/views/requirements/RequirementCollectView.vue`

本任务共 6 处修改，每处先给代码，改完统一做类型检查与手动验证。

- [ ] **Step 1: 引入 API + 新增状态**

在 `RequirementCollectView.vue:476` 的 `import { skillApi } from '@/api/skill'` 之后追加：

```ts
import { fpiAnalysisApi, type FpiAnalysisCache } from '@/api/fpiAnalysis'
```

在 `const fpiAnalysisRow = ref<FpiSkillRow | null>(null)`（约 597 行）之后追加状态块：

```ts
// ---- 分析结果缓存（后端 fpi_analysis_result）：打开抽屉展示最近一次，仅人工执行才覆盖 ----
interface FpiCacheMeta {
  updatedAt: string | null   // ISO 字符串（后端 LocalDateTime.toString()）
  skillName: string | null
  execDurationMs: number | null
  fingerprint: string | null
  oldTotal: number | null    // 缓存时工单数（fpSnapshot.total），过期横幅展示 X→Y
}
const fpiCacheMeta = ref<FpiCacheMeta | null>(null)
const fpiCacheStale = ref(false)      // 当前数据指纹与缓存不一致
const fpiCacheSaving = ref(false)     // 落库中（小字提示用）

/** 当前功能点行的数据指纹：需求+软质工单 id 升序拼接 → djb2 hash，前缀带数量便于人工识别 */
function calcFingerprint(row: FpiSkillRow): string {
  const ids = analysisReqItems(row).concat(analysisSoftItems(row))
    .map(x => String(x.id)).sort()
  let h = 5381
  for (const s of ids) { for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0 }
  return `n${ids.length}h${h.toString(16)}`
}

/** 打开抽屉时读取后端缓存并渲染（不自动执行技能） */
async function loadFpiCache(lineKey: string, row: FpiSkillRow) {
  fpiCacheMeta.value = null
  fpiCacheStale.value = false
  if (!row.code) {
    fpiAnalysisText.value = '> ⚠ 该功能点无编码，无法读取/保存分析缓存，可直接执行分析（结果不做持久化）。'
    return
  }
  try {
    const res = await fpiAnalysisApi.get(lineKey, row.code)
    const v = res?.value
    if (!v || !v.resultMd) {
      fpiAnalysisText.value = '> 尚未分析过。请在上方选择分析技能后点击「执行分析」，结果将自动保存并跨设备同步。'
      return
    }
    fpiAnalysisText.value = v.resultMd
    let oldTotal: number | null = null
    if (v.fpSnapshot) {
      try { oldTotal = JSON.parse(v.fpSnapshot)?.total ?? null } catch { /* 快照损坏按缺省 */ }
    }
    fpiCacheMeta.value = {
      updatedAt: v.updatedAt, skillName: v.skillName,
      execDurationMs: v.execDurationMs, fingerprint: v.dataFingerprint, oldTotal
    }
    fpiCacheStale.value = !!v.dataFingerprint && v.dataFingerprint !== calcFingerprint(row)
  } catch {
    fpiAnalysisText.value = '> 读取历史分析结果失败（后端不可达或未登录），可直接点击「执行分析」重新分析。'
  }
}
```

- [ ] **Step 2: 改造 `openFpiAnalysis`（去掉自动执行）**

将现有 `openFpiAnalysis`（约 763-770 行）整体替换为：

```ts
function openFpiAnalysis(row: FpiSkillRow) {
  fpiAnalysisRow.value = row
  fpiAnalysisTab.value = 'analysis' // 打开时默认展示合理性设计分析
  fpiAnalysisVisible.value = true
  loadPlatformSkills()
  loadFpiCache(String(activeTab.value), row)   // 展示最近一次缓存结果，不自动执行
}
```

- [ ] **Step 3: 改造 `runFpiAnalysis`（成功后落库）**

将现有 `runFpiAnalysis`（约 785-825 行）中 try 块的成功分支（`const out = ...` 到 `fpiAnalysisText.value = out || ...` 两行）替换为：

```ts
    const out = (res.stdout || '').trim()
    fpiAnalysisText.value = out || '> ⚠ 技能未返回分析内容（stdout 为空，检查脚本输出）'
    // 成功且非空 → 落库覆盖最近一次（失败仅提示，不影响本次展示）
    if (out && row.code) {
      fpiCacheSaving.value = true
      fpiAnalysisApi.save(String(activeTab.value), row.code, {
        fpName: row.name, skillName: anaCfg.skillName, resultMd: out,
        dataFingerprint: calcFingerprint(row),
        fpSnapshot: JSON.stringify(args.fp), execDurationMs: res.durationMs
      }).then(() => {
        fpiCacheMeta.value = {
          updatedAt: new Date().toISOString(), skillName: anaCfg.skillName,
          execDurationMs: res.durationMs, fingerprint: calcFingerprint(row),
          oldTotal: row.total ?? null
        }
        fpiCacheStale.value = false
      }).catch(err => {
        console.warn('[reqcollect] 分析结果保存失败', err)
        ElMessage({ message: '分析结果保存失败（本次展示不受影响）', type: 'warning', grouping: true })
      }).finally(() => { fpiCacheSaving.value = false })
    }
```

并在 `import { useMarkdown } from '@/composables/useMarkdown'`（约 474 行）附近确认已有 `ElMessage` 导入；若无，在 script 头部 import 区追加：

```ts
import { ElMessage } from 'element-plus'
```

（注：`durationMs` 字段 `executeSkill` 返回值中已存在，见 `skill.ts:108`；`args` 为 `runFpiAnalysis` 内已有的局部变量。）

- [ ] **Step 4: 模板加信息条与过期横幅**

在模板「合理性设计分析」tab 中，`<div class="ana-cfg-bar">`（约 393 行）之前插入：

```html
          <div v-if="fpiCacheMeta" class="fpi-cache-bar">
            <span class="fpi-cache-info">
              🕑 最近分析：{{ formatCacheTime(fpiCacheMeta.updatedAt) }}<template v-if="fpiCacheMeta.skillName"> · 技能 {{ fpiCacheMeta.skillName }}</template><template v-if="fpiCacheMeta.execDurationMs"> · 耗时 {{ (fpiCacheMeta.execDurationMs / 1000).toFixed(1) }}s</template><template v-if="fpiCacheSaving"> · <span class="fpi-cache-saving">保存中…</span></template>
            </span>
            <el-alert
              v-if="fpiCacheStale" type="warning" :closable="false" show-icon
              title="归集数据已变化，以下结果可能过期"
              :description="staleBannerText"
            />
          </div>
```

在 `const fpiCacheSaving = ref(false)` 声明之后追加 computed 与工具函数：

```ts
const staleBannerText = computed(() => {
  const meta = fpiCacheMeta.value
  const row = fpiAnalysisRow.value
  if (!meta || !row) return ''
  if (meta.oldTotal != null && row.total != null && meta.oldTotal !== row.total) {
    return `分析时工单 ${meta.oldTotal} 条，当前 ${row.total} 条。如需按最新数据重新评估，请点击「执行分析」。`
  }
  return '归集工单集合与分析时不同。如需按最新数据重新评估，请点击「执行分析」。'
})

function formatCacheTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
```

（后端 `LocalDateTime.toString()` 输出如 `2026-09-15T10:32:05.123`，`new Date()` 可解析；落库成功分支写入的是 `toISOString()`（UTC 带时区后缀），两者均可被 `formatCacheTime` 解析。）

- [ ] **Step 5: 样式追加**

在 `<style scoped>` 中 `.ana-cfg-bar` 规则（约 1816 行）之后追加：

```css
.fpi-cache-bar { margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
.fpi-cache-info { font-size: 12px; color: #909399; }
.fpi-cache-saving { color: #e6a23c; }
.fpi-cache-bar :deep(.el-alert) { padding: 4px 12px; }
.fpi-cache-bar :deep(.el-alert__title) { font-size: 12px; }
.fpi-cache-bar :deep(.el-alert__description) { font-size: 12px; margin-top: 2px; }
```

- [ ] **Step 6: 类型检查 + 构建**

```bash
cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | tail -8
```
Expected: 新增改动无类型错误（既有警告可比对改动前输出）。

- [ ] **Step 7: Commit**

```bash
cd /f/kjl-study && git add AIStudio/frontend/src/views/requirements/RequirementCollectView.vue && git commit -m "feat(reqcollect): 合理性设计分析接入结果缓存（开抽屉读缓存+过期横幅+成功落库）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 端到端手动验证（后端重建 + 浏览器走查）

**Files:** 无新文件（验证任务）

- [ ] **Step 1: 停后端 → 重建 jar → 重启平台**

```bash
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8091 -State Listen | Select -Exp OwningProcess -Unique | ForEach-Object { Stop-Process -Id \$_ -Force }"
cd /f/kjl-study/AIStudio && bash tools/start-backend.sh --build 2>&1 | tail -3
```
`--build` 会构建后自行启动后端；随后启动前端/MySQL 兜底：

```bash
powershell -NoProfile -Command "Start-Process -FilePath 'F:\kjl-study\AIStudio\启动平台.bat' -WorkingDirectory 'F:\kjl-study\AIStudio'"
```
Expected: 8090/8091/3306 均 LISTENING，`logs/backend.log` 无 ERROR。

- [ ] **Step 2: 迁移库表（若启动脚本未自动执行 001）**

```bash
E:/KjlStudy/mysql/bin/mysql.exe -uroot -pracc123 racc < /f/kjl-study/AIStudio/db/03_migrations/001_add_fpi_analysis_result.sql && E:/KjlStudy/mysql/bin/mysql.exe -uroot -pracc123 -e "DESC racc.fpi_analysis_result" | head -5
```
Expected: 表存在（幂等脚本重复执行无碍）。

- [ ] **Step 3: API 冒烟（浏览器登录后取 token，或用现有账号 admin/admin123 获取）**

```bash
TOKEN=$(curl -s -X POST http://localhost:8091/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python -c "import sys,json;print(json.load(sys.stdin)['token'])")
# 1. 无记录读取
curl -s http://localhost:8091/api/fpi-analysis/inpatient/BLGL-SMOKE -H "Authorization: Bearer $TOKEN"
# 2. 保存
curl -s -X PUT http://localhost:8091/api/fpi-analysis/inpatient/BLGL-SMOKE -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"fpName":"冒烟测试","skillName":"demo","resultMd":"# 冒烟","dataFingerprint":"n1h1","fpSnapshot":"{\"total\":1}","execDurationMs":100}'
# 3. 再读取（应有 value）
curl -s http://localhost:8091/api/fpi-analysis/inpatient/BLGL-SMOKE -H "Authorization: Bearer $TOKEN"
# 4. 删除 + 确认
curl -s -X DELETE http://localhost:8091/api/fpi-analysis/inpatient/BLGL-SMOKE -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8091/api/fpi-analysis/inpatient/BLGL-SMOKE -H "Authorization: Bearer $TOKEN"
```
Expected: 1→`{"value":null}`；2→`{"success":true}`；3→value 含 `"# 冒烟"`；4→删除后 value 恢复 null。

- [ ] **Step 4: 浏览器走查验收标准（对照规格 §6）**

打开 http://localhost:8090（admin/admin123）→ 需求归集 → 选一条线手动刷新出功能点列表 → 逐条核验：
1. 首次打开某功能点抽屉：显示「尚未分析过」提示，Network 面板**无** `/exec` 调用
2. 点「执行分析」：技能真实执行、结果展示，`fpi_analysis_result` 表出现该行（`SELECT user_id,fp_code,updated_at FROM fpi_analysis_result`）
3. 关抽屉重开：直接显示结果 + 「最近分析」信息条，无 `/exec` 调用
4. 刷新页面/另开浏览器登录同账号：重开抽屉仍显示缓存
5. 重新归集使工单集合变化后重开抽屉：出现过期横幅（工单 X→Y）
6. 使技能执行失败（如选无脚本技能）：旧缓存保留不变
7. 指纹一致时无横幅

- [ ] **Step 5: 验证通过后提交（如有微调）**

```bash
cd /f/kjl-study && git status --short | grep -v "^??" | head; git add -A AIStudio/ && git commit -m "chore(reqcollect): 分析结果缓存端到端走查收尾

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
（若 Step 4 无代码改动则跳过本步。）

---

## 自审记录

- **规格覆盖**：§2 数据模型→Task 1/2；§3 API→Task 3/4；§4.1 指纹→Task 6 Step 1；§4.2 打开流程→Task 6 Step 2；§4.3 执行落库→Task 6 Step 3；§4.5 信息条/横幅→Task 6 Step 4/5；§4.6 API 封装→Task 5；§5 边界（silent 请求/保存失败提示/stdout 空不落库/无编码行）→Task 6 各步；§6 验收→Task 7。
- **占位符**：无 TBD/TODO；所有代码步骤给出完整代码。
- **类型一致性**：`FpiAnalysisCache`/`FpiAnalysisSavePayload`（Task 5）与 Controller 入参/出参字段（Task 4）一致；`save()` 9 参签名在 Task 3 Service 与 Task 4 Controller 调用一致；`doSave` 同参（并发测试依赖 public）；前端 `calcFingerprint`/`loadFpiCache`/`fpiCacheMeta`/`fpiCacheStale`/`fpiCacheSaving`/`staleBannerText`/`formatCacheTime` 定义与引用一致。
