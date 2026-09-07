# 阶段7: 总结交付与 TFS 上传

### 元信息

- **前置条件**: 阶段1-6已完成（设计文档和 plan 已生成）
- **触发条件**: 自动执行（阶段6完成后进入）
- **预计耗时**: 1-3 分钟

### 输入

- 阶段5/6 生成的所有文档（根据 `changeScope` 条件）
- `state.json` 中的 `workItemId`, `hasExistingAnalysis`, `changeScope`
- `state.json` 中的 `hasProductAnalysis` 决定是否额外回写需求分析到 TFS

### 执行步骤

## 7.1 输出文件清单

列出所有已生成的文件：

```
{codeBasePath}/{planBasePath}/{需求号}/
├── state.json            # 阶段状态
├── brainstorm-notes.md   # 阶段3（复杂需求）
├── 需求分析.md           # 阶段4.1
├── 前端设计.md           # 阶段4.2（如需前端改动）
├── 后端设计.md           # 阶段4.3（如需后端改动）
├── API契约.md            # 阶段4.5（如涉及API变更）
├── 测试功能文档.md       # 阶段4.6
├── 前端plan.md           # 阶段5（如需前端改动）
└── 后端plan.md           # 阶段5（如需后端改动）
```

## 7.2 TFS 上传（自动执行）

> **设计已在阶段5经用户确认（复杂需求）或直接生成（简单需求），此处自动上传到 TFS。**

> **强制并行：附件上传与标签添加必须并行执行。** 在一条消息中同时调用上传工具和标签更新工具。

### 7.2.1 上传需求分析到工作项「需求分析」字段

**条件：** 仅当 `hasExistingAnalysis === false` **且** `hasProductAnalysis === false` 时执行。

> 当 `hasProductAnalysis === true` 时，TFS 上已有产品分析，不需要再回写。
> 当 `hasExistingAnalysis === true` 时，TFS 上已有需求分析内容，不需要覆盖。

**方式：** 使用脚本 `scripts/upload-analysis.cjs`（绕过 tfs-client 的 Content-Length bug）。

**执行命令：**

```bash
TFS_CLIENT_DIR=$(dirname $(find ~/.claude/mcp -name "tfs-client.mjs" -type f 2>/dev/null | head -1))
TFS_CLIENT_DIR="$TFS_CLIENT_DIR" WORK_ITEM_ID=WORK_ITEM_ID node scripts/upload-analysis.cjs
```

> **注意：** 脚本使用 `.cjs` 后缀 + `require` 加载 marked，`await import()` 动态加载 tfs-client.mjs。使用环境变量传递参数避免路径特殊字符问题。

### 7.2.2 上传设计文件为附件（先传后删）

**条件上传：**
- `需求分析.md`（仅当 `hasProductAnalysis === false` 时上传）
- `产品业务分析.md`（仅当 `hasProductAnalysis === true` 时上传，作为设计依据的溯源文件）

**条件上传：** `API契约.md`、`前端设计.md`、`后端设计.md`、`测试功能文档.md`、`前端plan.md`、`后端plan.md`（仅当文件实际生成时）

**步骤1：上传所有文件**

动态构建上传文件列表并使用 `mcp__mcp-tfs-query__upload_attachments` 上传。

**步骤2：清理旧的同名附件**

上传成功后，使用脚本 `scripts/cleanup-attachments.cjs`：

```bash
TFS_CLIENT_DIR=$(dirname $(find ~/.claude/mcp -name "tfs-client.mjs" -type f 2>/dev/null | head -1))
TFS_CLIENT_DIR="$TFS_CLIENT_DIR" WORK_ITEM_ID=WORK_ITEM_ID node scripts/cleanup-attachments.cjs
```

### 7.2.3 添加标签（追加模式）

**基础标签（始终添加）：**
- `AI-ANALYSIS-PLUS`
- `EMR-AI-PLAN`
- `STD-REQ-TO-PLAN-EMR-V3`

**条件标签（仅当 `hasProductAnalysis === false` 时追加）：**
- `AI-ANALYSIS`
- `EMR-AI-ANALYSIS-V2`

> 当 `hasProductAnalysis === true` 时，这些标签已经存在，不需要重复添加。

1. 调用 `mcp__mcp-tfs-query__get_work_item` 获取现有标签
2. 逐个检查并追加不存在的标签（分号分隔）
3. 使用 `mcp__mcp-tfs-query__update_work_item` 更新

## 7.2.4 自动创建子任务（自动执行）

> **在附件上传和标签添加完成后执行。根据 `state.json` 中的 `changeScope` 判断是否需要创建任务。**

**条件：** `changeScope.frontend` 或 `changeScope.backend` 为 `true` 时执行。

**步骤：**

1. 从 `state.json` 读取 `changeScope`，确定是否涉及前端/后端
2. 执行脚本自动检查并创建：

```bash
TFS_CLIENT_DIR=$(dirname $(find ~/.claude/mcp -name "tfs-client.mjs" -type f 2>/dev/null | head -1))
CURRENT_USER=$(git config user.username 2>/dev/null || git config user.name 2>/dev/null | tr 'A-Z' 'a-z' | tr ' ' '_' || echo "")
TFS_CLIENT_DIR="$TFS_CLIENT_DIR" WORK_ITEM_ID=WORK_ITEM_ID CREATE_FRONTEND=true/false CREATE_BACKEND=true/false CURRENT_USER="$CURRENT_USER" node scripts/create-tasks.cjs
```

