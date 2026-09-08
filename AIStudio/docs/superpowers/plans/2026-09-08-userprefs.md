# 用户配置后端持久化（userPrefs）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端 7 个 localStorage 配置迁移为后端按用户持久化，实现跨浏览器/跨设备配置一致。

**Architecture:** 后端新增 `com.racc.userpref` 包（KV 表 `user_preference` + REST 接口 `/api/user/prefs/{key}`），前端新增 `src/utils/userPrefs.ts` 通用工具（本地先行 + 后端校准 + 双写），7 个视图接入点替换为 `loadPref/savePref`。

**Tech Stack:** Spring Boot 3 + JPA（ddl-auto: update，自动建表）；Vue 3 + TypeScript + Axios（复用现有 `http.ts`）。

**Spec:** `docs/superpowers/specs/2026-09-08-user-config-backend-persistence-design.md`

**运行环境注意：**
- 仓库根为 `F:\kjl-study\AIStudio`（git 仓库，工作目录常见为该路径的父级，命令中用相对路径 `AIStudio/...` 时注意先 `cd /f/kjl-study/AIStudio`）。
- 后端已在本机运行（8091）。**改后端代码后需要重启后端**：关闭 RACC-后端-8091 窗口，重新运行 `F:\kjl-study\AIStudio\启动平台.bat`（会自动跳过已在运行的 MySQL/前端）。
- 后端单测通过 `cd AIStudio/backend && mvn test -Dtest=UserPreferenceServiceTest` 运行（首次需等待依赖下载）。
- 前端 Vite 热更新即时生效，无需重启。

---

### Task 1: 后端 Entity + Repository

**Files:**
- Create: `backend/src/main/java/com/racc/userpref/entity/UserPreferenceEntity.java`
- Create: `backend/src/main/java/com/racc/userpref/repository/UserPreferenceRepository.java`

- [ ] **Step 1: 创建 Entity**

```java
package com.racc.userpref.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户个人偏好配置（通用 KV）。每个用户每个 key 一行，值存 JSON 原文。
 * 前端配置如需求看板、知识库列显隐等通过 /api/user/prefs/{key} 存取。
 */
@Entity
@Table(name = "user_preference",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "pref_key"}))
public class UserPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "pref_key", nullable = false, length = 64)
    private String prefKey;

    @Column(name = "pref_value", columnDefinition = "TEXT")
    private String prefValue;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPrefKey() { return prefKey; }
    public void setPrefKey(String prefKey) { this.prefKey = prefKey; }

    public String getPrefValue() { return prefValue; }
    public void setPrefValue(String prefValue) { this.prefValue = prefValue; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 创建 Repository**

```java
package com.racc.userpref.repository;

import com.racc.userpref.entity.UserPreferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreferenceEntity, Long> {
    Optional<UserPreferenceEntity> findByUserIdAndPrefKey(Long userId, String prefKey);
}
```

- [ ] **Step 3: 编译验证**

Run: `cd /f/kjl-study/AIStudio/backend && mvn compile -q`
Expected: BUILD SUCCESS（无输出即成功）

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study/AIStudio && git add backend/src/main/java/com/racc/userpref/ && git commit -m "feat(userpref): 用户偏好KV实体与仓库

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 后端 Service（TDD）

**Files:**
- Test: `backend/src/test/java/com/racc/userpref/service/UserPreferenceServiceTest.java`
- Create: `backend/src/main/java/com/racc/userpref/service/UserPreferenceService.java`

- [ ] **Step 1: 写失败测试**

注意：项目当前没有任何测试目录（`backend/src/test` 需新建），`spring-boot-starter-test` 已在 pom.xml。本测试为纯 Mockito 单测，不启动 Spring 上下文。

```java
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
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /f/kjl-study/AIStudio/backend && mvn test -Dtest=UserPreferenceServiceTest -q`
Expected: COMPILATION ERROR（`UserPreferenceService` 不存在）

- [ ] **Step 3: 写最小实现**

```java
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /f/kjl-study/AIStudio/backend && mvn test -Dtest=UserPreferenceServiceTest -q`
Expected: `Tests run: 8, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
cd /f/kjl-study/AIStudio && git add backend/src/test/java/com/racc/userpref/ backend/src/main/java/com/racc/userpref/service/ && git commit -m "feat(userpref): 偏好服务（get/save/key校验）+ 8个单测

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 后端 Controller

