---
name: std-req-to-plan
description: 需求分析到实施计划全流程自动化技能。从 TFS 获取需求 -> 读取前后端代码 -> brainstorm 分析 -> 生成需求分析文档、API 契约、前后端设计文档 -> 生成前后端实施计划。当用户提到"需求分析"、"生成设计文档"、"生成实施计划"、"需求到设计"、"需求到开发计划"、"需求全流程"、"开始分析需求"、"TFS 需求分析"、"工作项设计"等关键词时触发。也适用于用户直接提供需求描述（非 TFS）的场景。
version: 1.0.0
parameters:
  - name: workItemId
    description: TFS 工作项 ID，用于自动获取需求详情
    type: string
    required: false
---

# 需求分析到实施计划全流程

## 角色定位

你是一位资深全栈架构师，擅长从需求出发，系统性地进行分析、设计和规划。你的工作不是写代码，而是把一个需求拆解成清晰的、可执行的设计方案和实施计划。

## 总体工作流

本技能按以下六个阶段顺序执行，每个阶段的输出是下一个阶段的输入。在进入下一阶段前，确保当前阶段的文档已生成并保存。

```
阶段1: 获取需求 → 阶段2: 读取代码 → 阶段3: Brainstorm 分析 → 阶段4: 生成设计文档 → 阶段5: 生成实施计划 → 阶段6: 总结交付
```

---

## 阶段1: 获取需求内容

### 1.1 需求来源判定

首先询问用户需求来源：

- **TFS 工作项**：用户提供工作项 ID
- **手动描述**：用户直接提供需求文本

### 1.2 从 TFS 获取需求

如果用户提供工作项 ID：

1. 调用 `mcp__mcp-tfs-query__get_work_item` 获取工作项详情
2. 提取关键字段：标题、描述、验收标准、关联需求、附件列表
3. 如果工作项有附件，调用 `mcp__mcp-tfs-query__download_attachments` 下载附件到输出目录

```json
// 需要从工作项中提取的信息
{
  "workItemId": "工作项ID",
  "title": "标题",
  "description": "详细描述",
  "acceptanceCriteria": "验收标准",
  "relatedItems": ["关联工作项ID列表"],
  "attachments": ["附件列表"]
}
```

### 1.3 创建输出目录

输出目录格式：`过程文件/[需求号]/`

- TFS 工作项：使用工作项 ID 作为目录名（如 `过程文件/1445554/`）
- 手动输入需求：使用年月日作为目录名（如 `过程文件/20260414/`）

---

## 阶段2: 读取项目代码

### 2.1 读取路径配置

读取技能目录下的 `config/paths.json` 配置文件：

```json
{
  "frontendPath": "前端代码的相对或绝对路径",
  "backendPath": "后端代码的相对或绝对路径",
  "excludePatterns": ["node_modules", "dist", "target", ".git"]
}
```

**配置文件不存在时**（首次使用）：使用 `AskUserQuestion` 询问用户：
- 前端代码路径
- 后端代码路径

然后自动创建 `config/paths.json` 文件。

> 配置文件随技能目录存储，可跨电脑迁移。如果项目结构变化，提醒用户更新配置。

### 2.2 代码扫描策略

不要逐文件读取所有代码，而是有策略地扫描：

**前端代码扫描（Vue 3 + WinDesign 3.0 项目）：**
1. 先读取项目根目录的 `package.json`，确认技术栈版本（Vue 3、win-design-next、TypeScript、Pinia 等）
2. 确认 WinDesign Next 组件库的使用方式（完整引入 vs 按需引入），检查 `main.ts` 中的注册方式
3. 扫描 `src/` 目录结构，了解页面和组件的组织方式
4. 读取路由配置（通常是 `src/router/` 下的文件），了解页面结构
5. 读取 API 请求层（通常是 `src/api/` 或 `src/services/`），了解现有的后端接口调用模式
6. 检查现有组件中 WinDesign 组件的使用模式（`w-` 前缀、事件绑定方式、主题配置）
7. 根据需求关键词，读取相关的页面组件和 Store 文件

**后端代码扫描（Spring Boot 项目）：**
1. 先读取项目根目录的 `pom.xml`，了解技术栈和依赖
2. 扫描 `src/main/java/` 目录结构，了解包组织方式
3. 读取 Controller 层，了解已有的 API 端点
4. 读取与需求相关的 Entity/DTO，了解数据模型
5. 读取 Service 层的关键接口，了解业务逻辑组织方式

**扫描目的：** 了解项目现有架构、编码模式和约定，让后续的设计文档能贴合项目实际情况，而非凭空设计。

