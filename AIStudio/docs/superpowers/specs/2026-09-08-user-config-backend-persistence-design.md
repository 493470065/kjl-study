# 设计文档：用户配置后端持久化（userPrefs）

- 日期：2026-09-08
- 状态：已获用户批准（架构/后端/前端三节均确认）
- 背景：系统通过局域网 IP 访问时，与 localhost 属不同浏览器源，localStorage 隔离导致配置"丢失"。

## 1. 目标

把前端散落在 localStorage 的 7 个功能 key 迁移为后端按用户持久化，实现换电脑、换浏览器、换访问地址（localhost ↔ 局域网 IP）后配置一致。登录令牌 `auth` 不在迁移范围。

## 2. 已确认决策

| 决策点 | 结论 |
|---|---|
| 迁移范围 | 全部 7 个功能 key（A） |
| 迁移策略 | 后端优先 + 自动合并：双写本地+后端，读时本地先行、后端校准 |
| 存储结构 | 通用 KV 表 user_preference（user_id + pref_key + pref_value JSON） |
| 共享机制 | 严格按用户隔离，无全局默认（本期 YAGNI） |
| 前端接入 | 方案一：通用 `src/utils/userPrefs.ts` 工具模块（非 Pinia store、非视图直连） |

## 3. 架构与数据流

```
浏览器 A（localhost）      浏览器 B（192.168.5.14）
        │  loadPref/savePref        │
        └──────────┬─────────────────┘
                   ▼
        src/utils/userPrefs.ts   ← 唯一接入点
        ① 读：本地先行 → 后端 GET 校准（fire-and-forget）
        ② 写：同步写 localStorage → 异步 PUT 后端（失败仅 console.warn）
                   ▼
        后端 UserPreferenceController  /api/user/prefs/{key}
                   ▼
        user_preference 表（user_id + pref_key 唯一）
```

读时序：先读 localStorage 立即渲染（零等待）→ 后台 GET 后端；后端返回非空值且与本地不同 → 写回 localStorage 并 dispatch `userprefs-updated:{key}` 事件，视图监听刷新。后端失败/无值 → 静默保持本地。

写时序：写本地 + POST 后端并行；后端失败不阻断 UI、不弹错。

## 4. 后端设计（新包 com.racc.userpref）

表结构（JPA ddl-auto: update 自动建表，无需 SQL 脚本）：

```
user_preference
├── id          BIGINT PK 自增
├── user_id     BIGINT NOT NULL
├── pref_key    VARCHAR(64) NOT NULL
├── pref_value  TEXT                 ← JSON 原文，后端不感知结构
├── updated_at  DATETIME
└── UNIQUE(user_id, pref_key)        ← save 为 upsert
```

组件（com/racc/userpref/ 下 4 文件）：

| 文件 | 职责 |
|---|---|
| entity/UserPreferenceEntity.java | JPA 实体 |
| repository/UserPreferenceRepository.java | findByUserIdAndPrefKey / findByUserId |
| service/UserPreferenceService.java | getPref（无值返回 null）/ savePref（查→无则建→覆盖→存） |
| controller/UserPreferenceController.java | GET/PUT /api/user/prefs/{key}；resolveUserId() 与 UserConfigController 一致 |

接口约定：
- `GET /api/user/prefs/{key}` → `200 {"value": <json|null>}`
- `PUT /api/user/prefs/{key}` body 为 JSON 原文，原样存取
- key 白名单：仅 `[a-zA-Z0-9._-]`，长度 ≤64，否则 400
- 未登录 401；每条记录绑定当前登录用户，禁止跨用户读写
- 认证链与 `/api/user/config/**` 同级（现有 JWT 体系）

## 5. 前端设计

新文件 `src/utils/userPrefs.ts`：

```ts
loadPref<T>(key: string, defaultValue: T): T   // 同步返回本地值，异步后端校准
savePref(key: string, value: unknown): void    // 双写本地+后端
```

- loadPref：同步读 localStorage 返回；同会话每 key 仅发一次后端 GET（Set 去重）；后端非空值 → 写回本地 + dispatch `userprefs-updated:{key}`；失败静默。
- savePref：同步写 localStorage → 异步 PUT，失败仅 console.warn。
- 复用 `src/api/http.ts` 的请求封装与 `getStoredToken()`。

7 个配置点接入（每处 2-4 行，替换 getItem/setItem 并加事件监听）：

| 文件 | key |
|---|---|
| RequirementsView.vue | reqboard.config.v1、reqboard.ui.v1 |
| RequirementCollectView.vue | reqcollect.links.v1 |
| KnowledgeView.vue | kv_column_visibility、kv_fixed_column_visibility、kv_scan_fixed_column_visibility |
| SkillsView.vue | skills.collapsed.v1 |
| ChatView.vue | chat-conversation-id |

兼容性：localStorage 保留双写，旧数据即首屏值，迁移零操作；后端不可用时退化为纯本地模式（与现状一致）；`auth` 不动。

## 6. 错误处理

- 后端不可达：读→保持本地；写→console.warn，UI 正常。
- 后端 401（登录过期）：静默跳过，不弹错（与现状一致，由全局 http 拦截处理）。
- 非法 key：后端 400，前端 key 均为常量，正常不触发。
- JSON 解析失败：loadPref 捕获，回退 defaultValue。

## 7. 测试策略

- 后端单测：UserPreferenceService —— get 无值/有值、save 新建/更新、upsert 幂等、key 白名单拒绝。
- 前端：userPrefs 单元行为核对 + 双浏览器实战验收：localhost 改配置 → 192.168.5.14 打开可见（反向同样）。
- 回归：后端停止时全页面正常使用（纯本地模式）。

## 8. 非目标（YAGNI）

- 全局默认配置层（管理员可设全员默认）
- 配置版本历史/审计
- 配置导入导出 UI
- sessionStorage 类配置（`auth`）迁移