**Files:**
- Create: `backend/src/main/java/com/racc/userpref/controller/UserPreferenceController.java`

背景：本项目 SecurityConfig 全放行 + JWT 过滤器注入上下文，各 Controller 自行 resolveUserId（未登录返回 401 JSON）——与 `UserConfigController`（`backend/src/main/java/com/racc/userconfig/controller/UserConfigController.java`）完全同模式。

- [ ] **Step 1: 创建 Controller**

```java
package com.racc.userpref.controller;

import com.racc.user.UserRepository;
import com.racc.userpref.service.UserPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户个人偏好配置接口（通用 KV）。
 * GET /api/user/prefs/{key}  → {"value": <json|null>}
 * PUT /api/user/prefs/{key}  → body 为 JSON 原文，原样存取
 */
@RestController
@RequestMapping("/api/user/prefs")
public class UserPreferenceController {

    private final UserPreferenceService userPreferenceService;
    private final UserRepository userRepository;

    public UserPreferenceController(UserPreferenceService userPreferenceService,
                                    UserRepository userRepository) {
        this.userPreferenceService = userPreferenceService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getPref(@PathVariable String key) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        try {
            String value = userPreferenceService.getPref(userId, key);
            return ResponseEntity.ok(Map.of("value", value == null ? JSONObject.NULL : value));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{key}")
    public ResponseEntity<?> savePref(@PathVariable String key, @RequestBody String body) {
        Long userId = resolveUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        try {
            userPreferenceService.savePref(userId, key, body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** 从 SecurityContextHolder 获取当前登录用户名，再查询 userId（与 UserConfigController 一致）。 */
    private Long resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = String.valueOf(auth.getPrincipal());
        return userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElse(null);
    }
}
```

注意：`JSONObject.NULL` 来自 `org.json.JSONObject`（Spring Boot 自带 spring-boot-starter-json 传递依赖，import `org.json.JSONObject` 即可）。若编译报缺依赖，改为返回 `ResponseEntity.ok(Map.of("value", ""))` 并在前端把空串视为 null —— 但优先用 `JSONObject.NULL`，语义正确（序列化为 `{"value":null}`）。

- [ ] **Step 2: 编译**

Run: `cd /f/kjl-study/AIStudio/backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
cd /f/kjl-study/AIStudio && git add backend/src/main/java/com/racc/userpref/controller/ && git commit -m "feat(userpref): REST接口 GET/PUT /api/user/prefs/{key}

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 重启后端 + 接口冒烟验证

**Files:** 无新文件（验证 Task 1-3 成果）

- [ ] **Step 1: 重启后端**

提示用户关闭 RACC-后端-8091 窗口，然后运行 `F:\kjl-study\AIStudio\启动平台.bat`（或由助手通过 PowerShell 启动）。等待 8091 监听：

Run: `sleep 60 && netstat -ano | grep ":8091 " | grep LISTENING`
Expected: 有 LISTENING 行

- [ ] **Step 2: 登录取 token**

Run: `curl -s -X POST http://localhost:8091/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
Expected: 返回 JSON 含 `"token":"..."` 字段（若字段名不同，以实际响应为准，提取 token 值）

- [ ] **Step 3: 冒烟：GET 无记录**

Run: `curl -s http://localhost:8091/api/user/prefs/reqboard.config.v1 -H "Authorization: Bearer <token>"`
Expected: `{"value":null}`

- [ ] **Step 4: 冒烟：PUT 保存 + GET 回读**

