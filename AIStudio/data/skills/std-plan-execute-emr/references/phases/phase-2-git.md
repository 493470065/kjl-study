# 阶段2: 准备 Git 分支（完整细节）

本文件包含阶段2的所有子步骤。**不随 skill 加载**，进入阶段2时由 agent 按需读取。

### 阶段2.0: 获取任务 ID

获取需求下关联的未关闭任务，取第一个作为开发任务号，用于分支命名和提交关联。

#### 阶段2.0.1: 查询关联任务

> **注意**：MCP 的 `get_work_item` 不返回 `relations` 字段，必须通过 TFS Client 脚本直接获取。

使用脚本获取未关闭的子任务列表：

```bash
TFS_CLIENT_DIR=$(dirname $(find ~/.claude/mcp -name "tfs-client.mjs" -type f 2>/dev/null | head -1))
TFS_CLIENT_DIR="$TFS_CLIENT_DIR" WORK_ITEM_ID={workItemId} node {skillDir}/scripts/get-child-tasks.cjs
```

脚本通过 TFS Client 直接调用 API 获取工作项（含 `relations`），筛选 `Hierarchy-Forward` 类型的子工作项，返回未关闭的 Task 列表（JSON 数组）。每个元素包含 `id`、`title`、`state`、`type` 字段。

#### 阶段2.0.2: 无任务处理

如果筛选结果为空（没有未关闭的 Task）（参见 E-18）：
- **交互模式**：输出提示并终止：

  > 需求 #{workItemId} 下没有未关闭的开发任务。请在 TFS 上创建对应的开发任务后重试。

- **Headless 模式**：报错终止，日志输出 `"No open tasks found for work item {workItemId}"`

#### 阶段2.0.3: 选取任务

取第一个未关闭任务作为开发任务，所有仓库共用同一任务 ID。

分支使用任务号而非需求号，是因为 TFS 的提交关联机制要求在任务级别追踪开发进度——每个 commit 需关联到具体的开发任务，而非上层的 Product Backlog Item。

**选取流程：**

1. **仅1个未关闭任务**：直接使用，无需选择
2. **多个未关闭任务**：
   - 交互模式：使用 `AskUserQuestion` 列出所有未关闭任务让用户手动指定
   - Headless 模式：取第一个未关闭任务（按 ID 升序）

#### 阶段2.0.4: 确定分支命名

所有仓库共用同一分支：`feature/{任务ID}`

### 阶段2.1: 强制同步远程基准分支

**必须确保本地远端引用与远程仓库完全一致。** 对每个匹配的仓库依次执行：

```bash
cd {repository.local_path}
git fetch origin --prune
```

`fromBranch` 取自 `config/<system>/versions.json` 中对应版本的 `fromBranch`（仓库级别覆盖用项目 repos 中的 `versions[currentVersion].clone_branch`）。

**验证远端分支存在：** `git rev-parse origin/{fromBranch}` — 失败时终止并提示检查分支名和远程仓库状态（参见 E-04）。

### 阶段2.2: 处理已存在的同名分支

本地已有 `feature/{任务ID}` 时，**必须先与远端同步确保代码最新**：

```bash
# 1. 检查远端是否也有同名分支
git rev-parse origin/feature/{任务ID} 2>/dev/null
```

根据远端是否存在同名分支：
- **远端已有同名分支**：`git fetch origin feature/{任务ID}` 拉取最新，然后 `git checkout feature/{任务ID} && git reset --hard origin/feature/{任务ID}` 强制与远端同步
- **远端无同名分支**：本地分支保留，但需 `git rebase origin/{fromBranch}` 将其变基到最新基准分支

**`git reset --hard` 前的安全保护（强制执行）：**
```bash
# 检查是否有未提交的变更
if [ -n "$(git status --porcelain)" ]; then
  echo "检测到未提交变更，自动 stash 保护..."
  git stash push -m "auto-stash-before-sync-{任务ID}"
fi
# 执行 reset
git reset --hard origin/feature/{任务ID}
# 恢复 stash（如果有）
if git stash list | grep -q "auto-stash-before-sync-{任务ID}"; then
  git stash pop
fi
```

