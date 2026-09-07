---
name: std-req-to-plan-emr
description: >
  需求分析到实施计划全流程自动化技能，从 TFS 获取需求，读取前后端代码，生成需求分析文档、前后端设计文档、API 契约、实施计划。
  当用户提到"需求分析"、"设计文档"、"实施计划"、"需求号"、"分析需求"、"工作项设计"、"简单分析"、"快速分析"、"做个方案"、"帮我拆解需求"等关键词时触发。
  适用于 TFS 工作项和手动需求描述两种输入方式，简单需求自动跳过 brainstorm 直接生成 plan，复杂需求包含深度分析和用户确认环节。
  不适用于: 纯代码开发执行（用 std-plan-execute-emr）、Bug 修复（用 std-bug-fix）、代码审查（用 tfs-pr-auto-review 或 code-review）、已有 plan 的执行（用 std-plan-execute-emr）。
version: 2.2.1
parameters:
  - name: workItemId
    description: TFS 工作项 ID，用于自动获取需求详情
    type: string
    required: false
  - name: mode
    description: "执行模式。complex: 完整流程含 brainstorm 和用户确认（默认）；simple: 简化流程，跳过 brainstorm、用户确认，直接生成 plan"
    type: string
    required: false
---

# 需求分析到实施计划全流程

## 绝对禁止事项（最高优先级）

> **本技能执行过程中，严禁修改任何项目源代码。**

1. **禁止使用 Edit/Write 工具**修改项目源代码文件
2. **禁止使用 Bash 工具**执行修改源代码的命令
3. **只允许"读取"操作**：使用 Read、Grep、Glob 浏览和分析代码
4. **唯一允许写入的文件**：`{codeBasePath}/{planBasePath}/{需求号}/` 下的文档（含 `state.json`） + 公共路径配置文件（`~/.claude/skills/std-code-paths/config/settings.json` 和 `~/.claude/skills/std-code-paths/config/<system>/repositories.json`） + 各仓库的 `代码扫描摘要.md`

## 快速开始

**使用方式：**
1. 提供工作项 ID：`分析需求 1445554`
2. 手动描述需求：直接粘贴需求文本
3. 指定版本：`分析需求 1445554，版本 250815`
4. 简单需求：`简单分析需求 1445554`（跳过 brainstorm 和确认，直接生成）
5. 快速分析：`快速分析需求 1445554`（默认简单模式，直接生成）

**预计耗时：**

| 仓库数 | 模式 | 预计时间 |
|--------|------|---------|
| 1-2 | 简单 | 3-5 分钟 |
| 1-2 | 复杂 | 5-8 分钟 |
| 2-4 | 简单 | 5-10 分钟 |
| 2-4 | 复杂 | 8-15 分钟 |
| 4+ | 复杂 | 15-25 分钟 |

## 依赖

本技能依赖以下外部技能（需已安装）：
- `superpowers:brainstorming` — 复杂需求的深度分析（简单需求不使用）
- `superpowers:writing-plans` — 复杂需求的计划生成（简单需求不使用）
- `std-code-paths` — 公共代码路径配置

## 角色定位

你是一位资深全栈架构师，擅长把需求拆解成清晰的、可执行的设计方案和实施计划。你的工作不是写代码，而是分析和规划。

## 总体工作流

按以下七个阶段顺序执行，每个阶段读取对应的指令文档：

```
阶段1: 获取需求 → 阶段2: 检测产品分析 → 阶段3: 读取代码 → [复杂度判定] → 阶段4/跳过 → 阶段5: 设计文档 → 阶段6: 实施计划 → 阶段7: 交付

产品分析分支：
  ├─ hasProductAnalysis=true  → [跳过阶段4 brainstorm] → 阶段5(复用产品分析) → 阶段6 → 阶段7
  └─ hasProductAnalysis=false → 阶段4(brainstorm) → 阶段5(完整) → 阶段6 → 阶段7(额外回写)
```

### 复杂度判定与流程分支

**两阶段判定：** 阶段1末尾进行初步预判（基于需求文本，写入 `state.json` 的 `preliminaryComplexity` 字段），阶段3末尾确认或调整（写入 `state.json` 的 `complexity` 字段）。

阶段3完成后，确认需求复杂度（除非已通过 `mode` 参数指定）：

**简单需求**（特征参考）：涉及 1-2 个功能模块 / 3 个以下 API / 无数据库变更 / 需求描述 <200 字
**复杂需求**（满足任一）：涉及 3+ 功能模块 / 5+ API / 数据库变更 / 新技术依赖 / 多页面新增重构 / 需求描述 >500 字

