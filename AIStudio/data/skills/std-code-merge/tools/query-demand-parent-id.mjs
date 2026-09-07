#!/usr/bin/env node
/**
 * 查询需求详情并获取父级工作项ID
 * 本工具用于在需求合并流程中，提前获取新任务号的父级工作项ID
 *
 * 用法:
 * node tools/query-demand-parent-id.mjs <需求号> <新任务号> [项目名称]
 *
 * 示例:
 * node tools/query-demand-parent-id.mjs 1144995 1485439 WiNEX-Inpatient-2
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 查找 tfs2018-integration 技能目录
function findTfsIntegrationPath() {
  const possiblePaths = [
    path.resolve(__dirname, '../../tfs2018-integration/tools/tfs-client.mjs'),
    path.resolve(__dirname, '../../../tfs2018-integration/tools/tfs-client.mjs'),
    path.resolve(process.env.HOME || process.env.USERPROFILE, '.claude/skills/tfs2018-integration/tools/tfs-client.mjs'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return pathToFileURL(p).href;
    }
  }

  // 如果都找不到，抛出错误
  throw new Error(`无法找到 tfs-client.mjs，已搜索路径:\n${possiblePaths.join('\n')}`);
}

// 将文件路径转换为 file:// URL（Windows 兼容）
function pathToFileURL(filePath) {
  const absolutePath = path.resolve(filePath);
  if (process.platform === 'win32') {
    return new URL(`file:///${absolutePath.replace(/\\/g, '/')}`);
  }
  return new URL(`file://${absolutePath}`);
}

// 动态导入 TFS 客户端
async function importTFSClient() {
  try {
    const tfsModuleUrl = findTfsIntegrationPath();
    const TFSClientModule = await import(tfsModuleUrl);
    return TFSClientModule.default;
  } catch (error) {
    console.error('无法导入 TFS 客户端:', error.message);
    process.exit(2);
  }
}

/**
 * 查询工作项的父级工作项ID
 * @param {number} workItemId - 工作项ID
 * @param {Object} client - TFS 客户端实例
 * @returns {Promise<number|null>} 父级工作项ID，如果没有则返回null
 */
async function getParentWorkItemId(workItemId, client) {
    try {
        const workItem = await client.getWorkItem(workItemId);

        if (workItem.relations && workItem.relations.length > 0) {
            // 查找父级工作项
            const parentRelation = workItem.relations.find(rel =>
                rel.attributes &&
                (rel.attributes.name === 'System.LinkTypes.Hierarchy-Forward' ||
                 rel.attributes.name === 'Parent')
            );

            if (parentRelation) {
                // 从URL中提取父级工作项ID
                const match = parentRelation.url.match(/\/workItems\/(\d+)$/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }

        return null;
    } catch (error) {
        console.error(`查询工作项 ${workItemId} 失败:`, error.message);
        return null;
    }
}

/**
 * 查询需求详情
 * @param {number} demandId - 需求ID
 * @param {string} projectName - 项目名称
 * @param {Object} client - TFS 客户端实例
 * @returns {Promise<Object>} 需求详情
 */
async function queryDemandDetail(demandId, projectName = '', client) {
    try {
        // 构建查询条件
        const wiql = `
            SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType],
                   [System.TeamProject], [Microsoft.VSTS.Common.Priority],
                   [Winning.Product.Name], [RaD.Center], [System.Description]
            FROM WorkItems
            WHERE [System.Id] = ${demandId}
        `;

        const result = await client.queryWorkItems(wiql, projectName);

        if (result.length > 0) {
            return result[0];
        } else {
            throw new Error(`未找到需求 ${demandId}`);
        }
    } catch (error) {
        console.error(`查询需求 ${demandId} 失败:`, error.message);
        throw error;
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('用法: node query-demand-parent-id.mjs <需求号> <新任务号> [项目名称]');
        process.exit(1);
    }

    const demandId = parseInt(args[0]);
    const newTaskId = parseInt(args[1]);
    const projectName = args[2] || '';

    if (isNaN(demandId) || isNaN(newTaskId)) {
        console.error('需求号和新任务号必须是数字');
        process.exit(1);
    }

    try {
        // 动态导入 TFS 客户端
        const TFSClient = await importTFSClient();
        const client = new TFSClient();

        console.log(`正在查询需求 ${demandId} 和任务 ${newTaskId}...`);

        // 查询需求详情
        const demandDetail = await queryDemandDetail(demandId, projectName, client);
        console.log('\n📋 需求详情:');
        console.log(`  需求ID: ${demandDetail.id}`);
        console.log(`  标题: ${demandDetail.fields['System.Title']}`);
        console.log(`  类型: ${demandDetail.fields['System.WorkItemType']}`);
        console.log(`  状态: ${demandDetail.fields['System.State']}`);
        console.log(`  项目: ${demandDetail.fields['System.TeamProject']}`);

        // 查询新任务号的父级工作项ID
        const parentId = await getParentWorkItemId(newTaskId, client);

        if (parentId) {
            console.log(`\n🔗 父级工作项ID: ${parentId}`);
        } else {
            console.log(`\n⚠️  未找到任务 ${newTaskId} 的父级工作项`);
        }

        // 输出JSON格式结果，方便其他脚本使用
        const result = {
            demandId,
            newTaskId,
            parentId,
            demandDetail: {
                id: demandDetail.id,
                title: demandDetail.fields['System.Title'],
                state: demandDetail.fields['System.State'],
                type: demandDetail.fields['System.WorkItemType'],
                project: demandDetail.fields['System.TeamProject']
            }
        };

        console.log('\n📊 JSON输出:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
try {
    const scriptPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
    if (import.meta.url === `file:///${scriptPath}`) {
        main();
    }
} catch (e) {
    main();
}

export { queryDemandDetail, getParentWorkItemId };