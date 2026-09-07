---
name: |
  std-bug-fixer
description: |
  Bug修复分析技能（增强版）- 从TFS获取Bug列表并进行分析，提供代码定位、修复建议和工作量估算。
  支持从TFS查询列表URL或单个Bug ID进行分析，自动分批获取大量Bug，生成详细的分析报告。
  新增功能：代码仓库映射、代码搜索定位、详细修复建议（含代码示例）、AI自动修复。
  触发关键词：bug、Bug、BUG、缺陷、问题、修复、fix、代码定位、修复建议、AI修复。
  使用方式：
  - "分析Bug 12345"
  - "从查询URL获取Bug列表并定位代码"
  - "批量分析Bug并生成修复建议"
  - "AI自动修复Bug 12345"
---

# Bug Fixer - Bug修复分析技能（增强版）

本技能提供TFS Bug的获取、分析、代码定位和详细修复建议功能。

## 🎯 功能概述

### 核心功能

1. **从TFS查询列表获取Bug**
   - 支持TFS查询列表URL
   - 自动解析集合和项目信息
   - 支持分批获取（超过200条时）

2. **单个Bug分析**
   - 根据Bug ID获取详情
   - 智能分析Bug类型
   - 提供修复建议

3. **批量Bug分析**
   - 支持批量分析多个Bug
   - 生成统计报告
   - 工作量估算

4. **代码仓库映射** ✨新增
   - 自动将Bug映射到本地代码仓库
   - 支持多种匹配策略（精确匹配、模糊匹配、关键词匹配）
   - 验证文件路径是否存在

5. **代码搜索定位** ✨新增
   - 从堆栈跟踪推断代码位置
   - 使用ripgrep/grep搜索相关代码
   - 提取代码上下文

6. **详细修复建议** ✨新增
   - 基于Bug类型生成修复方案
   - 提供修复前后代码对比
   - 包含测试建议和预防措施

7. **报告生成**
   - Markdown格式报告（含代码片段）
   - Excel格式报告
   - 修复优先级建议

## 🔧 使用方式

### 方式1: 从TFS查询列表URL获取Bug（基础模式）

```
用户输入: "分析这个查询列表里的Bug: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Public%20Query/_workitems?id=xxx&_a=query"
```

```
用户输入: "分析这个查询列表里的Bug: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Public%20Query/_workitems?id=xxx&_a=query"
```

**执行流程**:

1. **解析URL**
   ```
   URL解析结果:
     集合: WINNING-6.0
     查询ID: xxx
     项目: Public Query
   ```

2. **切换集合并执行查询**
   - 自动切换到指定集合
   - 使用WIQL查询获取Bug ID列表
   - 显示找到的Bug数量

3. **分批获取Bug详情**
   ```
   找到 250 个Bug

   开始批量获取 Bug...
   批次大小: 100

   [批次 1/3] 获取 100 个Bug...
     ✓ 成功获取 100 个Bug
   [批次 2/3] 获取 100 个Bug...
     ✓ 成功获取 100 个Bug
   [批次 3/3] 获取 50 个Bug...
     ✓ 成功获取 50 个Bug

   批量获取完成，共获取 250 个Bug
   ```

4. **分析Bug并生成报告**
   ```
   开始分析Bug...
   进度: 250/250 (100.0%)
   分析完成，耗时: 45.2秒

   报告已保存: ./reports/bug-fix-report_20260227150430.md
   ```

### 方式2: 分析单个Bug

```
用户输入: "分析Bug 12345"
```

**执行流程**:

1. **获取Bug详情**
   ```
   获取Bug: 12345 - 系统登录后显示空白页面
   ```

2. **分析Bug**
   ```
   开始分析Bug...
   分析完成，耗时: 0.5秒
   ```

3. **生成报告**
   ```
   # Bug分析报告

   ## 基本信息
   - Bug ID: 12345
   - 标题: 系统登录后显示空白页面
   - 状态: Active
   - 优先级: P1
   - 类别: UI问题
   - 风险等级: HIGH
   - 估算工时: 3小时 (中等)

   ## 修复建议
   1. 检查前端路由配置
   2. 检查登录后的页面加载逻辑
   3. 查看浏览器控制台错误信息
   4. 检查后端返回的数据格式
   ```

