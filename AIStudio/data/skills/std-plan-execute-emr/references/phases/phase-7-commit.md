# 阶段7: 提交关联与推送（完整细节）

本文件包含阶段7的所有步骤。**不随 skill 加载**，进入阶段7时由 agent 按需读取。

> **仅在前置阶段全部通过后执行。**

### 阶段7.1: 安全提交

**禁止 `git add -A`。** 使用精确暂存：

**分支保护检查（强制）：** 确认当前分支不是基准分支（`fromBranch`，如 sr-next），必须在 `feature/{任务ID}` 分支上操作：

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "{fromBranch}" ]; then
  echo "❌ 安全拦截：当前分支为基准分支 {fromBranch}，禁止直接提交！"
  echo "请确认已在 feature/{任务ID} 分支上操作。"
  exit 1
fi
```

在基准分支上则强制终止，不执行任何提交操作。

```bash
git status --short           # 检查变更
# 敏感文件检查：跳过 .env、*.key、node_modules/ 等（参见 E-24）
git diff --name-only | xargs git add
git diff --cached --stat     # 确认暂存内容
git commit -m "$(cat <<'EOF'
feature/{任务ID} {需求标题}

关联工作项: #{任务ID}
EOF
)"
```

### 阶段7.2: 添加 TFS 标签

为需求追加 `AI-CODING;EMR-AI-EXEC;STD-PLAN-EXECUTE-EMR-V3` 标签（先读后追加，不覆盖已有标签）。

**上传保障（三级重试 + 验证）：**

对标签更新操作执行以下保障流程：

1. **第一级：主路径** — 使用 `mcp__mcp-tfs-query__update_work_item` 更新标签，完成后调用 `get_work_item` 验证 `System.Tags` 包含目标标签
2. **第二级：重试 3 次** — 间隔 2s/4s/8s，每次验证
3. **第三级：降级 curl** — 使用 `curl -X PATCH` 直接调 TFS REST API 更新标签，降级后验证
4. **降级仍失败** → 输出失败报告，阻塞等待用户介入（参见 E-28~E-30）

### 阶段7.3: 推送分支

**推送前分支保护检查（强制）：** 二次确认推送目标不是基准分支：

```bash
PUSH_BRANCH="feature/{任务ID}"
if [ "$PUSH_BRANCH" = "{fromBranch}" ]; then
  echo "❌ 安全拦截：推送目标为基准分支 {fromBranch}，禁止直接推送！"
  exit 1
fi
git push origin feature/{任务ID}
```

远端已有同名分支时的处理（参见 E-17）。

### 阶段7.4: 清理 Worktree

向用户确认是否清理（headless 自动清理）：
```bash
cd {repository.local_path}
git worktree remove .claude/worktrees/feature+{任务ID} --force
```

更新状态文件 `currentPhase: "completed"`。

### 阶段7.5: 最终汇报

```
=== 全部完成 ===

分支: feature/{任务ID} 已推送到远程
关联任务: #{任务ID}
版本: {currentVersion} ({versionLabel})
标签: AI-CODING;EMR-AI-EXEC;STD-PLAN-EXECUTE-EMR-V3 已添加到需求 #{workItemId}
Worktree: 已清理 / 已保留

下一步: 在 TFS 上创建 Pull Request，合并到 {fromBranch}
```

### 输出

- 分支 `feature/{任务ID}` 已推送到远程
- commit 已关联任务 #{任务ID}
- `AI-CODING;EMR-AI-EXEC;STD-PLAN-EXECUTE-EMR-V3` 标签已添加到需求
- Worktree 已清理或保留（用户选择）
- `.execute-state.json` 更新：`currentPhase: "completed"`
