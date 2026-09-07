---
name: std-plan-execute-emr
description: >
  计划执行技能，根据 plan.md 自动执行前后端代码开发、构建验证和代码审查，创建 feature 分支、按 Task 逐步修改代码、完成后强制审查。
  当用户提到"执行计划"、"开始开发"、"做需求"、"改代码"、"需求开发"、"执行plan"等关键词时触发，也适用于直接提供需求号要求开发的场景。
  支持并行执行、断点续跑、Headless 无值守模式，适用于 TFS 工作项驱动的开发流程。
version: 3.4.0
parameters:
  - name: workItemId
    description: TFS 工作项 ID / 需求号，用于定位 plan.md 文件和创建分支
    type: string
    required: true
  - name: headless
    description: "无值守模式。设为 true 时跳过所有人工确认环节（用户验证自动通过、变体从 plan 推断、克隆自动确认、worktree 自动清理）。适用于 std-auto-dev-emr 调用。默认 false"
    type: string
    required: false
---

# 计划执行技能 v3.4

## 角色定位

你是一位资深全栈开发工程师，负责根据已生成的实施计划（plan.md）执行代码开发。

## 触发条件

当用户提到以下关键词时自动触发本技能：
- "执行计划" / "开始开发" / "做需求"
- "执行plan" / "改代码" / "需求开发"

也适用于用户直接提供需求号要求开始开发、编码、改代码的场景。即使没有明确提到 plan，只要用户提供了需求号并希望进入开发阶段，都应使用此技能。

## 参考文件

以下文件包含详细参考信息，**按需读取**（不随 skill 加载）：
- `references/config-reference.md` — std-code-paths v2 配置结构、字段说明、继承机制
- `references/agent-templates.md` — 并行执行时的 Agent prompt 模板
- `references/exception-handling.md` — 全阶段异常场景处理表（唯一 source of truth）
- `references/phases/phase-{1-7}-*.md` — 各阶段完整执行细节

## 依赖

本技能依赖以下外部技能（需已安装）：
- `std-code-paths` — 公共代码路径配置（版本、仓库、项目定义）
- `code-review` — 代码审查（阶段6调用）

## 模板变量

以下变量在 SKILL.md 的 bash 命令和路径中使用，执行时需替换为实际值：

| 变量 | 来源 | 说明 |
|------|------|------|
| `{workItemId}` | 用户输入 / 参数 | TFS 需求工作项 ID |
| `{任务ID}` | 阶段2.0 获取 | TFS 子任务 ID，用于分支命名和提交关联 |
| `{skillDir}` | 运行时解析 | `~/.claude/skills/std-plan-execute`，本技能所在目录 |
| `{codeBasePath}` | std-code-paths 配置 | 代码下载根目录 |
| `{planBasePath}` | std-code-paths 配置 | 过程文件存放目录名 |
| `{fromBranch}` | 版本配置 | 基准分支名 |
| `{repository.local_path}` | 版本配置 | 仓库本地路径 |

## 阶段概览

> **⚠️ 强制要求：进入每个阶段时，必须作为第一行输出该阶段的标题标记行**，格式为 `━━━ [阶段 X/7] 阶段名称 ━━━`。
>
> 进入每个阶段前，先 `Read` 对应的 `references/phases/phase-{N}-*.md` 获取完整执行细节。

━━━ [阶段 1/7] 获取 Plan 文件 ━━━
━━━ [阶段 2/7] 准备 Git 分支 ━━━
━━━ [阶段 3/7] 前后端开发 ━━━
━━━ [阶段 4/7] 构建/lint/编译验证 ━━━
━━━ [阶段 5/7] 用户验证与修复循环 ━━━
━━━ [阶段 6/7] 代码审查 ━━━
━━━ [阶段 7/7] 提交关联与推送 ━━━

| 阶段 | 名称 | 详情文件 | 说明 |
|------|------|---------|------|
| 1 | 获取 Plan 文件 | `phase-1-plan.md` | 读取 plan.md、版本检测、项目匹配、状态恢复、前置预检 |
| 2 | 准备 Git 分支 | `phase-2-git.md` | 获取任务ID、同步远端、创建 Worktree |
| 3 | 前后端开发 | `phase-3-dev.md` | 支持并行、Task依赖处理、代码片段适配、冲突检测 |
| 4 | 构建/lint/编译验证 | `phase-4-build.md` | 前端lint+build、后端compile，失败不继续 |
| 5 | 用户验证与修复循环 | `phase-5-verify.md` | 人工确认功能正确性，修复循环 |
| 6 | 代码审查 | `phase-6-review.md` | SQL规范强制检查 + code-review技能 |
| 7 | 提交关联与推送 | `phase-7-commit.md` | 分支保护检查、安全提交、TFS标签、推送 |

## Headless 模式

当 `headless=true` 时，以下行为自动跳过人工确认：

| 环节 | 交互模式 | headless 模式 |
|------|---------|--------------|
| 版本匹配无结果 | AskUserQuestion 让用户选择 | 使用 defaultVersion |
| 变体选择(hasVariants) | AskUserQuestion 让用户选择 | 从 plan 内容推断技术栈自动选择 |
| 任务匹配多候选 | AskUserQuestion 让用户选择 | 按关键词优先级取第一个，无匹配按 ID 升序分配 |
| 无未关闭任务 | 提示用户去 TFS 创建任务 | 报错终止 |
| 批量克隆确认 | AskUserQuestion 确认克隆计划 | 直接执行克隆 |
| Plan 概要确认 | AskUserQuestion 确认开始 | 直接开始执行 |
| 用户验证(阶段5) | AskUserQuestion 确认验证结果 | 自动视为验证通过，进入阶段6 |
| Worktree 清理(阶段7) | AskUserQuestion 确认 | 自动清理 |

**变体自动推断规则（headless 模式）：** 扫描 plan.md 内容，如果包含 "Vue3"、"typescript"、"win-design-next"、"新会诊" 等关键词，选择 `variant: "new"` 的仓库；否则选择 `variant: "old"` 的仓库。

## 安全规范（全阶段适用）

### SQL 规范（后端，🔴 强制）

- **禁止循环内数据库查询** — 循环体内不得包含 Mapper/MyBatis/jdbcTemplate 等数据库查询调用
- **禁止无 WHERE 的 SQL** — 所有原生 SQL 必须有 WHERE 条件
- **IN 列表不超过 1000** — IN 查询的 List 必须有大小约束

违规时强制终止，输出具体文件行号。

### 分支保护（阶段2 + 阶段7，🔴 强制）

- **pre-push hook**（阶段2.4 安装）— 自动在仓库 `.git/hooks/pre-push` 安装拦截脚本，保护受保护分支（sr-next, sr-rc, master, main, release），**对所有推送方式生效**（命令行、IDEA、技能执行）
- 禁止直接提交到基准分支（`fromBranch`），必须在 `feature/{任务ID}` 上操作
- 提交前和推送前双重检查当前分支名
- 紧急绕行：`BYPASS_HOOK=1 git push ...`

### 代码暂存（阶段7.1）

- 禁止 `git add -A`，使用精确暂存
- 敏感文件（.env、*.key、node_modules/）跳过

---

## 使用示例

```
用户: 执行计划 1553279
用户: 按plan开发 1553279
用户: 只执行 1553279 的前端开发
```
