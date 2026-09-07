# 阶段4: Brainstorm 需求分析

### 元信息

- **前置条件**: 阶段1-3已完成（`state.json` 存在且 `completedStages` 包含 1、2、3）
- **触发条件**: `complexity === "complex"` 且 `hasProductAnalysis === false` 时执行；其他情况跳过
- **预计耗时**: 2-5 分钟

> **条件跳过规则（按优先级）：**
>
> 1. **有产品分析跳过**：如果 `state.json` 中 `hasProductAnalysis === true`，跳过本阶段所有 brainstorm 操作，执行以下步骤后直接进入阶段 5：
>    - 读取 `产品业务分析.md`（来自 `state.json` 的 `productAnalysisFile` 字段）
>    - **检查复杂度锁定状态**：
>      - 如果 `state.json.complexityLocked === true` → 使用已有 `complexity`，跳过自动判定
>        - 输出："复杂度已在阶段3确认为 simple/complex，保持不变"
>      - 如果 `state.json.complexityLocked` 不存在或为 `false` → 执行自动判定：
>        - 解析产品分析内容，计算以下信号：
>          - 涉及模块数（1-2 → 简单，3+ → 复杂）
>          - API 数量（<3 → 简单，5+ → 复杂）
>          - 数据库变更（无 → 简单，有 → 复杂）
>          - 需求描述长度（<200 字 → 简单，>500 字 → 复杂）
>          - 新技术依赖（无 → 简单，有 → 复杂）
>          - 多页面新增/重构（无 → 简单，有 → 复杂）
>        - 满足任一复杂信号 → `complexity: "complex"`，否则 `"simple"`
>        - 将结果写入 `state.json` 的 `complexity` 字段 + `complexityLocked: true`
>        - 输出："基于产品分析自动判定为 简单/复杂 需求"
>    - 根据代码扫描结果自动推断 `changeScope`（有前端仓库 → frontend=true，有后端仓库 → backend=true，API 路由命中 → api=true）
>    - 更新 `state.json`：`currentStage: 4`，`completedStages` 追加 4，`changeScope`
>    - 直接进入阶段 5
>
> 2. **简单需求跳过**：如果 `state.json` 中 `complexity === "simple"`，直接进入阶段 5。改动范围由代码扫描结果自动推断，更新 `state.json` 的 `changeScope` 后跳到阶段 5。

### 输入

- 阶段1的需求数据（`requirementAnalysis` 或 `description` + `title` + `acceptanceCriteria`）
- 阶段2的代码扫描摘要
- `state.json` 中的 `currentVersion`, `matchedProject`, `matchedRepositories`

### 执行步骤

#### 4.1 触发 Brainstorm

调用 `Skill` 工具，参数 `skill: "superpowers:brainstorming"`。

在 brainstorming 过程中，将以下上下文传递给分析：
- 需求内容（来自阶段1）
- 代码扫描摘要（来自阶段2）
- 项目技术栈信息

#### 4.2 分析重点

在 brainstorming 过程中，引导分析关注以下维度：

1. **功能边界**：涉及哪些功能模块？新增什么？修改什么？
2. **数据流**：数据从前端到后端的完整流转路径
3. **技术影响**：是否需要引入新依赖？是否需要调整现有架构？
4. **前后端协作点**：需要联调的地方、API 接口清单
5. **风险点**：技术风险、兼容性问题

**4.2a 图谱增强分析（可选）**

如果阶段2的代码扫描摘要中包含「知识图谱辅助信息」，使用 graphify 进一步深化分析：

1. **核心类上下文**：对 brainstorm 涉及的核心类，使用 `graphify explain` 获取社区归属和邻居关系，验证功能边界判断的准确性
2. **架构影响验证**：根据调用链路信息，验证"技术影响"评估是否完整，是否有遗漏的上下游依赖
3. **模块复用发现**：根据相似实现查询结果，评估是否有可直接复用的现有代码，减少开发量

