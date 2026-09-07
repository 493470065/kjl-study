# 产品分析协调机制 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 std-req-to-plan 中新增阶段 2 检测产品分析，根据 TFS 状态条件化后续流程，并增加三级上传保障。

**Architecture:** 新增独立阶段文件，重命名现有阶段文件（编号 +1），在关键阶段中增加 `hasProductAnalysis` 条件分支，阶段 7 增加回写保障机制。所有改动仅涉及 `std-req-to-plan` 技能目录。

**Tech Stack:** Markdown 技能文件编辑，无代码依赖

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 新建 | `stages/stage2-detect-product-analysis.md` | 检测 TFS 产品分析状态 |
| 重命名 | `stages/stage2-read-code.md` → `stages/stage3-read-code.md` | 读取项目代码 |
| 重命名+修改 | `stages/stage3-brainstorm.md` → `stages/stage4-brainstorm.md` | 增加 hasProductAnalysis 条件跳过 |
| 重命名+修改 | `stages/stage4-design-docs.md` → `stages/stage5-design-docs.md` | 增加输入源切换 |
| 重命名 | `stages/stage5-plans.md` → `stages/stage6-plans.md` | 实施计划生成 |
| 重命名+修改 | `stages/stage6-delivery.md` → `stages/stage7-delivery.md` | 增加条件回写+三级上传保障 |
| 修改 | `SKILL.md` | 更新流程图、state.json、恢复表、异常处理表 |

---

### Task 1: 重命名现有阶段文件

**Files:**
- Rename: `stages/stage2-read-code.md` → `stages/stage3-read-code.md`
- Rename: `stages/stage3-brainstorm.md` → `stages/stage4-brainstorm.md`
- Rename: `stages/stage4-design-docs.md` → `stages/stage5-design-docs.md`
- Rename: `stages/stage5-plans.md` → `stages/stage6-plans.md`
- Rename: `stages/stage6-delivery.md` → `stages/stage7-delivery.md`

- [ ] **文件**: `stages/stage2-read-code.md` → `stages/stage3-read-code.md`
- [ ] **操作**: 重命名（mv 命令）
- [ ] **内容**: 执行批量重命名命令
- [ ] **验收**: 确认 5 个文件均已重命名成功，旧文件名不存在

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan/stages
mv stage2-read-code.md stage3-read-code.md
mv stage3-brainstorm.md stage4-brainstorm.md
mv stage4-design-docs.md stage5-design-docs.md
mv stage5-plans.md stage6-plans.md
mv stage6-delivery.md stage7-delivery.md
ls -la stage*.md
```

预期输出：存在 stage1、stage3、stage4、stage5、stage6、stage7 共 6 个文件，stage2 不存在（将在 Task 2 新建）。

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/
git commit -m "refactor: 重命名阶段文件，为新增阶段2腾出编号"
```

---

### Task 2: 新建阶段 2 检测产品分析指令文件

**Files:**
- Create: `stages/stage2-detect-product-analysis.md`

- [ ] **文件**: `stages/stage2-detect-product-analysis.md`
- [ ] **操作**: 新增
- [ ] **内容**: 创建完整的阶段指令文件

```markdown
# 阶段 2: 检测产品分析

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

**并行读取（使用 Agent 工具或并行调用）：**

1. **读取标签**：调用 `mcp__mcp-tfs-query__get_work_item` 获取工作项，提取 `System.Tags` 字段
2. **读取需求分析字段**：从同一返回结果中提取 `Winning.Demand.Analysis`（即 `requirementAnalysis`）字段内容

**实际上只需一次 `get_work_item` 调用**，返回结果中同时包含 `System.Tags` 和 `Winning.Demand.Analysis`。

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
```

- [ ] **验收**: 文件存在于 `stages/stage2-detect-product-analysis.md`，内容包含完整的输入、执行步骤、判定逻辑、异常处理和输出契约

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage2-detect-product-analysis.md
git commit -m "feat: 新增阶段2检测产品分析指令文件"
```

---

### Task 3: 修改 stage4-brainstorm.md 增加条件跳过逻辑

**Files:**
- Modify: `stages/stage4-brainstorm.md`（原 stage3-brainstorm.md）

- [ ] **文件**: `stages/stage4-brainstorm.md`
- [ ] **操作**: 修改
- [ ] **内容**: 在文件开头（标题之后）增加 `hasProductAnalysis` 条件跳过逻辑，并更新内部阶段编号引用

**修改点 1：标题修改**

将 `# 阶段3: Brainstorm 需求分析` 改为 `# 阶段4: Brainstorm 需求分析`

