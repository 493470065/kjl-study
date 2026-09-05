# 需求看板「超期状态」字段设计

- 日期：2026-09-05（口径修订：2026-09-05 运行验证后，经用户确认切换判定基准）
- 状态：已交付（用户逐节批准 §1-§4；口径切换后终审 Ready）
- 范围：AIStudio 需求看板（RequirementsView.vue）全部 6 个 Tab 的列表增加「超期状态」「完成日期」两列

> **⚠️ 口径修订（2026-09-05，运行验证后）**：初版设计以 `Microsoft.VSTS.Scheduling.TargetDate`（目标日期）为判定基准，实测 652 个工作项中该字段填充率为 0，功能不可用。经用户确认，判定基准切换为积压报表 SQL 口径的「完成日期」`Microsoft.VSTS.Scheduling.FinishDate`（实测填充率约 75%），终结态词表改为 `['已关闭', '已验证', 'Closed']`（「已解决 Resolved」不算终结态，仍参与延期判定）。下文 §1-§3 中所有 TargetDate/targetDate/目标日期 字样均应按此修订理解为 FinishDate/finishDate/完成日期；列名、注释、代码已全部落实修订，本文档其余部分保留初版结构供追溯。

## 背景与目标

需求看板 6 个 Tab（关注需求/多语翻译/多语专项/病历库存/spec需求/Aiflow需求）共用一张工作项列表，用户要求各 Tab 列表增加「超期状态」字段，用于一眼识别逾期未关闭的需求。

## 关键口径（用户确认）

1. **判定基准**：TFS 目标日期字段 `Microsoft.VSTS.Scheduling.TargetDate`。
2. **展示规则**：已超期 / 今日到期 / 正常 三态 + 无日期、已关闭显示 `-`。
3. **配套能力**：仅同时显示「目标日期」列；不加超期筛选、不加统计栏计数、不加默认排序。

## 方案选型

采用 **方案 A：全链路透传 `targetDate` 字段 + 前端计算超期状态**。

- 方案 B（前端读原始未归一化字段）不可行：TFS 数据源 Tab 的数据来自后端 `formatWorkItem` 产物，不含 TargetDate，会全部显示无日期。
- 方案 C（后端计算 overdueStatus）不推荐：120s 后端缓存中的预计算状态会跨天失真，改动链路最长。

方案 A 优势：后端零改动；超期状态前端实时计算，跨天自动正确；MCP 与 TFS 两种数据源口径一致。

## 设计 §1 数据层

**改动 1 — MCP Server** `data/mcp/tfs-query-winex/tfs-client.mjs` 的 `formatWorkItem()`（现 161-194 行）：

在 `requirementType` 行后增加：

```js
targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate'] || '',
```

TFS 返回 ISO 串（如 `"2026-09-10T00:00:00Z"`）或空。

**改动 2 — 前端类型与别名**：

- `frontend/src/api/tfs.ts` 的 `TfsWorkItem` 增加 `targetDate?: string`。
- `frontend/src/views/requirements/RequirementsView.vue` 的 `FIELD_ALIASES` 增加：

```ts
targetDate: ['targetDate', 'TargetDate', 'Microsoft.VSTS.Scheduling.TargetDate'],
```

MCP 数据源按别名归一，TFS 数据源直取改动 1 的字段，两口径一致。

**后端零改动**（`TfsBridgeController` 透传 MCP JSON）。

## 设计 §2 展示层

**超期状态计算函数**（`RequirementsView.vue` 工具函数区）：

```ts
type OverdueStatus = 'overdue' | 'dueToday' | 'normal' | 'closed' | 'none'

/** 超期状态：未关闭 + 目标日期已过 → 已超期；目标日期为今天 → 今日到期；其余正常；无日期 → none */
function overdueStatusOf(item: TfsWorkItem): OverdueStatus {
  if (!item.targetDate) return 'none'
  const closedStates = ['Closed', '已完成', '已关闭', 'Done', 'Resolved']
  if (closedStates.includes(item.state)) return 'closed'
  // 目标日期取本地日期（TFS 传 UTC 午夜零点，直接比日期避免时区差一天）
  const d = new Date(item.targetDate)
  const today = new Date()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'dueToday'
  return 'normal'
}
```

「已关闭」状态词表 `['Closed', 'Resolved', '已完成', '已关闭', 'Done']` 与 `stateTagColor` 词表同源维护；实测发现其它终结态词（如「已拒绝」）时补词表即可。

**列表两列**（「状态」列后、「指派人」列前插入，列顺序：ID、标题、类型、产品名称、优先级、状态、目标日期、超期状态、指派人、客户名称、创建时间、操作）：

| 列 | 宽度 | 渲染 |
|----|------|------|
| 目标日期 | 110px | `formatDate(row.targetDate)`；overdue 时文字标红 |
| 超期状态 | 100px | `el-tag`：overdue→红「已超期」(danger)；dueToday→橙「今日到期」(warning)；normal→灰「正常」(info)；closed/none→`-`（灰色空值风格） |

**详情抽屉**：「迭代路径」行后加「目标日期」项，显示日期原文，不加超期状态。

**列宽**：新增 210px 由标题/客户名称的 `min-width` 弹性列吸收，不加横向滚动条。

## 设计 §3 交互与持久化

- 筛选栏、统计栏、`hasFilter`/`filteredActiveItems`/`resetFilters` 全部不动。
- `reqboard.ui.v1` 持久化不含列定义，无需迁移。
- 超期状态渲染时实时计算，不落数据不进缓存；跨天刷新页面即自动更新。
- 不开列表排序（与现有列一致，Element Plus 需显式 `sortable`）。
- 自定义 MCP 工具若返回字段名不在别名表内，该 Tab 显示 `-`，不报错不影响其它列（合理降级）。

## 设计 §4 测试与验收

验证方式（无前端自动化测试基建，以实际运行验证为主）：

1. `frontend` 跑 `npm run build`（vite + vue-tsc）无类型错误。
2. TFS 数据源 Tab（病历库存有默认查询 ID）确认两列出现、有/无日期渲染正确。
3. MCP 数据源 Tab（关注需求默认 MCP）确认两列正常。
4. 判定正确性：过去日期未关闭→红「已超期」；今天→橙「今日到期」；未来→灰「正常」；Closed→`-`。
5. 详情抽屉「目标日期」与列表一致。
6. 回归：筛选、Tab 记忆、统计栏、分页、启动自动化行为不变。

**验收标准**：

- 6 个 Tab 均出现两列，TFS/MCP 数据源口径一致。
- 超期/今日到期/正常/无日期/已关闭 五种形态符合 §2 定义。
- `npm run build` 通过。
- 现有功能零回归。

## 改动文件清单（3 个，后端 0 个）

| 文件 | 改动 |
|------|------|
| `data/mcp/tfs-query-winex/tfs-client.mjs` | `formatWorkItem` 增加 `targetDate` 字段 |
| `frontend/src/api/tfs.ts` | `TfsWorkItem` 加 `targetDate?: string` |
| `frontend/src/views/requirements/RequirementsView.vue` | 别名表 + 计算函数 + 两列 + 抽屉项 |

## 已知限制

- `data/mcp/` 在 `.gitignore` 中（运行时数据目录），`tfs-client.mjs` 的改动**不随 git 提交**，重启后端/MCP 进程后生效；换电脑/重建 data 目录需重新加该行。
- 「已超期」的判定含今天以前所有未关闭项；若未来需要「超期天数」细分（如超期 >7 天强化提示），属后续迭代。
