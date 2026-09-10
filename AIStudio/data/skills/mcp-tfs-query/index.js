#!/usr/bin/env node
/**
 * MCP TFS Query Server
 * 卫宁健康 WINNING-6.0 团队
 *
 * Model Context Protocol 服务器，用于查询 TFS 2018 工作项
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import TFSClient from './tfs-client.mjs';

// 创建 TFS 客户端
const tfsClient = new TFSClient();

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'mcp-tfs-query',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_work_item',
        description: '根据工作项ID查询单个工作项的详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_work_items',
        description: '批量查询多个工作项的详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: '工作项ID列表',
            },
          },
          required: ['ids'],
        },
      },
      {
        name: 'list_projects',
        description: '列出所有可用的TFS项目',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_attachments',
        description: '列出工作项的所有附件',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'download_attachments',
        description: '下载工作项的所有附件到PRD目录',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
            targetDir: {
              type: 'string',
              description: '可选的目标目录，默认为当前项目下的PRD/{工作项ID}目录',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'upload_attachment',
        description: '上传单个文件作为工作项的附件',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
            filePath: {
              type: 'string',
              description: '要上传的文件的完整路径',
            },
            fileName: {
              type: 'string',
              description: '可选的文件名，默认使用原文件名',
            },
            comment: {
              type: 'string',
              description: '可选的附件注释',
            },
          },
          required: ['id', 'filePath'],
        },
      },
      {
        name: 'upload_attachments',
        description: '批量上传多个文件作为工作项的附件',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
            filePaths: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '要上传的文件的完整路径数组',
            },
            comment: {
              type: 'string',
              description: '可选的附件注释',
            },
          },
          required: ['id', 'filePaths'],
        },
      },
      {
        name: 'update_work_item',
        description: '更新工作项字段（如状态、标签、指派人等）',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '工作项ID',
            },
            updates: {
              type: 'object',
              description: '要更新的字段键值对，例如: { "System.Tags": "标签1;标签2", "System.State": "Active" }',
            },
            comment: {
              type: 'string',
              description: '可选的变更注释（会添加到历史记录）',
            },
          },
          required: ['id', 'updates'],
        },
      },
    ],
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_work_item': {
        const { id } = args;
        const workItem = await tfsClient.getWorkItem(id);
        const formatted = tfsClient.formatWorkItem(workItem);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case 'get_work_items': {
        const { ids } = args;
        const workItems = await tfsClient.getWorkItems(ids);
        const formatted = workItems.map(wi => tfsClient.formatWorkItem(wi));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case 'list_projects': {
        const projects = tfsClient.getProjects();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      }

      case 'list_attachments': {
        const { id } = args;
        const workItem = await tfsClient.getWorkItem(id);
        const attachments = tfsClient.getAttachments(workItem);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workItemId: id,
                attachmentCount: attachments.length,
                attachments: attachments
              }, null, 2),
            },
          ],
        };
      }

      case 'download_attachments': {
        const { id, targetDir } = args;
        const result = await tfsClient.downloadWorkItemAttachments(id, targetDir);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'upload_attachment': {
        const { id, filePath, fileName, comment } = args;
        const result = await tfsClient.uploadAttachment(id, filePath, fileName, comment);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'upload_attachments': {
        const { id, filePaths, comment } = args;
        const result = await tfsClient.uploadAttachments(id, filePaths, comment);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'update_work_item': {
        const { id, updates, comment } = args;
        const result = await tfsClient.updateWorkItem(id, updates, comment);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stderr 用于调试日志（不影响 MCP 通信）
  console.error('MCP TFS Query Server 已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
