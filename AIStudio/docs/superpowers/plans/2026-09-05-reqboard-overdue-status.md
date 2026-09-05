# 需求看板「超期状态」字段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 需求看板全部 6 个 Tab 的列表新增「目标日期」「超期状态」两列，超期状态由前端按 TargetDate 与当天日期实时计算（五态：已超期/今日到期/正常/已关闭/无日期）。

**Architecture:** 全链路透传 TFS 字段 `Microsoft.VSTS.Scheduling.TargetDate`：MCP Server `formatWorkItem` 补取字段 → 前端 `TfsWorkItem` 类型与 `FIELD_ALIASES` 归一 → 表格加两列、渲染时调 `overdueStatusOf` 计算。后端 Spring Boot 零改动（`TfsBridgeController` 对 MCP 返回 JSON 透传）。

**Tech Stack:** Vue 3 `<script setup>` + TypeScript + Element Plus（前端）；Node.js ESM（MCP Server，无构建步骤）。设计文档：`docs/superpowers/specs/2026-09-05-reqboard-overdue-status-design.md`。

**重要环境约束：**
- 项目目录 `F:\kjl-study\AIStudio`，bash 路径写 `/f/kjl-study/AIStudio`。git 仓库根在 `F:\kjl-study`（父目录），git 命令在 AIStudio 子目录内可直接执行，`git add` 用相对路径。
- `data/mcp/tfs-query-winex/tfs-client.mjs` 在 `.gitignore`（`AIStudio/data/`）内，**不进 git**。后端每次工具调用临时 spawn MCP 进程（见 `TfsBridgeService` 注释），所以 MCP 改动对下一次调用即生效，无需重启后端。
- 后端 `/api/tfs/query`、`/api/tfs/following` 有 **120s 内存缓存**（`TfsBridgeController` QUERY_TTL_MS），改完 MCP 后看板可能最长 2 分钟仍返回旧数据（无 targetDate 字段）。验证时遇到可等缓存过期或重启后端。
- 前端无单测基建，自动化验证关卡是 `npm run build`（= `vue-tsc -b && vite build`）。dev server（8090）带 HMR，改动保存后浏览器刷新即可见。
- 组件内已有局部 `formatDate`（包装 `formatDateTime`，输出带时分秒）；目标日期列要**只显示日期**，故从 `@/utils/format` 以别名 `formatDateOnly` 引入 `formatDate`。

**明确的非目标（设计 §3）：** 不改筛选栏/统计栏/`hasFilter`/`filteredActiveItems`/`resetFilters`；不加超期筛选；不加统计计数；不开表头排序（不加 `sortable`）。

---

### Task 1: MCP Server formatWorkItem 透传 targetDate

**Files:**
- Modify: `F:\kjl-study\AIStudio\data\mcp\tfs-query-winex\tfs-client.mjs`（`formatWorkItem` 方法内，当前 186-192 行）

- [ ] **Step 1: 在 requirementType 行后加 targetDate 取值**

用 Edit 工具。old_string（文件中唯一，含行首 6 空格缩进）：

```
      // 需求性质（卫宁口径：功能性/接口/软件质量），需求归集软质统计依赖此字段
      requirementType: fields['Microsoft.VSTS.CMMI.RequirementType'] || '',
      // 需求看板详情抽屉：需求分析（卫宁自定义字段）/ 验收标准（TFS 标准字段）
      requirementAnalysis: fields['Winning.Demand.Analysis'] || '',
```

new_string：

```
      // 需求性质（卫宁口径：功能性/接口/软件质量），需求归集软质统计依赖此字段
      requirementType: fields['Microsoft.VSTS.CMMI.RequirementType'] || '',
      // 目标日期（TFS 调度字段），需求看板超期状态判定依据
      targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate'] || '',
      // 需求看板详情抽屉：需求分析（卫宁自定义字段）/ 验收标准（TFS 标准字段）
      requirementAnalysis: fields['Winning.Demand.Analysis'] || '',
```

- [ ] **Step 2: 语法检查**

Run: `node --check "F:\kjl-study\AIStudio\data\mcp\tfs-query-winex\tfs-client.mjs"`
Expected: 无任何输出、退出码 0。

- [ ] **Step 3: 无 git 操作**

该文件被 `.gitignore` 排除（`AIStudio/data/`），是运行时文件。改动即生效（后端每次调用临时 spawn MCP 进程）。**禁止**执行 `git add -f`。

