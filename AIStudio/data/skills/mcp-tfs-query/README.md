# MCP TFS Query Server

卫宁健康 WINNING-6.0 团队的 TFS 2018 MCP 服务器，用于查询工作项信息。

## 功能特性

- 🔍 查询单个工作项详细信息
- 📋 批量查询多个工作项
- 📁 列出所有可用项目
- 🎯 格式化输出，易读易解析

## 安装步骤

### 1. 安装依赖

```bash
cd mcp-tfs-query
npm install
claude mcp add sqlserver-query -- node D:\dev\winning-winex-inpatient-doctor-order\mcp-sqlserver-query\index.js
```

### 2. 配置认证信息

复制配置示例文件：

```bash
cp config.json.example config.json
```

编辑 `config.json`，填入你的 PAT Token：

```json
{
  "serverUrl": "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0",
  "pat": "your-personal-access-token-here"
}
```

### 3. 获取 PAT Token

1. 登录 TFS: http://tfs2018-web.winning.com.cn:8080/tfs/
2. 点击右上角用户头像 → **安全** → **+添加** → **个人访问令牌**
3. 设置令牌名称（如 "MCP TFS Query"）和有效期
4. 选择权限：**工作项** (读取、管理)
5. 复制生成的令牌到 `config.json`

## 使用方法

### 方式一：直接运行（测试）

```bash
npm start
```

### 方式二：在 Claude Code 中配置

在 Claude Code 的配置文件中添加此 MCP 服务器：

**Windows 配置文件位置**:
`%USERPROFILE%\.claude.json`

```json
{
  "mcpServers": {
    "mcp-tfs-query": {
      "command": "node",
      "args": ["D:\\dev\\mcp\\mcp-tfs-query\\index.js"],
      "cwd": "D:\\dev\\mcp\\mcp-tfs-query"
    }
  }
}
```

### 方式三：在其他 MCP 客户端中使用

参考客户端文档配置 MCP 服务器。

## 可用工具

### 1. get_work_item
根据工作项ID查询单个工作项的详细信息

**参数**:
- `id` (number, 必需): 工作项ID

**示例**:
```
查询工作项 1356193
```

**返回**:
```json
{
  "id": 1356193,
  "title": "住院医生站开立医嘱，弹出医嘱联动项目时...",
  "type": "需求",
  "state": "已分析",
  "assignedTo": "未分配",
  "project": "WiNEX-Inpatient-2",
  "description": "...",
  "priority": "2",
  "createdDate": "2025-12-30T08:10:07Z",
  "url": "http://..."
}
```

### 2. get_work_items
批量查询多个工作项的详细信息

**参数**:
- `ids` (array, 必需): 工作项ID列表

**示例**:
```
批量查询工作项 [1356193, 1356194, 1356195]
```

### 3. list_projects
列出所有可用的TFS项目

**参数**: 无

**返回**:
```json
[
  {
    "name": "WiNEX-Inpatient-2",
    "id": "fa2bf9fc-fdc9-4167-ae72-feef8525e1f5"
  },
  ...
]
```

## 项目结构

```
mcp-tfs-query/
├── index.js                 # MCP 服务器主文件
├── tfs-client.mjs          # TFS 客户端封装
├── config.json.example     # 配置示例文件
├── config.json             # 实际配置文件（需创建）
├── package.json            # 项目配置
└── README.md               # 本文档
```

## 依赖项

- `@modelcontextprotocol/sdk`: MCP SDK
- `azure-devops-node-api`: Azure DevOps API 客户端

## 支持的项目列表

服务器内置了卫宁健康 WINNING-6.0 团队的所有项目，包括：

- WiNEX-Inpatient-2 (住院大临床项目)
- WiNEX-Outpatient (门诊医生站)
- WiNEX-Emergency (急诊)
- WiNEX-Integration (集成组)
- WiNEX-MiddlePlatform (业务中台)
- WiNEX-DCP (数据中台)
- 等30+个项目

完整列表请调用 `list_projects` 工具查看。

## 故障排除

### 配置文件未找到

**错误**: `配置文件不存在`

**解决**: 确保 `config.json` 文件存在于项目根目录，并且格式正确。

### 认证失败

**错误**: `401 Unauthorized` 或 `403 Forbidden`

**解决**:
1. 检查 PAT Token 是否正确
2. 确认 PAT Token 有足够的权限（工作项读取）
3. 检查 PAT Token 是否已过期

### 工作项不存在

**错误**: `工作项未找到`

**解决**:
1. 确认工作项ID正确
2. 确认你有权限访问该工作项
3. 确认工作项未被删除



## Tooling / MCP Usage
- 如需执行JavaScript代码，请使用沙箱工具。
- **禁止**在项目目录中生成除任务明确要求外的任何`.js`临时文件。
- 如果必须生成临时文件，请将其创建在 `./tmp/` 目录下，并在操作完成后**自行清理**。

## 开发者

卫宁健康 WINNING-6.0 团队

