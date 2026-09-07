---
name: std-plan-execute
description: 计划执行技能 - 根据 plan.md 自动执行前后端代码开发。读取本地或 TFS 附件中的前端/后端 plan.md，从 sr-next 创建 fix/需求号 分支，按 plan 修改代码，完成后强制进行代码审查。当用户提到"执行计划"、"按计划开发"、"开始开发"、"执行plan"、"plan执行"、"根据plan开发"、"需求开发"、"开始编码"、"按plan改代码"等关键词时触发。也适用于用户直接提供需求号要求开始开发的场景。
version: 1.0.0
parameters:
  - name: workItemId
    description: TFS 工作项 ID / 需求号，用于定位 plan.md 文件和创建分支
    type: string
    required: true
---

# 计划执行技能

## 角色定位

你是一位资深全栈开发工程师，负责根据已生成的实施计划（plan.md）执行代码开发。你严格遵循计划中的步骤，一步步实现代码修改，确保每个 Task 都被正确完成。

## 总体工作流

```
阶段1: 获取 Plan 文件 → 阶段2: 准备 Git 分支 → 阶段3: 执行前端开发 → 阶段4: 执行后端开发 → 阶段5: 代码审查 → 阶段6: 推送与关联
```

---

## 阶段1: 获取 Plan 文件

### 1.1 读取路径配置

读取技能目录下的 `config/paths.json` 配置文件：

```json
{
  "planBasePath": "plan 文件的基础目录，如 过程文件",
  "frontendPath": "前端代码路径",
  "backendPath": "后端代码路径",
  "fromBranch": "sr-next",
  "branchFormatter": "fix/{taskId}"
}
```

**首次使用时**（配置文件不存在或字段为空），使用 `AskUserQuestion` 询问用户逐项填写，然后自动保存配置。

### 1.2 读取本地 Plan 文件

根据需求号，尝试从本地读取 plan 文件：

```
{planBasePath}/{workItemId}/前端plan.md
{planBasePath}/{workItemId}/后端plan.md
```

### 1.3 从 TFS 获取 Plan 文件

如果本地文件不存在，通过 mcp-tfs-query MCP 从 TFS 工作项附件中获取：

1. 调用 `mcp__mcp-tfs-query__list_attachments` 列出工作项附件
2. 在附件列表中查找 `前端plan.md` 和 `后端plan.md`
3. 调用 `mcp__mcp-tfs-query__download_attachments` 下载到 `{planBasePath}/{workItemId}/` 目录

如果 TFS 附件中也不存在对应的 plan 文件，提示用户：
> 未找到需求 {workItemId} 的 plan 文件。请先使用 std-req-to-plan 技能生成实施计划，或手动提供 plan 文件路径。

### 1.4 Plan 文件分析

读取到 plan 文件后，提取关键信息：
- 每个 Task 的文件修改清单
- 代码片段
- 验证步骤
- 前端/后端分别有多少个 Task

向用户展示计划概要，确认是否开始执行。

---

## 阶段2: 准备 Git 分支（Worktree 模式）

开发始终在独立的 Git Worktree 中进行，避免污染主仓库工作目录。

**重要：分支名使用任务 ID（而非需求 ID）。** 例如前端任务 #1559052 对应分支 `fix/1559052`。

### 2.0 获取任务 ID

**步骤1：自动获取子任务**

通过 TFS API 查询需求工作项的子级关系，自动提取任务 ID：

1. 读取需求的关联关系（relations），筛选 `System.LinkTypes.Hierarchy-Reverse` 类型的子工作项
2. 取第一个子任务作为开发任务 ID（前端和后端统一使用同一个任务）

**步骤2：未获取到时提示用户输入**

如果自动获取失败（无子任务），通过 `AskUserQuestion` 提示用户手动输入任务 ID。

分支命名规则：`fix/{任务ID}`

### 2.1 更新基准分支

先在主仓库拉取最新代码：

**前端仓库：**
```bash
cd {frontendPath}
git fetch origin
git checkout {fromBranch}
git pull origin {fromBranch}
```

**后端仓库（如果后端 plan 存在）：**
```bash
cd {backendPath}
git fetch origin
git checkout {fromBranch}
git pull origin {fromBranch}
```

### 2.2 处理已存在的同名分支

如果本地已有 `fix/{任务ID}` 或 `fix/{任务ID}` 分支：
- 询问用户是要继续在已有分支上开发，还是删除重建
- 如果用户选择重建：`git branch -D fix/{对应任务ID}` 删除旧分支
- 不要擅自删除或覆盖已有分支

### 2.3 创建 Worktree

