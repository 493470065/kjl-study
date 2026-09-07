# 设计文档：Graphify 知识图谱集成到 std-req-to-plan

> 日期: 2026-05-13
> 状态: 待审批

## 1. 目标

在 `std-req-to-plan` 的代码扫描（阶段2）和深度分析（阶段3）中，集成 graphify 知识图谱作为辅助信息源，提升代码定位精度和架构理解深度。

## 2. 设计原则

- **可选透明**：graphify-out 不存在时完全透明跳过，不影响现有流程
- **辅助不替代**：graphify 查询结果补充 grep 扫描，不替代现有两轮扫描策略
- **零 API 成本**：仅使用 `graphify query/path/explain` 命令，读取已有的 `graphify-out/graph.json`，不调用 LLM
- **渐进增强**：当前为"辅助扫描层"定位，预留升级为"首选定位工具"的扩展点

## 3. 改动范围

### 3.1 阶段2：读取项目代码

**在 `stages/stage2-read-code.md` 的 2.6 节（代码扫描策略）中，Round 1 之后、Round 2 之前插入新步骤 `2.6a`：**

#### 2.6a 图谱辅助查询（可选）

**前置检查（两级）：**

1. **CLI 可用性检查**：检测 `~/.local/bin/graphify` 是否存在，不存在则跳过此步骤
2. **图谱存在性检查**：对每个参与扫描的仓库，检查 `{仓库 local_path}/graphify-out/graph.json` 是否存在。不存在则跳过此步骤

**自动增量更新：** 图谱存在时，对比 commit hash 判断是否过期：

