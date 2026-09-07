# std-req-to-plan-emr P0/P1 优化设计

> 日期: 2026-06-05
> 版本: 基于 v2.2.1
> 范围: 步骤编号统一、脚本 HTTPS 支持、复杂度锁定机制

## 背景

基于 v2.2.1 的技能评审，确认 3 项需要优化的问题。上下文溢出问题经确认由 subagent 机制已解决，降级为可忽略。子任务拆分暂不处理。

## 优化项1：步骤编号修正 + 统一模板结构

### 问题

stage3~stage6 的内部步骤编号全部比文件名阶段号偏移 -1（stage3 用 `2.x`，stage4 用 `3.x`...），给维护造成困惑。部分 stage 文件标题层级不规范（`##` 和 `####` 混用无统一规则）。

### 方案

修正编号的同时，为所有 stage 文件建立统一的骨架模板。

### 统一模板结构

```markdown
# 阶段N: 阶段名称

### 元信息
- **前置条件**: [哪些阶段必须完成]
- **触发条件**: [何时执行本阶段]
- **预计耗时**: [时间范围]

### 输入
- [依赖的数据/文件列表]

### 执行步骤

#### N.0 恢复检查
[恢复逻辑]

#### N.1 步骤名称
[步骤内容]

...

### 输出
- [产出的文件/状态变更]

**输出数据契约（后续阶段依赖的字段）：**
[JSON schema]

### 异常处理

| 场景 | 处理方式 |
|------|---------|
| ... | ... |
```

### 标题层级规范

| 层级 | Markdown | 用途 |
|------|----------|------|
| H1 | `#` | 阶段标题（每个文件仅一个） |
| H2 | `##` | 节标题（简单需求流程 / 复杂需求流程 / 格式要求等分区） |
| H3 | `###` | 固定节（元信息 / 输入 / 输出 / 异常处理） |
| H4 | `####` | 步骤编号（如 `#### 3.1 读取路径配置`） |
| H5 | `#####` | 子步骤/条件分支（如 `##### 3.6a Graphify 主导模式`） |

### 各文件改动明细

#### stage1-fetch-requirement.md

- 编号：已正确，不改动
- 结构补全：补充 `### 元信息` 节（前置条件：无；预计耗时：<1分钟）
- 结构补全：补充 `### 异常处理` 节（从 SKILL.md 总表抽取本阶段相关场景）

#### stage2-detect-product-analysis.md

- 编号：无内部步骤编号，不改动
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1完成；预计耗时：<1分钟）

#### stage3-read-code.md

- 编号修正：`#### 2.0`~`#### 2.9` → `#### 3.0`~`#### 3.9`
- 子步骤修正：`##### 2.6a` / `##### 2.6b` → `##### 3.6a` / `##### 3.6b`
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1-2完成；预计耗时：2-5分钟）
- 异常处理：当前异常散在各步骤中（只读约束、超时控制等），不强制抽取为独立节

#### stage4-brainstorm.md

- 编号修正：`#### 3.1`~`#### 3.5` → `#### 4.1`~`#### 4.5`
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1-3完成；预计耗时：2-5分钟）
- 结构补全：补充 `### 异常处理` 节（Brainstorm 未完成时回到分析阶段）

#### stage5-design-docs.md

- 编号修正：`## 4.1`~`## 4.7` → `#### 5.1`~`#### 5.7`（从 `##` 降级为 `####`）
- 子步骤修正：`### 4.5a` / `### 4.5b` → `##### 5.5a` / `##### 5.5b`
- 保留为 `##` 的标题：`## 设计思路：API-First`、`## 输入源切换`、`## 简单需求流程`、`## 复杂需求流程`（这些是分区标题，符合 H2 规范）
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1-4完成；预计耗时：3-10分钟）
- 结构补全：补充 `### 异常处理` 节（设计文档矛盾、模板读取失败等场景）

#### stage6-plans.md

- 编号修正：`## 5.1` → `#### 6.1`
- 保留为 `##` 的标题：`## 简单需求`、`## 复杂需求`、`## 计划文件格式要求`
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1-5完成；预计耗时：2-5分钟）
- 结构补全：补充 `### 异常处理` 节（格式自检失败、设计文档缺失等场景）

