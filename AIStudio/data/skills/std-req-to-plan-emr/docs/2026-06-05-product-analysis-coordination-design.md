# 设计文档：std-req-to-plan 与 std-req-analysis-ma 产品分析协调

> 日期：2026-06-05
> 状态：已确认

## 背景

当前存在两个独立技能：

- **std-req-analysis-ma**（产品技能）：从 TFS 获取需求，生成产品业务分析，回写 `Winning.Demand.Analysis` 字段，添加 `AI-ANALYSIS` / `EMR-AI-ANALYSIS-V2` 标签。
- **std-req-to-plan**（开发技能）：获取需求 → 读取代码 → brainstorm → 设计文档 → 实施计划 → 交付。

问题：当产品技能已生成需求分析时，开发技能仍重复执行 brainstorm 和需求分析，浪费时间且可能产生不一致。

## 目标

通过检测 TFS 上是否已有产品需求分析，让 `std-req-to-plan` 自动选择流程：

| 条件 | 行为 |
|------|------|
| TFS 有产品分析（标签+字段同时存在） | 复用产品分析，跳过 brainstorm 和需求分析，自动判定复杂度，直接生成设计文档和实施计划 |
| TFS 无产品分析 | 执行完整流程，额外将需求分析回写 TFS（字段+标签+附件） |

## 方案选择

| 方案 | 说明 | 结论 |
|------|------|------|
| A：修改 std-req-to-plan 阶段流程 | 在现有技能中新增检测阶段，条件化后续流程 | **采用** |
| B：创建独立检测模块 | 抽取独立阶段文件，各阶段自行条件分支 | 职责清晰但增加复杂度 |
| C：创建轻量协调技能 | 新建技能负责检测和调用 | 多一层嵌套，维护成本高 |

## 设计详情

### 1. 新增阶段 2：检测产品分析

在阶段 1（获取需求）之后、阶段 3（读取代码）之前插入新阶段。

#### 阶段编号（6→7）

| 新编号 | 阶段名称 | 原 stage 文件 | 说明 |
|--------|---------|--------------|------|
| 1 | 获取需求 | stage1-fetch-requirement.md | 不变 |
| **2** | **检测产品分析** | **stage2-detect-product-analysis.md（新建）** | **新增** |
| 3 | 读取项目代码 | stage3-read-code.md | 原 stage2，重命名 |
| 4 | Brainstorm 需求分析 | stage4-brainstorm.md | 原 stage3，增加条件跳过 |
| 5 | 生成设计文档 | stage5-design-docs.md | 原 stage4，增加输入源切换 |
| 6 | 生成实施计划 | stage6-plans.md | 原 stage5，重命名 |
| 7 | 总结交付与 TFS 上传 | stage7-delivery.md | 原 stage6，增加条件回写+上传保障 |

#### 检测逻辑

检测条件：**标签 AND 字段内容必须同时存在**。

```
1. 从 TFS 工作项读取：
   - System.Tags（检查 AI-ANALYSIS / EMR-AI-ANALYSIS-V2）
   - Winning.Demand.Analysis（检查字段内容）

2. 判定条件（必须同时满足）：
   ✓ 标签包含 AI-ANALYSIS 或 EMR-AI-ANALYSIS-V2
   ✓ Winning.Demand.Analysis 非空且非空白

3. 结果处理：
   hasProductAnalysis = true:
     → 读取 Winning.Demand.Analysis 完整内容
     → 保存到 {planBasePath}/{需求号}/产品业务分析.md
     → 输出："检测到 TFS 已有产品需求分析，将复用产品分析内容"

   hasProductAnalysis = false:
     → 输出："TFS 未检测到产品需求分析，将执行完整分析流程"

4. 更新 state.json，标记阶段 2 完成
```

#### state.json 新增字段

```json
{
  "hasProductAnalysis": true,
  "productAnalysisSource": "tfs",
  "productAnalysisFile": "产品业务分析.md"
}
```

#### 异常处理

| 场景 | 处理方式 |
|------|---------|
| TFS 读取标签/字段失败 | 重试 3 次后降级为 curl，仍失败则终止阶段 2 |
| 产品分析内容为空或乱码 | 视为无产品分析，`hasProductAnalysis=false` |

### 2. 阶段 4 Brainstorm 条件跳过与复杂度自动判定

