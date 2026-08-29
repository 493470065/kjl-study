# 景磊的AI工作站 · UED 整体重设计提案

> 2026-08-29 ｜ 基于全站 37 个视图、路由、状态管理与 API 层的三线审计
> （信息架构 / 组件与交互一致性 / 核心体验与全局机制），所有结论均附源码证据。

---

## 0. 审计总评

**做得好的**：水墨视觉体系（主题色板 + CSS 变量 + 印章细节）、按钮级 `:loading` 覆盖、
`v-loading` 加载态统一、错误提示单通道（只用 ElMessage）、工具调用过程可视化、
弹窗表单提交按钮位置一致。

**核心问题一句话**：视觉有体系，但**约定覆盖率只有约 15%**——布局骨架、状态语义、
错误处理、核心对话能力各自为政，靠"复制邻近页面"演化，形成了 16 份页头、5 份状态映射、
3 份三栏编辑器、2 套危险确认模式的平行实现。同时核心体验（聊天）缺失 AI 对话产品的
标配能力，并存在白屏级稳定性隐患。

改造哲学：**收敛与迁移优先，不造新轮子**；**先堵高危，再补标配，后收机制**。

---

## 1. 设计原则（北极星）

1. **对话即主场**：聊天页是本产品的"首页"，一切能力（Agent、知识、技能）都应能在对话中被触达，而不是让用户去管理页里找。
2. **按用户目标归类，不按技术归属**：定时任务、Webhook 是"自动化的触发器"，不是"系统配置"。
3. **错误必须被看见、被引导**：任何失败都要有反馈 + 下一步动作（去配置 / 重试 / 看日志），静默吞错是缺陷。
4. **约定大于重复**：页头、状态徽章、危险确认、分页各只有一种官方写法，沉淀为组件/工具，逐页迁移。
5. **水墨但克制**：黛青、宣纸、朱砂只用于品牌层与点缀；语义色（成功/警告/危险）保持功能直觉，不追求风格化。
6. **键盘与读屏可达**：交互元素可 Tab、可 Enter、有 aria 标签，次级文字对比度 ≥ 4.5:1。

---

## 2. 信息架构重组

### 2.1 现状病灶

- 菜单分组被 `display: none` 隐藏，用户只看到 4 条分隔线，分组意图不可感知。
- 16 项隐藏菜单靠 `v-if="false"` 硬编码而非权限控制；其中 `/` 是死链（重定向到 /chat）、`/skills` 与可见菜单重复。
- `/personal-config`（用户配置 LLM Key 的唯一页面）**无任何入口**——新用户旅程在此彻底断裂。
- `DashboardView`（孤儿，无路由）、`PipelineView`（无路由死代码）；`/tfs-dashboard` 有路由无菜单。
- 四个"看板"语义过载：需求看板 / TFS 看板 / 运营平台看板 / 孤儿 Dashboard。
- 命名分裂：产品名三个版本；LLM 模块一名三称；"管理"后缀漂移；中英空格不统一；"系统配置"三层同名。
- 13/28 条路由有 `meta.title`，但**无任何 `document.title` 赋值逻辑**——多开标签页无法区分。

### 2.2 目标菜单结构（5+1 分组，显示分组标题）

| 分组 | 菜单项 | 说明 |
|---|---|---|
| **工作台** | 首页、AI 对话、需求看板 | 首页 = 复活 DashboardView，定位"驾驶舱 + 新手向导"（见 2.4） |
| **智能体与能力** | Agent 管理、Skill 管理、知识库 | 强耦合概念同组（Agent 表单依赖 Skill/MCP/LLM 三处候选） |
| **编排与执行** | 工作流编排、任务执行（原自动化管理）、定时任务、Webhook 通知 | 定义、执行、触发器归一域，补全自动化闭环 |
| **模型与连接** | LLM 管理、MCP 管理 | 运行基座；本地算力、沙箱恢复后也收编于此 |
| **质量与观测** | 运行时监控、AI 评估、结构化输出、审计日志 | 工具箱类隐藏页面统一归宿 |
| **系统管理**（底部） | 账户管理、团队协作、系统配置、仓库管理、产品线管理、开发环境 | 仅 ADMIN 可见，组名消除三层同名 |