#### stage7-delivery.md

- 编号：已正确（`7.1`~`7.2.5`），不改动
- 结构补全：补充 `### 元信息` 节（前置条件：阶段1-6完成；预计耗时：1-3分钟）

#### SKILL.md

- 更新 state.json 示例，增加 `complexityLocked` 字段（与优化项3联动）
- 各阶段描述中的步骤号引用同步更新

### 不改动的内容

- `references/` 下的模板文件 — 不涉及
- `scripts/` 下的脚本 — 不涉及
- 各 stage 的实质内容（执行逻辑、判定规则、输出契约）— 不变

---

## 优化项2：脚本 HTTPS 自动检测

### 问题

3 个脚本都硬编码 `require('http')`，如果 TFS 服务器使用 HTTPS 协议会静默失败。

### 方案

根据 `client.serverUrl` 的协议自动选择 `http` 或 `https` 模块。

### 各脚本改动明细

#### upload-analysis.cjs

改动点：
1. 第 2 行增加 `const https = require('https');`
2. 提取公共请求函数：

```javascript
function createTfsRequest(urlObj, options, body) {
  const isHttps = urlObj.protocol === 'https:';
  const lib = isHttps ? https : http;
  return lib.request({
    ...options,
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
  });
}
```

3. 第 49 行 `http.request({...})` 替换为 `createTfsRequest(urlObj, {...})`

#### cleanup-attachments.cjs

改动点同 upload-analysis.cjs：
1. 增加 `const https = require('https');`
2. 加入 `createTfsRequest` 函数
3. 第 99 行替换

#### create-tasks.cjs

改动点：
1. 删除第 2 行 `const http = require('http');`（未使用的 import，所有 TFS 交互通过 tfs-client 代理）

### 不改动的内容

- `tfs-client.mjs` — 不在 skill 控制范围内
- 环境变量接口 — 不变
- 错误处理逻辑 — 不变

---

## 优化项3：复杂度锁定机制

### 问题

stage3 确认复杂度后，stage4 的"有产品分析"分支可能自动覆盖 `complexity` 值，导致用户确认的结果被忽略。

### 方案

在 state.json 增加 `complexityLocked` 字段，一旦 `complexity` 被确认即锁定，后续阶段只读。

### state.json schema 变更

新增字段：

| 字段 | 类型 | 含义 |
|------|------|------|
| `complexityLocked` | `boolean` | `true` = 后续阶段禁止覆盖 complexity；`false` 或缺失 = 允许 |

### 写入时机（stage3）

`complexity` 和 `complexityLocked` 同步写入，无两步操作：

| 触发方式 | complexity 值 | complexityLocked | 场景 |
|---------|--------------|-----------------|------|
| `AskUserQuestion` 用户选择 | 用户选择值 | `true` | 标准流程 |
| `mode` 参数指定 | 参数值 | `true` | 调用时 mode=simple |
| 快捷触发词 | `"simple"` | `true` | 用户说"简单分析"/"快速分析" |
| 预判确认复用 | preliminaryComplexity 值 | `true` | 预判为 simple 且代码扫描无意外 |

### 读取守卫（stage4）

stage4 的两个跳过分支在操作 complexity 时检查：

**分支1：有产品分析跳过（自动判定复杂度）**

```
if state.json.complexityLocked === true:
  使用已有 complexity，跳过自动判定
  输出："复杂度已在阶段3确认为 simple/complex，保持不变"
else:
  解析产品分析 → 自动判定 → 写入 complexity + complexityLocked: true
```

**分支2：简单需求跳过**

原来直接跳过，不操作 complexity。无需改动。

### SKILL.md 联动更新

1. state.json 示例中增加 `complexityLocked` 字段
2. 复杂度判定章节增加说明：complexity 一经确认即锁定，后续阶段只读

### 不改动的内容

- stage5、stage6、stage7 — 它们只读取 complexity，从不写入
- `preliminaryComplexity` — 保持不变，仅用于 stage3 内部预判优化
- 异常处理表 — complexityLocked 本身就是防异常覆盖的机制