---

### Task 2: 前端类型定义与字段别名归一

**Files:**
- Modify: `F:\kjl-study\AIStudio\frontend\src\api\tfs.ts`（`TfsWorkItem` 接口，当前 9-10 行）
- Modify: `F:\kjl-study\AIStudio\frontend\src\views\requirements\RequirementsView.vue`（`FIELD_ALIASES`，当前 604-605 行）

- [ ] **Step 1: TfsWorkItem 接口加 targetDate 可选字段**

Edit `frontend/src/api/tfs.ts`。old_string：

```
  /** 需求性质（卫宁自定义字段 Microsoft.VSTS.CMMI.RequirementType：功能性/接口/软件质量） */
  requirementType?: string
```

new_string：

```
  /** 需求性质（卫宁自定义字段 Microsoft.VSTS.CMMI.RequirementType：功能性/接口/软件质量） */
  requirementType?: string
  /** 目标日期（TFS 调度字段 Microsoft.VSTS.Scheduling.TargetDate），超期状态判定依据 */
  targetDate?: string
```

- [ ] **Step 2: FIELD_ALIASES 加 targetDate 别名行（MCP 数据源归一用）**

Edit `frontend/src/views/requirements/RequirementsView.vue`。old_string：

```
  requirementAnalysis: ['requirementAnalysis'],
  url: ['url', 'htmlLink']
```

new_string：

```
  requirementAnalysis: ['requirementAnalysis'],
  targetDate: ['targetDate', 'TargetDate', 'Microsoft.VSTS.Scheduling.TargetDate'],
  url: ['url', 'htmlLink']
```

- [ ] **Step 3: 构建验证**

Run: `cd /f/kjl-study/AIStudio/frontend && npm run build`
Expected: `vue-tsc -b` 无类型错误，`vite build` 输出 `✓ built in ...`。

- [ ] **Step 4: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/api/tfs.ts frontend/src/views/requirements/RequirementsView.vue && git commit -m "feat(frontend): 需求看板超期状态——TfsWorkItem 类型与字段别名透传 targetDate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: 提交成功，只含上述 2 个文件（`RequirementsView.vue` 本步只有 FIELD_ALIASES 一行改动）。

---

### Task 3: 超期状态计算函数 + 表格两列 + 详情抽屉 + 样式

**Files:**
- Modify: `F:\kjl-study\AIStudio\frontend\src\views\requirements\RequirementsView.vue`（模板区/工具函数区/样式区，4 处 Edit + 1 处构建验证）

- [ ] **Step 1: 引入日期格式化工具（日期列只显示年月日）**

Edit。old_string：

```
import { formatDateTime } from '@/utils/format'
```

new_string：

```
import { formatDateTime, formatDate as formatDateOnly } from '@/utils/format'
```

- [ ] **Step 2: 工具函数区加 overdueStatusOf（在 stateTagColor 后）**

Edit。old_string：

```
function stateTagColor(state: string) {
  const map: Record<string, string> = { 'Active': 'warning', 'Resolved': 'success', 'Closed': 'info', 'New': 'primary' }
  return (map[state] || 'info') as any
}
```

new_string：

