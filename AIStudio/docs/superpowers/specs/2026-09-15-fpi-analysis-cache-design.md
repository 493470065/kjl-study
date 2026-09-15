# 合理性设计分析结果缓存 — 设计文档

**日期**: 2026-09-15
**模块**: AIStudio 需求归集（RequirementCollectView）+ 后端新增分析结果存储
**方案**: B（后端持久化，用户选定）

---

## 1. 背景与目标

需求归集界面 → 功能点健康度列表 →「合理性设计」抽屉中的「合理性设计分析」，当前每次打开都重新执行技能（`openFpiAnalysis` 自动触发 `runFpiAnalysis()`），结果只存前端内存，关闭即丢。

**目标**：
- 每次进入抽屉，展示**最近一次分析结果**（从后端读取）
- 只有**人工点击「执行分析」**才重新执行技能并覆盖存储
- 归集数据已变化时展示**过期横幅**提示（不自动重跑）

**已确认决策**：跨设备跟随用户（按登录用户隔离）、按功能点各自缓存、数据变化展示过期横幅。

## 2. 数据模型

新表 `fpi_analysis_result`（每用户每功能点一行，覆盖式保存最近一次）：

```sql
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

要点：
- 唯一键 `(user_id, line_key, fp_code)`：同一用户同一功能点仅存最近一次，覆盖式更新（upsert）
- `result_md` 用 LONGTEXT（与 `user_preference.pref_value` 同款），单份报告一般 15KB~几十KB，无压力
- `data_fingerprint`：分析成功时对当次工单明细计算的指纹（算法见 §4）
- `fp_snapshot`：当次传给技能的 `fp` 对象 JSON 快照（用于过期横幅对比工单数变化）

**迁移脚本**：`db/03_migrations/001_add_fpi_analysis_result.sql`（幂等 `CREATE TABLE IF NOT EXISTS`），与代码同一 commit 提交；`01_schema.sql` 同步补齐该表（新机器从零部署直接可用）。

## 3. 后端 API（新模块 `com.racc.fpianalysis`）

仿照 `userpref` 模块四件套（Controller / Service / Entity / Repository）：

| 方法 | 路径 | 说明 |
|:--|:--|:--|
| GET | `/api/fpi-analysis/{lineKey}/{fpCode}` | 读取最近一次分析结果；无则返回 `{"value": null}` |
| PUT | `/api/fpi-analysis/{lineKey}/{fpCode}` | 保存/覆盖最近一次分析结果（body 为 JSON：resultMd、skillName、dataFingerprint、fpSnapshot、execDurationMs） |
| DELETE | `/api/fpi-analysis/{lineKey}/{fpCode}` | 删除该功能点的分析结果（供「清除缓存」能力，前端暂不暴露入口，YAGNI 留接口） |

- userId 从 `SecurityContextHolder` 解析（与 `UserPreferenceController.resolveUserId` 一致），未登录 401
- 并发 upsert 复用 `UserPreferenceService` 的「撞唯一约束后 REQUIRES_NEW 重试」手法
- `lineKey` 白名单校验：`inpatient|outpatient|emergency`；`fpCode` ≤128 字符校验
- 权限：登录用户即可（与 userpref 一致，数据按 userId 天然隔离）

## 4. 前端交互（RequirementCollectView.vue）

### 4.1 数据指纹

```ts
function calcFingerprint(items: FpiWorkItemRef[]): string
// items 各工单 id 升序拼接 → 简单字符串 hash（djb2）→ "n{数量}h{hash}"
```

- 指纹输入 = `analysisReqItems(row).concat(analysisSoftItems(row))` 的工单 id 集合（含各 id 前数量），工单增减/变更即变化
- 分析成功保存时计算并存 `dataFingerprint`；打开抽屉时对当前数据重新计算并对比

### 4.2 打开抽屉流程（`openFpiAnalysis` 改造）

```
openFpiAnalysis(row)
  → 展示行元信息（原有）
  → GET /api/fpi-analysis/{line}/{code}
      ├─ 命中 → fpiAnalysisText = resultMd；显示信息条「最近分析：{updated_at 格式化} · 技能 {skill_name} · 耗时 {duration}」
      │         → 比对指纹：不一致 → 追加过期横幅「⚠️ 归集数据已变化（工单 {old}→{new}），结果可能过期，可点击重新分析」
      │         → 不自动执行技能
      ├─ 未命中（value null）→ 显示「尚未分析过，请点击「执行分析」」（保持现状的提示语风格）
      └─ 请求失败（网络/后端异常）→ 显示提示语，行为退化为现状（手动点执行分析可跑）
