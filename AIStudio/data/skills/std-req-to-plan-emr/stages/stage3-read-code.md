# 阶段3: 读取项目代码

### 元信息

- **前置条件**: 阶段1-2已完成（`state.json` 存在且 `completedStages` 包含 1、2）
- **触发条件**: 自动执行（阶段2完成后进入）
- **预计耗时**: 2-5 分钟（取决于仓库数量和大小）

### 输入

- 阶段1输出的需求内容（`requirementAnalysis` 或 `description`）
- `state.json` 中的 `iterationPath`、`preliminaryComplexity`

### 执行步骤

> **只读约束：本阶段的所有操作必须严格只读。禁止使用 Edit、Write 工具修改任何项目代码文件。唯一允许写入的是公共路径配置文件（`~/.claude/skills/std-code-paths/config/settings.json`、`~/.claude/skills/std-code-paths/config/<system>/repositories.json`）、各仓库的 `代码扫描摘要.md` 和输出目录下的 `state.json`。**

> **敏感信息过滤：** 代码扫描时，必须过滤以下敏感信息，不得写入扫描摘要：数据库密码、JWT 密钥、API Key、Token、连接字符串中的凭据。如遇到 `password=`、`secret=`、`apiKey=`、`token=` 等模式，替换为 `[REDACTED]`。

> **超时控制：** 单个仓库的代码扫描（含粗扫+细扫）不应超过 3 分钟。如果仓库文件数量过多（>500 个文件），仅扫描需求关键词命中的文件 + 必读文件，跳过无关目录（node_modules、dist、.git 等）。

#### 3.0 恢复检查

如果 `state.json` 存在且 `completedStages 包含 3，读取状态跳到 3.6 开始代码扫描（跳过版本检测和项目匹配）。

#### 3.1 读取路径配置

**调用公共技能获取路径配置：** 使用 `Skill` 工具调用 `std-code-paths`，然后按照以下顺序读取配置文件：

1. **全局设置**：读取 `~/.claude/skills/std-code-paths/config/settings.json`，获取 `codeBasePath`、`planBasePath`、`defaultSystem`、`defaultProject`
2. **系统配置**：基于 `defaultSystem`（默认 `emr`），读取 `config/<system>/` 目录下的文件：
   - `config/<system>/versions.json` — 版本定义（含 `iterationPatterns`）
   - `config/<system>/repositories.json` — 仓库注册表（`repos[]`，每个仓库定义一次）
   - `config/<system>/<项目名>.json` — 项目配置（按需读取，在 3.4 项目匹配时使用）

> **配置文件定位：** 所有路径基于 `~/.claude/skills/std-code-paths/config/`，使用 Read 工具展开 `~` 为实际路径。

#### 3.2 版本检测（从 TFS 需求迭代路径确定）

1. 从阶段1获取的 `iterationPath` 中提取版本标识
2. **精确匹配**：读取 `config/<system>/versions.json`，遍历 `versions` 对象，对每个版本的 `iterationPatterns` 进行匹配（大小写不敏感）
3. **匹配成功** → 使用该版本 key 作为 `currentVersion`
4. **无精确匹配 → 模糊匹配**：提取迭代路径中的数字序列（如 `2503`），与各版本 key 的前缀进行匹配
5. **无模糊匹配 → 用户选择**：使用 `AskUserQuestion` 列出所有可用版本供用户选择

向用户展示版本检测结果：
```
版本检测:
  需求迭代路径: WINNING-6.0\250225\Sprint 3
  匹配版本: 250225 (2025年2月25日迭代版本)
