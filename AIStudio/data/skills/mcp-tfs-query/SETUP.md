# Claude Desktop MCP 配置指南

本指南将帮助你将 TFS Query MCP 服务器配置到 Claude Desktop 中。

## 步骤1: 找到 Claude Desktop 配置文件

**Windows 配置文件位置**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

完整路径通常是：
```
C:\Users\Administrator\AppData\Roaming\Claude\claude_desktop_config.json
```

## 步骤2: 编辑配置文件

打开 `claude_desktop_config.json`，添加以下内容：

```json
{
  "mcpServers": {
    "mcp-tfs-query": {
      "command": "node",
      "args": [
        "D:\\dev\\mcp\\mcp-tfs-query\\index.js"
      ],
      "cwd": "D:\\dev\\mcp\\mcp-tfs-query"
    }
  }
}
```

**注意事项**:
- 如果配置文件中已有其他 MCP 服务器，请将 `tfs-query` 添加到现有的 `mcpServers` 对象中
- 确保路径使用双反斜杠 `\\` 或正斜杠 `/`
- 路径需要根据你的实际项目位置进行调整

## 步骤3: 重启 Claude Desktop

配置完成后，需要重启 Claude Desktop：
1. 完全退出 Claude Desktop
2. 重新启动 Claude Desktop

## 步骤4: 验证配置

在 Claude Desktop 中，你可以通过以下方式验证 MCP 服务器是否正常工作：

### 方法1: 查看可用工具
在对话中输入：
```
列出可用的 MCP 工具
```

应该能看到 `tfs-query` 相关的工具：
- `get_work_item` - 查询单个工作项
- `get_work_items` - 批量查询工作项
- `list_projects` - 列出所有项目

### 方法2: 测试查询
在对话中输入：
```
查询工作项 1356193
```

应该能返回该工作项的详细信息。

## 使用示例

### 示例1: 查询单个工作项
```
帮我查询工作项 1356193 的详细信息
```

### 示例2: 批量查询
```
帮我查询工作项 1356193、1356194、1356195 的信息
```

### 示例3: 列出项目
```
列出所有可用的 TFS 项目
```

## 常见问题

### Q: Claude Desktop 启动后没有识别到 MCP 服务器？
**A**: 检查以下几点：
1. 配置文件路径是否正确
2. 配置文件格式是否正确（JSON 格式，注意逗号）
3. MCP 服务器目录中的 `config.json` 是否存在且配置正确
4. 查看 Claude Desktop 的日志（通常在 `%APPDATA%\Claude\logs\`）

### Q: 调用工具时返回认证错误？
**A**: 检查 `config.json` 中的 PAT Token：
1. Token 是否正确复制
2. Token 是否已过期
3. Token 是否有足够的权限（工作项读取）

### Q: 查询不到工作项？
**A**: 可能的原因：
1. 工作项ID不存在
2. 当前账户没有访问该工作项的权限
3. 工作项已被删除

## 高级配置

### 添加多个 MCP 服务器

如果你有多个 MCP 服务器，可以这样配置：

```json
{
  "mcpServers": {
    "mcp-tfs-query": {
      "command": "node",
      "args": [
        "D:\\dev\\mcp\\mcp-tfs-query\\index.js"
      ],
      "cwd": "D:\\dev\\mcp\\mcp-tfs-query"
    },
    "another-server": {
      "command": "python",
      "args": ["path/to/another/server.py"]
    }
  }
}
```

### 环境变量配置（可选）

如果需要使用环境变量配置 PAT Token：

```json
{
  "mcpServers": {
    "mcp-tfs-query": {
      "command": "node",
      "args": [
        "D:\\dev\\mcp\\mcp-tfs-query\\index.js"
      ],
      "cwd": "D:\\dev\\mcp\\mcp-tfs-query",
      "env": {
        "TFS_PAT": "your-pat-token-here"
      }
    }
  }
}
```

同时需要修改 `index.js` 以支持从环境变量读取配置。

## 技术支持

如果遇到问题，请联系：
- 卫宁健康 WINNING-6.0 团队
- 查看项目 README.md 获取更多信息
