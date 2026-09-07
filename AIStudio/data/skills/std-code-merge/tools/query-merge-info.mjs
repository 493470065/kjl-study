#!/usr/bin/env node
/**
 * 查询合并信息工具
 * 用于代码合并流程中查询需求详情和新任务号的父级工作项ID
 *
 * 用法:
 * node tools/query-merge-info.mjs <需求号> <新任务号> [项目名称]
 *
 * 示例:
 * node tools/query-merge-info.mjs 1144995 1485439 WiNEX-Inpatient-2
 *
 * 说明:
 * - 需求号：仅查询详情用于显示，不查询父级工作项
 * - 新任务号：查询其父级工作项ID，用于后续添加 AI-MERGE 标记
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
            // 查找父级工作项（Hierarchy-Reverse 关系）
            const parentRelation = workItem.relations.find(rel =>
                rel.rel === 'System.LinkTypes.Hierarchy-Reverse'
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
        console.error('用法: node query-merge-info.mjs <需求号> <新任务号> [项目名称]');
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

        console.log(`正在查询需求 ${demandId} 和任务 ${newTaskId} 的合并信息...`);

        // 查询需求详情（仅用于显示）
        const demandDetail = await queryDemandDetail(demandId, projectName, client);
        console.log('\n📋 需求详情:');
        console.log(`  需求ID: ${demandDetail.id}`);
        console.log(`  标题: ${demandDetail.fields['System.Title']}`);
        console.log(`  类型: ${demandDetail.fields['System.WorkItemType']}`);
        console.log(`  状态: ${demandDetail.fields['System.State']}`);
        console.log(`  项目: ${demandDetail.fields['System.TeamProject']}`);

        // 查询新任务号的父级工作项ID（用于添加 AI-MERGE 标记）
        const parentId = await getParentWorkItemId(newTaskId, client);

        console.log(`\n📝 新任务 #${newTaskId} 信息:`);
        if (parentId) {
            console.log(`  父级工作项ID: ${parentId}`);
            console.log(`  说明：稍后将使用此父级工作项ID添加 AI-MERGE 标记`);
        } else {
            console.log(`  ⚠️  未找到父级工作项`);
            console.log(`  说明：稍后将直接标记到该任务`);
        }

        // 输出JSON格式结果，方便其他脚本使用
        const result = {
            demandId,
            demandTitle: demandDetail.fields['System.Title'],
            demandState: demandDetail.fields['System.State'],
            demandType: demandDetail.fields['System.WorkItemType'],
            demandProject: demandDetail.fields['System.TeamProject'],
            newTaskId,
            parentId,
            tagTargetId: parentId || newTaskId,  // 用于添加标记的目标ID
            tagDescription: parentId ? `父级工作项 ${parentId}` : `直接标记到任务 ${newTaskId}`
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