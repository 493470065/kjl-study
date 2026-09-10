# 🚀 快速配置指南 - 3分钟配置完成

## 步骤 1: 打开 Claude Desktop 配置文件

**Windows**:
按 `Win + R`，输入：
```
%APPDATA%\Claude
```

打开 `claude_desktop_config.json`

## 步骤 2: 添加 MCP 服务器配置

在配置文件中添加以下内容：

```json
{
  "mcpServers": {
    "tfs-query": {
      "command": "node",
      "args": [
        "D:\\dev\\winning-winex-inpatient-doctor-order\\mcp-tfs-query\\index.js"
      ],
      "cwd": "D:\\dev\\winning-winex-inpatient-doctor-order\\mcp-tfs-query"
    }
  }
}
```

⚠️ **注意**: 如果配置文件中已有 `mcpServers`，只需添加 `tfs-query` 部分。

## 步骤 3: 重启 Claude Desktop

1. 完全退出 Claude Desktop
2. 重新启动 Claude Desktop

## 步骤 4: 测试使用

在 Claude Desktop 中输入：

```
查询工作项 1356193
```

应该能看到类似这样的输出：

```
📋 工作项详情
- ID: 1356193
- 标题: 住院医生站开立医嘱，弹出医嘱联动项目时...
- 类型: 需求
- 状态: 已分析
- 项目: WiNEX-Inpatient-2
```

## ✅ 配置完成！

现在你可以在 Claude Desktop 中：
- 查询任何工作项详情
- 批量查询多个工作项
- 列出所有TFS项目

## 📚 更多文档

- `README.md` - 项目文档
- `SETUP.md` - 详细配置指南
- `EXAMPLES.md` - 使用示例
- `PROJECT_SUMMARY.md` - 项目总结

---

**配置完成时间**: 约 2-3 分钟
**难度**: ⭐ 简单