#### 条件分支

```
if hasProductAnalysis === true:
  跳过 brainstorm
  自动判定复杂度:
    - 解析产品业务分析.md 内容
    - 计算信号：模块数、API 数量、数据库变更、页面新增/重构、需求描述长度、新技术依赖
    - 应用现有复杂度判定规则，结果写入 state.json.complexity
    - 输出："基于产品分析自动判定为 简单/复杂 需求"
  直接进入阶段 5

if hasProductAnalysis === false:
  执行现有 brainstorm 流程（不变）
  用户手动确认复杂度（不变）
```

#### 自动判定规则（复用现有信号表）

| 信号 | 简单 | 复杂 |
|------|------|------|
| 涉及模块数 | 1-2 | 3+ |
| API 数量 | <3 | 5+ |
| 数据库变更 | 无 | 有 |
| 需求描述长度 | <200 字 | >500 字 |
| 新技术依赖 | 无 | 有 |
| 多页面新增/重构 | 无 | 有 |

满足任一复杂信号 → 复杂，否则简单。

#### 阶段恢复适配

| 已有文件 | 恢复逻辑 |
|---------|---------|
| `state.json` 存在且 `completedStages` 含 2 | 阶段 2 已完成，从阶段 3 继续 |
| `hasProductAnalysis=true` 且无 brainstorm-notes.md | 正常跳过阶段 4，从阶段 5 继续 |
| `hasProductAnalysis=false` 且无 brainstorm-notes.md | 从阶段 4 继续 brainstorm |

### 3. 阶段 5 设计文档输入源切换

```
if hasProductAnalysis === true:
  输入源 = 产品业务分析.md（来自 TFS Winning.Demand.Analysis）
  - 从产品分析中提取：功能范围、字段变更、影响模块、业务规则
  - 以这些信息作为需求分析的等价物
  - 不再自主生成"需求分析"文档

if hasProductAnalysis === false:
  输入源 = brainstorm 阶段的产出（现有逻辑不变）
  - 正常生成需求分析 → API 契约 → 前后端设计 → 测试文档
```

#### 输出对照

| 环节 | 有产品分析 | 无产品分析 |
|------|-----------|-----------|
| 需求分析文档 | 不生成，用产品分析替代 | 正常生成 |
| API 契约 | 生成（基于产品分析） | 生成（基于需求分析） |
| 前端设计 | 生成 | 生成 |
| 后端设计 | 生成 | 生成 |
| 测试文档 | 生成 | 生成 |
| 用户确认节点 | 按 complexity 决定 | 现有逻辑不变 |

### 4. 阶段 7 交付回写条件化 + 三级上传保障

#### 条件回写

```
if hasProductAnalysis === true:
  执行现有交付逻辑（不变）:
    - 设计文件作为附件上传
    - 标签添加（开发计划相关标签）
    - 自动创建子任务

if hasProductAnalysis === false:
  额外执行:
    1. 将自主生成的需求分析写入 Winning.Demand.Analysis 字段
    2. 添加标签 AI-ANALYSIS
    3. 添加标签 EMR-AI-ANALYSIS-V2
    4. 需求分析文档作为附件上传
    5. 继续执行原有的设计文件上传、标签添加、任务创建
```

#### 回写操作对照

| 操作 | 有产品分析 | 无产品分析 |
|------|-----------|-----------|
| 写入 `Winning.Demand.Analysis` | 不写（已有） | 写入 |
| 添加 `AI-ANALYSIS` 标签 | 不加（已有） | 添加 |
| 添加 `EMR-AI-ANALYSIS-V2` 标签 | 不加（已有） | 添加 |
| 上传需求分析附件 | 不上传（没有） | 上传 |
| 上传设计文档附件 | 上传 | 上传 |
| 添加开发计划标签 | 上传 | 上传 |
| 创建子任务 | 创建 | 创建 |

#### 三级上传保障

对每一项上传操作执行：

```
第一级：主路径上传
  使用 TFS MCP 工具直接上传
  完成后立即验证：重新读取字段/附件/标签
  验证通过 → 标记该项上传成功
  验证失败/上传异常 → 进入第二级

第二级：重试（最多 3 次）
  每次重试前等待：2s → 4s → 8s
  每次重试后验证
  3 次仍失败 → 进入第三级

第三级：降级方案
  字段回写：降级到 update_demand_analysis.py
  附件上传：降级到 curl 直接调 TFS REST API
  标签添加：降级到 curl 直接调 TFS REST API
  降级后验证
  降级仍失败 → 阻塞，要求用户介入
```