- **个人配置**移入右上角用户下拉（与修改密码、查看令牌同级）——它属于"我的账户"，不属于路由迷宫。
- 三个 TFS 相关看板（需求看板 / TFS 看板 / DashboardView）职能合并：需求列表留"需求看板"，统计数据并入"首页"。

### 2.3 命名规范（全站强制）

1. 品牌名统一为「景磊的AI工作站」，同步修订 README、设计文档与登录页副标题。
2. 英文术语与中文之间恒加空格（Skill 管理、LLM 管理、AI 对话）。
3. 页面标题恒等于菜单名；`meta.title` 必填。
4. "管理"后缀只给 CRUD 页；看板/工具页不带。
5. 状态文案统一："运行中"永远一种颜色（建议 warning 橙），"已停止/已禁用"用 info。

### 2.4 首页定位：驾驶舱 + 新手向导

恢复 `/` 为真首页，顶部一排**健康检查卡**：

- LLM 是否已配置 → 未配置给「去配置」按钮（深链 /providers 或 /personal-config）
- MCP 是否可用 → 未启用给入口
- 今日任务数 / Agent 数 / 最近执行

这直接修复"新用户登录后对话报错却无路自救"的头号旅程断点。

### 2.5 权限 UX 修复

| 问题 | 方案 |
|---|---|
| 登录后无条件 `push('/chat')`，无权限用户陷入"登录→弹回登录页"死循环 | 落地页 = 用户 `allowedMenus` 的第一个可访问菜单 |
| 已登录访问无权限路由被踢回登录页（误以为被登出） | 新增 403 页面："无权访问，请联系管理员" |
| 菜单过滤后出现空分组/孤立分隔线 | 组内全空时隐藏整组；侧栏全空时显示"暂无可用功能"空态 |
| 隐藏菜单靠 `v-if="false"` 而非权限 | 恢复菜单项时一律走 `hasMenuAccess`，清理 `/` 死链与重复 `/skills` |

### 2.6 用户旅程深链矩阵（修补断点）

| 旅程 | 断点 | 修补 |
|---|---|---|
| 新用户配置 LLM→对话 | 对话报错无引导；个人配置无入口 | 首页健康卡 + 报错文案带深链；个人配置进用户下拉 |
| 创建 Agent→使用 | 表单只有文字提示"来自某某菜单"；建好的 Agent 无法在主对话使用 | 表单提示升级为可点击深链 + 内联新建；**聊天页增加 Agent 选择器**（见 3.2） |
| 需求→自动化执行 | 需手工输入 TFS 需求号 | 需求看板行级「启动自动化」按钮 → `/automate?workItemId=xxx` 深链 |
| 工作流→定时运行 | 编排与触发器互不相通 | 工作流卡片「创建定时任务」出口；定时任务编辑页反向链接回工作流 |
| 对话出错→排查 | 无上下文入口 | 错误气泡附「查看监控」深链 `/monitor` |

---

## 3. 核心体验重设计

### 3.1 高危修复（稳定性与安全，必须先做）

| # | 问题 | 证据 | 方案 |
|---|---|---|---|
| 1 | 路由守卫裸 `JSON.parse`：storage 损坏 → 每次导航抛错 → 全站白屏死循环 | `router/index.ts:160-161` | 包 try/catch，损坏时清 storage 走未登录分支 |
| 2 | 聊天流切换/新建会话不中止旧流 → 内容串台进新会话 | `ChatView.vue` 全文无 `.abort()` | 切换/新建/卸载时 `abortController.abort()` |
| 3 | SSE fetch 只读 localStorage；"不记住我"时 token 在 sessionStorage → 聊天流必然 401 | `api/chat.ts:74-76` | 与 `http.ts` 统一的双 storage 读取，抽 `getToken()` 工具 |
| 4 | markdown-it `html: true` + `v-html` 无消毒 → XSS | `useMarkdown.ts:4` | 引入 DOMPurify，或关闭 `html` 选项 |
| 5 | 无全局错误边界：渲染异常 = 白屏 | 无 `errorHandler` | `app.config.errorHandler` + 路由级错误兜底页 |
| 6 | 历史加载/会话删除失败静默吞错 | `ChatView.vue:162-211` 多处空 catch | 统一走错误反馈层（见 4.1） |

