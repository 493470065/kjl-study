---
name: code-review
description: 代码审查 - 支持首次审核(全量)和增量审核(变更)两种模式
tags: [review, code-quality, security]
allowed-tools: Bash(git:*), Read, Write
output_format: json_only
---

## Skill名称：code-review

## 功能描述
对代码仓库进行自动化安全审查和质量检查，支持首次全量扫描和增量变更扫描。

## 输入要求
- 必需参数：scan_type（扫描类型：security/quality/full）
- 必需参数：scan_mode（扫描模式：initial/incremental）
- 必需参数：severity_filter（严重级别过滤）
- 可选参数：files（待审查文件列表，如未提供则自动收集）
- 可选参数：output_mode（输出模式：standard/stream_files，默认 standard）
- 可选参数：batch_size（流式模式下每批文件数，默认 200）
- 可选参数：output_dir（流式模式下批次文件输出目录，默认 .claude/tmp）

## 扫描流程

### 标准模式（output_mode=standard）

1. 从 @references/review-rules.json 读取规则并根据 scan_type 过滤
2. **收集待审查文件**（优先使用 Prompt 中的文件列表）
   - 如果 Prompt 中提供了 `## 待审查文件` 章节，直接使用该列表
   - 如果 Prompt 中只提供了文件总数（无具体列表），**必须使用 Bash 工具收集文件**
   - 如果两者都没有提供，根据 scan_mode 自动收集文件
3. **深度审查所有代码**（核心要求！）
   - **四轮审查法**：逐行分析 → 结构分析 → 安全审计 → 性能评估
   - **多角度检查**：从安全、性能、质量、规范、业务五个角度检查同一段代码
   - **完整读取**：必须读取完整的文件内容，包括所有方法、字段、注解
   - **重点检查**：Service、Controller、Repository 等业务逻辑类
4. **公平执行所有规则**，不要对规则有任何倾斜或偏好，每条规则都要认真检查
5. 按批次执行规则检查（第1批→第2批→...→第5批），特别关注高危问题
6. 一次性输出所有批次的审查结果

### 流式文件输出模式（output_mode=stream_files）

**适用场景**：文件数量 > 500 个，或需要避免重复读取 SKILL.md

1. 从 @references/review-rules.json 读取规则并根据 scan_type 过滤
2. **收集待审查文件**（必须从 Prompt 的文件列表读取）
   - 从 Prompt 中提取 `## 待审查文件` 章节的文件列表
3. **严格审查代码**，仔细检查每个文件，不要遗漏任何问题
4. **公平执行规则**，不要对规则有任何倾斜或偏好，每条规则都要认真检查
5. **计算批次数量**：total_batches = ceil(total_files / batch_size)
6. **分批扫描并写入文件**：
   ```
   for batch_id in range(total_batches):
       # 获取当前批次的文件
       start_idx = batch_id * batch_size
       end_idx = min(start_idx + batch_size, total_files)
       batch_files = all_files[start_idx:end_idx]

       # 扫描当前批次
       batch_issues = scan_batch(batch_files)

       # 立即写入文件（不累积在内存中）
       batch_file_path = f"{output_dir}/batch_{batch_id+1:03d}.json"
       Write(batch_file_path, json.dumps({
           "batch_id": batch_id + 1,
           "batch_number": batch_id + 1,
           "total_batches": total_batches,
           "files_assigned": len(batch_files),
           "files_scanned": extract_scanned_files(batch_issues),
           "scan_timestamp": current_time(),
           "vulnerabilities": batch_issues["vulnerabilities"],
           "quality_issues": batch_issues["quality_issues"],
           "batch_summary": calculate_summary(batch_issues)
       }, ensure_ascii=False))

       # 清空当前批次结果（释放内存）
       batch_issues.clear()
   ```
5. **输出摘要 JSON**（不是完整结果，只包含统计信息和文件路径）：
   @templates/stream-output-format.md

**流式模式关键要求**：
- ✅ 每批完成后立即使用 Write 工具写入文件
- ✅ 批次文件路径格式：`{output_dir}/batch_{batch_number:03d}.json`
- ✅ 每个批次文件必须是完整的独立 JSON（可单独解析）
- ✅ 最后只输出摘要，不输出所有问题详情
- ❌ 禁止在内存中累积所有批次的结果
- ❌ 禁止最后输出包含所有问题的完整 JSON