**修改点 2：在标题后、`### 输入` 之前插入条件跳过块**

在现有简单需求跳过说明之后，追加 `hasProductAnalysis` 条件。将现有的：

```markdown
> **简单需求跳过此阶段。** 如果 `state.json` 中 `complexity === "simple"`，直接进入阶段4。改动范围由代码扫描结果自动推断（有前端仓库 → frontend=true，有后端仓库 → backend=true，API 路由命中 → api=true），更新 `state.json` 的 `changeScope` 后跳到阶段4。
```

替换为：

```markdown
> **条件跳过规则（按优先级）：**
>
> 1. **有产品分析跳过**：如果 `state.json` 中 `hasProductAnalysis === true`，跳过本阶段所有 brainstorm 操作，执行以下步骤后直接进入阶段 5：
>    - 读取 `产品业务分析.md`（来自 `state.json` 的 `productAnalysisFile` 字段）
>    - **自动判定复杂度**：解析产品分析内容，计算以下信号：
>      - 涉及模块数（1-2 → 简单，3+ → 复杂）
>      - API 数量（<3 → 简单，5+ → 复杂）
>      - 数据库变更（无 → 简单，有 → 复杂）
>      - 需求描述长度（<200 字 → 简单，>500 字 → 复杂）
>      - 新技术依赖（无 → 简单，有 → 复杂）
>      - 多页面新增/重构（无 → 简单，有 → 复杂）
>    - 满足任一复杂信号 → `complexity: "complex"`，否则 `"simple"`
>    - 将结果写入 `state.json` 的 `complexity` 字段
>    - 输出："基于产品分析自动判定为 简单/复杂 需求"
>    - 根据代码扫描结果自动推断 `changeScope`（有前端仓库 → frontend=true，有后端仓库 → backend=true，API 路由命中 → api=true）
>    - 更新 `state.json`：`currentStage: 4`，`completedStages` 追加 4，`changeScope`
>    - 直接进入阶段 5
>
> 2. **简单需求跳过**：如果 `state.json` 中 `complexity === "simple"`，直接进入阶段 5。改动范围由代码扫描结果自动推断，更新 `state.json` 的 `changeScope` 后跳到阶段 5。
```

**修改点 3：更新所有内部阶段编号引用**

将文件中所有 `阶段4` 引用替换为 `阶段5`，`阶段3` 替换为 `阶段4`。具体包括：

- `跳到阶段4` → `跳到阶段5`
- `跳过 brainstorm 时` → 保持不变（逻辑描述）
- `阶段3 Brainstorm` 相关的进度文本 → `阶段4 Brainstorm`

**修改点 4：更新 3.5 节的 state.json 示例**

```json
{
  "currentStage": 4,
  "changeScope": {
    "frontend": true,
    "backend": true,
    "api": true
  },
  "completedStages": [1, 2, 3, 4]
}
```

- [ ] **验收**: 文件中标题为"阶段4"，包含 `hasProductAnalysis` 跳过逻辑，所有内部引用已更新为新的阶段编号

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage4-brainstorm.md
git commit -m "feat: 阶段4增加hasProductAnalysis条件跳过和自动复杂度判定"
```

---

### Task 4: 修改 stage5-design-docs.md 增加输入源切换

**Files:**
- Modify: `stages/stage5-design-docs.md`（原 stage4-design-docs.md）

- [ ] **文件**: `stages/stage5-design-docs.md`
- [ ] **操作**: 修改
- [ ] **内容**: 更新标题和阶段引用，增加 `hasProductAnalysis` 输入源切换逻辑

**修改点 1：标题修改**

`# 阶段4: 生成设计文档` → `# 阶段5: 生成设计文档`

**修改点 2：在 `### 输入` 节中追加 `hasProductAnalysis` 相关输入**

在现有输入列表末尾追加：

```markdown
- `state.json` 中的 `hasProductAnalysis` 决定需求分析来源，`productAnalysisFile` 指定替代文件
```

**修改点 3：在 `### 执行步骤` 开头（设计思路之后、简单需求流程之前）插入输入源切换说明**

在 `## 设计思路：API-First` 和 `## 简单需求流程` 之间插入：