### 2.3 代码摘要

扫描完成后，在输出目录生成 `代码扫描摘要.md`，记录：
- 项目技术栈和版本
- 目录结构概览
- 与需求相关的现有模块和文件
- 现有的编码模式和约定

---

## 阶段3: Brainstorm 需求分析

这一阶段使用 `superpowers:brainstorming` 技能进行深度需求分析。这是强制步骤，不要跳过。

### 3.1 触发 Brainstorm

调用 `Skill` 工具，参数 `skill: "superpowers:brainstorming"`。

在 brainstorming 过程中，将以下上下文传递给分析：
- 需求内容（来自阶段1）
- 代码扫描摘要（来自阶段2）
- 项目技术栈信息

### 3.2 分析重点

在 brainstorming 过程中，引导分析关注以下维度：

1. **功能边界**：这个需求涉及哪些功能模块？需要新增哪些功能？修改哪些现有功能？
2. **数据流**：数据从前端到后端的完整流转路径是什么？
3. **技术影响**：需要引入新的依赖吗？需要对现有架构做调整吗？
4. **前后端协作点**：哪些地方需要前后端联调？API 接口有哪些？
5. **风险点**：有没有技术风险？有没有兼容性问题？

### 3.3 Brainstorm 输出

Brainstorming 完成后，将分析结论整理为结构化笔记，保存到输出目录的 `brainstorm-notes.md`。这份笔记是后续设计文档的核心素材。

---

## 阶段4: 生成设计文档

基于阶段3的分析结果，依次生成以下文档。每个文档都有对应的模板，从 `references/` 目录读取。

### 4.1 需求分析文档

**文件名：** `需求分析.md`
**模板：** 读取 `references/requirement-analysis-template.md`

这份文档将需求转化为技术语言，包含：
- 需求概述和背景
- 功能点拆解（每个功能点有明确的输入、输出和验收标准）
- 非功能性需求（性能、安全、兼容性）
- 需求依赖关系图
- 风险识别和应对策略

### 4.2 API 契约规范

**文件名：** `API契约.md`
**模板：** 读取 `references/api-contract-template.md`

使用 TypeScript interface 格式定义前后端 API 契约，包含：
- 接口地址和 HTTP 方法
- 请求参数的 TypeScript interface 定义
- 响应数据的 TypeScript interface 定义
- 错误码定义
- 分页、排序等通用参数约定

示例格式：
```typescript
// 请求参数
interface CreateOrderRequest {
  patientId: string;
  orderItems: OrderItemDTO[];
  remark?: string;
}

// 响应数据
interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  createTime: string;
}
```

### 4.3 前端设计文档

**文件名：** `前端设计.md`
**模板：** 读取 `references/frontend-design-template.md`
**组件文档：** 读取 `references/win-design-next-docs.md`（WinDesign Next 完整组件 API 文档）

基于 WinDesign 3.0 (win-design-next) 组件库和 Vue 3 Composition API 风格进行设计。在生成前端设计文档之前，先读取 `references/win-design-next-docs.md` 了解完整的组件 API 和使用示例，确保设计方案中使用的组件属性和事件都是准确的。
- 页面/组件结构图（使用 `w-` 前缀组件）
- 新增和修改的组件清单
- 路由配置变更（Vue Router 4）
- 状态管理设计（Pinia）
- 组件间数据流
- TypeScript 类型定义
- 需要引入的新依赖

> 前端设计必须基于 WinDesign 3.0 设计规范：
> - 主题色 `#2d5afa`，使用 CSS 变量 `--w3-color-primary`
> - 组件使用 `w-` 前缀（`<w-button>`, `<w-table>`, `<w-form>` 等）
> - 设计稿标准 1920x1080px，最小适配 1366x768px
> - 使用 `<script setup lang="ts">` Composition API 风格
> - 官方文档: http://wued.winning-health.com.cn:8088/win-design-next/

### 4.4 后端设计文档

**文件名：** `后端设计.md`
**模板：** 读取 `references/backend-design-template.md`

基于项目现有的 Spring Boot 模式，设计：
- Controller 层 API 端点定义
- Service 层业务逻辑设计
- 数据模型（Entity/DTO/VO）设计
- 数据库表结构变更（如需要）
- 中间件使用（如 Redis 缓存、消息队列等）

---

## 阶段5: 生成实施计划

这一阶段使用 `superpowers:writing-plans` 技能，将设计文档转化为可执行的实施计划。

### 5.1 生成前端实施计划

1. 读取阶段4生成的 `前端设计.md`
2. 调用 `Skill` 工具，参数 `skill: "superpowers:writing-plans"`
3. 以前端设计文档为输入，生成前端实施计划
4. 保存为 `前端plan.md`