```

#### 3.3 检查代码下载根目录（codeBasePath）

1. 读取 `settings.json` 中的 `codeBasePath` 字段
2. 如果为空字符串，使用 `AskUserQuestion` 提示用户输入
3. 用户输入后，验证路径有效性，然后将 `codeBasePath` 回写到 `~/.claude/skills/std-code-paths/config/settings.json`

#### 3.4 项目自动匹配（加权算法）

根据阶段1获取的需求内容，使用加权算法自动匹配对应的项目：

**匹配步骤：**

1. **扫描项目文件**：列出 `config/<system>/` 目录下所有 `.json` 文件，排除 `versions.json` 和 `repositories.json`，每个文件代表一个项目
2. **加权评分**：读取每个项目文件，计算加权得分：
   - 检查项目的 `aliases` 中每个别名在需求内容中出现的次数
   - 如果项目有 `aliasWeights` 字段，使用对应权重（未列出的别名默认 weight=1）
   - `score = Σ(aliasWeights[keyword] × hitCount)`
   - 如果需求内容命中该项目的 `excludeKeywords`（可选字段），则 `score *= 0.5`

3. **选择项目**：取最高得分的项目作为匹配结果

4. **置信度判定**：
   - 最高 score ≥ 3 且与第二名分差 ≥ 2 → 自动选中
   - score < 3 或 top2 分差 < 1 → 使用 `AskUserQuestion` 让用户确认或选择

5. **无匹配时**：使用 `settings.json` 中的 `defaultProject` 作为默认项目

> **向后兼容：** 如果项目没有 `aliasWeights` 字段，所有别名默认 weight=1，行为等同于原简单词频统计。

#### 3.5 仓库筛选与路径检查

匹配到项目并确定版本后，筛选适用的仓库并检查路径：

**版本感知的仓库筛选：**

项目的 `repos` 字段支持三种写法（详见 std-code-paths 技能文档）：

| 写法 | 示例 | 含义 |
|------|------|------|
| 字符串 | `"repo-id"` | 全版本覆盖，使用默认克隆分支 |
| 对象+版本列表 | `{ "id": "...", "versions": ["250815"] }` | 仅指定版本，使用默认克隆分支 |
| 对象+版本覆盖 | `{ "id": "...", "versions": { "240815": { "clone_branch": "..." } } }` | 版本级覆盖分支/URL |

筛选步骤：
1. 读取匹配项目文件的 `repos` 数组
2. 对每个 repo 条目，解析其版本覆盖规则：
   - 字符串 `"repo-id"` → 所有版本均参与，无版本级覆盖
   - 对象含 `versions` 数组 → 检查 `currentVersion` 是否在数组中，在则参与
   - 对象含 `versions` 对象 → 检查 `currentVersion` 是否为 key，在则参与且使用覆盖的 `clone_branch`
   - 对象无 `versions` 字段 → 所有版本均参与
3. 通过 `id` 在 `repositories.json` 的 `repos[]` 中查找仓库详情（name、type、tech_stack、local_path、clone_url 等）

**分支解析（默认值继承链，从低到高）：**
1. 版本 `defaultCloneBranch`（`config/<system>/versions.json` 中该版本的 `defaultCloneBranch`）
2. 项目 `defaultCloneBranch`（项目配置文件中的 `defaultCloneBranch`）
3. 仓库级显式覆盖（项目 `repos` 中该仓库的 `versions[currentVersion].clone_branch`）

> 只需写**不同**的地方，解析时按优先级从高到低取值。

**路径检查逻辑：**
1. 从 `repositories.json` 获取仓库的 `local_path`，如为空则由 `codeBasePath` 和仓库 `id`（或 `clone_url` 提取的仓库名）拼接
2. **路径已配置且目录存在** → 直接使用
3. **路径为空或目录不存在，但有 `clone_url`** → 触发自动克隆
4. **路径为空且无 `clone_url`** → 提示用户手动输入路径

**自动克隆流程：**
1. 从 `clone_url` 提取仓库名作为目标目录名
2. 目标路径：`{codeBasePath}/{repo_name}`
3. 检查目标目录是否已存在 → 已存在则直接使用
4. 不存在则执行：`cd {codeBasePath} && git clone -b {clone_branch} {clone_url}`
5. 克隆成功后更新 `local_path` 回写到 `config/<system>/repositories.json` 中对应仓库的条目

**批量克隆：** 多个仓库需克隆时，先汇报计划再用 `AskUserQuestion` 让用户确认。

#### 3.6 代码扫描策略

> **强制并行：当前端和后端仓库都参与分析时，必须使用 Agent 工具并行执行代码扫描。** 将前端仓库扫描和后端仓库扫描分别派发给独立的 Agent，在一条消息中发出两个 Agent 调用。

**前置检查（两个条件都满足则使用 Graphify 主导模式，任一不满足则使用传统模式）：**
1. **CLI 可用性**：`~/.local/bin/graphify` 是否存在
2. **图谱存在性**：所有参与扫描的仓库都有 `{仓库 local_path}/graphify-out/graph.json`

---

##### 3.6a Graphify 主导模式（条件满足时执行）

> **当 Graphify 可用时，跳过传统的 Round 1 粗扫（grep + 目录扫描），由 Graphify 负责文件定位和关系发现，Agent 仅负责读取和理解命中文件。**

**步骤 1：Graphify 增量更新**

对每个参与扫描的仓库执行：

```bash
cd {仓库 local_path}
CACHED=$(grep "Built from commit" graphify-out/GRAPH_REPORT.md | grep -oP '`\K[^`]+')
CURRENT=$(git rev-parse --short HEAD)
if [ "$CACHED" != "$CURRENT" ]; then
  ~/.local/bin/graphify update .   # 增量 AST 提取，零 API 成本
