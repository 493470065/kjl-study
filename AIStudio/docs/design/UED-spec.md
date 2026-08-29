# 景磊的AI工作站 · UED 规范

> 本规范沉淀自 2026-08-29 全站 UED 审计与重设计（见 `2026-08-29-ued-redesign-proposal.md`）。
> **所有新功能、新页面必须对照本规范实现**；发现规范未覆盖的场景，先补充本规范再写代码。
> 视觉基调：**江南水墨**——黛青为骨、宣纸为底、朱砂点睛，克制、留白、功能优先。

---

## 1. 设计令牌（唯一事实来源）

全部定义在 `frontend/src/App.vue` 的 `:root`，**禁止在页面里硬编码下列色值**，一律引用变量。

### 1.1 色彩

| 令牌 | 值 | 用途 |
|---|---|---|
| `--el-color-primary`（黛青） | `#41556d` | 主按钮、链接、选中态、激活指示 |
| primary 梯度 | `#6e7f91 / #93a1b1 / #bcc4cf / #d5dae1 / #edeff3`、dark `#334356` | hover、浅色背景（Element 自动使用） |
| `--ink-deep / --ink / --ink-light` | `#201f1c / #2c2a26 / #4a4741` | 侧栏框架（浓墨） |
| `--ink-text-on-dark` | `#d8d2c2` | 深色侧栏上的文字 |
| `--paper / --paper-light / --paper-card` | `#f6f3ec / #f0ebdf / #fbf9f4` | 页面底 / 浅底 / 卡片底（宣纸） |
| `--paper-border` | `#e3ddce` | 常规边框（墨痕） |
| `--seal`（朱砂） | `#a8452f` | **仅品牌点缀**：Logo 印章、激活菜单朱砂条、头像底 |
| `--ink-text / --ink-text-regular / --ink-text-secondary` | `#3d3a34 / #5f5b52 / #6f6a5e` | 主/常规/次级文字 |
| `--viz-*`（blue/indigo/orange/purple/violet/magenta/cyan/teal/green/slate/gray） | 见 `App.vue :root` | **数据可视化专用**：流程事件、图谱节点、图表系列。不属于语义色，禁止用于状态徽章 |

### 1.2 语义色（功能直觉优先，不做水墨化）

| 色 | 语义 | 唯一性约束 |
|---|---|---|
| success `#67c23a` | 成功 / 已启用 / 完成 | |
| warning `#e6a23c` | **运行中 / 执行中** / 等待 / 需关注 | 「运行中」全站只有这一种颜色 |
| danger `#f56c6c` | **仅**失败 / 错误 / 危险操作按钮 | 禁止用于角色、运行状态等非危险语义 |
| info | 已停止 / 草稿 / 中性 | |

状态 → 徽章**必须**走 `useStatusTag`（`composables/useStatusTag.ts`），禁止各页面自写映射：

```ts
import { useStatusTag } from '@/composables/useStatusTag'
const { statusType, statusLabel } = useStatusTag()
// <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
```

### 1.3 字体与排版

| 令牌 | 栈 | 用途 |
|---|---|---|
| `--app-font-sans` | 系统字体栈（中文落到微软雅黑） | 所有正文（`--el-font-family` 已同步） |
| `--app-font-mono` | Consolas, Menlo, Monaco… | 代码、密钥、ID、commit 号 |

字号层级：页面标题 **20px/600**、区块标题 **16px/600**、正文 **14px**、辅助 **13px**、时间戳/极次要 **11–12px**。
禁止 15/18/28 等随意字号；标题字距 `letter-spacing: 0.5–2px`。

### 1.4 圆角 / 间距 / 边框

- 圆角：按钮/输入 **8px**（`--el-border-radius-base`）、卡片 **12px**、标签/小元素 **4–6px**
- 页边距：一律交给 `el-main` 的 **24px**，**禁止在页面根元素私加 padding**
- 卡片：纸底 `--paper-card` + 1px `--paper-border` + 阴影 `0 1px 3px rgba(44,42,38,.06)`

---

## 2. 页面布局规范

### 2.1 标准页面 = `page-container`（全局组件，无引号直接用）

```vue
<page-container title="LLM 管理">
  <template #actions>            <!-- 页头右侧主操作（每页最多 1 个 primary） -->
    <el-button type="primary">新增</el-button>
  </template>
  <template #toolbar>            <!-- 搜索/筛选条（可选） -->
    <el-input placeholder="搜索…" />
  </template>
  …正文…
</page-container>
```

| prop | 何时用 |
|---|---|
| 缺省 | 内容自带卡片壳（表单页、简单列表） |
| `no-card` | 页面内容是表格/卡片矩阵，自带容器 |

布局**默认全宽自适应**（横向铺满内容区，不做 1400px 之类的限宽），与平台原有各页面行为一致。

**禁止**再手写 `.page-header + h2`；菜单名、页面 `title`、路由 `meta.title` 三者必须一致。

### 2.2 结构骨架