```markdown
## 输入源切换（根据 hasProductAnalysis）

进入阶段 5 前，检查 `state.json` 的 `hasProductAnalysis` 字段：

**`hasProductAnalysis === true`（有产品分析）：**
- 需求分析的来源 = `产品业务分析.md`（读取 `state.json.productAnalysisFile` 指定的文件）
- **不生成** `需求分析.md` 文件
- 直接从 `产品业务分析.md` 中提取：功能范围、字段变更、影响模块、业务规则
- 将提取的信息作为 API 契约、前后端设计的输入依据
- 后续流程不变：API 契约 → 前端设计 ↔ 后端设计 → 测试文档 → 一致性校验

**`hasProductAnalysis === false`（无产品分析）：**
- 执行现有完整流程不变
- 正常生成 `需求分析.md` → API 契约 → 前后端设计 → 测试文档
```

**修改点 4：修改 4.1 节需求分析文档的条件**

将 4.1 节标题下增加条件说明：

```markdown
## 4.1 需求分析文档（条件生成）

> **条件：** 如果 `hasProductAnalysis === true`，跳过此文档的生成，用 `产品业务分析.md` 替代。后续 4.2-4.4 中引用"需求分析"的地方，改为引用 `产品业务分析.md` 的内容。
```

**修改点 5：更新所有内部阶段编号引用**

将文件中 `阶段5` 替换为 `阶段6`，`阶段4` 替换为 `阶段5`，`阶段3` 替换为 `阶段4`。具体包括：

- `进入阶段5` → `进入阶段6`
- `回到 brainstorm 阶段` → `回到阶段4 brainstorm`
- 简单需求流程中的 `直接进入阶段5` → `直接进入阶段6`
- 复杂需求流程中的 `进入 4.5a` → `进入 5.5a`（等等，这里的编号其实是小节编号，需要检查）
  - 实际上 4.5a、4.5b 是本文件内部的小节编号，保持不变即可

**修改点 6：更新输出数据契约**

输出列表中的 `需求分析.md` 行修改为：

```markdown
- `需求分析.md`（`hasProductAnalysis === false` 时始终生成；`hasProductAnalysis === true` 时不生成，用 `产品业务分析.md` 替代）
```

- [ ] **验收**: 文件中标题为"阶段5"，包含输入源切换说明，4.1 节增加条件生成逻辑，所有内部引用已更新

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage5-design-docs.md
git commit -m "feat: 阶段5增加hasProductAnalysis输入源切换逻辑"
```

---

### Task 5: 修改 stage7-delivery.md 增加条件回写 + 三级上传保障

**Files:**
- Modify: `stages/stage7-delivery.md`（原 stage6-delivery.md）

- [ ] **文件**: `stages/stage7-delivery.md`
- [ ] **操作**: 修改
- [ ] **内容**: 更新标题、增加条件回写逻辑、增加三级上传保障机制

**修改点 1：标题修改**

`# 阶段6: 总结交付与 TFS 上传` → `# 阶段7: 总结交付与 TFS 上传`

**修改点 2：在 `### 输入` 节中追加字段**

在现有 `state.json` 依赖字段列表中追加：

```markdown
- `state.json` 中的 `hasProductAnalysis` 决定是否额外回写需求分析到 TFS
```

**修改点 3：替换 6.2.1 节（上传需求分析到工作项字段）**

将现有的 6.2.1 节替换为条件化版本：

```markdown
### 7.2.1 上传需求分析到工作项「需求分析」字段

**条件：** 仅当 `hasExistingAnalysis === false` **且** `hasProductAnalysis === false` 时执行。

> 当 `hasProductAnalysis === true` 时，TFS 上已有产品分析，不需要再回写。
> 当 `hasExistingAnalysis === true` 时，TFS 上已有需求分析内容，不需要覆盖。

**执行方式不变**，使用脚本 `scripts/upload-analysis.cjs`。
```

**修改点 4：修改 6.2.2 节（附件上传列表）**

将 `**始终上传：** 需求分析.md` 改为：

```markdown
**条件上传：**
- `需求分析.md`（仅当 `hasProductAnalysis === false` 时上传）
- `产品业务分析.md`（仅当 `hasProductAnalysis === true` 时上传，作为设计依据的溯源文件）
```

**修改点 5：修改 6.2.3 节（标签添加）**

