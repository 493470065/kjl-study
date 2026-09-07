# 需求覆盖率分析器 - SKILL统计特征标记集成指南

## 📋 集成方案

本指南说明如何给 `requirement-coverage-analyzer` 添加统计特征标记，使 SKILL使用追踪器能够检测到它的使用。

## 🎯 三种检测方式

### 方式1：文件名标记（推荐）

**位置**: `report-generator.mjs` 第307-330行

修改 `generateMarkdownReport` 函数中的文件名生成逻辑：

```javascript
// 导入增强模块
import { generateMarkedReportFilename } from './skill-tracking-enhancement.mjs';

// 原代码（第327-330行）：
const reportPath = path.join(
  reportsDir,
  `requirement-coverage-${data.requirementId}-${timestamp}.md`
);

// 修改为：
const reportPath = path.join(
  reportsDir,
  generateMarkedReportFilename(data.requirementId, now, data.score)
);
```

**效果**: 生成的文件名格式为 `requirement-coverage-analysis-123456-score75-20260227123456.md`

---

### 方式2：报告元数据标记

**位置**: `report-generator.mjs` 第389行 `buildMarkdownContent` 函数开头

在报告内容开头添加隐藏的元数据：

```javascript
// 导入增强模块
import { generateTrackingMetadata } from './skill-tracking-enhancement.mjs';

function buildMarkdownContent(data) {
  const sections = [];

  // 在文件开头添加SKILL追踪元数据
  sections.push(generateTrackingMetadata(data));

  // 原有的标题代码
  sections.push('# 需求覆盖率分析报告\n');
  // ...其余代码保持不变
}
```

**效果**: 报告文件开头会添加：
```html
<!-- SKILL-TRACKING-METADATA: {"skill_id":"requirement-coverage-analyzer","requirement_id":"123456","score":75} -->
```

---

### 方式3：报告末尾追踪信息块

**位置**: `report-generator.mjs` `buildMarkdownContent` 函数末尾

在报告内容末尾添加追踪信息：

```javascript
// 导入增强模块
import { generateTrackingReportBlock } from './skill-tracking-enhancement.mjs';

function buildMarkdownContent(data) {
  // ... 所有原有代码 ...

  // 在函数末尾，return sections.join('\n') 之前添加：
  sections.push(generateTrackingReportBlock(data));

  return sections.join('\n');
}
```

---

### 方式4：终端输出提示

**位置**: `main.mjs` 第1730-1738行

在报告生成后输出追踪提示：

```javascript
// 导入增强模块
import { printSkillTrackingHintWithTFS } from './skill-tracking-enhancement.mjs';

// 原代码（第1730-1738行）：
console.log(`\n生成报告...`);
generateConsoleReport(result, config);

try {
  const reportPath = await generateMarkdownReport(result, config);
  console.log(`\n报告已保存: ${reportPath}`);
} catch (error) {
  console.error(`警告: 无法保存报告文件 - ${error.message}`);
}

// 修改为：
console.log(`\n生成报告...`);
generateConsoleReport(result, config);

try {
  const reportPath = await generateMarkdownReport(result, config);
  console.log(`\n报告已保存: ${reportPath}`);

  // 添加SKILL追踪提示
  printSkillTrackingHintWithTFS(result, reportPath);
} catch (error) {
  console.error(`警告: 无法保存报告文件 - ${error.message}`);
}
```

---

## 🔧 快速应用补丁

创建补丁文件 `skill-tracking.patch`：