```

### 4.3 执行分析流程（`runFpiAnalysis` 改造）

- 入口不变：顶部「执行分析」按钮 + 底部「重新分析」按钮（二者同一函数）
- 技能执行成功（`res.success && stdout 非空`）后：
  1. 正常渲染结果（现状）
  2. `PUT /api/fpi-analysis/{line}/{code}` 保存 `{resultMd: stdout, skillName, dataFingerprint: 当前指纹, fpSnapshot: args.fp, execDurationMs}`
  3. 保存失败仅 console.warn + 界面小字提示「结果保存失败」，不影响本次展示
- 技能执行失败/超时不写缓存（保留旧结果）

### 4.4 关键行为变化表

| 场景 | 现状 | 改后 |
|:--|:--|:--|
| 打开抽屉（已配置技能） | 自动执行技能 | 读缓存展示，不执行 |
| 打开抽屉（从未分析过） | 自动执行技能 | 提示「尚未分析过」 |
| 点「执行分析」 | 执行+内存展示 | 执行+展示+落库 |
| 点「重新分析」 | 执行+内存展示 | 执行+展示+覆盖落库 |
| 换设备/刷新页面 | 结果丢失 | 缓存仍在（按用户） |
| 数据变化 | 无感知 | 过期横幅提示 |

### 4.5 UI 增量

- 分析 Tab 顶部新增**信息条**（命中缓存时）：最近分析时间、技能名、耗时
- 信息条下方可选**过期横幅**（指纹不一致时）：警告样式
- 复用现有 `ana-cfg-bar`、markdown 渲染、`fpiReportParsed` 结构化卡片逻辑——`fpiReportParsed` 基于 `fpiAnalysisText` computed，缓存文本填入后自动生效，无需额外适配

### 4.6 API 封装

`frontend/src/api/` 新增（或挂在合适现有 api 文件）：

```ts
fpiAnalysisApi = {
  get(lineKey, fpCode): Promise<{ value: FpiAnalysisCache | null }>
  save(lineKey, fpCode, payload): Promise<void>
  remove(lineKey, fpCode): Promise<void>
}
```

## 5. 边界与错误处理

| 场景 | 处理 |
|:--|:--|
| 未登录/会话过期 | 401 由 http 拦截器统一处理（跳登录），与现状一致 |
| 后端不可达 | 读取失败→显示提示，可手动执行；保存失败→console.warn+小字提示，不阻断 |
| stdout 为空 | 不写缓存（视为失败，现状已提示） |
| 超长结果（>4MB） | LONGTEXT 可存；PUT body 走 axios 默认无截断；前端不做截断（完整保存） |
| `_unmatched` 行 | 抽屉入口按钮本身只对非 `_unmatched` 行显示（`v-if="!row._unmatched"`），无需处理 |
| 并发覆盖（两设备同时分析同一功能点） | 后写赢（upsert 语义），符合「最近一次」语义 |
| 功能点编码变化（spec-code-rename） | 旧编码缓存自然失效成「未分析过」，无迁移需求 |
| lineSkills 未配置该条线 | `row` 本身来自技能数据源，能打开抽屉必有条线上下文；`lineKey` 从 `activeLine`（当前条线状态）取值 |

## 6. 验收标准

1. 打开抽屉（有缓存）→ 显示最近一次结果 + 信息条，网络面板**无** `/exec` 调用
2. 数据指纹一致时无过期横幅；手工改动工单集合（重新归集后数量变化）→ 出现过期横幅
3. 点「执行分析」→ 技能真实执行 → 展示新结果 → 后端表有记录（updated_at 刷新）
4. 刷新页面/换浏览器登录同账号 → 打开抽屉仍显示缓存结果
5. 从未分析的功能点 → 显示「尚未分析过」，不自动执行
6. 技能执行失败 → 旧缓存保留不变
7. 迁移脚本幂等可重复执行；`01_schema.sql` 与迁移脚本表结构一致

## 7. 范围外（YAGNI）

- 多版本历史记录（只存最近一次）
- 共享/跨用户分析结果
- 前端删除缓存入口（后端 DELETE 接口预留）
- 缓存容量上限/LRU（数据库存储，无需）