### 3.2 聊天页重设计（本产品的门面）

**输入区**
- `Enter 发送 / Shift+Enter 换行`（含 Mac Cmd）——当前是反的且不支持 Mac
- 生成中「发送」按钮变为「停止」（暴露已存在的 AbortController）
- textarea 自动增高（autosize）、字数上限提示
- 流式请求加首字节超时（建议 60s）+ 超时友好提示

**消息区**
- 代码块真正落地：语言标签 + 复制按钮（ChatView 的样式和事件已备好，只缺 markdown-it 自定义 fence 渲染器）
- 每条消息操作条：复制 / 重新生成；错误消息独立样式（红边 + 图标 + 重试按钮）
- 滚动策略：用户上滑看历史时暂停自动滚动，出现「回到底部」悬浮按钮
- 流式渲染优化：chunk 节流（如 80ms）批量渲染，避免长回答每 chunk 全量重渲

**会话列表**
- 删除会话二次确认（ElMessageBox）
- 首屏加载态（避免先闪"开始新对话"空态再跳变）
- 列表项改为 `button`/role+tabindex，支持键盘导航

**Agent 选择器**（补上缺失的产品环节）
- 输入区上方下拉选择 Agent（默认"通用助手"），`projectId/agentId` 真正传入 `chatApi.stream`
- 与 Agent 管理模块打通：建好的 Agent 能在主对话中使用

### 3.3 登录页

- 注册 `@element-plus/icons-vue`，修复 `prefix-icon="User"/"Lock"` 图标不显示
- 补 `:rules` 校验与 `autocomplete="username"/"current-password"`
- 登录请求走带超时的封装实例；登录按钮 `native-type="submit"` + 用户名框回车可提交
- 401 回跳携带 `redirect` 参数，登录后回原页；登录页显示"登录已过期"提示

### 3.4 全局反馈机制

| 机制 | 现状 | 目标 |
|---|---|---|
| 接口错误 | 拦截器只处理 401；296 处散装 `ElMessage.error` + 134 处静默 catch | `http.ts` 响应拦截器统一出口：超时/网络/状态码文案映射，页面层默认不再各自处理（提供 `silent` 选项逃生） |
| 401 | `window.location.href` 硬跳转，丢失页面状态，无提示 | router 软跳转 + "登录已过期" + `redirect` 回跳 |
| 路由切换 | 懒加载期间空白 | NProgress 顶部进度条 |
| 页面标题 | 永远是「景磊的AI工作站」 | `router.afterEach` 按 `meta.title` 设置 `document.title` |
| 超时文案 | `timeout of 30000ms exceeded` 透传 | 「请求超时，请稍后重试」 |

### 3.5 可访问性 & 响应式基线

- 次级文字 `#8a857a` 在宣纸底上仅 3.4:1 → 加深到 `#6f6a5e`（≥4.5:1）；占位符色同步校准
- 纯图标按钮全部补 `aria-label`；消息区加 `aria-live="polite"` + `role="log"`；输入框加 label
- 主框架响应式：侧栏可折叠（≤1280px 自动收起为图标栏，≤768px 抽屉化）
- 弹窗改 `width="80%" max-width` 约束；统计卡栅格补 `xs/sm/md` 断点；登录卡加 `max-width: 90vw`

---

## 4. 组件与交互规范

### 4.1 页面骨架（收编 16 份手写页头）

增强 `PageContainer`：补 `toolbar` / `tabs` 插槽与 `full-width` prop，标题统一 20px；
逐页替换 16 处手写 `.page-header`；删除视图根部私加的 `padding`，页边距一律交给 `el-main` 24px。

### 4.2 数据表格约定

| 项 | 规范 |
|---|---|
| 外观 | 统一 `stripe`，不加 `border` |
| 行操作 | 一律 `link` 按钮；>4 个收进「更多」dropdown；操作列 `fixed="right"` |
| 分页 | 统一 `layout="total, sizes, prev, pager, next, jumper"` + `background`；缺失分页的列表页（Automate、Audit、Settings 等）补齐 |
| 筛选 | 以 `KnowledgeFilters.vue` 为蓝本泛化 `FilterBar`，替换 Audit 内联复制四遍的筛选条等 |

### 4.3 表单规范