### 方式3: 从已保存的Bug文件分析

```
用户输入: "分析这个Bug列表文件: ./bugs-cache.json"
```

### 方式4: 启用代码定位和修复建议（增强模式）✨

```
用户输入: "分析这个查询列表里的Bug并定位代码: http://tfs2018-web...query"
```

**前提条件**：
1. 运行 `node tools/main.mjs init-config` 初始化配置模板
2. 编辑 `config/code-repositories.json` 配置本地仓库路径
3. 添加 `--enable-code-location` 和 `--enable-fix-suggestions` 选项

**执行流程**（增强模式）：

1. **初始化代码仓库映射**
   ```
   初始化代码定位模块...
   ✓ 已加载 3 个仓库配置
   ```

2. **分析Bug并定位代码**
   ```
   开始分析Bug...
   进度: 50/50 (100.0%)
   分析完成，耗时: 52.3秒
   ✓ 成功定位代码: 42/50
   ```

3. **生成增强报告**
   ```
   ## 代码位置
   - **仓库**: HIS系统
   - **本地路径**: `D:/Coding/his-system`
   - **匹配分数**: 150
   - **匹配原因**: TFS项目匹配: HIS

   **已验证的文件**:
   - `D:/Coding/his-system/src/main/java/com/winning/his/controller/PatientController.java`

   **代码上下文**:
   ```java
   文件: src/main/java/com/winning/his/controller/PatientController.java
   行号: 125

   public Patient savePatient(@RequestBody PatientDTO dto) {
       Patient patient = new Patient();
       patient.setName(dto.getName());  // ❌ 可能为null
       return patientService.save(patient);
   }
   ```

   ## 详细修复建议
   - **Bug类型**: 空指针异常
   - **严重程度**: HIGH
   - **问题摘要**: 检测到空指针异常，可能是在使用对象前未进行空值检查

   **可能原因**:
   - 对象引用未初始化
   - 方法返回了null值但未检查

   **解决方案**:
   - 在使用对象前进行空值检查
   - 使用 Optional 类包装可能为null的值
   - 为参数提供合理的默认值

   **代码示例**:

   **修复方案1：显式空值检查**:
   ```java
   public Patient savePatient(@RequestBody PatientDTO dto) {
       // ✅ 添加空值检查
       if (dto == null || dto.getName() == null) {
           throw new IllegalArgumentException("患者信息不能为空");
       }
       Patient patient = new Patient();
       patient.setName(dto.getName());
       return patientService.save(patient);
   }
   ```
   ```

## 📋 Bug分析规则

本技能内置了多种Bug类型的识别规则：

### 代码质量问题

| 规则 | 识别模式 | 严重程度 |
|------|----------|----------|
| NULL_POINTER | NullPointerException, null pointer | HIGH |
| INDEX_OUT_OF_BOUNDS | IndexOutOfBounds, array index | HIGH |
| TYPE_CONVERSION | ClassCastException, type conversion | MEDIUM |

### 安全漏洞

| 规则 | 识别模式 | 严重程度 |
|------|----------|----------|
| SQL_INJECTION | SQL injection, SQL syntax | CRITICAL |
| XSS_VULNERABILITY | XSS, cross-site scripting | CRITICAL |

### 并发问题

| 规则 | 识别模式 | 严重程度 |
|------|----------|----------|
| CONCURRENCY | ConcurrentModification, race condition | HIGH |

### 性能问题

| 规则 | 识别模式 | 严重程度 |
|------|----------|----------|
| RESOURCE_LEAK | resource leak, file not closed | HIGH |
| PERFORMANCE | slow, timeout, performance | MEDIUM |

## 📊 报告格式

### Markdown报告