#### 验证机制

| 操作 | 验证方式 |
|------|---------|
| 字段回写（`Winning.Demand.Analysis`） | 重新读取该字段，比对内容是否一致 |
| 附件上传 | `list_attachments` 检查文件名是否存在 |
| 标签添加 | 重新读取 `System.Tags`，检查目标标签是否存在 |

#### 上传顺序

```
串行执行（有依赖关系）:

1. 标签添加 → 验证
2. 字段回写 → 验证
3. 附件上传（每个文件独立上传，独立验证）
4. 子任务创建 → 验证
```

#### 失败报告格式

```
⚠️ TFS 上传统计报告：
━━━━━━━━━━━━━━━━━━━━
✅ 标签添加 AI-ANALYSIS       — 成功
✅ 标签添加 EMR-AI-ANALYSIS-V2 — 成功
✅ 字段回写 Winning.Demand.Analysis — 成功
✅ 附件上传 需求分析.md         — 成功
❌ 附件上传 前端设计.md          — 失败（3次重试+降级均失败）
   错误: Connection timeout
   本地文件: /Users/xxx/过程文件/1445554/前端设计.md
   建议: 手动在 TFS Web 界面上传该文件
✅ 子任务创建                  — 成功

请手动处理失败项后输入 "继续"
```

## SKILL.md 主文档改动汇总

### 总体工作流

```
阶段1: 获取需求
  ↓
阶段2: 检测产品分析
  ├─ 有产品分析 → 阶段3 → [跳过阶段4] → 阶段5(复用产品分析) → 阶段6 → 阶段7
  └─ 无产品分析 → 阶段3 → 阶段4(brainstorm) → 阶段5(完整) → 阶段6 → 阶段7(额外回写)
```

### 进度反馈

```
━━━ [阶段 N/7] 阶段名称 ━━━
```

### 并行执行表

| 阶段 | 可并行的操作 |
|------|-------------|
| 阶段 2 | 检测标签 ↔ 检测字段内容（并行读取） |
| 阶段 3 | 前端代码扫描 ↔ 后端代码扫描 |
| 阶段 5 | 需求分析单独生成；API 契约单独生成；前端设计 ↔ 后端设计可并行；测试文档最后生成 |
| 阶段 6 | 前端 plan ↔ 后端 plan 并行生成 |
| 阶段 7 | 附件上传 ↔ 标签添加可并行；字段回写和任务创建串行 |

### 异常处理新增

| 场景 | 处理方式 |
|------|---------|
| TFS 读取标签/字段失败 | 重试 3 次后降级为 curl，仍失败则终止阶段 2 |
| 产品分析内容为空或乱码 | 视为无产品分析，`hasProductAnalysis=false` |
| 上传重试 3 次+降级均失败 | 阻塞等待用户介入，提供手动操作步骤 |

## 文件改动清单

| 操作 | 文件 | 改动内容 |
|------|------|---------|
| 修改 | `SKILL.md` | 更新流程图（6→7阶段）、state.json 结构、阶段恢复表、异常处理表、并行执行表 |
| 新建 | `stages/stage2-detect-product-analysis.md` | 新阶段完整指令 |
| 重命名+修改 | `stage2-read-code.md` → `stage3-read-code.md` | 更新内部阶段编号引用 |
| 重命名+修改 | `stage3-brainstorm.md` → `stage4-brainstorm.md` | 增加条件跳过+自动判定复杂度 |
| 重命名+修改 | `stage4-design-docs.md` → `stage5-design-docs.md` | 增加输入源切换 |
| 重命名 | `stage5-plans.md` → `stage6-plans.md` | 更新内部阶段编号引用 |
| 重命名+修改 | `stage6-delivery.md` → `stage7-delivery.md` | 增加条件回写+三级上传保障 |

## 不改动的部分

- `std-req-analysis-ma` 技能完全不动
- `std-code-paths` 技能完全不动
- 阶段 1（获取需求）内容不变
- 阶段 3（读取代码）内容不变
- 阶段 6（实施计划）内容不变
