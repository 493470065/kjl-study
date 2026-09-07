# 需求覆盖率分析器 - SKILL统计特征标记完整指南

## 📊 问题：如何让追踪器检测到SKILL使用？

**问题**: requirement-coverage-analyzer 运行后，SKILL使用追踪器无法检测到它的使用。

**原因**: 追踪器需要通过以下方式识别SKILL使用：
1. ✓ **Git提交信息** - 包含特定关键词
2. ✓ **报告文件名** - 包含特定标记
3. ✓ **报告内容** - 包含元数据标记
4. ✓ **TFS附件** - 工作项上传的报告

---

## 🎯 解决方案：添加统计特征标记

### 方案概述

| 标记位置 | 标记方式 | 追踪器检测 | 优先级 |
|---------|---------|-----------|--------|
| 报告文件名 | `requirement-coverage-analysis-*.md` | ✓ reportFiles | 高 |
| 提交信息 | `docs(requirement-coverage): ...` | ✓ commitPatterns | 高 |
| 报告元数据 | HTML注释隐藏元数据 | ✓ contentMarkers | 中 |
| TFS附件 | 上传报告到工作项 | ✓ tfsAttachmentPatterns | 中 |

---

## 🚀 快速开始（3步应用）

### 步骤1: 创建增强模块

已为你创建：`tools/skill-tracking-enhancement.mjs`

该模块包含：
- `generateMarkedReportFilename()` - 生成带标记的文件名
- `generateTrackingMetadata()` - 生成隐藏的元数据
- `generateTrackingReportBlock()` - 生成追踪信息块
- `printSkillTrackingHintWithTFS()` - 输出使用提示

### 步骤2: 应用补丁

```bash
cd skills/requirement-coverage-analyzer

# 运行自动应用脚本
node apply-skill-tracking-enhancement.mjs
```

该脚本会自动修改：
- `tools/report-generator.mjs` - 添加标记到报告
- `tools/main.mjs` - 添加使用提示输出

### 步骤3: 验证效果

```bash
# 1. 测试生成报告
node tools/main.mjs analyze 123456

# 查看生成的文件名（应该包含 requirement-coverage-analysis- 标记）
ls -la reports/

# 2. 测试追踪器检测
cd ../skill-usage-tracker
node tools/test.mjs

# 应该能看到需求覆盖率分析器被检测到
```

---

## 📋 手动应用方式（如果自动脚本失败）

### 修改1: report-generator.mjs

**位置**: 第1-5行（导入部分）

```javascript
// 添加导入
import {
  generateMarkedReportFilename,
  generateTrackingMetadata,
  generateTrackingReportBlock
} from './skill-tracking-enhancement.mjs';
```

**位置**: 第327-330行（文件名生成）

```javascript
// 原代码
const reportPath = path.join(
  reportsDir,
  `requirement-coverage-${data.requirementId}-${timestamp}.md`
);

// 修改为
const reportPath = path.join(
  reportsDir,
  generateMarkedReportFilename(data.requirementId, now, data.score)
);
```

**位置**: 第389行（buildMarkdownContent 函数开头）

```javascript
function buildMarkdownContent(data) {
  const sections = [];

  // 添加这一行
  sections.push(generateTrackingMetadata(data));

  // 原有的标题代码...
  sections.push('# 需求覆盖率分析报告\n');
```

**位置**: buildMarkdownContent 函数末尾（return 之前）

```javascript
  // ... 所有原有代码 ...

  // 在 return 之前添加
  sections.push(generateTrackingReportBlock(data));

  return sections.join('\n');
}
```

### 修改2: main.mjs

**位置**: 第15行附近（导入部分）

```javascript
// 添加导入
import { printSkillTrackingHintWithTFS } from './skill-tracking-enhancement.mjs';
```

**位置**: 第1734-1738行（报告生成后）

```javascript
try {
  const reportPath = await generateMarkdownReport(result, config);
  console.log(`\n报告已保存: ${reportPath}`);

  // 添加这一行
  printSkillTrackingHintWithTFS(result, reportPath);
} catch (error) {
  console.error(`警告: 无法保存报告文件 - ${error.message}`);
}
```

---

## 📊 应用效果

### 1. 报告文件名变化

**应用前**:
```
requirement-coverage-123456-20260227123456.md
```

**应用后**:
```
requirement-coverage-analysis-123456-score75-20260227123456.md
```

