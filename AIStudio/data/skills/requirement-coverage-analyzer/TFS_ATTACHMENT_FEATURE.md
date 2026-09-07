# TFS附件上传功能

## 功能概述

需求覆盖率分析器现在支持自动将生成的分析报告上传到TFS工作项作为附件。

## 使用方法

```bash
# 基础用法
node main.mjs analyze 123456 --upload-to-tfs

# 结合其他参数
node main.mjs analyze 123456 --upload-to-tfs --code-project W.in-MVP --output ./reports
```

## 工作流程

1. **分析需求**: 生成覆盖率分析报告
2. **保存报告**: 报告保存到本地文件系统
3. **上传TFS**: 将报告作为附件上传到对应的工作项
4. **确认结果**: 终端显示上传状态和附件ID

## 上传信息

| 字段 | 说明 |
|------|------|
| 工作项ID | 分析的需求ID |
| 附件注释 | 包含评分信息，如"需求覆盖率分析报告 - 评分: 75/100" |
| 附件格式 | Markdown (.md) |
| 文件名 | requirement-coverage-analysis-{ID}-score{评分}-{时间戳}.md |

## 前提条件

1. **TFS配置文件**: `../../tfs2018-integration/config/tfs-config.json`
2. **PAT Token**: 配置文件中需要包含有效的Personal Access Token
3. **网络访问**: 能够访问TFS服务器 (http://tfs2018-web.winning.com.cn:8080/tfs/)

## 配置示例

`tfs-config.json` 格式:

```json
{
  "serverUrl": "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0",
  "pat": "your-pat-token-here",
  "collection": "WINNING-6.0"
}
```

## 输出示例

```
正在上传报告到TFS工作项 123456...
  ✓ TFS连接成功
  正在上传附件: requirement-coverage-analysis-123456-score75-20260227152412.md
  ✓ 附件上传成功: ID=abc123-def456-ghi789
  ✓ 报告已上传到TFS
    附件ID: abc123-def456-ghi789
    工作项: 123456
```

## 错误处理

如果上传失败，会显示友好的错误信息：

```
⚠️  TFS上传失败: 无法连接到TFS服务器
```

报告仍然会保存到本地，不会因为上传失败而丢失。

## SKILL追踪集成

此功能与SKILL使用追踪器完全集成：

1. ✓ **文件名检测**: 报告文件名包含 `requirement-coverage-analysis` 标记
2. ✓ **TFS附件检测**: 追踪器可检测TFS工作项中的报告附件
3. ✓ **提交信息检测**: 提供推荐的Git提交信息格式

## 相关文件

| 文件 | 说明 |
|------|------|
| `tools/tfs-attachment-uploader.mjs` | TFS附件上传器核心模块 |
| `tools/main.mjs` | 集成了上传功能的主入口 |
| `tools/test-tfs-upload.mjs` | 功能测试脚本 |

---

**TFS附件上传 - 让需求分析报告自动归档到TFS工作项！**