使用 `AskUserQuestion`：
- 问题："请判定需求复杂度，这将影响后续流程："
- 选项：
  - `简单需求` — 跳过 brainstorm，跳过设计确认，直接生成 plan
  - `复杂需求` — 完整 brainstorm 分析，设计确认后生成 plan

将结果记录到 `state.json` 的 `complexity` 字段（`"simple"` 或 `"complex"`）。

> **锁定规则：** `complexity` 确认后同时写入 `complexityLocked: true`，后续阶段只读，不可覆盖。

> **快捷触发：** 用户提到"简单分析"、"快速分析"、skill 参数 `mode=simple` 时直接设为简单需求，无需询问。

### 流程模式对比

| 环节 | 简单需求 | 复杂需求 | 有产品分析 |
|------|---------|---------|-----------|
| 阶段4 Brainstorm | **跳过** | 深度分析 | **跳过** + 自动判定复杂度 |
| 阶段5 用户确认 | **跳过** | 分批确认 | 按 complexity 决定 |
| 阶段6 Plan 生成 | 直接生成 | writing-plans | 按 complexity 决定 |
| 阶段7 TFS 上传 | 自动执行 | 自动执行 | 自动执行（不额外回写） |

### 各阶段指令文件

> 进入每个阶段前，使用 Read 工具读取对应的 `stages/stageN-xxx.md` 文件获取详细指令。不要在开始时一次性读取所有阶段文件。

## 阶段1: 获取需求内容

- **指令文件**: `stages/stage1-fetch-requirement.md`
- 从 TFS 获取需求或接收手动输入，下载附件，初始化 state.json，进行初步复杂度预判

## 阶段2: 检测产品分析

- **指令文件**: `stages/stage2-detect-product-analysis.md`
- 检测 TFS 工作项是否已有产品需求分析（标签+字段同时存在），决定后续流程分支

## 阶段3: 读取项目代码

- **指令文件**: `stages/stage3-read-code.md`
- 版本检测、仓库匹配、代码扫描（两轮策略）、复杂度判定确认

## 阶段4: Brainstorm 需求分析

- **指令文件**: `stages/stage4-brainstorm.md`
- 深度分析（简单需求或已有产品分析时跳过），生成结构化 brainstorm 笔记，判定前后端改动范围
- **有产品分析时**：自动判定复杂度，跳过 brainstorm

## 阶段5: 生成设计文档

- **指令文件**: `stages/stage5-design-docs.md`
- API-First 流程：需求分析（或产品分析）→ API 契约 → 前端设计 ↔ 后端设计（并行）→ 测试文档 → 一致性校验
- **有产品分析时**：不生成需求分析，用产品分析作为输入源

## 阶段6: 生成实施计划

- **指令文件**: `stages/stage6-plans.md`
- 基于 `### Task N:` 格式生成可执行的实施计划，与 std-plan-execute-emr 解析兼容

## 阶段7: 总结交付与 TFS 上传

- **指令文件**: `stages/stage7-delivery.md`
- 需求分析上传到 TFS 字段、设计文件作为附件上传、标签添加、自动创建子任务
- **无产品分析时**：额外回写 `Winning.Demand.Analysis` 字段 + 添加 `AI-ANALYSIS` `EMR-AI-ANALYSIS-V2` 标签
- **三级上传保障**：确保每项 TFS 操作必须成功

## 进度反馈（强制）

每进入一个新阶段时，输出进度指示：

```
━━━ [阶段 N/7] 阶段名称 ━━━
```

在每个阶段的关键步骤完成时，输出简要状态更新。

## 并行执行原则

| 阶段 | 可并行的操作 |
|------|-------------|
| 阶段 2 | 检测标签 ↔ 检测字段内容（并行读取） |
| 阶段 3 | 前端代码扫描 ↔ 后端代码扫描 |
| 阶段 5 | 需求分析单独生成；API 契约单独生成（基于需求分析）；前端设计 ↔ 后端设计可并行（基于 API 契约）；测试功能文档最后生成 |
| 阶段 6 | 前端 plan ↔ 后端 plan 并行生成 |
| 阶段 7 | 附件上传 ↔ 标签添加可并行；字段回写和任务创建串行 |

## 阶段恢复

如果中途中断，通过检查 `{codeBasePath}/{planBasePath}/{需求号}/state.json` 和目录下的已有文件判断恢复点：