fi
```

**步骤 2：Graphify 查询（4 种查询，使用 Bash 工具并行执行，总超时 60 秒，单次 15 秒）**

| 查询类型 | 执行条件 | 命令示例 | 用途 |
|---------|---------|---------|------|
| 语义搜索 | **必做** | `graphify query "consultation apply create submit"` | 定位需求相关的所有文件和方法 |
| 调用链路 | 语义搜索命中 Controller | `graphify path "ConsultApplyController" "ConsultApplyQueryRepository"` | 追踪 Controller → Service → Repository 完整链路 |
| 模块边界 | 命中频次最高的 2-3 个核心类 | `graphify explain "ConsultationApplyServiceImpl"` | 获取类的上下游依赖和邻居关系 |
| 相似实现 | 需求涉及"类似 XX 功能" | `graphify query "reply consultation response" --dfs` | 查找可复用的历史实现 |

**关键词翻译规则：** graphify AST 提取的节点标识是英文代码符号。需将中文关键词翻译为英文：
- 优先从代码扫描摘要中的已有类名/方法名做映射
- 摘要中无对应信息时，使用通用中英文翻译
- 示例：会诊申请 → consultation apply，审批 → approval audit，签收 → sign accept

**步骤 3：安全网检查**

统计 Graphify 所有查询的总命中文件数。如果 **总命中 < 5 个文件**，回退到传统模式（3.6b）。

**步骤 4：派发 Agent 精准读取**

Agent 的输入和任务发生变化——从"扫描仓库发现文件"变为"读取指定文件理解代码"：

**Agent 输入：**
- Graphify 命中的文件列表（含文件路径和 Graphify 发现的关系：调用链、模块边界）
- 需求内容（用于理解业务上下文）
- 必读文件：`package.json`（前端）或 `pom.xml`（后端）—— 获取技术栈信息

**Agent 任务（仅"理解"模式）：**
1. 读取 `package.json`/`pom.xml` 获取技术栈
2. 读取 Graphify 命中的所有关键文件的完整内容
3. 分析编码模式（Controller 写法、Service 规范、DTO 定义风格）
4. 输出结构化扫描摘要（技术栈、模块结构、关键代码、切入点）

**Agent 不再执行：** grep 搜索、目录结构扫描、路由配置读取（Graphify 已提供）

**结果整合：**
- 调用链路和模块边界 → 记录到代码扫描摘要的「知识图谱辅助信息」章节，供阶段3 使用

**超时和异常处理：**
- 单次 `graphify` 命令超过 15 秒 → 跳过该查询
- `graphify update` 超过 60 秒 → 跳过更新，直接使用旧图谱
- graphify 查询返回空结果 → 不影响后续流程，视为"图谱未命中"
- 安全网触发（总命中 < 5） → 回退到传统模式

---

##### 3.6b 传统模式（Graphify 不可用时执行）

> **当 Graphify CLI 不存在或仓库无图谱时，使用传统的两轮扫描策略。**

采用两轮扫描策略：

> **预判优化：** 如果 `state.json` 中 `preliminaryComplexity === "simple"` 且需求关键词在代码中命中数 <= 3，可跳过细扫的第二轮，仅对命中的文件执行基本读取。节省约 40% 扫描时间。

**第一轮：粗扫（结构概览 + 需求关键词定位）**

**通用扫描：**
1. 读取 `package.json`（前端）或 `pom.xml`（后端）
2. 扫描 `src/` 目录结构（递归1-2层）
3. 读取路由配置文件

**需求关键词定向扫描：**
1. 从需求内容中提取 5-10 个关键词
2. 使用 `grep -rl "关键词" src/` 定位相关文件
3. 汇总命中的文件列表

**第二轮：细扫（深入读取命中模块）**

仅针对第一轮命中的文件，以及约定必读文件：

**前端必读：** 路由配置、API 请求层、关键词命中的组件和 Store、`main.ts`

**后端必读：** 相关 Controller、Entity/DTO、Service 接口

**跳过规则：** 未命中的关键词标注为「新增模块」。

#### 3.7 代码摘要（按仓库存放 + 增量扫描）

> **核心原则：** 代码扫描摘要按仓库拆分存放到各自代码目录下，方便跨需求复用。

**摘要文件存放位置：**

```
{仓库 local_path}/代码扫描摘要.md
```

**增量扫描机制：**

1. **检查已有摘要**：对每个仓库检查 `{local_path}/代码扫描摘要.md` 是否存在
2. **读取上次扫描时间**：提取 `lastScanTime` 和 `lastCommitHash`
3. **确定变更文件**：`git diff --name-only {lastCommitHash} HEAD`
4. **增量决策**：
   - 无变更 → 复用已有摘要，跳过扫描
   - 有变更 → 仅对变更文件执行细扫，合并到已有摘要
5. **更新扫描时间**

**摘要文件头部格式：**

```markdown
---
lastScanTime: 2026-04-23T14:30:00+08:00
lastCommitHash: abc123def456
repoName: 仓库名称
techStack: vue3, typescript
---