```markdown
# Bug修复分析报告

## 📋 报告信息

- **生成时间**: 2026-02-27 15:04:30
- **数据来源**: TFS查询
- **Bug数量**: 250个
- **TFS集合**: WINNING-6.0
- **查询URL**: http://...

## 📊 统计概览

### 按类别分组

| 类别 | 数量 | 占比 |
|------|------|------|
| 代码质量 | 85 | 34.0% |
| 性能问题 | 62 | 24.8% |
| 业务逻辑 | 45 | 18.0% |
| 安全漏洞 | 18 | 7.2% |

### 风险等级分布

| 风险等级 | 数量 | 占比 |
|----------|------|------|
| 🔴 CRITICAL | 8 | 3.2% |
| 🟠 HIGH | 45 | 18.0% |
| 🟡 MEDIUM | 125 | 50.0% |
| 🟢 LOW | 72 | 28.8% |

### 工作量估算

- **总工时**: 620 小时
- **平均工时**: 2.5 小时/Bug
- **简单Bug**: 72个
- **中等Bug**: 125个
- **复杂Bug**: 53个

## 📋 Bug详细分析

### 代码质量

#### 🟠 [12345] 系统登录后显示空白页面

**基本信息**
- **状态**: Active
- **优先级**: P1
- **严重程度**: High
- **分配给**: 张三
- **创建时间**: 2026-02-20
- **有堆栈跟踪**: ✓

**分析结果**
- **类别**: 代码质量
- **风险等级**: 🟠 HIGH
- **估算工时**: 3小时 (中等)

**修复建议**
1. 检查前端路由配置是否正确
2. 检查登录后的页面加载逻辑
3. 查看浏览器控制台错误信息
4. 检查后端返回的数据格式

**代码位置**
| 类名 | 方法 | 文件 | 行号 |
|------|------|------|------|
| LoginController | loginSuccess | LoginController.java | 125 |
| MainView | initialize | MainView.vue | 45 |

## 🎯 修复优先级建议

建议按以下优先级修复Bug：

### P0 - 8个
- [1001] SQL注入漏洞 (~8h)
- [1002] XSS攻击漏洞 (~8h)
- [1003] 死锁问题 (~6h)
...

### P1 - 45个
- [12345] 系统登录后显示空白页面 (~3h)
- [12346] 数据保存失败 (~4h)
...

## 📝 修复模板

### 通用修复流程

1. **复现问题** - 根据Bug描述复现问题
2. **定位代码** - 使用堆栈跟踪或日志定位问题代码
3. **编写测试** - 先编写失败的单元测试
4. **修复代码** - 修复问题使测试通过
5. **验证修复** - 运行所有测试确保没有引入新问题
6. **代码审查** - 提交代码进行审查

### 代码质量修复模板

**适用Bug**:
- [12345] 空指针异常
- [12346] 数组越界
- [12347] 类型转换错误

**通用修复步骤**:
- 在使用对象前进行空值检查
- 在访问数组/列表前检查索引范围
- 使用instanceof检查类型
```

## ⚙️ 配置文件

### TFS配置（共享）

TFS认证配置存储在 `../tfs2018-integration/config/tfs-config.json`，本技能会自动读取该配置。

### 代码仓库映射配置 ✨新增

配置文件位置: `config/code-repositories.json`

**初始化配置**：
```bash
node tools/main.mjs init-config
```

**配置示例**：
```json
{
  "_comment": "代码仓库映射配置文件",
  "repositories": [
    {
      "name": "HIS系统",
      "localPath": "D:/Coding/his-system",
      "tfsProject": "HIS",
      "areaMapping": {
        "患者管理": "patient-management",
        "药品管理": "medicine-management"
      },
      "moduleKeywords": ["患者", "药品", "医嘱"],
      "techStack": ["java", "vue"],
      "basePackage": "com.winning.his",
      "pathPatterns": ["com/winning/his"],
      "type": "java"
    }
  ]
}
```

**配置项说明**：
- `name`: 仓库名称（用于显示）
- `localPath`: 本地代码仓库的绝对路径
- `tfsProject`: TFS项目名称（精确匹配）
- `areaMapping`: TFS AreaPath 到本地模块的映射
- `moduleKeywords`: 模块关键词列表（模糊匹配）
- `techStack`: 技术栈标签（java, javascript, python等）
- `basePackage`: Java基础包名
- `pathPatterns`: 代码路径模式
- `type`: 仓库类型

### Bug分析配置

配置文件位置: `config/bug-fixer-config.json`

```json
{
  "analysis": {
    "batchSize": 100,
    "maxConcurrentAnalysis": 3,
    "defaultMaxBugs": null,
    "enableCodeLocation": false,
    "enableFixSuggestions": false
  },
  "reports": {
    "outputDir": "./reports",
    "defaultFormat": "markdown"
  }
}
```

