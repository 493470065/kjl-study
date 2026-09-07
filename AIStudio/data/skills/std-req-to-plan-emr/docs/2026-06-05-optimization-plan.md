# std-req-to-plan-emr P0/P1 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复步骤编号偏移、统一 stage 模板结构、脚本 HTTPS 兼容、复杂度锁定机制

**Architecture:** 3 个独立优化项按依赖顺序执行——先改脚本（无依赖），再改 stage 文件（编号+模板+锁定），最后同步 SKILL.md

**Tech Stack:** Markdown 编辑（stage 文件）、Node.js 脚本修改（cjs）

**设计文档:** `docs/2026-06-05-optimization-design.md`

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `scripts/upload-analysis.cjs` | HTTPS 协议自动检测 |
| 修改 | `scripts/cleanup-attachments.cjs` | HTTPS 协议自动检测 |
| 修改 | `scripts/create-tasks.cjs` | 删除未使用的 http import |
| 修改 | `stages/stage1-fetch-requirement.md` | 补充元信息 + 异常处理 |
| 修改 | `stages/stage2-detect-product-analysis.md` | 补充元信息 |
| 修改 | `stages/stage3-read-code.md` | 编号 2.x→3.x + 元信息 + 复杂度锁定写入 |
| 修改 | `stages/stage4-brainstorm.md` | 编号 3.x→4.x + 元信息 + 异常处理 + 复杂度读取守卫 |
| 修改 | `stages/stage5-design-docs.md` | 编号 4.x→5.x + 元信息 + 异常处理 |
| 修改 | `stages/stage6-plans.md` | 编号 5.x→6.x + 元信息 + 异常处理 |
| 修改 | `stages/stage7-delivery.md` | 补充元信息 |
| 修改 | `SKILL.md` | state.json 示例 + 步骤号引用同步 |

---

### Task 1: upload-analysis.cjs HTTPS 支持

**Files:**
- 修改: `scripts/upload-analysis.cjs`

- [ ] **Step 1: 增加 https 模块引入**

将第 2 行：
```javascript
const http = require('http');
```
改为：
```javascript
const http = require('http');
const https = require('https');
```

- [ ] **Step 2: 在 `main()` 函数内 `const workItemId` 行之前添加 `createTfsRequest` 函数**

```javascript
  // 根据 serverUrl 协议自动选择 http/https
  function createTfsRequest(urlObj, options) {
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    return lib.request({
      ...options,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
    });
  }
```

- [ ] **Step 3: 替换 http.request 调用**