**脚本逻辑：**
- 获取需求工作项的子任务列表（通过 `Hierarchy-Forward` 关系）
- 检查当前用户是否已有子任务（不限状态）→ 有则跳过创建
- 前端+后端合并创建**一个**任务，标题 = 需求标题
- 自动继承父工作项的区域路径、迭代路径

**CREATE_FRONTEND / CREATE_BACKEND 参数取值：** 直接使用 `state.json` 中 `changeScope` 的对应字段值。

### 7.2.5 上传保障机制（三级重试 + 验证）

> **原则：每一项 TFS 操作必须成功。** 不允许静默失败。

对 7.2.1 ~ 7.2.4 中的每一项操作，执行以下保障流程：

**第一级：主路径**

使用 TFS MCP 工具（`mcp__mcp-tfs-query__*`）直接执行操作。
操作完成后**立即验证**：

| 操作类型 | 验证方式 |
|---------|---------|
| 字段回写（`Winning.Demand.Analysis`） | 重新调用 `get_work_item`，读取 `requirementAnalysis` 字段，比对内容是否一致 |
| 附件上传 | 调用 `list_attachments`，检查目标文件名是否存在 |
| 标签添加 | 调用 `get_work_item`，读取 `System.Tags`，检查目标标签是否存在 |
| 子任务创建 | 调用 `get_work_item` 获取子工作项列表，检查标题是否匹配 |

验证通过 → 标记该项成功，继续下一项。
验证失败或操作异常 → 进入第二级。

**第二级：重试（最多 3 次）**

- 第 1 次重试前等待 2 秒
- 第 2 次重试前等待 4 秒
- 第 3 次重试前等待 8 秒
- 每次重试后执行同样的验证
- 3 次仍失败 → 进入第三级

**第三级：降级方案**

| 操作类型 | 降级方式 |
|---------|---------|
| 字段回写 | 使用 `scripts/upload-analysis.cjs` 脚本（绕过 MCP 直接调 API） |
| 附件上传 | 使用 `curl` 直接调 TFS REST API 上传附件并关联工作项 |
| 标签添加 | 使用 `curl -X PATCH` 直接调 TFS REST API 更新标签 |
| 子任务创建 | 使用 `curl -X POST` 直接调 TFS REST API 创建子工作项 |

降级后验证。
降级仍失败 → 阻塞，输出失败报告并等待用户介入。

**失败报告格式：**

```
⚠️ TFS 上传统计报告：
━━━━━━━━━━━━━━━━━━━━
✅ 标签添加 AI-ANALYSIS       — 成功
✅ 标签添加 EMR-AI-ANALYSIS-V2 — 成功
✅ 字段回写 Winning.Demand.Analysis — 成功
✅ 附件上传 需求分析.md         — 成功
❌ 附件上传 前端设计.md          — 失败（3次重试+降级均失败）
   错误: Connection timeout
   本地文件: {codeBasePath}/{planBasePath}/{需求号}/前端设计.md
   建议: 手动在 TFS Web 界面上传该文件
✅ 子任务创建                  — 成功

请手动处理失败项后输入 "继续"
```

**上传顺序（串行执行）：**

```
1. 标签添加 → 验证
2. 字段回写 → 验证（仅当 hasProductAnalysis === false 且 hasExistingAnalysis === false）
3. 附件上传 → 逐个文件上传并验证
4. 子任务创建 → 验证
```

每项操作独立保障。前一项失败不阻塞后续操作（记录失败状态，最终统一报告）。

## 7.3 下一步建议

- 满意 → 进入开发阶段（使用 `std-plan-execute-emr` 技能）
- 需调整设计 → 回到阶段5修改
- 需修改计划 → 回到阶段6重新生成

### 输出

- 需求分析上传到 TFS `Winning.Demand.Analysis` 字段
- 设计文档作为 TFS 附件上传
- `AI-ANALYSIS-PLUS` + `EMR-AI-PLAN` + `STD-REQ-TO-PLAN-EMR-V3` 标签添加到工作项（始终）
- `AI-ANALYSIS` + `EMR-AI-ANALYSIS-V2` 标签添加到工作项（仅当 `hasProductAnalysis === false`）
- 根据变更范围自动创建子任务（标题 = 需求标题，前端+后端合并为一个任务）
- `state.json` 更新：`completedStages: [1,2,3,4,5,6,7]`

**输出数据契约（完成后用户可检查的状态）：**

`state.json` 最终状态：
```json
{
  "workItemId": "string",
  "currentStage": 7,
  "complexity": "'simple' | 'complex'",
  "currentVersion": "string",
  "matchedProject": "string",
  "matchedRepositories": ["string"],
  "changeScope": { "frontend": "boolean", "backend": "boolean", "api": "boolean" },
  "completedStages": [1, 2, 3, 4, 5, 6, 7]
}
```

TFS 工作项更新确认清单：
- [ ] `Winning.Demand.Analysis` 字段已填充（仅当 `hasExistingAnalysis === false` 且 `hasProductAnalysis === false`）
- [ ] 附件已上传（去重旧同名附件）
- [ ] 标签包含 `AI-ANALYSIS-PLUS`、`EMR-AI-PLAN` 和 `STD-REQ-TO-PLAN-EMR-V3`（始终）
- [ ] 标签包含 `AI-ANALYSIS` 和 `EMR-AI-ANALYSIS-V2`（仅当 `hasProductAnalysis === false`）
- [ ] 子任务已创建（仅当当前用户无已有子任务时）
- [ ] 所有上传操作均已验证成功（三级保障通过）