## 🔧 集成TFS 2018 Integration Skill

本技能依赖于 `tfs2018-integration` skill，共享其TFS客户端和配置。

### 共享配置

TFS认证配置存储在 `../tfs2018-integration/config/tfs-config.json`，本技能会自动读取该配置。

### 集合管理

本技能支持与 `tfs2018-integration` 相同的集合：
- WINNING-6.0 - 主集合
- WN_PH-Platform - 公共卫生平台集合
- WN_TECH - 技术平台集合
- wn_his - HIS产品集合

## 🛠️ 工具文件

| 文件 | 说明 |
|------|------|
| `tools/tfs-bug-client.mjs` | TFS Bug客户端 |
| `tools/bug-analyzer.mjs` | Bug分析器（增强版） |
| `tools/report-generator.mjs` | 报告生成器（增强版） |
| `tools/main.mjs` | 主入口（增强版） |
| `tools/code-repository-mapper.mjs` | ✨ 代码仓库映射模块 |
| `tools/code-searcher.mjs` | ✨ 代码搜索工具 |
| `tools/fix-suggestion-generator.mjs` | ✨ 修复建议生成器 |
| `config/code-repositories.template.json` | ✨ 仓库配置模板 |

## 📝 注意事项

### 基础功能

1. **分批获取**: 当Bug数量超过200条时，自动分批获取，每批100条
2. **Token限制**: 分析大量Bug时注意token消耗，建议分批处理
3. **报告保存**: 报告默认保存在 `./reports/` 目录
4. **Excel报告**: 需要安装 `xlsx` 库：`npm install xlsx`
5. **TFS限制**: TFS 2018的WIQL查询可能有限制，建议使用分页查询

### 增强功能

6. **代码定位要求**:
   - 需要配置 `config/code-repositories.json`
   - 需要本地代码仓库可访问
   - 匹配依赖TFS项目名、AreaPath或关键词

7. **代码搜索要求**:
   - 需要安装 ripgrep（推荐）或使用系统 grep
   - Windows: `choco install ripgrep`
   - macOS: `brew install ripgrep`
   - Linux: `apt install ripgrep` 或 `yum install ripgrep`

8. **修复建议生成**:
   - 依赖代码定位功能
   - 支持的Bug类型：空指针、SQL注入、XSS、数组越界等10种
   - 代码示例根据Bug类型自动生成

9. **性能考虑**:
   - 代码搜索会增加分析时间
   - 大量Bug建议分批分析
   - 可以只启用代码定位而不启用修复建议以提高速度

## 🎯 使用示例

### 基础功能

```bash
# 从查询URL获取Bug
node tools/main.mjs query "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Public%20Query/_workitems?id=xxx&_a=query"

# 限制获取数量
node tools/main.mjs query "查询URL" --max 50

# 分析单个Bug
node tools/main.mjs bug 12345

# 生成Excel报告
node tools/main.mjs query "查询URL" --format excel --output report.xlsx

# 保存Bug列表
node tools/main.mjs query "查询URL" --save-bugs
```

### 增强功能 ✨

```bash
# 初始化配置模板（首次使用）
node tools/main.mjs init-config

# 启用代码定位
node tools/main.mjs query "查询URL" --enable-code-location

# 启用详细修复建议
node tools/main.mjs query "查询URL" --enable-code-location --enable-fix-suggestions

# 分析单个Bug并定位代码
node tools/main.mjs bug 12345 --enable-code-location --enable-fix-suggestions

# 从已保存的文件分析（含代码定位）
node tools/main.mjs analyze ./bugs-cache.json --enable-fix-suggestions

# 使用自定义配置文件
node tools/main.mjs query "查询URL" --enable-code-location --repo-config /path/to/custom-config.json
```

### 配置流程

1. **初始化配置**
   ```bash
   node tools/main.mjs init-config
   ```

2. **编辑配置文件**
   编辑 `config/code-repositories.template.json`：
   - 设置 `localPath` 为本地代码仓库路径
   - 配置 `tfsProject` 映射关系
   - 添加 `moduleKeywords` 关键词
   - 保存为 `config/code-repositories.json`

3. **运行增强分析**
   ```bash
   node tools/main.mjs query "查询URL" --enable-code-location --enable-fix-suggestions
   ```