## 输出格式

### 标准模式输出格式（output_mode=standard）

**严格格式要求：**
- 输出必须是纯 JSON，第一个字符是 `{`，最后一个是 `}`
- 禁止任何自然语言前缀（如"扫描完成"、"结果如下"）
- 禁止 Markdown 代码块标记（```json）
- 禁止任何标题、列表、表格、加粗等 Markdown 格式
- CLI 模式下 result 字段必须是**纯 JSON 字符串**

**输出前自检清单：**
- [ ] 第一个字符是 `{`，最后一个字符是 `}`？
- [ ] 没有 ```json 代码块标记？
- [ ] 没有"完成"、"结果"、"如下"等词语？
- [ ] 没有 Markdown 格式（##、|、-、**）？
- [ ] result字段是纯 JSON？

**示例输出：**

以下是result返回数据示例，实际返回不要```json 代码块标记

@templates/json-output-format.md

### 流式文件输出模式格式（output_mode=stream_files）

**摘要输出格式**（Claude 最后返回的 JSON）：

@templates/stream-output-format.md

**摘要输出格式要求：**
- ✅ 必须包含 `batch_files` 数组，列出所有生成的批次文件路径
- ✅ 必须包含 `total_batches`、`total_files_assigned`、`total_files_scanned`
- ✅ `total_issues` 是所有批次的问题总数
- ✅ `summary` 是所有批次的汇总统计
- ❌ 不要包含具体的 `vulnerabilities` 或 `quality_issues` 详情（在批次文件中）
- ❌ 不要包含 `fix_solutions`（由外部合并后生成）

**批次文件格式**（`.claude/tmp/batch_XXX.json`）：

@templates/stream-output-format.md

**批次文件格式要求：**
- ✅ 每个批次文件必须是独立的、完整的 JSON 对象
- ✅ 可以单独解析，不依赖其他批次文件
- ✅ 必须包含 `batch_id`、`batch_number`、`total_batches`
- ✅ `files_assigned` 是分配给该批次的文件数
- ✅ `files_scanned` 是实际扫描的文件数（可能因跳过而小于 assigned）
- ✅ `vulnerabilities` 和 `quality_issues` 是该批次的具体问题
- ✅ `batch_summary` 是该批次的统计信息

**示例输出：**

以下是result返回数据示例，实际返回不要```json 代码块标记

@templates/stream-output-format.md

## 字段说明

### 顶层字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| scan_time | string | ✅ | ISO 8601 格式时间戳 |
| scan_mode | string | ✅ | initial 或 incremental |
| scan_type | string | ✅ | full/security/quality |
| files_scanned | number | ✅ | 实际扫描的文件数 |
| vulnerabilities | array | ✅ | 安全问题列表 |
| quality_issues | array | ✅ | 质量问题列表 |
| summary | object | ✅ | 扫描摘要统计 |
| fix_solutions | array | ✅ | 修复方案列表（必须字段） |

### vulnerabilities / quality_issues 字段

| 字段 | 类型 | 必需 | 说明                                   |
|------|------|------|--------------------------------------|
| checkpoint_id | string | ✅ | 规则检查点 ID（如 QUAL-B011-6）              |
| severity | string | ✅ | 严重级别：严重/警告/提示/信息                     |
| file | string | ✅ | 文件路径                                 |
| line | number | ✅ | 行号                                   |
| description | string | ✅ | 问题描述                                 |
| category | string | ✅ | 问题类别（代码质量/性能规范等）                     |
| code_snippet | string | ✅ | 代码上下文（行号: 内容，问题行用 >>> 标记, 取问题行前后各1行，共3行） |

### fix_solutions 字段（重要）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| rule_id | string | ✅ | 规则 ID（如 QUAL-B011-6） |
| rule_name | string | ✅ | 规则名称（如"null调用风险"） |
| severity | string | ✅ | 级别：严重/警告/提示/信息 |
| issue_count | number | ✅ | 该规则触发的问题总数 |
| affected_files | array | ✅ | 受影响的文件路径列表 |
| fix_steps | array | ✅ | 修复步骤列表（使用序号："1. 第一步"） |
| code_example | string | ✅ | 修复后的代码示例 |
| rationale | string | ✅ | 修复原理说明 |

