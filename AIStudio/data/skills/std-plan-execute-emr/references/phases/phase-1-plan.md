# 阶段1: 获取 Plan 文件（完整细节）

本文件包含阶段1的所有子步骤。**不随 skill 加载**，进入阶段1时由 agent 按需读取。

### 阶段1.1: 读取路径配置

**调用公共技能获取路径配置：** 使用 `Skill` 工具调用 `std-code-paths`，然后按以下顺序读取配置文件：
1. `~/.claude/skills/std-code-paths/config/settings.json` — 全局设置（`codeBasePath`、`planBasePath`、`defaultSystem`、`defaultProject`）
2. `config/<system>/versions.json` — 版本定义（含 `iterationPatterns`）
3. `config/<system>/repositories.json` — 仓库注册表
4. `config/<system>/<项目名>.json` — 项目配置（按需读取）

**首次使用时**（`codeBasePath` 为空），使用 `AskUserQuestion` 填写并保存到 `settings.json`。

**路径展开：** 读取后立即展开 `~`、`$HOME`、`$变量名`，展开结果不回写配置文件。详细配置结构见 `references/config-reference.md`。

### 阶段1.2: 版本检测

从 TFS 需求的 `System.IterationPath` 匹配 `config/<system>/versions.json` 中的 `iterationPatterns` 确定版本。无匹配时：headless 模式使用 `defaultVersion`，交互模式列出选项让用户选择。

版本检测结果决定：参与开发的仓库列表、基准分支（`fromBranch`）、各仓库克隆分支。

### 阶段1.3: 检查 codeBasePath

`codeBasePath` 为空时提示用户输入（headless 模式下报错终止）。输入后回写配置并 `mkdir -p`。

### 阶段1.4: 项目自动匹配

读取 plan 文件，遍历项目 `aliases` 统计命中次数，取最高命中项目。置信度不足时：headless 模式使用 `defaultProject`，交互模式让用户确认。

### 阶段1.5: 变体选择（hasVariants）

项目 `hasVariants` 为 `true` 时需选择变体。headless 模式从 plan 推断（见上方规则），交互模式使用 `AskUserQuestion` + `variantPrompt`。

### 阶段1.6: 路径可用性检查与自动克隆

按版本筛选适用仓库，逐一检查 `local_path`：
1. **路径存在** → 直接使用
2. **路径空/不存在，有 clone_url** → 自动克隆（headless 直接执行，交互模式批量确认，克隆失败参见 E-15）
3. **路径空且无 clone_url** → 提示用户手动输入（参见 E-03）

**克隆步骤：**
```bash
cd {codeBasePath}
git clone -b {clone_branch} {clone_url}
# 前端仓库克隆后安装依赖
cd {repo_name} && test -f package-lock.json && npm ci || npm install
```

克隆成功后回写 `local_path` 到配置文件。

### 阶段1.7: 读取 Plan 文件

优先从本地读取 `{codeBasePath}/{planBasePath}/{workItemId}/前端plan.md` 和 `后端plan.md`，不存在则从 TFS 附件下载。两者都没有时终止并提示先生成 plan（参见 E-01）。

### 阶段1.8: Plan 格式校验

扫描 `Task` 标题（`/^#{2,3}\s+Task\s+\d+/i`），无 Task 时按 `##` 切分容错（参见 E-02）。仍失败则提示用户调整格式。

### 阶段1.9: Plan 分析

提取每个 Task 的文件清单、代码片段、验证步骤，统计前后端 Task 数量。向用户展示概要（headless 模式跳过确认直接执行）。

### 阶段1.10: 状态恢复检测（幂等性）

**检查是否存在上一次中断的执行状态。** 状态文件路径：`{codeBasePath}/{planBasePath}/{workItemId}/.execute-state.json`

**状态文件格式：**
```json
{
  "workItemId": "1553279",
  "taskId": "1559052",
  "currentVersion": "250815",
  "currentPhase": "frontend_dev",
  "completedTasks": { "frontend": ["Task 1", "Task 2"], "backend": [] },
  "worktrees": { "frontend": "/path/to/worktree", "backend": "/path/to/worktree" },
  "branches": { "frontend": "feature/1559052", "backend": "feature/1559052" },
  "fromBranch": "sr-next",
  "updatedAt": "2026-04-23T10:30:00Z"
}
```

所有仓库共用同一 `taskId`，`branches` 中前端和后端使用相同分支名。

**恢复流程：**

1. **状态文件存在且 currentPhase 不是 `completed`** → 检测为中断执行
2. 检查状态中记录的 worktree 和分支是否仍然存在：
   - worktree 目录存在且分支正确 → 可以恢复
   - worktree 不存在但分支存在 → 需重新创建 worktree
   - 都不存在 → 需从头开始（清除状态文件）
3. **校验 completedTasks 完整性**（恢复模式强制执行）：
   ```bash
   cd {worktree路径}
   git diff --name-only origin/{fromBranch}
   ```
   将 diff 结果与 `completedTasks` 中记录的 Task 涉及文件交叉验证：
   - 已记录的 Task 文件在 diff 中存在 → 确认有效
   - 已记录的 Task 文件在 diff 中不存在 → 标记为「需重做」并从 completedTasks 移除
4. 向用户汇报恢复选项（headless 模式自动选择续跑）：
   - **续跑**：从 currentPhase 继续，跳过已验证有效的 Task
   - **重新开始**：清理已有 worktree 和分支，从头执行
   - **终止**：不做任何操作

**状态更新时机：** 每个阶段开始时更新 `currentPhase`，每个 Task 完成时更新 `completedTasks`，阶段7完成时设置 `currentPhase: "completed"`。

### 阶段1.11: 前置条件预检

一次性检查所有前置条件：

| # | 检查项 | 方法 | 失败处理 |
|---|--------|------|---------|
| 1 | TFS 连接 | `get_work_item` | 提示检查 MCP 配置 |
| 2 | Plan 文件 | 确认已读取 | 参见 E-01 |
| 3 | 代码路径 | 目录存在或可克隆 | 参见 E-03 |
| 4 | Git 可用 | `git --version` | 提示安装 Git |
| 5 | 远程可达 | `git ls-remote origin` | 提示检查网络/凭证 |
| 6 | 版本确定 | `currentVersion` 非空 | 回退版本检测 |
| 7 | Worktree/分支状态 | 检测已有 worktree 和分支 | 参见 E-05 |

### 输出

- `前端plan.md` / `后端plan.md` 已读取并解析
- `.execute-state.json` 已创建或恢复
- `currentVersion`、匹配的项目和仓库列表已确定
- 前置条件全部通过
