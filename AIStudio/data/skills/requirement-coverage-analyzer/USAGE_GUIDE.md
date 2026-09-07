# 需求覆盖率分析器 - TFS附件上传功能使用指南

## 功能概述

需求覆盖率分析器现已完全集成SKILL使用追踪和TFS附件上传功能，实现：

1. **自动追踪**: 添加统计特征标记，追踪器可自动检测使用
2. **TFS上传**: 自动将分析报告上传到TFS工作项作为附件
3. **智能提示**: 提供推荐的Git提交信息格式

## 快速开始

### 1. 基础分析

```bash
cd skills/requirement-coverage-analyzer
node tools/main.mjs analyze 123456
```

### 2. 分析并上传到TFS

```bash
node tools/main.mjs analyze 123456 --upload-to-tfs
```

### 3. 完整参数示例

```bash
node tools/main.mjs analyze 123456 \
  --upload-to-tfs \
  --code-project W.in-MVP \
  --output ./reports \
  --repos-dir /data/git-repos
```

## 命令行选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--upload-to-tfs` | 将报告上传到TFS工作项 | `--upload-to-tfs` |
| `--code-project <项目>` | 指定代码仓库所在项目 | `--code-project W.in-MVP` |
| `--output <路径>` | 指定报告输出目录 | `--output ./reports` |
| `--repos-dir <路径>` | 指定仓库根目录 | `--repos-dir /data/git-repos` |
| `--config <路径>` | 指定配置文件路径 | `--config ./config.json` |

## 输出示例

### 终端输出

```
报告已保存: D:\reports\requirement-coverage-analysis-123456-score75-20260227152412.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 SKILL使用追踪提示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

本报告已添加统计特征标记，可被SKILL使用追踪器自动识别。

报告文件:
  D:\reports\requirement-coverage-analysis-123456-score75-20260227152412.md

建议的Git提交信息:
  docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100

提交命令:
  git add "D:\reports\requirement-coverage-analysis-123456-score75-20260227152412.md"
  git commit -m "docs(requirement-coverage): 需求123456覆盖率分析报告 评分:75/100"

追踪器将通过以下方式识别本SKILL的使用:
  ✓ 报告文件名标记
  ✓ 提交信息关键词
  ✓ TFS工作项附件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

正在上传报告到TFS工作项 123456...
  ✓ TFS连接成功
  正在上传附件: requirement-coverage-analysis-123456-score75-20260227152412.md
  ✓ 附件上传成功: ID=abc123-def456-ghi789
  ✓ 报告已上传到TFS
    附件ID: abc123-def456-ghi789
    工作项: 123456
```

### 生成的报告

**文件名**: `requirement-coverage-analysis-123456-score75-20260227152412.md`

**文件内容开头**:
```markdown
<!-- SKILL-TRACKING-METADATA: {"skill_id":"requirement-coverage-analyzer","skill_name":"需求覆盖率分析器",...} -->

<!-- 本报告由需求覆盖率分析器自动生成 -->
<!-- SKILL使用追踪器可识别此文件 -->

# 需求覆盖率分析报告
...
```

**文件内容末尾**:
```markdown
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
4. **TFS附件检测**: 工作项附件中的报告可被追踪器检测

---

*SKILL使用追踪器 - 自动统计团队SKILL使用情况*
```

## TFS配置

### 配置文件位置

```
skills/tfs2018-integration/config/tfs-config.json
```

### 配置文件格式

```json
{
  "serverUrl": "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0",
  "pat": "your-pat-token-here",
  "collection": "WINNING-6.0"
}
```

### 获取PAT Token

1. 登录TFS服务器
2. 进入用户设置 → 安全 → Personal Access Tokens
3. 创建新Token，选择相应权限
4. 复制Token并保存到配置文件

## 追踪器统计

### 运行统计

```bash
cd ../skill-usage-tracker
node tools/main.mjs stats
```

### 统计输出

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  人员详细使用情况
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 张三 <zhangsan@winning.com.cn>
   总提交: 15次

   SKILL使用详情:
      • 需求覆盖率分析器                 8次
        首次: 2026/02/01 10:00
        最近: 2026/02/27 15:30
        最近使用:
          02/27 15:30 | docs(requirement-coverage): 需求123456覆盖率 评分:75/100
          02/26 14:20 | docs(requirement-coverage): 需求234567覆盖率 评分:82/100
          02/25 16:10 | docs(requirement-coverage): 需求345678覆盖率 评分:68/100
```

## 验证功能

### 运行验证脚本

```bash
cd skills/requirement-coverage-analyzer/tools
node verify-integration.mjs
```

### 验证TFS上传功能

```bash
node test-tfs-upload.mjs
```

## 故障排除

### 问题：TFS上传失败

**检查项**:
1. TFS配置文件是否存在
2. PAT Token是否有效
3. 网络是否可访问TFS服务器

**解决方案**:
```bash
# 检查配置文件
cat ../../tfs2018-integration/config/tfs-config.json

# 测试TFS连接
node test-tfs-upload.mjs
```

### 问题：追踪器未检测到使用

**检查项**:
1. 报告文件名是否包含 `requirement-coverage-analysis` 标记
2. 是否使用了推荐的Git提交信息
3. 追踪器配置是否正确

**解决方案**:
```bash
# 检查生成的文件
ls -la reports/

# 验证追踪器配置
cat ../skill-usage-tracker/config/skills.json

# 运行追踪器测试
cd ../skill-usage-tracker
node tools/test.mjs
```

## 相关文档

| 文档 | 说明 |
|------|------|
| `SKILL_TRACKING_QUICKSTART.md` | SKILL追踪快速入门 |
| `TFS_ATTACHMENT_FEATURE.md` | TFS附件上传功能详细说明 |
| `INTEGRATION_COMPLETE.md` | 功能集成完成报告 |
| `demo-tracking-report.md` | 追踪增强演示报告 |

## 技术支持

如遇问题，请查看：
1. 验证脚本输出
2. 帮助信息: `node main.mjs help`
3. 相关文档文件

---

**TFS附件上传功能 - 让需求分析报告自动归档到TFS工作项！**