图谱增强结果写入 `brainstorm-notes.md` 的「三、架构影响分析」章节。

#### 4.3 前后端改动范围判定

Brainstorming 完成后，根据分析结论判定改动范围：

**需要前端改动**（满足任一）：
- 新增/修改页面或组件
- 修改路由配置
- 修改前端状态管理（Pinia store）
- 新增/修改前端 API 调用
- 修改 UI 交互逻辑

**需要后端改动**（满足任一）：
- 新增/修改 API 接口
- 修改数据库表结构
- 新增/修改 Service 层业务逻辑
- 修改 Entity/DTO/VO 数据模型
- 引入新的中间件

**条件跳过规则：**
- 仅前端改动 → 跳过后端设计文档和后端 plan
- 仅后端改动 → 跳过前端设计文档和前端 plan
- API 契约仅在涉及 API 变更时生成
- 完全不涉及 API 变更（纯前端 UI 调整或纯后端数据修复）→ API 契约也可跳过

#### 4.4 输出

将分析结论整理为结构化笔记，使用 `references/brainstorm-notes-template.md` 模板生成 `brainstorm-notes.md`：

1. 读取 `references/brainstorm-notes-template.md` 模板
2. 填充各章节内容：
   - **一、改动范围判定**：基于 4.3 节的分析结论
   - **二、技术决策记录**：记录 brainstorming 过程中的关键技术选择
   - **三、架构影响分析**：基于代码扫描结果分析影响范围
   - **四、数据模型变更清单**：列出所有涉及的数据结构变更
   - **五、关键技术风险**：从 brainstorm 分析中提取
   - **六、API 接口清单**：初步的接口列表（后续阶段5生成详细 API 契约时展开）
   - **七、前后端协作点**：需要联调的关键节点
3. 保存到输出目录的 `brainstorm-notes.md`

> **简单需求自动推断：** 跳过 brainstorm 时，由代码扫描结果自动推断填写「一、改动范围判定」和「三、架构影响分析」，其余章节标注为"由代码扫描自动推断，可能不完整"。

#### 4.5 更新 state.json

更新输出目录下的 `state.json`，填充改动范围判定结果：

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

保留阶段2写入的 `currentVersion` 和 `matchedProject` 等字段不变，仅追加 `changeScope`。

### 输出

- `brainstorm-notes.md`（使用 `references/brainstorm-notes-template.md` 模板生成的结构化分析笔记）
- `state.json` 更新：`changeScope: { frontend, backend, api }`, `completedStages: [1,2,3,4]`

**输出数据契约（后续阶段依赖的字段）：**

`state.json` 追加字段：
```json
{
  "changeScope": {
    "frontend": "boolean — 是否涉及前端改动",
    "backend": "boolean — 是否涉及后端改动",
    "api": "boolean — 是否涉及 API 变更"
  }
}
```

`brainstorm-notes.md` 必须包含的7个章节（阶段5读取各章节作为设计依据）：
- 一、改动范围判定 → 阶段5 决定生成哪些设计文档
- 二、技术决策记录 → 阶段5 设计方案参考
- 三、架构影响分析 → 阶段5 现有模块影响评估
- 四、数据模型变更清单 → 阶段5 后端 Entity/DTO 设计
- 五、关键技术风险 → 阶段5 风险应对
- 六、API 接口清单（初步）→ 阶段5 API 契约详细展开
- 七、前后端协作点 → 阶段5 联调要点

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| Brainstorm 技能调用失败 | 重试一次，仍失败则基于代码扫描摘要生成简化版 brainstorm 笔记 |
| 模板文件读取失败 | 使用内置的 7 章节结构直接生成，不依赖模板文件 |
| 图谱增强查询超时 | 跳过图谱增强，使用传统分析结果 |
| `changeScope` 无法判定 | 默认 `frontend: true, backend: true, api: true`，在笔记中标注为"待确认" |