Run:
```bash
curl -s -X PUT http://localhost:8091/api/user/prefs/reqboard.config.v1 \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"queryIds":{"x":"1"},"sources":{},"mcp":{}}'
# Expected: {"success":true}

curl -s http://localhost:8091/api/user/prefs/reqboard.config.v1 -H "Authorization: Bearer <token>"
# Expected: {"value":"{\"queryIds\":{\"x\":\"1\"},\"sources\":{},\"mcp\":{}}"}
```

注意：`@RequestBody String` 收到的是原始 JSON 文本（Spring 消费 application/json 时按 String 读原始体），存取均为原文。

- [ ] **Step 5: 冒烟：非法 key 400 + 未登录 401**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8091/api/user/prefs/bad%2Fkey" -H "Authorization: Bearer <token>"
# Expected: 400

curl -s -o /dev/null -w "%{http_code}" http://localhost:8091/api/user/prefs/reqboard.config.v1
# Expected: 401
```

- [ ] **Step 6: 冒烟：跨用户隔离（有第二个账号时）**

用另一账号（如注册一个 test 用户）重复 GET，Expected: `{"value":null}`（看不到 admin 的配置）。若系统无注册入口则跳过本步，隔离由 userId 绑定在逻辑上保证。

---

### Task 5: 前端 userPrefs 工具模块

**Files:**
- Create: `frontend/src/utils/userPrefs.ts`

- [ ] **Step 1: 创建工具模块**

```ts
/**
 * 用户配置后端持久化（通用 KV）。
 *
 * 读（loadPref）：同步返回 localStorage 值让界面零等待渲染；同一页面会话内每个 key
 * 只向后端校准一次，后端有值时覆盖本地并广播 userprefs-updated:{key} 事件。
 * 写（savePref）：立即写 localStorage 保证本机即时生效，同时异步 PUT 后端；后端
 * 失败仅 console.warn，不阻断 UI（退化为纯本地模式，与迁移前行为一致）。
 *
 * 登录令牌 auth 不走此模块。
 * 后端：GET/PUT /api/user/prefs/{key}（见 com.racc.userpref）。
 */
import http from '@/api/http'

const loadedKeys = new Set<string>()

function backendGet(key: string): Promise<string | null> {
  return http.get(`/user/prefs/${encodeURIComponent(key)}`, { silent: true })
    .then(res => {
      const v = res.data?.value
      return typeof v === 'string' ? v : null   // null / 非字符串（异常情况）→ 无值
    })
    .catch(() => null)   // 后端不可达/未登录/超时：静默保持本地
}

function backendPut(key: string, value: string): void {
  http.put(`/user/prefs/${encodeURIComponent(key)}`, value, {
    silent: true,
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.warn(`[userPrefs] 同步配置到后端失败: ${key}`, err))
}

/**
 * 读配置：返回 localStorage 当前值（无则 defaultValue）；同时触发一次后端校准。
 * 后端值与本地不同时：覆盖 localStorage 并派发 userprefs-updated:{key} 事件，
 * 视图应监听该事件用新值刷新状态。
 */
export function loadPref<T>(key: string, defaultValue: T): T {
  let local: T = defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) local = JSON.parse(raw) as T
  } catch { /* 本地损坏：用默认值 */ }

  if (!loadedKeys.has(key)) {
    loadedKeys.add(key)
    backendGet(key).then(remote => {
      if (remote === null) return            // 后端无值 → 保留本地
      let remoteParsed: unknown
      try { remoteParsed = JSON.parse(remote) } catch { return }
      let localRaw: string | null = null
      try { localRaw = localStorage.getItem(key) } catch { /* ignore */ }
      if (localRaw === remote) return        // 已一致，无需打扰视图
      try { localStorage.setItem(key, remote) } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent(`userprefs-updated:${key}`, { detail: remoteParsed }))
    })
  }
  return local
}

/**
 * 写配置：双写 localStorage + 后端（异步）。
 */
export function savePref(key: string, value: unknown): void {
  const json = JSON.stringify(value)
  try { localStorage.setItem(key, json) } catch { /* 容量满等：本地失败不影响后端 */ }
  backendPut(key, json)
}
```

- [ ] **Step 2: 类型检查**

Run: `cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: 无 userPrefs 相关错误（项目存量错误若有，忽略与本次无关的）

