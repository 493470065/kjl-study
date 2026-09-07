# JSON 输出格式规范

## 🚨 输出格式（最高优先级）

**核心要求：直接输出纯 JSON，不要任何前缀、说明或 Markdown 标记**

- ✅ **直接输出纯 JSON** 第一个字符必须是 `{`，最后一个字符必须是 `}`
- ❌ 禁止任何自然语言前缀（如"扫描完成"、"结果如下"、"基于规则分析"、"让我输出JSON"）
- ❌ 禁止 Markdown 代码块标记（```json）
- ❌ 禁止任何标题、列表、表格、加粗等 Markdown 格式

---

## JSON 输出模板

```json
{
  "scan_time": "2026-01-15T10:00:00",
  "scan_mode": "initial|incremental",
  "project_name": "项目名称",
  "base_commit": "abc123",
  "head_commit": "def456",
  "files_scanned": 150,
  "files_skipped": 20,
  "batches_executed": 1,
  "duration": 45,
  "lines_analyzed": 15000,
  "vulnerabilities": [
    {
      "type": "sql_injection",
      "severity": "critical",
      "confidence": 0.9,
      "file_path": "src/main/java/Example.java",
      "line_number": 42,
      "rule_id": "SEC-B003",
      "message": "用户输入直接拼接到 SQL 查询中",
      "cwe_id": "CWE-89",
      "recommendation": "使用参数化查询或 ORM",
      "code_snippet": "41: String sql = ...;\n42: >>> rs = stmt.executeQuery(sql);\n43: if (rs.next())"
    }
  ],
  "quality_issues": [
    {
      "type": "empty_catch",
      "severity": "low",
      "category": "代码质量",
      "file_path": "src/Service.java",
      "line_number": 15,
      "rule_id": "QUAL-B011-2",
      "message": "空catch块",
      "recommendation": "至少记录异常日志",
      "code_snippet": "14: } catch (Exception e) {\n15: >>> }\n16: return null;"
    }
  ],
  "summary": {
    "total_vulnerabilities": 8,
    "total_quality_issues": 12,
    "critical_count": 2,
    "high_count": 5,
    "medium_count": 10,
    "low_count": 3,
    "info_count": 0
  },
  "fix_solutions": [
    {
      "rule_id": "PERF-B007",
      "rule_name": "下游调用超时配置规范",
      "severity": "高危",
      "issue_count": 5,
      "affected_files": ["File1.java", "File2.java"],
      "fix_steps": [
        "1. 在 Feign Client 配置中添加超时设置",
        "2. 设置连接超时（connectTimeout）为 5 秒",
        "3. 设置读取超时（readTimeout）为 30 秒",
        "4. 验证超时配置生效（添加日志或单元测试）"
      ],
      "code_example": "// 配置示例\nFeignClient.builder()\n    .options(new Request.Options(5_000, 30_000))\n    .build();",
      "rationale": "设置超时可以防止长时间阻塞，保护系统稳定性。连接超时防止连接建立阶段无限等待，读取超时防止数据传输阶段长时间挂起。"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `scan_time` | string | ✅ | 扫描时间（ISO8601） |
| `scan_mode` | string | ✅ | initial/incremental |
| `files_scanned` | number | ✅ | 扫描文件数 |
| `code_snippet` | string | ✅ | 代码上下文（问题行前后各1行，共3行） |
| `fix_solutions` | array | ✅ | **修复方案列表（必须字段）** |

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

## fix_solutions 字段规则

### 🔴 必须要求

**fix_solutions 是必须字段，不能省略！**

即使没有问题需要修复，也必须返回空数组：
```json
{
  "fix_solutions": []
}
```

### 生成规则

#### 1. 按问题级别决定是否生成修复方案

| 问题级别         | 是否必须生成修复方案 | 说明              |
|--------------|-------------------|-----------------|
| 高危（critical） | ✅ **必须生成** | 必须为每个高危问题生成修复方案 |
| 中危（medium）   | ⚠️ 建议生成 | 建议生成，但可以省略      |
| 低危（low）      | ⚠️ 建议生成 | 建议生成，但可以省略      |
| 信息（info）     | ❌ 不需要 | 不生成修复方案         |

#### 2. 按规则 ID 分组

- **每个规则 ID 生成一个修复方案**（不要将相同规则的问题合并）
- 例如：QUAL-B011-4 出现 3 次，只生成 1 个修复方案，但 `issue_count` = 3
- `affected_files` 列出所有受影响的文件

#### 3. 修复方案内容要求

每个修复方案必须包含以下字段：

| 字段 | 类型 | 必填 | 说明                  |
|------|------|------|---------------------|
| `rule_id` | string | ✅ | 规则 ID，例如 "QUAL-B011-4" |
| `rule_name` | string | ✅ | 规则名称，例如 "使用printStackTrace" |
| `severity` | string | ✅ | 级别：高危/中危            |
| `issue_count` | number | ✅ | 该规则触发的问题总数          |
| `affected_files` | array | ✅ | 受影响的文件路径列表          |
| `fix_steps` | array | ✅ | 修复步骤列表（使用序号）        |
| `code_example` | string | ✅ | 修复后的代码示例            |
| `rationale` | string | ✅ | 修复原理说明              |

#### 4. fix_steps 格式要求

**必须使用序号列表格式**：
```json
"fix_steps": [
  "1. 第一步操作",
  "2. 第二步操作",
  "3. 第三步操作"
]
```

**要求**：
- 每个步骤以序号开头（1. 2. 3. ...）
- 步骤要具体可执行
- 最多 5 个步骤

#### 5. code_example 格式要求

- 必须是实际可执行的代码
- 包含必要的上下文（变量声明、导入语句等）
- 使用注释说明关键点
- 语言要与被审查代码一致（Java/Groovy/Python）

### 示例

#### 示例 1: 高危问题的修复方案

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

#### 示例 2: 中危问题的修复方案

```json
{
  "rule_id": "QUAL-B011-6",
  "rule_name": "null调用风险",
  "severity": "中危",
  "issue_count": 1,
  "affected_files": [
    "src/main/java/com/winning/cloud/gateway/loadbalancer/ConsistentHashLoadBalancer.java"
  ],
  "fix_steps": [
    "1. 使用 isPresent() 检查 Optional 是否为空",
    "2. 使用 orElse(null) 或 orElseThrow() 提供默认值",
    "3. 如果不需要 null 值，使用 orElseThrow() 抛出异常"
  ],
  "code_example": "ServiceInstance instance = allServerList.stream()\n    .filter(i -> i.getInstanceId().equals(serverInstanceId))\n    .findFirst()\n    .orElse(null);\n\n// 或者抛出异常\nServiceInstance instance = allServerList.stream()\n    .filter(i -> i.getInstanceId().equals(serverInstanceId))\n    .findFirst()\n    .orElseThrow(() -> new IllegalStateException(\"Server not found: \" + serverInstanceId + \"\"));",
  "rationale": "未检查 Optional 是否为空直接调用 get() 会抛出 NoSuchElementException。使用 isPresent() 检查或 orElse() 提供默认值可以避免空指针异常。"
}
```

#### 示例 3: 空修复方案（没有问题）

```json
{
  "fix_solutions": []
}
```

### 常见错误

❌ **错误 1: 省略 fix_solutions 字段**
```json
{
  "vulnerabilities": [...],
  "quality_issues": [...]
  // ❌ 缺少 fix_solutions 字段
}
```

❌ **错误 2: fix_solutions 为 null**
```json
{
  "fix_solutions": null  // ❌ 应该是 []
}
```

❌ **错误 3: 修复方案缺少必需字段**
```json
{
  "fix_solutions": [
    {
      "rule_id": "QUAL-B011-4"
      // ❌ 缺少 rule_name, severity, fix_steps 等字段
    }
  ]
}
```

✅ **正确格式**
```json
{
  "fix_solutions": [
    {
      "rule_id": "QUAL-B011-4",
      "rule_name": "使用printStackTrace",
      "severity": "高危",
      "issue_count": 1,
      "affected_files": ["File.java"],
      "fix_steps": ["1. 步骤1", "2. 步骤2"],
      "code_example": "// 代码示例",
      "rationale": "修复原理"
    }
  ]
}
```