- 全部改走 `:rules + formRef.validate()`，废除"假 required + ElMessage 兜底"
- 错误落在字段上并滚动定位
- 主按钮动词统一：新建 →「创建」，编辑 →「保存」

### 4.4 危险操作统一

选定 `ElMessageBox.confirm` 单一模式，封装 `useConfirmDelete(实体名)`：
文案统一"确定删除 XX 吗？此操作不可恢复"、`type: 'warning'`、确认按钮染危险色、
取消分支统一处理。消除 17+5=22 处分裂写法。

### 4.5 状态徽章语义收敛

建立唯一映射（`useStatusTag` + `StatusTag` 组件），替换 5 份各自实现：

| 状态 | 颜色 |
|---|---|
| 运行中/执行中 | warning（修复 Agent 页用 danger、MCP 页用 success 的三色冲突） |
| 成功/已启用 | success |
| 失败/错误 | danger（**仅**留给失败；管理员角色改用 primary） |
| 已停止/草稿 | info |

### 4.6 公共组件沉淀清单（按重复度）

1. `PageShell/PageHeader`（16 份）→ 并入 PageContainer
2. `ThreePaneEditor`（Skills/Repository/ProductLine 3 份逐类复制）
3. `StatusTag` + `useStatusTag`（5 份）
4. `ExecutionEvidencePanel` 日志/变更/产物面板（Automate+Pipeline 4 份）
5. `ContextMenu` 右键菜单（Skills/Workflows 2 份 CSS 逐行相同）
6. `FilterBar`（以 KnowledgeFilters 泛化）
7. `utils/format.ts`：formatTime/formatDate/formatDuration/formatJson（5+ 处重复定义）
8. `DetailDialog`（descriptions+tabs 详情骨架，4 处）

### 4.7 设计令牌落地

视图里硬编码的 `#41556d / #8a857a / #f3efe4…` 批量替换为 App.vue 已定义的
`--el-color-primary / --ink-* / --paper-*` 变量（换肤一处生效）；
内联样式重灾区（OpsDashboardView 114 处、DevEnvView 84 处）优先清理，
并立评审红线：**块级布局禁止内联样式**。

---

## 5. 实施路线图

### P0 · 高危与快赢（约 2–3 天，风险低、收益直接）

1. 路由守卫 `JSON.parse` 防护（白屏隐患）
2. 聊天流中止管理 + 「停止生成」按钮（数据串台）
3. SSE 鉴权双 storage 修复（不记住我必挂）
4. markdown XSS 消毒（DOMPurify）
5. `router.afterEach` 设置 `document.title`
6. 登录落地页改为"第一个可访问菜单" + 403 页
7. 统一危险确认（`useConfirmDelete`）+ 状态色收敛 + 页面内边距收敛

### P1 · 核心体验与全局机制（约 1 周）

8. 聊天页标配：Enter 发送、代码块复制、消息操作条、贴底滚动、流式节流、会话删除确认、首屏加载态、Agent 选择器
9. `http.ts` 统一错误出口 + 401 软跳转 + 超时文案；全局错误边界；NProgress
10. 登录页修复（图标、校验、超时、redirect 回跳）
11. 侧栏可折叠 + 关键对比度修复 + aria 基线

### P2 · 信息架构重组（约 1 周，需产品确认）

12. 菜单 5+1 重组 + 显示分组标题 + 个人配置进用户下拉
13. 首页驾驶舱（健康检查卡 + 新手引导）；TFS 三看板合并；删除/重挂孤儿视图
14. 命名规范落地 + 深链矩阵（需求→自动化、工作流→定时任务等）

### P3 · 组件收敛与技术债（随迭代滚动推进）

15. PageContainer 增强 + 16 页页头迁移；DataTable 规范落地与补分页
16. 表单 `:rules` 全面迁移
17. 公共组件抽取（ThreePaneEditor / ExecutionEvidencePanel / ContextMenu / FilterBar / format utils）
18. 设计令牌落地 + 内联样式重灾区清理

---

## 6. 验收度量