使用 `EnterWorktree` 工具创建隔离工作环境：

**前端仓库（当前会话正在前端仓库中时）：**
```
EnterWorktree(name: "fix/{任务ID}")
```

这会在 `.claude/worktrees/fix+{任务ID}` 下创建独立工作目录，并自动生成新分支。

**前端仓库（当前会话不在前端仓库中时）：**
```bash
cd {frontendPath}
git worktree add .claude/worktrees/fix+{任务ID} -b fix/{任务ID} HEAD
```

**后端仓库（如果后端 plan 存在）：**
```bash
cd {backendPath}
git worktree add .claude/worktrees/fix+{任务ID} -b fix/{任务ID} HEAD
```

### 2.4 确认 Worktree 状态

创建 worktree 后，确认分支和基准点：
```bash
git branch --show-current  # 前端应为 fix/{任务ID}，后端应为 fix/{任务ID}
git log --oneline -1       # 应为 {fromBranch} 的最新 commit
```

### 2.5 异常处理

| 场景 | 处理方式 |
|------|---------|
| 代码路径不存在 | 提示用户更新 config/paths.json |
| Git 仓库未初始化 | 提示用户确认代码路径是否正确 |
| fromBranch 不存在 | 提示用户确认分支名称配置 |
| 网络问题导致 fetch 失败 | 提示用户检查网络后重试 |
| 同名分支已存在且被 checkout | 先 `git checkout {fromBranch}` 释放分支，再重建 |
| EnterWorktree 报分支冲突 | 先删除旧分支 `git branch -D fix/{对应任务ID}`，再重试 |

---

## 阶段3: 执行前端开发

### 3.1 执行前提

- 前端 plan 文件已获取
- 已通过 Worktree 创建 `fix/{任务ID}` 分支（工作目录为 `.claude/worktrees/fix+{任务ID}`）

### 3.2 按 Task 执行

逐个 Task 执行前端 plan.md 中的步骤。对于每个 Task：

1. **读取 Task 描述** - 理解要修改什么文件、改什么内容
2. **读取目标文件** - 先读取当前文件内容，理解上下文
3. **执行修改** - 按 plan 中的代码片段或描述进行修改
4. **本地验证** - 如 plan 中有验证步骤（如启动开发服务器），执行验证
5. **提交** - 按 plan 中的 commit 信息提交代码

### 3.3 Commit 规范

每个 Task 完成后提交，commit message 格式：

```
feat/fix/refactor(scope): 简短描述

Task N/M of #{workItemId}
```

### 3.4 注意事项

- 严格按 plan 执行，不要自行发挥添加 plan 之外的功能
- 如果 plan 中的代码片段与实际代码有出入（如行号偏移、上下文不同），根据实际情况调整，但要保持修改的意图不变
- 如果发现 plan 中有明显错误（如引用了不存在的文件），暂停并告知用户，让用户决定如何处理
- 修改代码前必须先读取当前文件内容，不能盲目覆盖

---

## 阶段4: 执行后端开发

### 4.1 执行前提

- 后端 plan 文件已获取
- 后端仓库已在独立 Worktree 中创建 `fix/{任务ID}` 分支

### 4.2 按 Task 执行

与前端开发流程相同，逐个 Task 执行后端 plan.md 中的步骤。

如果后端 plan 不存在（纯前端需求），跳过此阶段。

---

## 阶段5: 代码审查

这是**强制步骤**，所有代码修改完成后必须执行。

### 5.1 审查前检查

在调用代码审查之前，确认：

1. 所有 plan 中的 Task 已完成
2. 代码已全部提交到对应分支（前端：`fix/{任务ID}`，后端：`fix/{任务ID}`）
3. 前端/后端分别统计修改文件数量和 commit 数量

### 5.2 执行代码审查

调用 `code-review:code-review` 技能进行代码审查。

审查时需提供以下上下文：
- 需求号和需求标题
- 修改范围概要
- 基于 `fromBranch` 的 diff

```bash
# 生成 diff 供审查（在 worktree 目录中执行）
git diff {fromBranch}...fix/{任务ID} --stat
git diff {fromBranch}...fix/{任务ID}
```

### 5.3 审查结果处理

**重要：如果代码审查结果为不通过，必须强制终止后续所有操作（阶段6 推送与关联、添加标签等），立即提示用户。**

终止时向用户输出：
```
⚠️ 代码审查未通过，后续操作已终止。

审查发现的问题：
- [列出具体问题]

请修复以上问题后重新执行。
```

根据代码审查的反馈：
- **高风险问题**：必须修复，修复后重新提交和审查
- **中风险问题**：建议修复，告知用户让用户决定
- **低风险建议**：记录下来，由用户决定是否处理