变化：
- 添加 `-analysis` 后缀（追踪器可识别）
- 添加评分信息 `-score75`
- 保持时间戳不变

### 2. 报告内容变化

**应用前**:
```markdown
# 需求覆盖率分析报告

## 1. 基本信息
...
```

**应用后**:
```markdown
<!-- SKILL-TRACKING-METADATA: {"skill_id":"requirement-coverage-analyzer","requirement_id":"123456","score":75,...} -->
<!-- 本报告由需求覆盖率分析器自动生成 -->
<!-- SKILL使用追踪器可识别此文件 -->

# 需求覆盖率分析报告

## 1. 基本信息
...

（报告末尾新增）

---

## 📊 SKILL使用追踪信息

本报告由 **需求覆盖率分析器** 自动生成。

| 字段 | 值 |
|------|-----|
| SKILL ID | requirement-coverage-analyzer |
| 需求 ID | 123456 |
| 评分 | 75 |

### 📝 建议的Git提交信息

docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100

### 🔍 如何被追踪

1. **文件名检测**: 包含 `requirement-coverage-analysis` 标记
2. **元数据检测**: 开头的隐藏元数据包含SKILL信息
3. **提交信息检测**: 使用上述提交信息格式将被识别

---

*SKILL使用追踪器 - 自动统计团队SKILL使用情况*
```

### 3. 终端输出变化

**应用前**:
```
报告已保存: /path/to/requirement-coverage-123456-20260227123456.md
```

**应用后**:
```
报告已保存: /path/to/requirement-coverage-analysis-123456-score75-20260227123456.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 SKILL使用追踪提示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

本报告已添加统计特征标记，可被SKILL使用追踪器自动识别。

报告文件:
  /path/to/requirement-coverage-analysis-123456-score75-20260227123456.md

建议的Git提交信息:
  docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100

提交命令:
  git add "/path/to/requirement-coverage-analysis-123456-score75-20260227123456.md"
  git commit -m "docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100"

追踪器将通过以下方式识别本SKILL的使用:
  ✓ 报告文件名标记
  ✓ 提交信息关键词
  ✓ TFS工作项附件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. TFS附件上传（可选）

使用 `--upload-to-tfs` 参数自动上传报告到TFS工作项：

```bash
node main.mjs analyze 123456 --upload-to-tfs
```

**输出示例**:
```
报告已保存: /path/to/requirement-coverage-analysis-123456-score75-20260227123456.md

正在上传报告到TFS工作项 123456...
  ✓ TFS连接成功
  正在上传附件: requirement-coverage-analysis-123456-score75-20260227123456.md
  ✓ 附件上传成功: ID=abc123-def456-ghi789
  ✓ 报告已上传到TFS
    附件ID: abc123-def456-ghi789
    工作项: 123456
```

**追踪器可通过以下方式检测TFS附件**:
- 工作项附件中的"需求覆盖率分析报告"关键词
- 附件文件名包含 `requirement-coverage-analysis` 标记
- 附件注释中包含评分信息

---

## ✅ 验证清单

应用补丁后，按以下清单验证：

- [ ] 报告文件名包含 `requirement-coverage-analysis` 标记
- [ ] 报告开头有隐藏的元数据注释
- [ ] 报告末尾有追踪信息块
- [ ] 终端输出显示SKILL追踪提示
- [ ] 运行 `node tools/test.mjs` 能检测到该SKILL使用
- [ ] 提交代码后，stats命令能统计到该SKILL

---

## 🔄 回退方法

如果需要回退修改：

```bash
cd skills/requirement-coverage-analyzer/tools

# 回退 report-generator.mjs
mv report-generator.mjs.backup report-generator.mjs

# 回退 main.mjs
mv main.mjs.backup main.mjs

# 删除增强模块（可选）
rm skill-tracking-enhancement.mjs
```

---

## 📝 相关文件

| 文件 | 说明 |
|------|------|
| `skill-tracking-enhancement.mjs` | 增强功能模块 |
| `apply-skill-tracking-enhancement.mjs` | 自动应用脚本 |
| `SKILL_TRACKING_INTEGRATION.md` | 详细集成指南 |
| `tools/report-generator.mjs` | 需要修改的报告生成器 |
| `tools/main.mjs` | 需要修改的主入口 |

---

**SKILL统计特征标记 - 让追踪更准确，让贡献更可见！** 🎯
