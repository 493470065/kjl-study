# 阶段 2: 检测产品分析

### 元信息

- **前置条件**: 阶段1已完成（`state.json` 存在且 `completedStages` 包含 1）
- **触发条件**: 自动执行（阶段1完成后进入）
- **预计耗时**: < 1 分钟

### 输入

- 阶段1输出的 `state.json`（含 `workItemId`）
- TFS 工作项数据（来自阶段1）

### 前置条件

- TFS MCP 可用
- 阶段1已完成（`state.json` 存在且 `completedStages` 包含 1）

### 执行步骤

#### 2.0 恢复检查

如果 `state.json` 存在且 `completedStages` 包含 2，跳过本阶段，直接进入阶段 3。

#### 2.1 检测 TFS 产品分析状态

从 TFS 工作项中读取两个字段：

**一次调用获取全部信息：**

调用 `mcp__mcp-tfs-query__get_work_item` 获取工作项详情，返回结果中同时包含 `System.Tags` 和 `Winning.Demand.Analysis`（即 `requirementAnalysis` 字段）。

#### 2.2 判定逻辑

**检测条件（必须同时满足）：**

| 条件 | 检查方式 | 通过标准 |
|------|---------|---------|
| 标签存在 | 检查 `System.Tags` 是否包含 `AI-ANALYSIS` 或 `EMR-AI-ANALYSIS-V2` | 标签字符串中包含任一标签名 |
| 字段非空 | 检查 `Winning.Demand.Analysis`（即返回数据的 `requirementAnalysis` 字段） | 非 null、非空字符串、非纯空白 |

**判定结果：**

```
两个条件都满足 → hasProductAnalysis = true
任一条件不满足 → hasProductAnalysis = false
```

#### 2.3 结果处理

**`hasProductAnalysis = true` 时：**

1. 读取 `Winning.Demand.Analysis` 的完整内容
2. 将内容保存到输出目录下的 `产品业务分析.md`：
   - 路径：`{codeBasePath}/{planBasePath}/{需求号}/产品业务分析.md`
   - 格式：将 HTML 内容转换为 Markdown 保存（如原始内容为 HTML）
3. 输出提示信息：
   ```
   ✅ 检测到 TFS 已有产品需求分析
   - 标签: AI-ANALYSIS / EMR-AI-ANALYSIS-V2 ✓
   - 需求分析字段: 已有内容 ✓
   - 已保存到: 产品业务分析.md
   
   将跳过 brainstorm 阶段，复用产品分析内容直接生成设计文档和实施计划。
   ```

**`hasProductAnalysis = false` 时：**

1. 输出提示信息：
   ```
   ℹ️ TFS 未检测到产品需求分析
   - 标签: 未找到 AI-ANALYSIS 或 EMR-AI-ANALYSIS-V2
   - 需求分析字段: 为空
   
   将执行完整分析流程，生成的需求分析将回写到 TFS。
   ```

#### 2.4 更新 state.json

在输出目录下的 `state.json` 中追加以下字段：

```json
{
  "hasProductAnalysis": true 或 false,
  "productAnalysisSource": "tfs",
  "productAnalysisFile": "产品业务分析.md"
}
```

同时更新：
- `currentStage`: 2
- `completedStages`: 追加 2（如已有 [1] 则变为 [1, 2]）

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| TFS MCP 不可用 | 终止阶段 2，提示用户检查 TFS MCP 配置 |
| `get_work_item` 调用失败 | 重试最多 3 次，间隔 2s/4s/8s；仍失败则终止 |
| `System.Tags` 字段缺失 | 视为标签条件不满足，`hasProductAnalysis = false` |
| `Winning.Demand.Analysis` 内容为乱码 | 视为字段条件不满足，`hasProductAnalysis = false` |
| 文件保存失败（`产品业务分析.md`） | 重试一次，仍失败则将内容存入 `state.json` 的 `productAnalysisContent` 字段作为后备 |

### 输出

- `state.json` 更新：`hasProductAnalysis`, `productAnalysisSource`, `productAnalysisFile`, `currentStage: 2`, `completedStages` 追加 2
- `产品业务分析.md`（仅当 `hasProductAnalysis = true` 时生成）

**输出数据契约（后续阶段依赖的字段）：**

`state.json` 追加字段：
```json
{
  "hasProductAnalysis": "boolean — 是否检测到产品分析，决定阶段4是否跳过 brainstorm、阶段5是否切换输入源、阶段7是否额外回写",
  "productAnalysisSource": "'tfs' — 产品分析来源标识",
  "productAnalysisFile": "'产品业务分析.md' — 保存的文件名，阶段5读取此文件作为输入"
}
```
