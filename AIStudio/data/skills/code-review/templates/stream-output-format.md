# 流式文件输出模式格式示例

## 摘要输出格式（Claude 最后返回的 JSON）

```json
{
  "output_mode": "stream_files",
  "total_batches": 240,
  "batch_files": [
    ".claude/tmp/batch_001.json",
    ".claude/tmp/batch_002.json",
    ".claude/tmp/batch_003.json",
    "...",
    ".claude/tmp/batch_240.json"
  ],
  "total_files_assigned": 12000,
  "total_files_scanned": 11850,
  "total_issues": 600,
  "scan_timestamp": "2026-01-20T10:30:00Z",
  "scan_duration_seconds": 3600,
  "summary": {
    "by_severity": {
      "严重": 120,
      "警告": 300,
      "提示": 150,
      "信息": 30
    },
    "by_category": {
      "安全规范": 150,
      "性能规范": 120,
      "语法规范": 180,
      "工程规范": 100,
      "框架规范": 30,
      "业务规范": 15,
      "架构规范": 5
    }
  }
}
```

## 批次文件格式（.claude/tmp/batch_XXX.json）

```json
{
  "batch_id": 1,
  "batch_number": 1,
  "total_batches": 240,
  "files_assigned": 50,
  "files_scanned": 48,
  "scan_timestamp": "2026-01-20T10:30:00Z",
  "vulnerabilities": [
    {
      "checkpoint_id": "SEC-B001-1",
      "severity": "严重",
      "file": "src/main/java/Example.java",
      "line": 81,
      "description": "SQL注入风险 - 字符串拼接构建SQL语句",
      "category": "安全规范",
      "code_snippet": "79:     String sql = \"SELECT * FROM users WHERE id = \" + userId;\n80: >>>     Statement stmt = conn.createStatement();\n81: >>>     ResultSet rs = stmt.executeQuery(sql);"
    }
  ],
  "quality_issues": [
    {
      "checkpoint_id": "SYN-B004-1",
      "severity": "警告",
      "file": "src/main/java/Example.java",
      "line": 40,
      "description": "变量命名不规范 - hHS命名不符合驼峰命名规范",
      "category": "语法规范",
      "code_snippet": "39: private void process(HttpHeaders hHS) {\n40: >>>     hHS = exchange.getRequest().getHeaders();\n41: }"
    }
  ],
  "batch_summary": {
    "total_issues": 5,
    "by_severity": {
      "严重": 2,
      "警告": 3
    },
    "by_category": {
      "安全规范": 3,
      "语法规范": 2
    }
  }
}
```

## 完整输出格式示例（标准模式）

```json
{
  "scan_time": "2026-01-19T10:30:00Z",
  "scan_mode": "initial",
  "scan_type": "full",
  "files_scanned": 15,
  "vulnerabilities": [
    {
      "checkpoint_id": "QUAL-B011-6",
      "severity": "警告",
      "file": "src/main/java/com/example/Example.java",
      "line": 81,
      "description": "null调用风险 - findFirst().get()可能抛出NoSuchElementException",
      "category": "代码质量",
      "code_snippet": "80:     .filter(i -> i.getId().equals(id))\n81: >>>     .findFirst().get();\n82: }"
    }
  ],
  "quality_issues": [
    {
      "checkpoint_id": "SYN-B004-1",
      "severity": "警告",
      "file": "src/main/java/com/example/Example.java",
      "line": 40,
      "description": "变量命名不规范 - hHS命名不符合驼峰命名规范",
      "category": "语法规范",
      "code_snippet": "39: private void process(HttpHeaders hHS) {\n40: >>>     hHS = exchange.getRequest().getHeaders();\n41: }"
    }
  ],
  "summary": {
    "total_issues": 12,
    "by_severity": {
      "严重": 2,
      "警告": 8,
      "提示": 2
    },
    "by_category": {
      "代码质量": 9,
      "性能规范": 1,
      "语法规范": 1,
      "工程规范": 1
    },
    "files_with_issues": 8
  },
  "fix_solutions": [
    {
      "rule_id": "QUAL-B011-6",
      "rule_name": "null调用风险",
      "severity": "警告",
      "issue_count": 1,
      "affected_files": ["src/main/java/com/example/Example.java"],
      "fix_steps": [
        "1. 使用 findFirst().orElse(null) 替代 findFirst().get()",
        "2. 添加 null 检查，避免空指针异常",
        "3. 使用日志框架记录未找到实例的情况"
      ],
      "code_example": "ServiceInstance instance = list.stream()\n    .filter(i -> i.getId().equals(id))\n    .findFirst().orElse(null);\nif (instance == null) {\n    LOGGER.warn(\"未找到实例: {}\", id);\n    return Mono.empty();\n}",
      "rationale": "直接调用 get() 会抛出 NoSuchElementException，使用 orElse(null) 可以提供默认值，避免异常导致程序中断。"
    },
    {
      "rule_id": "QUAL-B011-4",
      "rule_name": "使用printStackTrace",
      "severity": "严重",
      "issue_count": 2,
      "affected_files": [
        "src/main/java/com/example/RouteController.java",
        "src/main/java/com/example/DynamicRouteServiceImpl.java"
      ],
      "fix_steps": [
        "1. 删除所有 e.printStackTrace() 调用",
        "2. 使用日志框架记录异常：LOGGER.error(\"操作失败\", e)",
        "3. 确保日志中包含必要的上下文信息"
      ],
      "code_example": "} catch (Exception e) {\n    LOGGER.error(\"删除路由失败, routeId: {}\", routeId, e);\n    return \"delete fail\";\n}",
      "rationale": "printStackTrace 输出到标准错误流，不利于日志集中管理。使用日志框架可以统一格式，便于日志收集和告警。"
    }
  ]
}
```