**状态恢复模式**：如果状态文件存在且指向该分支，直接续跑（仍需先执行上述同步操作确保代码最新）。

**非恢复模式的处理策略：**
- **交互模式**：询问继续使用还是删除重建（删除前会先同步）
- **Headless 模式**：如果分支有未提交变更，保留并同步远端代码后续跑；无变更则删除基于 `origin/{fromBranch}` 重建

**同步后验证：**
```bash
git log --oneline -1 origin/{fromBranch}
git merge-base HEAD origin/{fromBranch}
```

### 阶段2.3: 创建 Worktree

使用 Bash `git worktree` 命令（不依赖 EnterWorktree 工具），**基于远端最新基准分支** `origin/{fromBranch}` 创建：

```bash
cd {repository.local_path}
# 确保远端引用最新（阶段2.1已 fetch，此处为双重保障）
git fetch origin
# 基于远端分支创建 worktree，确保代码是最新的
git worktree add .claude/worktrees/feature+{任务ID} -b feature/{任务ID} origin/{fromBranch}
```

多仓库时 worktree 名称加后缀区分：
- 前端仓库：`.claude/worktrees/feature+{任务ID}`
- 后端仓库：`.claude/worktrees/feature+{任务ID}+backend`

前后端同仓库只创建一个 worktree。创建后保存状态到 `.execute-state.json`（`taskId` 和 `branches` 字段）。

### 阶段2.4: 安装 pre-push hook（分支保护）

为每个仓库安装 git pre-push hook，**拦截推送到受保护分支的操作**。此 hook 对该仓库的所有推送生效，包括命令行、IDEA、技能执行——覆盖手动 push 场景。

```bash
cd {repository.local_path}

# 受保护分支列表（按需扩展）
cat > .git/hooks/pre-push << 'HOOK'
#!/bin/sh
# pre-push hook — 禁止推送到受保护分支
# 适用于所有推送方式（命令行、IDEA、技能执行）

PROTECTED_BRANCHES="sr-next sr-rc master main release"
remote="$1"
url="$2"

while read local_ref local_sha remote_ref remote_sha; do
  branch_name=$(echo "$remote_ref" | sed 's|refs/heads/||')
  for protected in $PROTECTED_BRANCHES; do
    if [ "$branch_name" = "$protected" ]; then
      echo ""
      echo "❌ 安全拦截：禁止推送到受保护分支 [$branch_name]！"
      echo "   仓库: $(basename $(git rev-parse --show-toplevel))"
      echo "   远程: $remote ($url)"
      echo ""
      echo "   如确需推送，请使用命令："
      echo "   BYPASS_HOOK=1 git push $remote $branch_name"
      echo ""
      exit 1
    fi
  done
done

# 紧急绕行开关
if [ -n "$BYPASS_HOOK" ]; then
  echo "⚠️  已绕过分支保护（BYPASS_HOOK=1）"
  exit 0
fi

exit 0
HOOK

chmod +x .git/hooks/pre-push
echo "✅ pre-push hook 已安装 — 受保护分支: sr-next, sr-rc, master, main, release"
```

**注意：** 如果仓库已有 `pre-push` hook，需合并逻辑而非覆盖。检测方式：
```bash
if [ -f .git/hooks/pre-push ]; then
  # 检查是否已包含我们的保护逻辑
  if grep -q "PROTECTED_BRANCHES" .git/hooks/pre-push; then
    echo "pre-push hook 已存在且包含分支保护，跳过"
  else
    # 在已有 hook 开头追加保护逻辑
    echo "检测到已有 pre-push hook，将在开头追加分支保护逻辑"
    # ... 追加逻辑
  fi
fi
```

### 阶段2.5: 确认 Worktree 状态

```bash
git branch --show-current && git log --oneline -1 && git merge-base HEAD origin/{fromBranch}
```

### 输出

- 所有匹配仓库的 worktree 已创建（`.claude/worktrees/feature+{任务ID}`）
- 分支 `feature/{任务ID}` 基于最新 `origin/{fromBranch}` 创建
- **pre-push hook 已安装**（拦截推送到受保护分支）
- `.execute-state.json` 更新：`taskId`、`worktrees`、`branches`、`fromBranch`