# 代码扫描摘要 - 仓库名称

## 项目技术栈和版本
...

## 目录结构概览
...

## 与需求相关的现有模块和文件
...

## 现有的编码模式和约定
...
```

**首次扫描（无已有摘要）：** 执行完整的两轮扫描策略。

#### 3.8 复杂度判定

代码扫描完成后，确认需求复杂度：

> **两阶段判定：** 如果 `state.json` 中 `preliminaryComplexity` 存在，向用户展示预判结果并请求确认，而非从零开始询问。如果 `preliminaryComplexity === "simple"` 且代码扫描未发现意外复杂度，可直接使用预判结果，跳过询问。

使用 `AskUserQuestion`：
- 问题："请判定需求复杂度，这将影响后续流程："
- 选项：
  - `简单需求` — 跳过 brainstorm 分析，跳过设计确认，直接生成所有文档和 plan
  - `复杂需求` — 执行深度 brainstorm 分析，设计文档分批生成并逐一确认

将结果记录到 `state.json` 的 `complexity` 字段。

> **锁定规则：** 写入 `complexity` 的同时必须写入 `complexityLocked: true`。此后任何阶段不得覆盖此值。包括以下场景：
> - 用户通过 `AskUserQuestion` 选择 → 立即锁定
> - `mode` 参数指定 → 立即锁定
> - 快捷触发词（"简单分析"/"快速分析"）→ 立即锁定
> - 预判确认复用（`preliminaryComplexity === "simple"` 且代码扫描无意外）→ 立即锁定

#### 3.9 更新 state.json

阶段3完成时，更新输出目录下的 `state.json`：

```json
{
  "currentStage": 3,
  "complexity": "complex",
  "complexityLocked": true,
  "currentVersion": "250815",
  "matchedProject": "会诊",
  "matchedRepositories": ["winning-webui-consultation-next", "winning-emr-consultation"],
  "completedStages": [1, 2, 3]
}
```

### 输出

- `state.json` 更新：`currentVersion`, `matchedProject`, `matchedRepositories`, `complexity`
- 各仓库下生成 `代码扫描摘要.md`
- 代码扫描结果（上下文传递给后续阶段）

**输出数据契约（后续阶段依赖的字段）：**

`state.json` 追加字段：
```json
{
  "currentVersion": "string — 匹配到的版本标识（如 '250815'），阶段5计划文件路径可能用到",
  "matchedProject": "string — 匹配到的项目名称（如 '会诊'）",
  "matchedRepositories": ["string — 仓库ID列表，如 'winning-webui-consultation-next'"],
  "complexity": "'simple' | 'complex' — 最终复杂度判定，决定阶段3-5的执行路径",
  "complexityLocked": "boolean — 一旦 complexity 被确认即为 true，后续阶段只读"
}
```

`代码扫描摘要.md` 结构契约（每行仓库一个文件，位于 `{仓库local_path}/代码扫描摘要.md`）：
```
frontmatter: lastScanTime, lastCommitHash, repoName, techStack
章节: 项目技术栈和版本 | 目录结构概览 | 与需求相关的现有模块和文件 | 现有的编码模式和约定
可选章节: 知识图谱辅助信息（仅 Graphify 模式产生）
```
