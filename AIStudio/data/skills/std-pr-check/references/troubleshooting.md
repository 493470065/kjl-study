# 错误排查指南

## 1. PAT 无效或过期

```
401 认证错误 - 无效的 PAT token
```

**解决方法**：
1. 检查环境变量 `TFS_PAT` 或 `AZURE_DEVOPS_PAT`
2. 检查配置文件 `config/config.json` 中的 `pat` 字段
3. 重新生成 PAT

## 2. LLM API Key 无效

```
错误: 需要提供 xxx API Key
401 Unauthorized
```

**解决方法**：
1. 确认使用的 LLM 提供商：`--provider zhipu|minimax`
2. 检查对应的环境变量 (`ZHIPU_API_KEY` 或 `MINIMAX_API_KEY`)
3. 检查配置文件中的对应字段
4. 确认 API Key 有效且有足够额度

## 3. 没有关联工作项

```
⚠️ 检测到异常: 当前 PR 没有关联工作项
```

**解决方法**：
1. 在 PR 中手动链接工作项
2. 确认工作项已关联到此 PR

## 4. 网络连接失败

```
API Error: <urlopen error>
```

**解决方法**：
1. 检查网络连接
2. 确认 TFS 服务器地址可访问
3. 确认可以访问对应的 LLM API

## 5. LLM 解析失败

```
解析 LLM 结果失败
```

**解决方法**：
1. 使用 `--dry-run` 查看原始输出
2. 使用 `--save-prompt` 保存请求内容调试
3. 尝试切换不同的 LLM 提供商