- 侧栏（墨色渐变 + 可折叠）与顶栏（纸色蒙纱）由 `App.vue` 统一提供，页面不得自绘全局框架
- 三栏编辑器（左列表 + 中文件树 + 右编辑器）现有 3 处近似实现，新增同类页面请先评估复用/抽取 `ThreePaneEditor`

---

## 3. 组件使用规范

### 3.1 表格

- 外观统一 `stripe`，**不加** `border`
- 行操作：一律 `link` 按钮；**超过 4 个收进「更多」dropdown**；操作列 `fixed="right"`
- **卡片操作同此规则**：只保留高频动作（状态切换/编辑/详情），低频与危险操作收进「更多」dropdown，危险项用 `var(--el-color-danger)` 标红（范例：McpManagementView）
- 分页（有分页需求时必须提供）：
  `layout="total, sizes, prev, pager, next, jumper"` + `background`
- 排序：时间/数量列默认提供 `sortable`

### 3.2 表单

- 形态：CRUD 一律 **弹窗表单**（`el-dialog + el-form`），页面内表单仅用于筛选/内联添加
- 校验：**必须** `:rules + formRef.validate()`，错误落在字段上；**禁止**"假 required 星号 + 提交时 ElMessage 兜底"
- 底部按钮：右对齐，顺序「取消 → 主按钮」；主按钮动词统一——新建用**「创建」**、编辑用**「保存」**
- 保存成功反馈：`ElMessage.success('创建成功'/'保存成功')` + 关弹窗 + 刷新列表

### 3.3 危险操作（删除等不可恢复动作）

统一走 `useConfirmDelete`（`composables/useConfirmDelete.ts`），**禁止**自拼 ElMessageBox：

```ts
import { useConfirmDelete } from '@/composables/useConfirmDelete'
const { confirmDelete } = useConfirmDelete()

if (!await confirmDelete(`Skill "${name}"`, '删除 Skill')) return
// …执行删除；接口错误由统一错误出口提示，catch 里不必再 ElMessage
```

### 3.4 空态 / 加载态 / 错误

| 场景 | 规范 |
|---|---|
| 加载中 | `v-loading` 挂在数据容器上；按钮级动作用 `:loading`；长列表首屏必须有加载态，**禁止先闪空态再跳变** |
| 空数据 | `el-empty`（`description` 写清楚 + 引导按钮最佳）；禁止自制文字 div |
| 接口错误 | **默认不处理**——`api/http.ts` 拦截器统一提示（超时/网络/状态码文案）。可降级/轮询请求传 `{ silent: true }` |
| 渲染异常 | 全局 `errorHandler` 兜底；关键操作失败必须给用户"下一步"（重试/去配置/看日志入口） |

### 3.5 时间格式化

统一 `utils/format.ts`（`formatDateTime / formatDate / formatDuration / formatJson`），禁止各页面重复定义。

---

## 4. 交互规范

### 4.1 对话类产品（ChatView 基线）

- `Enter` 发送 / `Shift+Enter` 换行（兼容输入法 `isComposing` 与 Mac）
- 生成中必须有**「停止」**按钮（暴露 AbortController）；切换/新建/离开页面必须 `abort()` 防内容串台
- 流式渲染节流（≥60ms 批量），自动滚动需贴底检测 + 「回到底部」按钮
- 每条 AI 消息提供：复制；最后一条提供「重新生成」；错误消息独立红边样式 + 重试/引导入口

### 4.2 键盘与焦点

- 一切可点击项必须键盘可达：`role="button" + tabindex="0" + keydown.enter`（或直接用 button/el 组件）
- 纯图标按钮必须 `aria-label`
- 焦点可见：`outline: none` 时必须提供替代焦点样式（如边框变色）

### 4.3 登录态与路由

- 401 → 软跳转登录页 + 「登录已过期」+ `redirect` 回跳，**禁止** `window.location.href` 硬刷新
- 未登录访问受保护页 → 登录页携带 `redirect`；登录后落地 = 第一个可访问菜单
- 无权限 → `/403` 错误页（不是踢回登录页）；不存在 → `/404`
- 每条路由必须有 `meta.title`（afterEach 已自动写入 `document.title`）
- 跨页携带上下文一律用 query 深链（范例：需求看板 → `/automate?workItemId=123`，目标页在 `onMounted` 读取并预填）

### 4.4 反馈通道

- 只用 `ElMessage`（带 `grouping: true` 防刷屏）；**禁止** `ElNotification` / `alert`
- 静默吞错（空 `catch {}`）是缺陷：要么提示，要么注释说明"由统一出口处理"

---

## 5. 命名与文案规范

1. 品牌名全站唯一：**景磊的AI工作站**
2. 英文术语与中文之间恒加空格：Skill 管理、LLM 管理、AI 对话
3. 菜单名 = 页面标题 = `meta.title`
4. 「管理」后缀只给 CRUD 页；看板/工具页不带
5. 状态文案用 `statusLabel` 的中文映射，不直接裸露英文枚举给用户
6. 错误文案说人话 + 给下一步：✅「响应超时：服务端长时间未返回数据，请稍后重试」❌「timeout of 30000ms exceeded」