### 5.2 生成后端实施计划

1. 读取阶段4生成的 `后端设计.md`
2. 调用 `Skill` 工具，参数 `skill: "superpowers:writing-plans"`
3. 以后端设计文档为输入，生成后端实施计划
4. 保存为 `后端plan.md`

### 5.3 计划文件格式

实施计划遵循 superpowers:writing-plans 的标准格式：
- 每个任务是一个可独立完成的小步骤（2-5分钟）
- 包含具体的文件路径和代码片段
- 使用 `- [ ]` checkbox 语法跟踪进度
- 包含测试步骤

---

## 阶段6: 总结交付与 TFS 上传

### 6.1 输出文件清单

向用户确认所有文件已生成：

```
过程文件/[需求号]/
├── 代码扫描摘要.md      # 阶段2: 项目代码扫描结果
├── brainstorm-notes.md  # 阶段3: 需求分析笔记
├── 需求分析.md          # 阶段4.1: 需求分析文档
├── API契约.md           # 阶段4.2: 前后端 API 契约
├── 前端设计.md          # 阶段4.3: 前端设计文档
├── 后端设计.md          # 阶段4.4: 后端设计文档
├── 前端plan.md          # 阶段5.1: 前端实施计划
└── 后端plan.md          # 阶段5.2: 后端实施计划
```

### 6.2 TFS 上传

如果需求来源是 TFS 工作项，提示用户是否将文档上传到 TFS：

> "所有文档已生成完毕。是否需要将文档上传到 TFS 工作项 [工作项ID]？"
> - 需求分析.md 的内容将写入工作项的「需求分析」字段
> - 其他设计文件将作为附件上传

用户确认后执行以下操作：

#### 6.2.1 上传需求分析内容到工作项字段

1. 读取 `需求分析.md` 的完整内容
2. 将 Markdown 内容转换为 HTML 格式
3. 调用 `mcp__mcp-tfs-query__update_work_item` 将内容写入工作项的 `System.Description` 或自定义的「需求分析」字段：

```javascript
mcp__mcp-tfs-query__update_work_item({
  id: workItemId,
  updates: {
    "System.Description": "<h3>需求分析</h3>" + htmlContent
  },
  comment: "AI 需求分析助手自动上传需求分析文档"
})
```

#### 6.2.2 上传设计文件为附件

将以下文件作为附件批量上传到工作项：

```
- API契约.md
- 前端设计.md
- 后端设计.md
- 前端plan.md
- 后端plan.md
```

调用 `mcp__mcp-tfs-query__upload_attachments`：

```javascript
mcp__mcp-tfs-query__upload_attachments({
  id: workItemId,
  filePaths: [
    "过程文件/[需求号]/API契约.md",
    "过程文件/[需求号]/前端设计.md",
    "过程文件/[需求号]/后端设计.md",
    "过程文件/[需求号]/前端plan.md",
    "过程文件/[需求号]/后端plan.md"
  ],
  comment: "AI 需求分析助手自动上传设计文档和实施计划"
})
```

#### 6.2.3 添加标签

给工作项添加 `AI-ANALYSIS-PLUS` 标签，标记该需求已完成 AI 分析：

```javascript
mcp__mcp-tfs-query__update_work_item({
  id: workItemId,
  updates: {
    "System.Tags": "AI-ANALYSIS-PLUS"
  }
})
```

### 6.3 下一步建议

向用户提供下一步操作建议：
- 如果用户满意，可以进入开发阶段（使用 std-development 技能）
- 如果需要调整设计，可以回到阶段4修改特定文档
- 如果需要修改实施计划，可以回到阶段5重新生成

---

## 异常处理

| 场景 | 处理方式 |
|------|---------|
| TFS 连接失败 | 提示用户手动提供需求内容 |
| 代码路径不存在 | 提示用户更新 config/paths.json |
| 工作项无描述 | 提示用户补充需求详情 |
| Brainstorm 未完成 | 不跳过，确保分析充分后再进入设计阶段 |
| 设计文档有矛盾 | 回到 brainstorm 阶段澄清 |

---

## 使用示例

**示例1 - 通过 TFS 工作项 ID：**
```
用户: 帮我分析需求 1445554，生成设计文档和开发计划
```

**示例2 - 手动描述需求：**
```
用户: 我需要做一个患者挂号功能，支持预约挂号和当日挂号，需要和 HIS 系统对接
```

**示例3 - 指定输出目录：**
```
用户: 分析一下 1445554 这个需求，输出到 过程文件/1445554/
```
