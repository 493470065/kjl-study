---
name: std-testcase-generator
description: 根据需求信息自动设计并生成测试用例，支持用例设计分析和Excel格式输出。不直接操作TFS，需配合tfs2018-integration使用。
license: MIT
metadata:
  author: Winning Health
  version: "1.0.0"
  category: 测试用例生成
  tags: [测试用例, 用例生成, 功能用例, 功能测试]
---


# std-testcase-generator

## When to use this skill
- 需要根据卫宁健康TFS需求号生成测试用例
- 需要从需求文档和原型设计自动提取测试场景
- 需要输出标准格式的Excel测试用例文件
- 需要覆盖核心功能、配置参数、异常处理等测试场景

## Prerequisites

使用前需确保skill `tfs2018-integration` 已正确配置并能正常工作：

1. 执行 `skill tfs2018-integration` 获取TFS版本号信息
2. 确认TFS集成功能正常可用

## Usage

### 基本用法

提供需求号或者需求信息，生成完整的测试用例：

```
请为TFS需求号12345对应需求功能生成测试用例
```

```
请为"预约查询增加支付方式"功能生成测试用例
```

### 完整流程

**第一步：获取需求信息**
- 通过 skill `tfs2018-integration` 获取需求号对应需求的需求详细描述、需求分析内容
- 如果对应需求存在附件，则下载需求附件（需求分析文档、原型文档等）
- 如果调用skill报错，请自行重试修复，最大重试次数3次

**第二步：调用此 skill 生成测试用例**
- 根据获取的所有需求信息（包括需求详细描述、分析内容、附件内容）生成测试用例
- 支持功能需求、Bug修复、用户故事等类型
- 自动生成核心功能、配置参数、异常处理等测试场景

**第三步：输出文件**
- 格式：`当前工程/testcase/{需求号}-testcase_{时间戳}.xlsx`
- 包含6列：序号、用例名称、前置条件、执行步骤、预期结果、优先级

## Examples

- "为'预约查询增加支付方式'功能生成测试用例"
- "根据需求分析生成功能测试用例"
- "为用户登录功能创建完整的测试用例"
- "为'修复数据导出异常'生成Bug修复测试用例"

## Output format

测试用例Excel文件结构：

| 列名 | 说明 | 示例 |
|------|------|------|
| 序号 | 用例编号 | 1, 2, 3... |
| 用例名称 | 测试场景名称 | 用户登录_正常登录_已注册用户 |
| 前置条件 | 执行前需满足的条件 | 用户已注册且账号状态正常 |
| 执行步骤 | 具体操作步骤 | 1. 点击菜单【预约查询】... |
| 预期结果 | 期望的测试结果 | 显示查询结果列表，包含3条记录 |
| 优先级 | P0/P1/P2 | P0-核心功能，P1-重要功能，P2-可选功能 |

## Triggers

以下关键词会触发此 skill：

- 生成测试用例
- 卫宁测试用例
- 需求生成测试用例
- 创建测试用例
- 功能测试用例生成
- 用例生成
- 测试用例导出

## Integration

### 与 tfs2018-integration 的配合

此 skill **不直接操作 TFS**，TFS 相关操作由 `tfs2018-integration` skill 负责：

| Skill | 职责 |
|-------|------|
| `tfs2018-integration` | TFS 认证、工作项查询、附件下载 |
| `std-testcase-generator` | 用例生成、Excel 导出 |

**工作流程：**
1. 使用 `tfs2018-integration` 获取需求信息
2. 将需求信息传递给 `std-testcase-generator`
3. 生成测试用例并导出 Excel

## Template System

支持多种需求类型的测试用例模板：

| 模板文件 | 适用场景 |
|---------|---------|
| `templates/feature.json` | 功能需求 (Feature) |
| `templates/user-story.json` | 用户故事 (User Story) |
| `templates/bug-fix.json` | Bug修复 (Bug) |
| `templates/common.json` | 通用异常场景 |

模板使用 `{变量名}` 格式进行插值，支持的变量：
- `{title}` - 需求标题
- `{id}` - 需求编号
- `{workItemType}` - 工作项类型
- `{feature}` - 识别的功能点
- `{featureType}` - 功能类型