| 维度 | 现状基线 | 目标 |
|---|---|---|
| 白屏级隐患 | 2 处（守卫裸 parse、无错误边界） | 0 |
| 静默吞错 | 134 处空 catch | 逐月递减，关键路径 0 |
| 聊天标配能力（停止/重试/复制/Agent 选择） | 0/4 | 4/4 |
| 手写 `.page-header` | 16 份 | 0（统一 PageContainer） |
| 状态映射实现 | 5 份 | 1 份（StatusTag） |
| 次级文字对比度 | 3.4:1 | ≥ 4.5:1 |
| 命名一致性 | 3 个产品名、3 个 LLM 叫法 | 全站 1 套 |
| 新用户自助配置成功率 | 需线下问管理员要 URL | 首页健康卡自助引导 100% 可达 |

---

## 7. 实施记录（2026-08-29 当日落地）

**P0 已完成**：路由守卫 `JSON.parse` 防护；`afterEach` 设置 `document.title`；403/404 错误页（水墨风格）；
登录落地页改为第一个可访问菜单 + `redirect` 回跳；聊天流切换/新建/卸载自动 `abort`（防串台）；
「停止生成」按钮；SSE 鉴权双 storage 修复（`utils/authToken.ts`）；流式首字节 60s 超时；
SSE 错误体读取；markdown `html: false` + fence 渲染器落地代码块语言头/复制按钮（XSS 根治，零新依赖）；
`useConfirmDelete` 统一危险确认；RUNNING 三色冲突与 danger 语义收敛；4 处页面私加 padding 移除。

**P1 已完成**：聊天页 Enter 发送/Shift+Enter 换行、消息操作条（复制/重新生成）、错误气泡独立样式+去配置入口、
贴底滚动检测+回到底部按钮、流式 66ms 节流、会话删除二次确认、首屏加载态、**Agent 选择器**
（后端 `ChatService` 注入所选 Agent 的 systemPrompt）；`http.ts` 统一错误出口（超时/网络/状态码文案 + `silent` 逃生口 +
`grouping` 合并）；401 软跳转 + 「登录已过期」；全局 `errorHandler`；路由进度条（自研轻量实现，无新依赖）；
登录页 `:rules`/`autocomplete`/`native-type=submit`/超时；侧栏折叠（≤1280px 自动）；次级文字 `#8a857a→#6f6a5e`（122 处，≥4.5:1）；
会话列表/图标按钮 aria 补齐。

**P2 已完成**：菜单保持原有 9 项可见结构（工作区/资产与能力/业务编排/连接与基座）——
曾按提案重组为 5+1 分组并恢复全部隐藏菜单，但隐藏系产品有意为之，已于 2026-08-29 回退；
保留的改进：**显示分组标题**、权限过滤后空分组自动隐藏、隐藏页面路由仍可通过 URL 访问（需要开放时按 `hasMenuAccess` 加回菜单即可）；
个人配置移入用户下拉；`/` 复活为首页（DashboardView 健康检查卡：LLM/MCP/Agent/对话，
真实接口数据，替代恒 0 假卡片）；隐藏菜单死代码全部清理；品牌名统一（README/启动脚本/设计文档 → 景磊的AI工作站）；
5 处页面标题与菜单对齐；深链：需求看板行级「启动自动化」→ `/automate?workItemId=` 自动预填、
Agent 表单「候选来自…」变可点击深链、工作流「定时任务 →」出口。

**P3 已完成（本轮）**：`PageContainer` 增强（`toolbar` 插槽 + `full-width` prop）并迁移 5 个手写页头
（Providers/账户/系统配置/团队/沙箱，连同原有 4 页共 9 页）；`useStatusTag` 全站唯一状态映射（迁移 5 个视图）；
`utils/format.ts` 收敛重复格式化函数；`useConfirmDelete` 补齐迁移（共 8 个视图）；
Providers 表单改为 `:rules + validate()` 真实校验。

**遗留清单（建议纳入下一迭代）**：其余手写页头（Agent/Automate/Repository/Requirements/Ops 等 10 处）按同一模式迁移；
Automate/Audit 等列表补分页（部分需后端分页接口配合）；Repository 创建表单 `:rules` 迁移；
ThreePaneEditor / ExecutionEvidencePanel / ContextMenu / FilterBar / DetailDialog 组件抽取；
OpsDashboardView（114 处）与 DevEnvView（84 处）内联样式清理；分页与键盘命令面板（Ctrl+K）。