**优先检查 `state.json`**（如果存在，直接读取 `currentStage` 和 `completedStages` 确定恢复点）。

如果 `state.json` 不存在，回退到文件检查：

| 已有文件 | 可恢复到的阶段 |
|---------|--------------|
| 无 | 从阶段1开始 |
| 目录已创建但无内容 | 从阶段1继续 |
| 有附件（来自 TFS） | 阶段1已完成，从阶段2继续 |
| 有 brainstorm-notes.md | 阶段4已完成，从阶段5继续 |
| 有需求分析但无 API 契约 | 复杂需求：阶段5第一批完成，继续5.5a确认后生成 API 契约 |
| 有需求分析+API 契约但无前后端设计 | 复杂需求：阶段5第二批完成，继续5.5b确认后生成前后端设计 |
| 有需求分析+API 契约+设计文档但无测试文档 | 阶段5第三批完成，继续生成测试功能文档 |
| 有全部设计文档+测试文档但无 plan | 阶段5已完成，从阶段6继续 |
| 有 plan 文件 | 阶段6已完成，从阶段7继续 |
| 有 `产品业务分析.md` 且 `hasProductAnalysis=true` | 阶段 2 已完成，跳过阶段 4，从阶段 5 继续 |
| 无 `产品业务分析.md` 且 `hasProductAnalysis=false` 且无 brainstorm-notes.md | 从阶段 4 继续 brainstorm |

**state.json 结构：**
```json
{
  "workItemId": "工作项ID",
  "currentStage": 4,
  "preliminaryComplexity": "simple",
  "preliminaryComplexityReason": "需求文本 <200字，无数据库关键词",
  "complexity": "complex",
  "complexityLocked": true,
  "hasProductAnalysis": true,
  "productAnalysisSource": "tfs",
  "productAnalysisFile": "产品业务分析.md",
  "currentVersion": "250815",
  "matchedProject": "会诊",
  "matchedRepositories": ["repo-id-1", "repo-id-2"],
  "changeScope": { "frontend": true, "backend": true, "api": true },
  "completedStages": [1, 2, 3, 4]
}
```

恢复时向用户报告："检测到阶段 N 已完成，将从阶段 N+1 继续执行。"

## 异常处理

| 场景 | 处理方式 |
|------|---------|
| **误操作修改了源代码** | **立即 `git checkout -- <file>` 撤销，向用户报告** |
| TFS 连接失败 | 提示用户手动提供需求内容 |
| 模块路径未配置 | 提示用户输入路径，自动回写到 config/settings.json 或 config/\<system\>/repositories.json |
| 模块路径目录不存在 | 提示用户检查路径，引导更新配置 |
| 无法自动匹配项目 | 列出所有项目供用户选择 |
| 工作项无描述 | 提示用户补充需求详情 |
| Brainstorm 未完成 | 不跳过，确保分析充分后再进入设计 |
| 设计文档有矛盾 | 回到 brainstorm 阶段澄清 |
| Git clone 失败 | 提示具体错误，建议手动 clone。部分成功则继续 |
| `tfs-client.mjs` 方法不存在 | 回退到 curl 直接调用 TFS REST API |
| 附件上传失败 | 向用户报告失败原因 |
| `marked` 库未安装 | `npm install marked`，或回退到纯文本上传 |
| `config/` 下配置文件格式错误 | 报告解析错误位置，建议手动修复 |
| 代码扫描无关键词命中 | 全部标注为「新增模块」 |
| 标签更新冲突 | 重新获取最新标签后重试 |
| 旧附件清理失败 | 报告失败原因和新附件列表，建议手动在 TFS Web 界面删除 |
| **代码扫描超时** | **单仓库超过 3 分钟，缩减扫描范围为关键词命中文件+必读文件，跳过无关目录** |
| **Agent 执行超时** | **单个 Agent 任务超过 5 分钟无响应，向用户报告超时，建议检查仓库大小或手动提供关键文件** |
| **敏感信息泄露** | **代码扫描中发现 password/secret/apiKey/token 等字段，替换为 `[REDACTED]` 后再写入摘要** |
| TFS 读取标签/字段失败 | 重试 3 次后降级为 curl，仍失败则终止阶段 2 |
| 产品分析内容为空或乱码 | 视为无产品分析，`hasProductAnalysis=false` |
| 上传重试 3 次+降级均失败 | 阻塞等待用户介入，提供手动操作步骤和本地文件路径 |