将现有的标签添加逻辑替换为条件化版本：

```markdown
### 7.2.3 添加标签（追加模式）

**基础标签（始终添加）：**
- `AI-ANALYSIS-PLUS`
- `EMR-AI-PLAN`

**条件标签（仅当 `hasProductAnalysis === false` 时追加）：**
- `AI-ANALYSIS`
- `EMR-AI-ANALYSIS-V2`

> 当 `hasProductAnalysis === true` 时，这些标签已经存在，不需要重复添加。

标签添加步骤不变：
1. 调用 `mcp__mcp-tfs-query__get_work_item` 获取现有标签
2. 逐个检查并追加不存在的标签（分号分隔）
3. 使用 `mcp__mcp-tfs-query__update_work_item` 更新
```

**修改点 6：更新所有内部阶段编号引用**

将 `6.1` → `7.1`，`6.2` → `7.2`，`6.2.1` → `7.2.1`，`6.2.2` → `7.2.2`，`6.2.3` → `7.2.3`，`6.2.4` → `7.2.4`，`6.3` → `7.3`。

**修改点 7：在 7.2 节末尾、7.3 节之前，插入三级上传保障机制**

在 `## 7.2 TFS 上传` 的子节全部定义完后，在 `## 7.3 下一步建议` 之前，插入新的子节：

```markdown
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
| 附件上传 | 使用 `curl` 直接调 TFS REST API：`curl -X POST "{TFS_URL}/_apis/wit/attachments?fileName={name}&api-version=4.1" -H "Content-Type: application/octet-stream" --data-binary @{file_path} -u :{PAT}` 获取附件 URL，再 `curl -X PATCH "{TFS_URL}/_apis/wit/workitems/{id}?api-version=4.1" -H "Content-Type: application/json-patch+json" -u :{PAT} -d '[{"op":"add","path":"/relations/-","value":{"rel":"AttachedFile","url":"{attachment_url}"}}]'` |
| 标签添加 | 使用 `curl -X PATCH "{TFS_URL}/_apis/wit/workitems/{id}?api-version=4.1" -H "Content-Type: application/json-patch+json" -u :{PAT} -d '[{"op":"add","path":"/fields/System.Tags","value":"{new_tags}"}]'` |
| 子任务创建 | 使用 `curl -X POST "{TFS_URL}/_apis/wit/workitems/${type}?api-version=4.1" -H "Content-Type: application/json-patch+json" -u :{PAT} -d '[{"op":"add","path":"/fields/System.Title","value":"{title}"},{"op":"add","path":"/relations/-","value":{"rel":"System.LinkTypes.Hierarchy-Forward","url":"{parent_url}"}}]'` |

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
```

**修改点 8：更新输出数据契约**

将 `completedStages: [1,2,3,4,5,6]` 改为 `completedStages: [1,2,3,4,5,6,7]`，`currentStage: 6` 改为 `currentStage: 7`。

TFS 确认清单更新为：

```markdown
TFS 工作项更新确认清单：
- [ ] `Winning.Demand.Analysis` 字段已填充（仅当 `hasExistingAnalysis === false` 且 `hasProductAnalysis === false`）
- [ ] 附件已上传（去重旧同名附件）
- [ ] 标签包含 `AI-ANALYSIS-PLUS` 和 `EMR-AI-PLAN`（始终）
- [ ] 标签包含 `AI-ANALYSIS` 和 `EMR-AI-ANALYSIS-V2`（仅当 `hasProductAnalysis === false`）
- [ ] 子任务已创建（仅当当前用户无已有子任务时）
- [ ] 所有上传操作均已验证成功（三级保障通过）
```

- [ ] **验收**: 文件中标题为"阶段7"，包含条件回写逻辑、三级上传保障机制、失败报告格式，所有内部编号已更新

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage7-delivery.md
git commit -m "feat: 阶段7增加条件回写+三级上传保障机制"
```

---

### Task 6: 修改 stage3-read-code.md 更新阶段编号

**Files:**
- Modify: `stages/stage3-read-code.md`（原 stage2-read-code.md）

- [ ] **文件**: `stages/stage3-read-code.md`
- [ ] **操作**: 修改
- [ ] **内容**: 仅更新内部阶段编号引用

**需要替换的内容：**

- `# 阶段2: 读取项目代码` → `# 阶段3: 读取项目代码`
- `completedStages` 包含 2 → `completedStages` 包含 3
- `currentStage: 2` → `currentStage: 3`
- `completedStages: [1, 2]` → `completedStages: [1, 2, 3]`
- `跳到 2.6` → `跳到 2.6`（小节编号保持不变）
- 所有提及 `阶段1` 的引用保持不变（阶段1未变）