- [ ] **Step 3: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/utils/userPrefs.ts && git commit -m "feat(userprefs): 前端通用配置读写工具（本地先行+后端校准+双写）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 接入需求看板 RequirementsView（2 个 key）

**Files:**
- Modify: `frontend/src/views/requirements/RequirementsView.vue`

- [ ] **Step 1: 引入工具**

在 `<script setup lang="ts">` 顶部 import 区加入：

```ts
import { loadPref, savePref } from '@/utils/userPrefs'
```

- [ ] **Step 2: 改造 loadLocalConfig / saveLocalConfig（key: reqboard.config.v1，LS_KEY 定义在 438 行附近）**

原：

```ts
function loadLocalConfig(): ReqboardConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return cloneDefaultConfig()
    const parsed = JSON.parse(raw)
    return {
      queryIds: { ...DEFAULT_CONFIG.queryIds, ...(parsed.queryIds || {}) },
      sources: { ...DEFAULT_CONFIG.sources, ...(parsed.sources || {}) },
      mcp: { ...DEFAULT_CONFIG.mcp, ...(parsed.mcp || {}) }
    }
  } catch {
    return cloneDefaultConfig()
  }
}

function saveLocalConfig(cfg: ReqboardConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
}
```

改为（合并逻辑不变，只换存取通道 + 增加后端校准监听）：

```ts
function normalizeConfig(parsed: any): ReqboardConfig {
  return {
    queryIds: { ...DEFAULT_CONFIG.queryIds, ...(parsed?.queryIds || {}) },
    sources: { ...DEFAULT_CONFIG.sources, ...(parsed?.sources || {}) },
    mcp: { ...DEFAULT_CONFIG.mcp, ...(parsed?.mcp || {}) }
  }
}

function applyConfig(cfg: ReqboardConfig) {
  // 视图内响应配置的 reactive 状态在此统一刷新（沿用原 loadLocalConfig 的消费方式）
  Object.assign(configuredQueryIds, cfg.queryIds)
  Object.assign(configuredSources, cfg.sources)
  Object.assign(configuredMcp, cfg.mcp)
}

function loadLocalConfig(): ReqboardConfig {
  const cfg = normalizeConfig(loadPref<Partial<ReqboardConfig> | null>(LS_KEY, null))
  return cfg
}

function saveLocalConfig(cfg: ReqboardConfig) {
  savePref(LS_KEY, cfg)
}

// 后端校准：首次进入页面即触发，后端有不同值时刷新视图状态
onMounted(() => {
  const cfg = normalizeConfig(loadPref<Partial<ReqboardConfig> | null>(LS_KEY, null))
  applyConfig(cfg)
  window.addEventListener(`userprefs-updated:${LS_KEY}`, (e: Event) => {
    applyConfig(normalizeConfig((e as CustomEvent).detail))
  })
})
```

注意：`configuredQueryIds / configuredSources / configuredMcp` 的实际变量名以文件内现状为准（原 loadLocalConfig 的消费处，约 480-560 行）；若原文件是直接在初始化时消费 loadLocalConfig()，保持该调用不变，applyConfig 只需覆盖这些 reactive 对象。若原文件无 onMounted import，从 vue 补充 import。

- [ ] **Step 3: 改造 UI 状态读写（key: reqboard.ui.v1，LS_UI_KEY 在 543 行附近）**

原 549 行 `localStorage.getItem(LS_UI_KEY)` 与 566 行 `localStorage.setItem(LS_UI_KEY, ...)` 所在函数，同样替换为 `loadPref(LS_UI_KEY, 默认值)` / `savePref(LS_UI_KEY, 值)`。保留原有的 try/catch 合并逻辑，只换存取通道。UI 状态无需监听校准事件（列宽/折叠类状态刷新一次即可，若视图已有加载函数则在校准回调中重调一次）。