---

## 6. 可访问性基线（最低要求）

- 正文/次级文字对比度 **≥ 4.5:1**（次级文字用 `--ink-text-secondary`，已达标）
- 表单控件有 `label` 或 `aria-label`，不只靠 placeholder
- AI 流式输出区 `role="log" + aria-live="polite"`
- 状态不单靠颜色区分（附文字：运行中/完成/失败）

---

## 7. 响应式基线

- 主框架：侧栏 ≤1280px 自动折叠为图标栏（App.vue 已实现）
- 栅格卡片用 `:xs/:sm/:md` 断点，禁止全固定 `:span="6"`
- 弹窗宽度用百分比 + `max-width`，避免固定 1000px+ 在窄屏裁切
- 聊天类页面 ≤768px 侧栏浮层化

---

## 8. 新功能上线自检清单

**视觉**：□ 无硬编码色值（全部走令牌） □ 字号层级正确 □ 未私加页面 padding
**布局**：□ 使用 `page-container` □ 标题三处一致 □ 菜单位置符合现有分组
**组件**：□ 表格/分页/行操作合规 □ 表单走 `:rules` □ 删除走 `useConfirmDelete` □ 状态走 `useStatusTag`
**反馈**：□ 加载/空态/错误三态齐全 □ 不重复处理接口错误 □ 危险操作有确认
**交互**：□ 键盘可达 □ 图标按钮有 aria-label □ 跨页跳转带深链 □ 有"下一步"引导
**路由**：□ `meta.title` 已填 □ 需要隐藏的功能不放菜单（保留路由 + 权限控制）

---

## 9. 规范符合性基线（2026-08-29 全站整改后）

已完成的全站收敛（新功能不得回退到以下旧模式）：

- 硬编码色值 → 设计令牌（约 560 处）；AntD 杂色 → Element 语义色；图表色 → `--viz-*`
- `el-table` 一律 `stripe` 无 `border`（31 处）
- 手写 `.page-header + h2` → `page-container`（15 个页面），残留死样式已清理
- 删除确认 → `useConfirmDelete`（17 处，含原 5 处 `el-popconfirm`）
- 状态徽章 → `useStatusTag`（修正 Monitor/Sandbox/Compute 的 RUNNING 语义色错误；消灭 2 处跨文件重复定义；裸英文枚举全部中文化）
- `formatTime/formatDate` 本地重复定义 → 委托 `utils/format.ts`（13 处）
- 表单假校验（`required` 星号 + ElMessage 兜底）→ `:rules + validate()`（13 个对话框，含修复"可创建空名 Agent"缺陷）
- 行操作 > 4 按钮 → 收「更多」dropdown（Automate/Pipeline 9 按钮、Repository 5 按钮）；行操作实心按钮 → `link`
- 自制空状态 div → `el-empty`（6 处）
- 分页补齐 `sizes + jumper + background`；ScheduledTask 执行记录补前端分页
- 可点击卡片/右键菜单项补 `role + tabindex + keydown.enter`；纯图标按钮补 `aria-label`
- 弹窗 `1000px+` 固定宽度 → `80%`（7 处）
- 页面标题 18px→20px、区块标题 15px→16px 对齐字号阶梯

**已知遗留（后续迭代）**：① 部分页面 `catch` 内与统一错误出口重复的静态提示（渐进清理，勿一次全删——少数包裹非接口错误的场景需甄别）；② KnowledgeView 添加文档（三种动态模式）与 EvaluationView 数据集条目数的动态校验；③ Audit/Workflows/Evaluation/OpsPR 的服务端分页（需后端配合）；④ Automate/Pipeline 折叠头、OpsDashboard/DevEnv 约 200 处内联样式的深度清理；⑤ PipelineView 为未注册路由的死页面，待产品决策去留。

## 10. 关键代码位置速查

| 资产 | 位置 |
|---|---|
| 主题令牌 / 全局框架 | `frontend/src/App.vue` `:root` 与全局样式 |
| 统一请求 + 错误出口 | `frontend/src/api/http.ts`（silent 逃生口） |
| 登录态读取 | `frontend/src/utils/authToken.ts` |
| 危险确认 | `frontend/src/composables/useConfirmDelete.ts` |
| 状态徽章 | `frontend/src/composables/useStatusTag.ts` |
| Markdown（已消毒+代码复制） | `frontend/src/composables/useMarkdown.ts` |
| 格式化 | `frontend/src/utils/format.ts` |
| 路由守卫/标题/进度条 | `frontend/src/router/index.ts`、`utils/routerProgress.ts` |
| 错误页 | `frontend/src/views/error/ErrorView.vue`（403/404） |
| 页面容器 | `frontend/src/components/PageContainer.vue` |