- [ ] **验收**: 标题为"阶段3"，`currentStage` 和 `completedStages` 已更新

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage3-read-code.md
git commit -m "refactor: 更新stage3阶段编号引用"
```

---

### Task 7: 修改 stage6-plans.md 更新阶段编号

**Files:**
- Modify: `stages/stage6-plans.md`（原 stage5-plans.md）

- [ ] **文件**: `stages/stage6-plans.md`
- [ ] **操作**: 修改
- [ ] **内容**: 仅更新内部阶段编号引用

**需要替换的内容：**

- `# 阶段5: 生成实施计划` → `# 阶段6: 生成实施计划`
- `阶段5` 内部引用 → `阶段6`（如"进入阶段5" → "进入阶段6"）
- `阶段4` 引用 → `阶段5`（如"阶段4生成的" → "阶段5生成的"）
- `completedStages: [1,2,3,4,5]` → `completedStages: [1,2,3,4,5,6]`

- [ ] **验收**: 标题为"阶段6"，所有阶段引用已更新

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add stages/stage6-plans.md
git commit -m "refactor: 更新stage6阶段编号引用"
```

---

### Task 8: 修改 SKILL.md 主文档

**Files:**
- Modify: `SKILL.md`

- [ ] **文件**: `SKILL.md`
- [ ] **操作**: 修改
- [ ] **内容**: 更新总体工作流、state.json 结构、阶段恢复表、并行执行表、异常处理表、进度反馈、两种模式对比表、各阶段指令文件列表

**修改点 1：总体工作流**

将现有的：
```
阶段1: 获取需求 → 阶段2: 读取代码 → [复杂度判定] → 阶段3/跳过 → 阶段4: 设计文档 → 阶段5: 实施计划 → 阶段6: 交付
```

替换为：
```
阶段1: 获取需求 → 阶段2: 检测产品分析 → 阶段3: 读取代码 → [复杂度判定] → 阶段4/跳过 → 阶段5: 设计文档 → 阶段6: 实施计划 → 阶段7: 交付

产品分析分支：
  ├─ hasProductAnalysis=true  → [跳过阶段4 brainstorm] → 阶段5(复用产品分析) → 阶段6 → 阶段7
  └─ hasProductAnalysis=false → 阶段4(brainstorm) → 阶段5(完整) → 阶段6 → 阶段7(额外回写)
```

**修改点 2：各阶段指令文件列表**

替换为：
```markdown
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
- 基于 `### Task N:` 格式生成可执行的实施计划，与 std-plan-execute 解析兼容

## 阶段7: 总结交付与 TFS 上传

- **指令文件**: `stages/stage7-delivery.md`
- 需求分析上传到 TFS 字段、设计文件作为附件上传、标签添加、自动创建子任务
- **无产品分析时**：额外回写 `Winning.Demand.Analysis` 字段 + 添加 `AI-ANALYSIS` `EMR-AI-ANALYSIS-V2` 标签
- **三级上传保障**：确保每项 TFS 操作必须成功
```

**修改点 3：进度反馈**

将 `阶段 N/6` 替换为 `阶段 N/7`。

**修改点 4：两种模式对比表**

更新阶段编号引用：
- `阶段3 Brainstorm` → `阶段4 Brainstorm`
- `阶段4 用户确认` → `阶段5 用户确认`
- `阶段5 Plan 生成` → `阶段6 Plan 生成`
- `阶段6 TFS 上传` → `阶段7 TFS 上传`

同时增加"有产品分析"列：

```markdown
### 流程模式对比