## Severity 映射

按规则定义输出，严格映射：
- 严重 → high 🔴
- 警告 → medium 🟡
- 提示 → low 🔵
- 信息 → info ℹ️

## 深度审查方法（重要！）

### 四轮审查法

对每个文件，必须执行以下四轮检查：

#### 第一轮：逐行分析（基础问题）
1. 逐行阅读代码，不遗漏任何一行
2. 检查每个方法的实现逻辑
3. 关注：命名规范、代码格式、注释完整性
4. 检查：异常处理、空值检查、边界条件

#### 第二轮：结构分析（架构问题）
1. 分析类的职责和依赖关系
2. 检查方法长度和复杂度
3. 关注：循环嵌套、SQL 查询、RPC 调用
4. 检查：事务边界、资源释放、并发安全

#### 第三轮：安全审计（安全问题）
1. 检查所有用户输入点（Controller 参数）
2. 关注：SQL 注入、XSS、敏感信息泄露
3. 检查：认证授权、加密算法、权限控制
4. 特别注意：日志中打印的敏感信息

#### 第四轮：性能评估（性能问题）
1. 检查循环内的数据库操作（N+1 问题）
2. 关注：大集合操作、深分页、多表 JOIN
3. 检查：缓存使用、批量操作、异步处理
4. 特别注意：List 操作、Stream 操作、数据库查询

### 多角度检查清单

对于同一个代码段，从多个角度检查：

**安全角度：**
- [ ] SQL 注入（字符串拼接 SQL、${} 参数）
- [ ] XSS 风险（未转义的用户输入）
- [ ] 敏感信息泄露（日志中打印密码、token）
- [ ] 缺少权限检查（关键接口未验证权限）
- [ ] 弱加密算法（MD5、DES）
- [ ] 硬编码密钥（代码中写死的密钥、密码）

**性能角度：**
- [ ] N+1 查询（循环中查数据库，循环次数 > 5）
- [ ] 深分页（OFFSET > 10000）
- [ ] 多表 JOIN（> 5 表警告，> 7 表严重）
- [ ] 大集合操作（一次性加载大量数据）
- [ ] 缺少索引（WHERE 条件缺少索引）
- [ ] 循环中调用 RPC

**质量角度：**
- [ ] 空catch块（捕获异常但不处理）
- [ ] 缺少空值检查（直接调用可能为 null 的对象）
- [ ] 方法过长（> 100 行）
- [ ] 类过长（> 500 行）
- [ ] 重复代码（相同逻辑出现多次）
- [ ] 魔法数字（未定义常量的数字）

**规范角度：**
- [ ] 命名不规范（变量、方法、类名）
- [ ] 缺少注释（复杂逻辑无注释）
- [ ] 异常处理不规范（捕获 Exception）
- [ ] 日志级别不当（ERROR 级别记录正常信息）

**业务角度：**
- [ ] 业务逻辑不完整（缺少必要步骤）
- [ ] 边界条件未处理（空值、边界值）
- [ ] 数据校验不足（参数验证缺失）
- [ ] 状态机错误（非法状态转换）

### 重点审查对象

**Service 类：**
- 每个方法的业务逻辑是否完整？
- 事务注解是否正确？
- 异常处理是否规范？
- 日志记录是否充分？
- 是否有性能问题（N+1、深分页）？

**Controller 类：**
- 参数验证是否充分？
- 权限检查是否存在？
- 异常处理是否完整？
- 返回值是否合理？
- 是否有安全风险（SQL注入、XSS）？

**Repository/Mapper 类：**
- SQL 是否有注入风险？
- 查询条件是否完整？
- 是否有 N+1 问题？
- 批量操作是否优化？

## 参考模板
- 规则定义：@references/review-rules.json
- 扫描模式：@.claude/skills/code-review/templates/scan-modes.md
- 文件收集：@.claude/skills/code-review/templates/file-collection-strategy.md
