---
name: std-pr-check
description: "分析 PR 代码变更是否与 TFS/Azure DevOps 工作项需求匹配。自动获取工作项需求分析（Winning.Demand.Analysis），结合代码 Diff，调用 LLM 进行需求合规性分析。支持 Azure DevOps Services、Azure DevOps Server 2019+、TFS 2018。"
metadata:
  {
    "openclaw": {
      "emoji": "🔍",
      "user-invocable": true
    }
  }
---

# PR 需求合规性检查

基于 PR-Agent (qodo-ai/pr-agent) 技术架构，分析 Pull Request 代码实现是否满足关联工作项的需求。

## 架构

```
pr_check.py: 获取 PR 数据 → 异常检测 → LLM 分析 → 发布评论
```

异常检测：无工作项或无 commit 时直接跳过 LLM，节省成本。

## 环境要求

- **Python**: 3.6 或更高版本
- **依赖模块**: pyyaml（通过 `requirements.txt` 安装）

### 安装依赖

```bash
# Windows
py -3 -m pip install -r requirements.txt

# Linux/Mac
python3 -m pip install -r requirements.txt
```

### 验证环境

```bash
# 检查 Python 版本
python --version   # 或 py -3
python3 --version

# 列出支持的 LLM 提供商
python3 scripts/pr_check.py --list-models
```

## 快速开始

### 1. 配置

```bash
# TFS/Azure DevOps PAT
export TFS_PAT="your-tfs-pat-token"

# LLM API Key (选择其一)
export ZHIPU_API_KEY="your-zhipu-api-key"           # 智谱 AI
export MINIMAX_API_KEY="your-minimax-api-key"       # MiniMax
```

或创建 `config/config.json`:

```json
{
  "pat": "your-tfs-pat-token",
  "zhipu_api_key": "your-zhipu-api-key"
}
```

### 2. 运行

**Windows（推荐）**:
```bash
# 使用 Python Launcher
py -3 scripts/pr_check.py "<PR_URL>"

# 更新已有评论
py -3 scripts/pr_check.py "<PR_URL>" --update-existing

# 仅分析不发布（测试用）
py -3 scripts/pr_check.py "<PR_URL>" --dry-run
```

**Linux/Mac**:
```bash
# 一键检查 PR
python3 scripts/pr_check.py "<PR_URL>"

# 更新已有评论
python3 scripts/pr_check.py "<PR_URL>" --update-existing

# 仅分析不发布（测试用）
python3 scripts/pr_check.py "<PR_URL>" --dry-run
```

## 常用参数

| 参数 | 说明 |
|------|------|
| `--provider` | LLM 提供商：zhipu, minimax（默认: zhipu） |
| `--model` | LLM 模型名称（可选，使用默认模型） |
| `--update-existing` | 更新已有评论而非创建新评论 |
| `--dry-run` | 仅分析不发布评论 |
| `--list-models` | 列出所有支持的 LLM 提供商和模型 |

## 支持的 TFS 版本

- Azure DevOps Services (云版)
- Azure DevOps Server 2019+
- TFS 2018

## 获取的工作项字段

| 字段 | 来源 |
|------|------|
| `id` | System.Id |
| `title` | System.Title |
| `description` | System.Description |
| `acceptance_criteria` | **Winning.Demand.Analysis** (需求分析核心字段) |

## 合规性状态

| 状态 | 图标 | 判定逻辑 |
|------|------|----------|
| 完全符合 | ✅ | 有符合需求，无不符需求 |
| 部分符合 | ⚠️ | 既有符合又有不符 |
| 不符合 | ❌ | 有不符需求，无符合需求 |
| 待验证 | 🔍 | 有需要人工验证的内容 |

## LLM 分析输出格式

```yaml
review:
  ticket_compliance_check:
    - ticket_url: "工作项 ID 或 URL"
      ticket_requirements: "需求概述"
      fully_compliant_requirements: "已满足的需求"
      not_compliant_requirements: "未满足的需求"
      requires_further_human_verification: "需人工验证的内容"
```

## PAT 权限要求

- **Code**: Read
- **Work Items**: Read

## 故障排查

### 错误：本脚本需要 Python 3.6 或更高版本

**原因**: 系统默认的 Python 是 2.x

**解决方法**:
- **Windows**: 使用 `py -3` 命令代替 `python`，或安装 Python 3
- **Linux/Mac**: 使用 `python3` 命令代替 `python`

### 错误：缺少必需的 Python 依赖模块

**原因**: 未安装 `pyyaml` 模块

**解决方法**:
```bash
# Windows
py -3 -m pip install pyyaml

# Linux/Mac
python3 -m pip install pyyaml

# 或使用 requirements.txt
py -3 -m pip install -r requirements.txt
```

### 错误：Non-ASCII character 但没有编码声明

**原因**: Python 脚本包含中文字符但缺少编码声明

**解决方法**: 脚本已修复（添加 `# -*- coding: utf-8 -*-`），如果仍有问题请确保使用 Python 3 运行

### 错误：LLM API 调用失败

**可能原因**:
1. API Key 无效或过期
2. 网络连接问题
3. API 端点不可用

**解决方法**:
- 检查 `config/config.json` 中的 API Key 是否正确
- 尝试切换 LLM 提供商（如 `--provider kimi` 或 `--provider minimax`）
- 使用 `--dry-run` 参数测试而不发布评论

### Windows 上找不到 python3 命令

**原因**: Windows 默认没有 `python3` 命令

**解决方法**: 使用 Python Launcher:
```bash
py -3 scripts/pr_check.py "<PR_URL>"
```

## 更多信息

- **LLM 提供商配置**: [references/llm-providers.md](references/llm-providers.md)

## 参考资料

- [PR-Agent 源码](https://github.com/qodo-ai/pr-agent)
- [TFS/Azure DevOps REST API](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