将原来的：
```javascript
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${authToken}`,
        'Content-Length': Buffer.byteLength(body, 'utf-8')
      }
    }, (res) => {
```
改为：
```javascript
    const req = createTfsRequest(urlObj, {
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${authToken}`,
        'Content-Length': Buffer.byteLength(body, 'utf-8')
      }
    });
    req.on('response', (res) => {
```

注意：`http.request` 的回调参数改为 `req.on('response', ...)` 事件模式，与 `createTfsRequest` 返回的 request 对象兼容。

- [ ] **Step 4: 验证语法正确**

```bash
node --check scripts/upload-analysis.cjs
```
预期：无输出（语法正确）

- [ ] **Step 5: 提交**

```bash
git add scripts/upload-analysis.cjs
git commit -m "fix: upload-analysis.cjs 支持 HTTPS 自动检测协议"
```

---

### Task 2: cleanup-attachments.cjs HTTPS 支持

**Files:**
- 修改: `scripts/cleanup-attachments.cjs`

- [ ] **Step 1: 增加 https 模块引入**

将第 2 行：
```javascript
const http = require('http');
```
改为：
```javascript
const http = require('http');
const https = require('https');
```

- [ ] **Step 2: 在 `main()` 函数内 `const workItemId` 行之后添加 `createTfsRequest` 函数**

```javascript
  // 根据 serverUrl 协议自动选择 http/https
  function createTfsRequest(urlObj, options) {
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    return lib.request({
      ...options,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
    });
  }
```

- [ ] **Step 3: 替换 http.request 调用**

将原来的：
```javascript
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${authToken}`,
        'Content-Length': Buffer.byteLength(body, 'utf-8')
      }
    }, (res) => {
```
改为：
```javascript
    const req = createTfsRequest(urlObj, {
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${authToken}`,
        'Content-Length': Buffer.byteLength(body, 'utf-8')
      }
    });
    req.on('response', (res) => {
```

- [ ] **Step 4: 验证语法正确**

```bash
node --check scripts/cleanup-attachments.cjs
```
预期：无输出（语法正确）

- [ ] **Step 5: 提交**

```bash
git add scripts/cleanup-attachments.cjs
git commit -m "fix: cleanup-attachments.cjs 支持 HTTPS 自动检测协议"
```

---

### Task 3: create-tasks.cjs 清理未使用的 import

**Files:**
- 修改: `scripts/create-tasks.cjs`

- [ ] **Step 1: 删除未使用的 http 引入**

删除第 2 行：
```javascript
const http = require('http');
```
（已确认该脚本中 `http.` 使用次数为 0，所有 TFS 交互通过 tfs-client 代理）

- [ ] **Step 2: 验证语法正确**

```bash
node --check scripts/create-tasks.cjs
```
预期：无输出（语法正确）

- [ ] **Step 3: 提交**

```bash
git add scripts/create-tasks.cjs
git commit -m "chore: create-tasks.cjs 删除未使用的 http import"
```

---

### Task 4: stage3 编号修正 + 元信息 + 复杂度锁定写入

**Files:**
- 修改: `stages/stage3-read-code.md`

- [ ] **Step 1: 修正步骤编号（全局替换）**

按以下映射逐一替换（使用 Edit 工具 replace_all=false，避免子编号误匹配）：

| 原文 | 替换为 |
|------|--------|
| `#### 2.0 恢复检查` | `#### 3.0 恢复检查` |
| `#### 2.1 读取路径配置` | `#### 3.1 读取路径配置` |
| `#### 2.2 版本检测` | `#### 3.2 版本检测` |
| `#### 2.3 检查代码下载根目录` | `#### 3.3 检查代码下载根目录` |
| `#### 2.4 项目自动匹配` | `#### 3.4 项目自动匹配` |
| `#### 2.5 仓库筛选与路径检查` | `#### 3.5 仓库筛选与路径检查` |
| `#### 2.6 代码扫描策略` | `#### 3.6 代码扫描策略` |
| `##### 2.6a Graphify` | `##### 3.6a Graphify` |
| `##### 2.6b 传统模式` | `##### 3.6b 传统模式` |
| `#### 2.7 代码摘要` | `#### 3.7 代码摘要` |
| `#### 2.8 复杂度判定` | `#### 3.8 复杂度判定` |
| `#### 2.9 更新 state.json` | `#### 3.9 更新 state.json` |

同时替换步骤内部引用：
- `state.json` 中 `completedStages 包含 3` → 不需要改（引用的是阶段号不是步骤号）
- `2.6` → `3.6`（在正文描述中的引用）

- [ ] **Step 2: 在 `### 输入` 之前插入元信息节**

在文件开头的 `# 阶段3: 读取项目代码` 之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1-2已完成（`state.json` 存在且 `completedStages` 包含 1、2）
- **触发条件**: 自动执行（阶段2完成后进入）
- **预计耗时**: 2-5 分钟（取决于仓库数量和大小）
```

- [ ] **Step 3: 在 3.8 复杂度判定步骤中添加 complexityLocked 写入说明**

在 `#### 3.8 复杂度判定` 的 `将结果记录到 state.json 的 complexity 字段` 之后，追加：

```markdown

> **锁定规则：** 写入 `complexity` 的同时必须写入 `complexityLocked: true`。此后任何阶段不得覆盖此值。包括以下场景：
> - 用户通过 `AskUserQuestion` 选择 → 立即锁定
> - `mode` 参数指定 → 立即锁定
> - 快捷触发词（"简单分析"/"快速分析"）→ 立即锁定
> - 预判确认复用（`preliminaryComplexity === "simple"` 且代码扫描无意外）→ 立即锁定
```

- [ ] **Step 4: 更新 3.9 节的 state.json 示例**

将 3.9 节中的 state.json 示例：
```json
{
  "currentStage": 3,
  "complexity": "complex",
  "currentVersion": "250815",
  "matchedProject": "会诊",
  "matchedRepositories": ["winning-webui-consultation-next", "winning-emr-consultation"],
  "completedStages": [1, 2, 3]
}
```
改为：
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

- [ ] **Step 5: 更新输出数据契约**

在 `state.json 追加字段` 的 JSON 契约中，`complexity` 字段后追加：
```json
  "complexityLocked": "boolean — 一旦 complexity 被确认即为 true，后续阶段只读"
```

- [ ] **Step 6: 验证编号一致性**

```bash
grep -n "^####\|^#####" stages/stage3-read-code.md | grep -v "#### 3\."
```
预期：无匹配（所有 H4/H5 编号均已修正为 3.x）

```bash
grep -n "#### 2\." stages/stage3-read-code.md
```
预期：无匹配（无残留旧编号）

- [ ] **Step 7: 提交**

```bash
git add stages/stage3-read-code.md
git commit -m "refactor: stage3 编号修正 2.x→3.x + 元信息 + 复杂度锁定写入"
```

---

### Task 5: stage4 编号修正 + 元信息 + 异常处理 + 复杂度读取守卫

**Files:**
- 修改: `stages/stage4-brainstorm.md`

- [ ] **Step 1: 修正步骤编号**

| 原文 | 替换为 |
|------|--------|
| `#### 3.1 触发 Brainstorm` | `#### 4.1 触发 Brainstorm` |
| `#### 3.2 分析重点` | `#### 4.2 分析重点` |
| `**3.2a 图谱增强分析` | `**4.2a 图谱增强分析` |
| `#### 3.3 前后端改动范围判定` | `#### 4.3 前后端改动范围判定` |
| `#### 3.4 输出` | `#### 4.4 输出` |
| `#### 3.5 更新 state.json` | `#### 4.5 更新 state.json` |

同时替换正文中的引用：
- `3.3 节` → `4.3 节`
- `3.4 节` → `4.4 节`（如有）
- `brainstorm-notes.md 的「三、架构影响分析」` → 不变（引用的是模板章节名，非步骤号）

- [ ] **Step 2: 在 `### 输入` 之前插入元信息节**

在文件开头的 `# 阶段4: Brainstorm 需求分析` 之后、条件跳过规则块之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1-3已完成（`state.json` 存在且 `completedStages` 包含 1、2、3）
- **触发条件**: `complexity === "complex"` 且 `hasProductAnalysis === false` 时执行；其他情况跳过
- **预计耗时**: 2-5 分钟
```

- [ ] **Step 3: 在文件末尾（`### 输出` 的数据契约之后）追加异常处理节**

```markdown

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| Brainstorm 技能调用失败 | 重试一次，仍失败则基于代码扫描摘要生成简化版 brainstorm 笔记 |
| 模板文件读取失败 | 使用内置的 7 章节结构直接生成，不依赖模板文件 |
| 图谱增强查询超时 | 跳过图谱增强，使用传统分析结果 |
| `changeScope` 无法判定 | 默认 `frontend: true, backend: true, api: true`，在笔记中标注为"待确认" |
```

- [ ] **Step 4: 添加复杂度读取守卫**

在文件顶部的"有产品分析跳过"分支中，找到自动判定复杂度的部分：

```
> 1. **有产品分析跳过**：...自动判定复杂度...
```

将自动判定部分改为：

```markdown
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
>        - 写入 `state.json` 的 `complexity` 字段 + `complexityLocked: true`
>        - 输出："基于产品分析自动判定为 简单/复杂 需求"
```

- [ ] **Step 5: 验证编号一致性**

```bash
grep -n "^#### " stages/stage4-brainstorm.md | grep -v "#### 4\."
```
预期：无匹配

```bash
grep -n "#### 3\." stages/stage4-brainstorm.md
```
预期：无匹配

- [ ] **Step 6: 提交**

```bash
git add stages/stage4-brainstorm.md
git commit -m "refactor: stage4 编号修正 3.x→4.x + 元信息 + 异常处理 + 复杂度锁定守卫"
```

---

### Task 6: stage5 编号修正 + 元信息 + 异常处理

**Files:**
- 修改: `stages/stage5-design-docs.md`

- [ ] **Step 1: 修正步骤编号和标题层级**

将所有步骤标题从 `##` 降级为 `####`，编号从 4.x 改为 5.x：

| 原文 | 替换为 |
|------|--------|
| `## 4.1 需求分析文档` | `#### 5.1 需求分析文档` |
| `## 4.2 API 契约文档` | `#### 5.2 API 契约文档` |
| `## 4.3 前端设计文档` | `#### 5.3 前端设计文档` |
| `## 4.4 后端设计文档` | `#### 5.4 后端设计文档` |
| `## 4.5 用户确认环节` | `#### 5.5 用户确认环节` |
| `### 4.5a 需求分析确认` | `##### 5.5a 需求分析确认` |
| `### 4.5b API 契约确认` | `##### 5.5b API 契约确认` |
| `## 4.6 测试功能文档` | `#### 5.6 测试功能文档` |
| `## 4.7 前后端设计一致性校验` | `#### 5.7 前后端设计一致性校验` |

保留为 `##` 的标题（不改动）：
- `## 设计思路：API-First`
- `## 输入源切换（根据 hasProductAnalysis）`
- `## 简单需求流程`
- `## 复杂需求流程`
- `## 修改规则`

- [ ] **Step 2: 在 `### 输入` 之前插入元信息节**

在 `## 设计思路：API-First` 块之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1-4已完成（简单需求时阶段4可能被跳过）
- **触发条件**: 自动执行（上一阶段完成后进入）
- **预计耗时**: 3-10 分钟（简单需求偏短，复杂需求含确认环节偏长）
```

- [ ] **Step 3: 在文件末尾追加异常处理节**

在 `### 输出` 的数据契约之后追加：

```markdown

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| 设计模板文件读取失败 | 使用内置的章节结构直接生成，不依赖模板文件 |
| 前后端设计一致性校验发现矛盾 | 基于已确认的 API 契约自动修正，记录修正日志到 brainstorm-notes.md |
| WinDesign 组件文档不完整 | 使用精简版 summary + 通用组件映射表，不阻塞设计 |
| 用户确认环节反复修改超过 3 轮 | 提示用户考虑回到 brainstorm 阶段重新分析 |
```

- [ ] **Step 4: 验证编号和层级**

```bash
grep -n "^## 4\." stages/stage5-design-docs.md
```
预期：无匹配（旧编号已清除）

```bash
grep -n "^#### 5\." stages/stage5-design-docs.md
```
预期：7 个匹配（5.1~5.7）

- [ ] **Step 5: 提交**

```bash
git add stages/stage5-design-docs.md
git commit -m "refactor: stage5 编号修正 4.x→5.x + 标题层级统一 + 元信息 + 异常处理"
```

---

### Task 7: stage6 编号修正 + 元信息 + 异常处理

**Files:**
- 修改: `stages/stage6-plans.md`

- [ ] **Step 1: 修正步骤编号**

| 原文 | 替换为 |
|------|--------|
| `## 5.1 格式自检（强制）` | `#### 6.1 格式自检（强制）` |

保留为 `##` 的标题（不改动）：
- `## 简单需求`
- `## 复杂需求`
- `## 计划文件格式要求`

- [ ] **Step 2: 在 `### 输入` 之前插入元信息节**

在 `# 阶段6: 生成实施计划` 之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1-5已完成（设计文档已生成）
- **触发条件**: 自动执行（阶段5完成后进入）
- **预计耗时**: 2-5 分钟
```

- [ ] **Step 3: 在 `### 输出` 之后追加异常处理节**

```markdown

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| 格式自检失败（标题格式不匹配） | 自动修正标题为 `### Task N:` 格式后重新保存 |
| 格式自检失败（checkbox 缺失） | 为每个 Task 补充 `- [ ]` 前缀的字段行 |
| 设计文档缺失某些章节 | 基于 API 契约推断缺失内容，在 plan 中标注为"待确认" |
| writing-plans 技能输出格式不一致 | 生成后强制执行格式覆盖（标题改为 Task N: 格式） |
```

- [ ] **Step 4: 验证**

```bash
grep -n "^## 5\." stages/stage6-plans.md
```
预期：无匹配

```bash
grep -n "^#### 6\." stages/stage6-plans.md
```
预期：1 个匹配（6.1）

- [ ] **Step 5: 提交**

```bash
git add stages/stage6-plans.md
git commit -m "refactor: stage6 编号修正 5.x→6.x + 元信息 + 异常处理"
```

---

### Task 8: stage1 + stage2 + stage7 元信息补充

**Files:**
- 修改: `stages/stage1-fetch-requirement.md`
- 修改: `stages/stage2-detect-product-analysis.md`
- 修改: `stages/stage7-delivery.md`

- [ ] **Step 1: stage1 补充元信息**

在 `# 阶段1: 获取需求内容` 之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 无（本阶段为流程起点）
- **触发条件**: 用户调用 skill（提供工作项 ID 或手动需求文本）
- **预计耗时**: < 1 分钟
```

- [ ] **Step 2: stage1 补充异常处理**

在 `### 输出` 的数据契约之后追加：

```markdown

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| TFS MCP 不可用 | 提示用户手动提供需求文本 |
| 工作项无描述且无需求分析字段 | 提示用户补充需求详情 |
| 工作项 ID 不存在 | 报错并提示检查 ID 是否正确 |
| 附件下载失败 | 记录失败文件名，继续执行（非阻塞） |
```

- [ ] **Step 3: stage2 补充元信息**

在 `# 阶段 2: 检测产品分析` 之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1已完成（`state.json` 存在且 `completedStages` 包含 1）
- **触发条件**: 自动执行（阶段1完成后进入）
- **预计耗时**: < 1 分钟
```

- [ ] **Step 4: stage7 补充元信息**

在 `# 阶段7: 总结交付与 TFS 上传` 之后、`### 输入` 之前插入：

```markdown

### 元信息

- **前置条件**: 阶段1-6已完成（设计文档和 plan 已生成）
- **触发条件**: 自动执行（阶段6完成后进入）
- **预计耗时**: 1-3 分钟
```

- [ ] **Step 5: 验证**

```bash
grep -c "### 元信息" stages/stage1-fetch-requirement.md stages/stage2-detect-product-analysis.md stages/stage7-delivery.md
```
预期：每个文件各 1 次

- [ ] **Step 6: 提交**

```bash
git add stages/stage1-fetch-requirement.md stages/stage2-detect-product-analysis.md stages/stage7-delivery.md
git commit -m "docs: stage1/2/7 补充元信息节（统一模板）"
```

---

### Task 9: SKILL.md 同步更新

**Files:**
- 修改: `SKILL.md`

- [ ] **Step 1: 更新 state.json 示例**

在 SKILL.md 的 state.json 示例中，`"complexity"` 行之后插入：

```json
  "complexityLocked": true,
```

完整的 state.json 示例变为：
```json
{
  "workItemId": "工作项ID",
  "currentStage": 4,
  "preliminaryComplexity": "simple",
  "preliminaryComplexityReason": "需求文本 <200字，无数据库关键词",
  "complexity": "complex",
  "complexityLocked": true,
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

- [ ] **Step 2: 在复杂度判定章节增加锁定说明**

在 `### 复杂度判定与流程分支` 的段落中，`将结果记录到 state.json 的 complexity 字段` 之后追加：

```markdown

> **锁定规则：** `complexity` 确认后同时写入 `complexityLocked: true`，后续阶段只读，不可覆盖。
```

- [ ] **Step 3: 验证**

```bash
grep -c "complexityLocked" SKILL.md
```
预期：至少 2 次（state.json 示例 + 锁定说明）

- [ ] **Step 4: 提交**

```bash
git add SKILL.md
git commit -m "docs: SKILL.md 增加 complexityLocked 字段说明"
```

---

### Task 10: 全局验证

**Files:**
- 无文件修改，纯验证

- [ ] **Step 1: 验证所有 stage 编号无残留**

```bash
grep -rn "#### 2\.\|#### 3\.\|## 4\.\|## 5\." stages/ | grep -v "stage7"
```
预期：无匹配（stage7 的 7.x 编号是正确的，不在此检查范围）

- [ ] **Step 2: 验证所有 stage 有元信息节**

```bash
grep -l "### 元信息" stages/*.md | wc -l
```
预期：7（全部 7 个 stage 文件都有元信息节）

- [ ] **Step 3: 验证脚本语法**

```bash
node --check scripts/upload-analysis.cjs && node --check scripts/cleanup-attachments.cjs && node --check scripts/create-tasks.cjs && echo "全部通过"
```
预期：输出 "全部通过"

- [ ] **Step 4: 验证脚本无未使用的 http import**

```bash
grep -n "require('http')" scripts/create-tasks.cjs
```
预期：无匹配

```bash
grep -c "require('https')" scripts/upload-analysis.cjs scripts/cleanup-attachments.cjs
```
预期：各 1 次

- [ ] **Step 5: 验证 complexityLocked 覆盖完整**

```bash
grep -l "complexityLocked" stages/stage3-read-code.md stages/stage4-brainstorm.md SKILL.md | wc -l
```
预期：3（stage3 写入、stage4 读取守卫、SKILL.md 示例）

- [ ] **Step 6: 最终提交（如有 CHANGELOG 更新）**

在 `CHANGELOG.md` 顶部追加：

```markdown
## 2.2.2 (2026-06-05)

### P0/P1 优化（基于技能评审）

- **步骤编号修正**: stage3~6 内部编号与文件名阶段号对齐（3.x/4.x/5.x/6.x）
- **标题层级统一**: 定义 H1-H5 规范，stage5 的 `## 4.x` 降为 `#### 5.x`
- **统一模板结构**: 所有 stage 文件补充 `### 元信息` 节（前置条件/触发条件/预计耗时）
- **脚本 HTTPS 支持**: upload-analysis.cjs 和 cleanup-attachments.cjs 自动检测协议
- **脚本清理**: create-tasks.cjs 删除未使用的 `require('http')`
- **复杂度锁定机制**: state.json 新增 `complexityLocked` 字段，一经确认不可覆盖
```

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG 更新 v2.2.2 优化记录"
```