```bash
CACHED=$(grep "Built from commit" graphify-out/GRAPH_REPORT.md | grep -oP '`\K[^`]+')
CURRENT=$(git rev-parse --short HEAD)
if [ "$CACHED" != "$CURRENT" ]; then
  ~/.local/bin/graphify update .   # 增量 AST 提取，零 API 成本，仅处理变更文件
fi
```

- `graphify update` 是纯 AST 提取，不调用 LLM，基于文件 SHA256 哈希缓存，仅重新提取变更文件
- 增量更新通常在几秒内完成（取决于变更文件数）
- 如果图谱首次生成（全量），大项目可能需要 30-60 秒，可接受

**执行方式：** 更新完成后，使用 Bash 工具并行执行以下查询（每个仓库最多 4 个查询，总超时 60 秒）：

| 查询类型 | 命令 | 输入 | 输出 |
|---------|------|------|------|
| 语义搜索 | `graphify query "需求关键词1 关键词2"` | 从需求提取的关键词 | 相关节点和文件列表 |
| 调用链路 | `graphify path "ControllerA" "ServiceB"` | Round 1 grep 命中的核心类 | 最短调用路径 |
| 模块边界 | `graphify explain "核心类名"` | Round 1 命中频次最高的类 | 邻居节点和关系 |
| 相似实现 | `graphify query "类似功能的英文描述" --dfs` | 需求翻译的英文短语 | 相似功能的代码节点 |

**查询策略：**

1. **语义搜索**（必做）：将需求关键词翻译为英文短语组合（graphify AST 提取的节点标识是英文/代码符号），执行 `graphify query`。将返回的节点和文件路径与 grep 命中列表合并去重。
2. **调用链路**（按需）：如果 Round 1 命中了 Controller 类，使用 `graphify path` 追踪到 Service/Repository 层的完整链路。将链路中的文件加入 Round 2 细扫的"必读文件"列表。
3. **模块边界**（按需）：对命中频次最高的 2-3 个核心类，使用 `graphify explain` 获取邻居关系，理解该类的上下游依赖。结果写入代码扫描摘要的"现有编码模式"部分。
4. **相似实现**（按需）：如果需求涉及"新增类似 XX 的功能"，使用 `graphify query` 搜索已有类似实现，作为复用参考。

**结果整合：**

- graphify 命中但 grep 未命中的文件 → 加入 Round 2 细扫列表，标记为"图谱补充"
- 调用链路 → 记录到代码扫描摘要，供阶段3 brainstorm 使用
- 模块边界 → 记录到代码扫描摘要，供阶段3 架构影响分析使用

**超时处理：** 单次 `graphify` 命令超过 15 秒未响应则跳过该查询。graphify 查询总计不超过 60 秒。

### 3.2 阶段3：Brainstorm 需求分析

**在 `stages/stage3-brainstorm.md` 的 3.2 节（分析重点）中，增加图谱增强步骤：**

在 brainstorm 分析过程中，对涉及的核心类使用 `graphify explain` 获取：
- 该类所在的社区（Community）归属
- 直接依赖和被依赖关系
- 与其他模块的交互边界

这些信息用于：
- 更精确地判断功能边界（3.2 第1点）
- 验证数据流路径（3.2 第2点）
- 评估技术影响范围（3.2 第3点）

结果写入 `brainstorm-notes.md` 的「三、架构影响分析」章节。

### 3.3 代码扫描摘要格式扩展

在 `代码扫描摘要.md` 中新增可选章节：

```markdown
## 知识图谱辅助信息（可选）

> 以下信息来自 graphify 知识图谱，仅供参考。

### 调用链路
- `ConsultApplyController` → `ConsultationApplyServiceImpl.createConsultationApply()` → `ConsultApplyQueryRepository.createConsultApplyInfo()`

### 核心模块边界
- `ConsultationApplyServiceImpl`：依赖 `IWorkFlowBaseService`、`ConsultationParamBasicService` 等，被 `ConsultApplyController` 调用

### 相似实现参考
- 会诊申请流程与现有"会诊回复"流程共享 `ConsultReplyBasicService` 基础服务
```

## 4. 实现细节

### 4.1 需要修改的文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `stages/stage2-read-code.md` | 新增步骤 | 在 2.6 节 Round 1 和 Round 2 之间插入 `2.6a 图谱辅助查询` |
| `stages/stage3-brainstorm.md` | 补充说明 | 在 3.2 节分析重点中增加图谱查询指导 |
| `SKILL.md` | 无需修改 | graphify 是可选增强，不改变 skill 的阶段结构 |

### 4.2 graphify CLI 调用示例

```bash
# 前置检查
test -f /path/to/repo/graphify-out/graph.json && echo "EXISTS" || echo "NOT_FOUND"

# 语义搜索（从需求关键词翻译为英文）
cd /path/to/repo && ~/.local/bin/graphify query "consultation apply create submit"

# 调用链路追踪
cd /path/to/repo && ~/.local/bin/graphify path "ConsultApplyController" "ConsultApplyQueryRepository"

# 模块边界理解
cd /path/to/repo && ~/.local/bin/graphify explain "ConsultationApplyServiceImpl"

# 相似实现查找
cd /path/to/repo && ~/.local/bin/graphify query "reply consultation response answer" --dfs
```

### 4.3 关键词翻译策略

graphify 的 AST 提取使用代码符号名（英文），需求关键词是中文。需要将中文关键词翻译为对应的英文代码符号：

| 中文需求关键词 | 英文查询词 |
|--------------|-----------|
| 会诊申请 | consultation apply create submit |
| 会诊回复 | consultation reply response |
| 审批流程 | approval workflow audit |
| 签收 | sign accept receive |
| 取消 | cancel undo |
| 计费 | billing charge fee |

翻译逻辑：从需求中提取关键词后，基于代码扫描摘要中的已有类名/方法名做映射。如果摘要中没有对应信息，使用通用的中英文翻译。

## 5. 扩展预留

### 5.1 未来升级路径（方案 B）

当 graphify 在多个项目中证明有效后，可升级为"首选定位工具"：

1. Round 1 粗扫中，`graphify query` 优先于 `grep -rl`
2. grep 仅用于验证 graphify 结果的完整性
3. 需要修改 `stage2-read-code.md` 的 2.6 节核心逻辑

**扩展点设计：** 在 `2.6a` 步骤中，将 graphify 查询结果与 grep 结果分开记录（`graphify_hits` 和 `grep_hits`），为未来合并对比提供数据基础。

### 5.2 图谱自动更新（已实现）

已集成到 2.6a 步骤中：对比 commit hash，过期则自动执行 `graphify update` 增量更新。

### 5.3 多仓库图谱合并

graphify 支持 `graphify merge-graphs` 合并多个仓库的图谱。未来可：
- 将前端和后端仓库的图谱合并
- 在 merged graph 上做跨仓库调用链路追踪（如前端 API 调用 → 后端 Controller）

## 6. 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| graphify-out 不存在 | 无法使用图谱增强 | 自动检测，不存在则跳过 |
| graphify-out 过期（commit 不同） | 图谱与实际代码不一致 | 自动执行 `graphify update` 增量更新（零 API 成本） |
| graphify update 耗时过长（首次全量） | 增加扫描时间 | 大项目首次生成约 30-60s，后续增量仅几秒；超时则跳过更新直接使用旧图谱 |
| graphify CLI 未安装 | 查询失败 | 检测 `~/.local/bin/graphify` 是否存在，不存在则跳过 |
| 查询超时 | 增加扫描时间 | 单次 15s 超时，总计 60s 上限 |
| 中文关键词查询无结果 | 定位效果差 | 翻译为英文代码符号后查询 |
| graphify 结果与 grep 重叠 | 冗余信息 | 合并去重，标记来源 |
