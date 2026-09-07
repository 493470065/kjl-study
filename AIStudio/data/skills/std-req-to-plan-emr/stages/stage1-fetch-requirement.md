# 阶段1: 获取需求内容

### 元信息

- **前置条件**: 无（本阶段为流程起点）
- **触发条件**: 用户调用 skill（提供工作项 ID 或手动需求文本）
- **预计耗时**: < 1 分钟

### 输入

- 用户提供的工作项 ID（`workItemId` 参数）或手动需求文本

### 执行步骤

#### 1.1 需求来源判定

首先询问用户需求来源：

- **TFS 工作项**：用户提供工作项 ID
- **手动描述**：用户直接提供需求文本

> **快捷判断：** 如果调用 skill 时已传入 `workItemId` 参数，直接使用该 ID，无需询问。

#### 1.2 从 TFS 获取需求

如果用户提供工作项 ID：

1. 调用 `mcp__mcp-tfs-query__get_work_item` 获取工作项详情（已包含「需求分析」字段 `requirementAnalysis`，对应 TFS 字段 `Winning.Demand.Analysis`）
2. **优先读取「需求分析」字段**：检查返回结果中的 `requirementAnalysis` 字段是否有内容
   - **有内容**：将需求分析字段的内容作为核心需求输入，同时提取标题等基本字段，跳过读取描述字段
   - **无内容**：提取关键字段：标题、描述、验收标准、附件列表，作为需求输入
3. 如果工作项有附件，调用 `mcp__mcp-tfs-query__download_attachments` 下载附件到输出目录
4. 记录以下信息供后续阶段使用：

```json
{
  "workItemId": "工作项ID",
  "title": "标题",
  "requirementAnalysis": "需求分析字段内容（HTML格式，来自 Winning.Demand.Analysis）",
  "description": "详细描述（仅当需求分析字段为空时使用）",
  "acceptanceCriteria": "验收标准",
  "relatedItems": ["关联工作项ID列表"],
  "attachments": ["附件列表"],
  "hasExistingAnalysis": "true/false - 需求分析字段是否已有内容",
  "iterationPath": "System.IterationPath 的值，供阶段2版本检测使用"
}
```

#### 1.3 手动输入需求

如果用户手动提供需求文本：
- 将用户提供的文本作为核心需求输入
- 提示用户补充验收标准（可选）

#### 1.4 创建输出目录

输出目录格式：`{codeBasePath}/{planBasePath}/{需求号}/`

- TFS 工作项：使用工作项 ID 作为目录名（如 `{codeBasePath}/{planBasePath}/1445554/`）
- 手动输入需求：使用年月日作为目录名（如 `{codeBasePath}/{planBasePath}/20260414/`）

> **路径获取：** 先调用 `Skill` 工具（参数 `skill: "std-code-paths"`）加载公共路径配置技能，然后从 `~/.claude/skills/std-code-paths/config/settings.json` 中读取 `codeBasePath` 和 `planBasePath`。

#### 1.5 初始化 state.json

在输出目录下创建 `state.json`，记录阶段1的关键状态：

```json
{
  "workItemId": "工作项ID或日期标识",
  "currentStage": 1,
  "currentVersion": null,
  "matchedProject": null,
  "matchedRepositories": [],
  "changeScope": null,
  "preliminaryComplexity": "simple 或 complex",
  "preliminaryComplexityReason": "触发规则说明",
  "completedStages": [1]
}
```

#### 1.6 初步复杂度预判

基于需求文本内容，进行初步复杂度预判（不作为最终决定，仅用于优化后续阶段资源分配）：

**判定规则（满足任一即标记为 `preliminaryComplexity: "complex"`）：**
1. 需求文本长度 > 500 字
2. 提及 3 个以上独立功能模块（关键词计数）
3. 包含数据库变更关键词："表结构"、"字段"、"新增表"、"修改表"、"数据库"
4. 包含多页面/多模块关键词："多页面"、"页面新增"、"重构"、"迁移"
5. 包含新技术关键词："新依赖"、"新组件"、"集成"、"对接外部"

**结果写入 `state.json`：**
```json
{
  "preliminaryComplexity": "simple" 或 "complex",
  "preliminaryComplexityReason": "触发规则说明"
}
```

> **注意：** 这不是最终判定，不影响用户选择。仅用于阶段2的扫描策略优化。

### 输出

- `{codeBasePath}/{planBasePath}/{需求号}/state.json`（初始状态，含 `preliminaryComplexity`）
- TFS 附件（如有）下载到输出目录

**输出数据契约（后续阶段依赖的字段）：**

```json
{
  "workItemId": "string — 工作项ID或日期标识",
  "title": "string — 需求标题",
  "requirementAnalysis": "string | null — HTML格式需求分析内容（来自 Winning.Demand.Analysis），无内容时为 null",
  "description": "string — 需求详细描述（仅当 requirementAnalysis 为 null 时作为主输入）",
  "acceptanceCriteria": "string — 验收标准",
  "hasExistingAnalysis": "boolean — 需求分析字段是否已有内容",
  "iterationPath": "string — System.IterationPath 值，供阶段2版本检测"
}
```

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| TFS MCP 不可用 | 提示用户手动提供需求文本 |
| 工作项无描述且无需求分析字段 | 提示用户补充需求详情 |
| 工作项 ID 不存在 | 报错并提示检查 ID 是否正确 |
| 附件下载失败 | 记录失败文件名，继续执行（非阻塞） |
