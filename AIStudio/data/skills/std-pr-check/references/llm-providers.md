# LLM 提供商配置

## 支持的提供商

| 提供商 | 标识 | 默认模型 | 环境变量 | 配置键 |
|--------|------|---------|---------|--------|
| 智谱 AI | `zhipu` | glm-5 | `ZHIPU_API_KEY` | `zhipu_api_key` |
| MiniMax | `minimax` | MiniMax-M2.5 | `MINIMAX_API_KEY` | `minimax_api_key` |
| Kimi (月之暗面) | `kimi` | kimi-k2.5 | `KIMI_API_KEY` | `kimi_api_key` |

## 配置方式

### 方式一：环境变量（推荐）

```bash
export ZHIPU_API_KEY="your-zhipu-api-key"
python3 scripts/pr_check.py "<PR_URL>"
```

### 方式二：配置文件

```json
{
  "pat": "your-tfs-pat-token",
  "zhipu_api_key": "your-zhipu-api-key",
  "minimax_api_key": "your-minimax-api-key",
  "kimi_api_key": "your-kimi-api-key",
  "default_provider": "zhipu"
}
```

### 方式三：命令行参数

```bash
# 指定提供商
python3 scripts/pr_check.py "<PR_URL>" --provider zhipu

# 指定模型
python3 scripts/pr_check.py "<PR_URL>" --provider zhipu --model glm-4-plus

# 覆盖 API Key
python3 scripts/pr_check.py "<PR_URL>" --provider minimax --api-key "your-key"
```

## 提供商详情

### 智谱 AI

**API 地址**: https://open.bigmodel.cn/api/paas/v4/chat/completions

**获取 API Key**: https://open.bigmodel.cn/

**推荐模型**:
- `glm-5` - 默认，最新版本
- `glm-4-plus` - 高性能版本

### MiniMax

**API 地址**: https://api.minimax.chat/v1/text/chatcompletion_v2

**获取 API Key**: https://api.minimax.chat/

**推荐模型**:
- `MiniMax-M2.5` - 默认
- `abab6.5s-chat` - 备选

### Kimi (月之暗面 Moonshot AI)

**API 地址**: https://api.moonshot.cn/v1/chat/completions

**获取 API Key**: https://platform.moonshot.cn/console/api-keys

**推荐模型**:
- `moonshot-v1-8k` - 默认，8K 上下文
- `moonshot-v1-32k` - 32K 上下文
- `moonshot-v1-128k` - 128K 上下文（适合大型 PR 分析）

**官网**: https://www.moonshot.cn/

## 列出所有支持的模型

```bash
python3 scripts/pr_check.py --list-models
```