## 批次文件与标准格式字段映射

| 字段 | 批次文件 | 标准格式 | 说明 |
|------|---------|---------|------|
| 规则ID | `checkpoint_id` | `checkpoint_id` | 一致 |
| 文件路径 | `file` | `file` | 一致 |
| 行号 | `line` | `line` | 一致 |
| 严重级别 | `severity` | `severity` | 一致 |
| 问题描述 | `description` | `description` | 一致 |
| 问题类别 | `category` | `category` | 一致 |
| 代码片段 | `code_snippet` | `code_snippet` | 一致 |

## 字段要求

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

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| checkpoint_id | string | ✅ | 规则检查点 ID（如 QUAL-B011-6） |
| severity | string | ✅ | 严重级别：严重/警告/提示/信息 |
| file | string | ✅ | 文件路径 |
| line | number | ✅ | 行号 |
| description | string | ✅ | 问题描述 |
| category | string | ✅ | 问题类别（代码质量/性能规范等） |
| code_snippet | string | ✅ | 代码上下文（行号: 内容，问题行用 >>> 标记） |

### code_snippet 格式要求

> ⚠️ **重要**：code_snippet 字段格式错误会导致报告表格中的"代码"列显示为空！

**必须包含代码上下文（问题行前后各1行，共3行）**：
- **重要**: 必须包含所有行，包括空行，保持行号连续性
- 格式: `"行号: 代码内容"` 用 `\n` 连接
- 问题行用 `>>>` 标记
- **字段名必须是 `code_snippet`，禁止使用 `code_example`**（code_example 仅用于 fix_solutions）

**正确** ✅：
```json
{
  "code_snippet": "66: } catch (Exception e) {\n67:\n68: >>> e.printStackTrace();\n69: }"
}
```

**错误** ❌：
```json
{
  "code_example": "e.printStackTrace();"
}
```
（问题：缺少行号、缺少上下文、字段名错误）

**错误** ❌：
```json
{
  "code_snippet": "66: } catch (Exception e) {\n68: >>> e.printStackTrace();"
}
```
（问题：跳过了第67行，行号不连续）

---


### fix_solutions 字段（重要）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| rule_id | string | ✅ | 规则 ID（如 QUAL-B011-6） |
| rule_name | string | ✅ | 规则名称（如"null调用风险"） |
| severity | string | ✅ | 级别：严重/警告/提示/信息 |
| issue_count | number | ✅ | 该规则触发的问题总数 |
| affected_files | array | ✅ | 受影响的文件路径列表 |
| fix_steps | array | ✅ | 修复步骤列表（使用序号） |
| code_example | string | ✅ | 修复后的代码示例 |
| rationale | string | ✅ | 修复原理说明 |

#### 5. code_example 格式要求

- 必须是实际可执行的代码
- 包含必要的上下文（变量声明、导入语句等）
- 使用注释说明关键点
- 语言要与被审查代码一致（Java/Groovy/Python）

#### 示例: 问题的修复方案

```json
{
  "rule_id": "QUAL-B011-4",
  "rule_name": "使用printStackTrace",
  "severity": "高危",
  "issue_count": 2,
  "affected_files": [
    "src/main/java/com/winning/cloud/gateway/route/DynamicRouteServiceImpl.java",
    "src/main/java/com/winning/cloud/gateway/controller/RouteController.java"
  ],
  "fix_steps": [
    "1. 删除所有 e.printStackTrace() 调用",
    "2. 使用日志框架记录异常，例如：LOGGER.error(\"操作失败\", e)",
    "3. 确保日志中包含必要的上下文信息以便问题排查",
    "4. 验证日志输出正常且包含异常堆栈信息"
  ],
  "code_example": "catch (Exception e) {\n    LOGGER.error(\"删除路由失败, routeId: {}\", routeId, e);\n    return \"delete fail\";\n}",
  "rationale": "printStackTrace 输出到标准错误流，不利于日志集中管理和问题追踪。使用日志框架可以统一日志格式，便于日志收集和分析系统进行监控和告警。"
}
```