```
function stateTagColor(state: string) {
  const map: Record<string, string> = { 'Active': 'warning', 'Resolved': 'success', 'Closed': 'info', 'New': 'primary' }
  return (map[state] || 'info') as any
}

// ========== 超期状态（目标日期 vs 当天，渲染时实时计算） ==========
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

- [ ] **Step 3: 列表加「目标日期」「超期状态」两列（状态列后、指派人列前）**

Edit。old_string：

```
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="stateTagColor(row.state)" size="small">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="指派人" width="120" show-overflow-tooltip />
```

new_string：

```
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="stateTagColor(row.state)" size="small">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetDate" label="目标日期" width="110">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': overdueStatusOf(row) === 'overdue' }">{{ formatDateOnly(row.targetDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="超期状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="overdueStatusOf(row) === 'overdue'" type="danger" size="small">已超期</el-tag>
            <el-tag v-else-if="overdueStatusOf(row) === 'dueToday'" type="warning" size="small">今日到期</el-tag>
            <el-tag v-else-if="overdueStatusOf(row) === 'normal'" type="info" size="small">正常</el-tag>
            <span v-else style="color: #b8b1a0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="指派人" width="120" show-overflow-tooltip />
```

同时把列顺序注释（119 行）更新为含新列。Edit。old_string：

```
        <!-- 列顺序：ID、标题、类型、产品名称、优先级、状态、指派人、客户名称、创建时间、操作 -->
```

new_string：

```
        <!-- 列顺序：ID、标题、类型、产品名称、优先级、状态、目标日期、超期状态、指派人、客户名称、创建时间、操作 -->
```

- [ ] **Step 4: 详情抽屉加「目标日期」项（迭代路径行后）**

Edit。old_string：

```
          <el-descriptions-item label="迭代路径" :span="2">{{ selectedItem.iterationPath || '-' }}</el-descriptions-item>
```

new_string：

```
          <el-descriptions-item label="迭代路径" :span="2">{{ selectedItem.iterationPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目标日期" :span="2">{{ formatDateOnly(selectedItem.targetDate) }}</el-descriptions-item>
```

- [ ] **Step 5: 样式区加 .overdue-date（超期日期标红）**

Edit。old_string：

```
.id-link:hover {
  text-decoration: underline;
}
```

new_string：

```
.id-link:hover {
  text-decoration: underline;
}

.overdue-date {
  color: var(--el-color-danger);
  font-weight: 600;
}
```

- [ ] **Step 6: 构建验证**

Run: `cd /f/kjl-study/AIStudio/frontend && npm run build`
Expected: `vue-tsc -b` 无类型错误（重点确认 `formatDateOnly`、`overdueStatusOf`、`OverdueStatus` 无未使用/未定义报错），`vite build` 成功。

- [ ] **Step 7: Commit**

```bash
cd /f/kjl-study/AIStudio && git add frontend/src/views/requirements/RequirementsView.vue && git commit -m "feat(frontend): 需求看板列表与详情增加目标日期、超期状态列（前端实时计算五态）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: 提交成功，只含 1 个文件。

---

### Task 4: 运行验证（设计 §4 手工验收清单）

**Files:** 无代码改动。验证环境：后端 8091 运行中、前端 dev 8090 运行中、MySQL 3306 运行中（本会话开头已启动）。

- [ ] **Step 1: TFS 数据源 Tab 验证（病历库存 Tab 有默认查询 ID）**

浏览器打开 `http://localhost:8090` → 登录 admin/admin123 → 需求看板 → 「病历库存」Tab → 点工具栏「刷新」。
Expected: 表格出现「目标日期」「超期状态」两列（状态列右侧）；有目标日期的行显示 `YYYY-MM-DD` 与状态 tag；无日期的行两列显示 `-`。
若改动后 2 分钟内刷新仍无新列数据，属后端 120s 缓存（见环境约束），等待后重试或重启后端。

- [ ] **Step 2: MCP 数据源 Tab 验证（关注需求 Tab 默认 MCP）**

切到「关注需求」Tab → 刷新。
Expected: 同样出现两列，数据来自 MCP following（`formatWorkItem` 已含 targetDate）。

- [ ] **Step 3: 五种形态判定正确性验证**

用 TFS 网页端（`http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0`）找/改一条测试工作项的 `Microsoft.VSTS.Scheduling.TargetDate` 与状态，对照看板：
- TargetDate 过去日期 + 状态 Active → 红字日期 + 红 tag「已超期」
- TargetDate = 今天 + 未关闭 → 橙 tag「今日到期」
- TargetDate = 未来日期 + 未关闭 → 灰 tag「正常」
- 状态 Closed/Resolved/已完成/已关闭/Done（任一）→ 两列显示 `-`（closed 态）
- 无 TargetDate → 两列显示 `-`（none 态）
注意：改完 TFS 后看板需等 120s 缓存过期或重启后端才能看到新数据。

- [ ] **Step 4: 详情抽屉验证**

点开任一行 → 抽屉「迭代路径」下一行出现「目标日期」，值与列表列一致。

- [ ] **Step 5: 回归验证**

逐项确认与改动前一致：ID/状态/产品名称/客户名称筛选与「重置」；Tab 切换后查询条件记忆（localStorage `reqboard.ui.v1`）；统计栏状态标签点击联动；分页与页大小记忆；行点击详情；「启动自动化」跳转预填需求号。

- [ ] **Step 6: 验证通过后推送（可选，按用户指示）**

```bash
cd /f/kjl-study/AIStudio && git push origin main
```

Expected: 推送成功。若远端有新提交被拒，先 `git pull --rebase origin main` 处理冲突后再推。