- [ ] **Step 4: 类型检查**

Run: `cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | grep -i "RequirementsView" | head -10`
Expected: 无输出（无该文件相关错误）

- [ ] **Step 5: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/views/requirements/RequirementsView.vue && git commit -m "feat(requirements): 需求看板配置接入 userPrefs 后端持久化

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 接入需求归集 RequirementCollectView（1 个 key）

**Files:**
- Modify: `frontend/src/views/requirements/RequirementCollectView.vue`

- [ ] **Step 1: 引入工具**

```ts
import { loadPref, savePref } from '@/utils/userPrefs'
```

- [ ] **Step 2: 改造 loadLinks / saveLinks（key: reqcollect.links.v1，LS_LINKS_KEY 在 481 行附近）**

原 490-494 行附近 `loadLinks` 中 `localStorage.getItem(LS_LINKS_KEY)` 换为 `loadPref(LS_LINKS_KEY, null)`，保留后续 JSON 解析/校验/合并逻辑（raw 判空改为对 loadPref 返回值判空）；保存函数中 `localStorage.setItem(LS_LINKS_KEY, ...)` 换为 `savePref(LS_LINKS_KEY, 对象)`（不再自行 JSON.stringify，savePref 内部处理）。若视图初始化时消费 loadLinks 的 reactive 状态，仿照 Task 6 的 applyConfig 模式在校准事件回调中重调 loadLinks。

- [ ] **Step 3: 类型检查**

Run: `cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | grep -i "RequirementCollectView" | head -10`
Expected: 无输出

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/views/requirements/RequirementCollectView.vue && git commit -m "feat(requirements): 需求归集链接配置接入 userPrefs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 接入知识库 KnowledgeView（3 个列显隐 key）

**Files:**
- Modify: `frontend/src/views/knowledge/KnowledgeView.vue`

- [ ] **Step 1: 引入工具**

```ts
import { loadPref, savePref } from '@/utils/userPrefs'
```

- [ ] **Step 2: 改造 3 组列显隐函数**

三个 key：`kv_column_visibility`（1326-1336 行附近）、`kv_fixed_column_visibility`（1338-1354）、`kv_scan_fixed_column_visibility`（1356-1370）。每组 load/save 函数模式相同：

原模式：

```ts
function loadColumnVisibility(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('kv_column_visibility') || '{}')
  } catch { return {} }
}
function saveColumnVisibility() {
  try {
    localStorage.setItem('kv_column_visibility', JSON.stringify(columnVisibility.value))
  } catch { /* ignore */ }
}
```

改为：

```ts
function loadColumnVisibility(): Record<string, boolean> {
  return loadPref<Record<string, boolean>>('kv_column_visibility', {})
}
function saveColumnVisibility() {
  savePref('kv_column_visibility', columnVisibility.value)
}
```

另两组（`kv_fixed_column_visibility` 对应 `fixedColumnVisibility.value`、`kv_scan_fixed_column_visibility` 对应 `scanFixedColumnVisibility.value`）同样替换。注意 kv_fixed / kv_scan_fixed 的 load 函数原有"过滤已移除历史键"的 cleaned 逻辑——该逻辑保留，只是把数据来源从 localStorage 换成 loadPref：

```ts
function loadFixedColumnVisibility(): Record<string, boolean> {
  const raw = loadPref<Record<string, boolean>>('kv_fixed_column_visibility', {})
  // 过滤掉已不在 FIXED_COLUMN_KEYS 中的历史键（沿用原 cleaned 逻辑）
  const cleaned: Record<string, boolean> = {}
  for (const k of Object.keys(raw)) {
    // ...原过滤条件不变
  }
  return cleaned
}
```

列显隐是即改即存的 UI 偏好，后端校准覆盖时无需额外监听（load 函数在页面加载时调用一次即生效；若视图存在打开设置面板时重读的逻辑，保持不变——届时读到的已是覆盖后的 localStorage 值）。

- [ ] **Step 3: 类型检查**