| 环节 | 简单需求 | 复杂需求 | 有产品分析 |
|------|---------|---------|-----------|
| 阶段4 Brainstorm | **跳过** | 深度分析 | **跳过** + 自动判定复杂度 |
| 阶段5 用户确认 | **跳过** | 分批确认 | 按 complexity 决定 |
| 阶段6 Plan 生成 | 直接生成 | writing-plans | 按 complexity 决定 |
| 阶段7 TFS 上传 | 自动执行 | 自动执行 | 自动执行（不额外回写） |
```

**修改点 5：并行执行表**

替换为：
```markdown
| 阶段 | 可并行的操作 |
|------|-------------|
| 阶段 2 | 检测标签 ↔ 检测字段内容（并行读取） |
| 阶段 3 | 前端代码扫描 ↔ 后端代码扫描 |
| 阶段 5 | 需求分析单独生成；API 契约单独生成（基于需求分析）；前端设计 ↔ 后端设计可并行（基于 API 契约）；测试功能文档最后生成 |
| 阶段 6 | 前端 plan ↔ 后端 plan 并行生成 |
| 阶段 7 | 附件上传 ↔ 标签添加可并行；字段回写和任务创建串行 |
```

**修改点 6：state.json 结构**

替换为：
```json
{
  "workItemId": "工作项ID",
  "currentStage": 4,
  "preliminaryComplexity": "simple",
  "preliminaryComplexityReason": "需求文本 <200字，无数据库关键词",
  "complexity": "complex",
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

**修改点 7：阶段恢复表**

在现有表格中追加行：
```markdown
| 有 `产品业务分析.md` 且 `hasProductAnalysis=true` | 阶段 2 已完成，跳过阶段 4，从阶段 5 继续 |
| 无 `产品业务分析.md` 且 `hasProductAnalysis=false` 且无 brainstorm-notes.md | 从阶段 4 继续 brainstorm |
```

**修改点 8：异常处理表**

追加行：
```markdown
| TFS 读取标签/字段失败 | 重试 3 次后降级为 curl，仍失败则终止阶段 2 |
| 产品分析内容为空或乱码 | 视为无产品分析，`hasProductAnalysis=false` |
| 上传重试 3 次+降级均失败 | 阻塞等待用户介入，提供手动操作步骤和本地文件路径 |
```

- [ ] **验收**: SKILL.md 中所有阶段引用已更新为 7 阶段，state.json 包含新字段，恢复表包含新行，异常处理包含新增场景

- [ ] **Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add SKILL.md
git commit -m "feat: SKILL.md更新为7阶段流程，增加产品分析协调机制"
```

---

### Task 9: 全局验证 — 检查所有文件的一致性

**Files:**
- Verify: 所有 7 个阶段文件 + SKILL.md

- [ ] **文件**: 所有阶段文件和 SKILL.md
- [ ] **操作**: 验证
- [ ] **内容**: 执行一致性检查

**验证清单：**

1. **文件存在性检查**：
```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan/stages
for f in stage1-fetch-requirement.md stage2-detect-product-analysis.md stage3-read-code.md stage4-brainstorm.md stage5-design-docs.md stage6-plans.md stage7-delivery.md; do
  if [ -f "$f" ]; then echo "✅ $f"; else echo "❌ $f MISSING"; fi
done
```

预期：7 个文件全部存在。

2. **阶段编号一致性**：
```bash
for f in stages/stage*.md; do
  echo "=== $f ==="
  head -1 "$f"
  grep -n "阶段[0-9]" "$f" | head -5
done
```

预期：每个文件的标题阶段号与文件名编号一致。

3. **hasProductAnalysis 覆盖检查**：
```bash
echo "=== stage2 检测 ==="
grep -c "hasProductAnalysis" stages/stage2-detect-product-analysis.md
echo "=== stage4 条件跳过 ==="
grep -c "hasProductAnalysis" stages/stage4-brainstorm.md
echo "=== stage5 输入源 ==="
grep -c "hasProductAnalysis" stages/stage5-design-docs.md
echo "=== stage7 条件回写 ==="
grep -c "hasProductAnalysis" stages/stage7-delivery.md
echo "=== SKILL.md ==="
grep -c "hasProductAnalysis" SKILL.md
```

预期：stage2、stage4、stage5、stage7、SKILL.md 均包含 `hasProductAnalysis`。

4. **上传保障检查**：
```bash
grep -c "三级" stages/stage7-delivery.md
grep -c "验证" stages/stage7-delivery.md
grep -c "降级" stages/stage7-delivery.md
```

预期：均大于 0。

- [ ] **验收**: 所有检查通过，无不一致项

- [ ] **最终 Commit**

```bash
cd /Users/huangyunfeng/.claude/skills/std-req-to-plan
git add -A
git commit -m "feat: 产品分析协调机制实施完成 — 7阶段流程+条件分支+三级上传保障"
```