```diff
--- a/tools/report-generator.mjs
+++ b/tools/report-generator.mjs
@@ -1,5 +1,7 @@
 import fs from 'fs/promises';
 import path from 'path';
+import {
+  generateMarkedReportFilename,
+  generateTrackingMetadata,
+  generateTrackingReportBlock
+} from './skill-tracking-enhancement.mjs';
 import { fileURLToPath } from 'url';

@@ -304,6 +306,10 @@ export async function generateMarkdownReport(data, config) {
   const reportPath = path.join(
     reportsDir,
-    `requirement-coverage-${data.requirementId}-${timestamp}.md`
+    generateMarkedReportFilename(data.requirementId, now, data.score)
   );

   const content = buildMarkdownContent(data);

@@ -389,6 +395,9 @@ function buildMarkdownContent(data) {
 function buildMarkdownContent(data) {
   const sections = [];

+  // 添加SKILL追踪元数据
+  sections.push(generateTrackingMetadata(data));
+
   // 标题
   sections.push('# 需求覆盖率分析报告\n');

@@ -1090,6 +1099,10 @@ function buildMarkdownContent(data) {
   }
   sections.push('---');
   sections.push('');

+  // 添加SKILL追踪信息块
+  sections.push(generateTrackingReportBlock(data));
+
   return sections.join('\n');
 }
```

---

## 📊 追踪器配置更新

在 `skill-usage-tracker/config/skills.json` 中确保已配置该SKILL：

```json
{
  "requirement-coverage-analyzer": {
    "name": "需求覆盖率分析器",
    "category": "需求分析",
    "priority": "high",
    "indicators": {
      "commitPatterns": [
        "需求覆盖率",
        "coverage",
        "requirement-analysis",
        "需求分析"
      ],
      "reportFiles": [
        "requirement-coverage-analysis-*.md"
      ],
      "tfsAttachmentPatterns": [
        "需求覆盖率分析",
        "覆盖率分析报告"
      ]
    }
  }
}
```

---

## 🎯 使用示例

### 1. 分析需求（生成带标记的报告）

```bash
cd skills/requirement-coverage-analyzer

# 分析需求123456
node tools/main.mjs analyze 123456

# 生成的报告文件名：
# requirement-coverage-analysis-123456-score75-20260227123456.md
```

### 2. 使用推荐的提交信息

终端会显示：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 SKILL使用追踪提示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

建议的Git提交信息:
  docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100

提交命令:
  git add "/path/to/requirement-coverage-analysis-123456-score75-20260227123456.md"
  git commit -m "docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100"
```

### 3. 追踪器自动识别

```bash
cd skills/skill-usage-tracker

# 追踪器会自动检测到该SKILL的使用
node tools/main.mjs stats --days 7

# 输出中会显示：
# 需求覆盖率分析器: 2次
#   首次: 2026/02/27 12:34
#   最近: 2026/02/27 15:30
#   最近使用:
#     02/27 15:30 | docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100
```

---

## ✅ 验证集成效果

### 1. 检查生成的报告文件

```bash
# 查看报告文件名
ls -la reports/ | grep requirement-coverage

# 应该看到类似输出：
# requirement-coverage-analysis-123456-score75-20260227123456.md
```

### 2. 检查报告内容

```bash
# 查看报告开头的元数据
head -5 reports/requirement-coverage-analysis-*.md

# 应该看到：
# <!-- SKILL-TRACKING-METADATA: {"skill_id":"requirement-coverage-analyzer",...} -->
```

### 3. 测试追踪器检测

```bash
cd skills/skill-usage-tracker

# 运行测试
node tools/test.mjs

# 应该检测到需求覆盖率分析器的使用
```

---

## 📝 注意事项

1. **向后兼容**: 现有报告格式不受影响，只是添加了额外的元数据
2. **可选功能**: 用户可以选择是否使用推荐的提交信息
3. **本地化**: 所有提示信息都是中文，符合团队习惯
4. **TFS集成**: 支持将报告上传到TFS工作项作为附件

---

## 🚀 后续优化

1. **自动提交**: 可以添加 `--auto-commit` 选项，自动执行Git提交
2. **TFS上传**: 集成TFS API，自动上传报告到工作项
3. **Excel格式**: 同时生成Excel格式报告，便于团队分享
4. **Web展示**: 生成HTML格式报告，包含可视化图表

---

**SKILL统计特征标记 - 让追踪更准确，让贡献更可见！** 🎯