Run: `cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | grep -i "KnowledgeView" | head -10`
Expected: 无输出

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/views/knowledge/KnowledgeView.vue && git commit -m "feat(knowledge): 知识库列显隐接入 userPrefs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 接入技能页 SkillsView + 聊天页 ChatView（2 个 key）

**Files:**
- Modify: `frontend/src/views/skills/SkillsView.vue`
- Modify: `frontend/src/views/chat/ChatView.vue`

- [ ] **Step 1: SkillsView（key: skills.collapsed.v1，LS_COLLAPSE_KEY 在 417 行附近）**

```ts
import { loadPref, savePref } from '@/utils/userPrefs'
```

420 行 `localStorage.getItem(LS_COLLAPSE_KEY)` 换为 `loadPref<Record<string, boolean>>(LS_COLLAPSE_KEY, {})`（保留原有 try/catch 与默认值合并逻辑，来源换成 loadPref）；430 行 `localStorage.setItem(LS_COLLAPSE_KEY, ...)` 换为 `savePref(LS_COLLAPSE_KEY, collapsedGroups.value)`。

- [ ] **Step 2: ChatView（key: chat-conversation-id）**

```ts
import { loadPref, savePref } from '@/utils/userPrefs'
```

203 行 `localStorage.getItem('chat-conversation-id')` 换为：

```ts
const savedId = loadPref<string | null>('chat-conversation-id', null)
if (savedId && conversations.value.some(c => c.conversationId === savedId)) {
  currentConversationId.value = savedId
}
```

264、404 行 `localStorage.setItem('chat-conversation-id', convId)` 换为 `savePref('chat-conversation-id', convId)`。

- [ ] **Step 3: 类型检查**

Run: `cd /f/kjl-study/AIStudio/frontend && npx vue-tsc --noEmit 2>&1 | grep -iE "SkillsView|ChatView" | head -10`
Expected: 无输出

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/views/skills/SkillsView.vue frontend/src/views/chat/ChatView.vue && git commit -m "feat(skills,chat): 技能折叠状态与最近会话接入 userPrefs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 双浏览器实战验收 + 收尾

**Files:** 无新文件（端到端验收）

- [ ] **Step 1: 确认前后端运行中**

Run: `netstat -ano | grep -E ":(8090|8091) " | grep LISTENING`
Expected: 两个端口均 LISTENING（8090 是 Vite 热更新，Task 5-9 改动即时生效）

- [ ] **Step 2: 浏览器 A（localhost:8090）设置配置**

登录 admin/admin123 → 需求看板改一个查询 ID → 需求归集改一个链接 → 知识库列显隐切换一列。
F12 控制台验证：

```js
// 应看到后端 PUT 已发出（Network 过滤 user/prefs）且 200
// 本地也有值：
localStorage.getItem('reqboard.config.v1')
```

- [ ] **Step 3: 浏览器 B（192.168.5.14:8090）验证同步**

同机或另一台电脑浏览器打开 `http://192.168.5.14:8090`，登录 admin → 打开需求看板。
Expected: 查询 ID 与浏览器 A 一致（首次进入约 1 秒内后端校准完成）；知识库列显隐一致。

- [ ] **Step 4: 反向验证**

在浏览器 B 改配置 → 刷新浏览器 A（F5）。
Expected: A 显示 B 的修改。

- [ ] **Step 5: 降级验证（后端不可用仍可用）**

停掉后端（关 RACC-后端-8091 窗口）→ 浏览器操作需求看板改配置。
Expected: 改动正常保存进 localStorage，页面无报错弹窗（console 有 [userPrefs] warn 属预期）→ 重启后端。

- [ ] **Step 6: 最终提交（如有遗漏改动）**

```bash
cd /f/kjl-study/AIStudio && git status --short | grep -v "^??" | head
# 若有本次相关未提交改动，补充提交：
git add -A && git commit -m "feat(userprefs): 接入收尾与验收修正

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: 汇报验收结果**

向用户报告：7 个 key 全部接入清单、双浏览器验收截图/结论、降级行为说明。