**只有审查通过（无高风险问题）后，才可继续执行 5.4 及后续阶段。**

### 5.4 审查完成

代码审查通过后，生成代码审查报告文件（markdown 格式），保存到 `{planBasePath}/{workItemId}/code-review-{workItemId}.md`。

报告内容包含：
- 需求号、分支、基于分支、审查时间、审查结果
- 变更概要（文件数、行数、变更类型）
- 变更文件列表及说明
- Diff 详情
- 审查评估（正确性、风险、代码规范、范围控制）
- 审查结论

### 5.5 上传审查报告到任务附件

将代码审查报告上传到**对应任务**的 TFS 附件（不是需求本身）：
- 前端审查报告 → 上传到前端任务工作项
- 后端审查报告 → 上传到后端任务工作项

使用 `mcp__mcp-tfs-query__upload_attachment` 上传。任务工作项 ID 通过 `AskUserQuestion` 向用户获取。

### 5.6 向用户汇报

```
=== 开发完成汇报 ===

需求: #{workItemId} {需求标题}
分支: fix/{任务ID}
工作目录: .claude/worktrees/fix+{任务ID}/ (Worktree 模式)

前端修改:
- 文件数: X 个
- Commit 数: Y 个
- 基于: {fromBranch}

后端修改: (如有)
- 文件数: X 个
- Commit 数: Y 个
- 基于: {fromBranch}

代码审查: ✅ 通过 / ⚠️ 有建议项

下一步:
1. 退出 Worktree (ExitWorktree action: keep)
2. 推送分支到远程: git push origin fix/{任务ID}
3. 确认合并后可删除 Worktree
```

---

## 阶段6: 推送与关联

任务 ID 已在阶段2.0获取，此处直接使用。

### 6.1 Commit 关联工作项

推送前，确保 commit message 中包含任务 ID：

如 commit message 中未包含对应任务 ID，使用 `git commit --amend` 追加关联：
```
feat/fix/refactor(scope): 简短描述

关联工作项: #{任务ID} #{workItemId}
```

### 6.2 推送分支

```bash
git push origin fix/{任务ID}
```

### 6.4 确认关联

推送完成后，通过 `mcp__mcp-tfs-query__get_work_item` 确认任务工作项存在，向用户汇报关联状态。

### 6.5 为需求添加 AI-CODING 标签

推送成功后，为**需求工作项**添加 `AI-CODING` 标签。

**重要：必须先读取已有标签，追加而非覆盖。** 步骤如下：

1. 通过 `mcp__mcp-tfs-query__get_work_item(id: {workItemId})` 读取需求，提取已有标签
2. 检查已有标签中是否已包含 `AI-CODING`，已包含则跳过此步骤
3. 拼接标签：`现有标签;AI-CODING`（用分号 `;` 分隔）
4. 调用 `mcp__mcp-tfs-query__update_work_item` 更新标签

```
// 无已有标签
mcp__mcp-tfs-query__update_work_item(id: {workItemId}, updates: { "System.Tags": "AI-CODING" })

// 有已有标签如 "标签A;标签B"
mcp__mcp-tfs-query__update_work_item(id: {workItemId}, updates: { "System.Tags": "标签A;标签B;AI-CODING" })

// 已包含 AI-CODING → 跳过，不重复添加
```

---

## 异常处理

| 场景 | 处理方式 |
|------|---------|
| Plan 文件不存在（本地和 TFS 都没有） | 终止流程，提示用户先生成 plan |
| 代码路径配置为空 | 引导用户填写配置 |
| Git 分支创建失败 | 检查 fromBranch 是否存在，提示用户 |
| Plan 中的文件路径在代码中不存在 | 暂停并告知用户，不自行猜测 |
| 开发过程中遇到编译错误 | 尝试修复，如无法解决则暂停告知用户 |
| 代码审查发现严重问题 | 修复后重新审查 |
| Worktree 创建失败（同名分支已 checkout） | 先在主仓库切回 fromBranch 释放分支，再删除旧分支后重试 |
| Worktree 目录已存在 | 使用 `git worktree remove` 清理后重试 |

---

## 使用示例

**示例1 - 通过需求号执行开发：**
```
用户: 执行计划 1553279
用户: 按plan开发 1553279
用户: 开始开发需求 1553279
```

**示例2 - 指定 plan 文件路径：**
```
用户: 根据过程文件/1553279/前端plan.md 开始开发
```

**示例3 - 仅执行前端或后端：**
```
用户: 只执行 1553279 的前端开发
用户: 只做后端部分
```
