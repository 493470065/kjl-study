#!/usr/bin/env node
/**
 * 为 TFS 工作项添加标签
 * 用法: node add-work-item-tag.mjs <workItemId> <tag> [--parent]
 * 示例: node add-work-item-tag.mjs 1445554 "AI-ANALYSIS"
 *       node add-work-item-tag.mjs 1485200 "AI-MERGE" --parent  # 查询新任务号的父级工作项ID，然后标记
 *
 * 说明：
 * - 如果标签已存在，则跳过不重复添加
 * - 使用与 std-req-eval 相同的标签追加逻辑
 * - --parent 参数：先查询工作项的父级工作项ID，然后标记到父级工作项（用于代码合并场景）
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('用法: node add-work-item-tag.mjs <workItemId> <tag> [--parent]');
    console.error('示例: node add-work-item-tag.mjs 1445554 "AI-ANALYSIS"');
    console.error('       node add-work-item-tag.mjs 1485200 "AI-MERGE" --parent  # 查询新任务号的父级工作项ID，然后标记');
    process.exit(1);
  }

  // 动态导入 TFS 客户端
  const TFSClient = await importTFSClient();

  const [workItemId, newTag, ...rest] = args;
  const useParentFlag = rest.includes('--parent');

  // 如果使用 --parent 选项，先查询工作项的父级工作项ID
  let targetWorkItemId = workItemId;
  if (useParentFlag) {
    console.log(`正在查询工作项 ${workItemId} 的父级工作项ID...`);
    try {
      const client = new TFSClient();
      const witApi = await client.getWorkItemApi();
      const currentWorkItem = await witApi.getWorkItem(workItemId, null, null, 'All', null);

      // 查找父级工作项（Hierarchy-Reverse 关系）
      if (currentWorkItem.relations) {
        for (const rel of currentWorkItem.relations) {
          if (rel.rel === 'System.LinkTypes.Hierarchy-Reverse') {
            const parentWorkItemId = parseInt(rel.url.split('/').pop());
            console.log(`找到父级工作项ID: ${parentWorkItemId}`);
            targetWorkItemId = parentWorkItemId;
            break;
          }
        }
      }

      if (targetWorkItemId === workItemId) {
        console.log(`警告: 工作项 ${workItemId} 没有找到父级工作项ID，将直接标记到该工作项`);
      }
    } catch (error) {
      console.error('查询父级工作项ID失败:', error.message);
      process.exit(1);
    }
  }

  console.log(`正在为工作项 ${targetWorkItemId}${useParentFlag ? ` (${workItemId}的父级)` : ''} 添加标签 "${newTag}"...`);

  try {
    const client = new TFSClient();
    const witApi = await client.getWorkItemApi();

    // 获取当前工作项
    console.log('正在获取当前工作项...');
    const currentWorkItem = await witApi.getWorkItem(targetWorkItemId);
    console.log(`工作项标题: ${currentWorkItem.fields['System.Title']}`);

    // 获取当前标签
    const currentTags = currentWorkItem.fields['System.Tags'] || '';
    const existingTagList = currentTags
      ? currentTags.split(';').map(t => t.trim()).filter(t => t)
      : [];

    console.log(`当前标签: ${existingTagList.length > 0 ? existingTagList.join('; ') : '(无)'}`);

    // 检查标签是否已存在
    if (existingTagList.includes(newTag)) {
      console.log(`\n✓ 标签 "${newTag}" 已存在，跳过添加`);
      process.exit(0);
    }

    // 添加新标签
    const finalNewTagList = [...new Set([...existingTagList, newTag])];
    const finalNewTags = finalNewTagList.join('; ');

    // 更新标签
    console.log(`正在添加标签 "${newTag}"...`);
    const document = [
      {
        op: 'replace',
        path: '/fields/System.Tags',
        value: finalNewTags
      }
    ];

    const updatedWorkItem = await witApi.updateWorkItem(null, document, targetWorkItemId);

    console.log('\n✓ 标签添加成功！');
    console.log(`工作项 ID: ${updatedWorkItem.id}`);
    console.log(`修订版本: ${updatedWorkItem.rev}`);
    console.log(`新标签: ${finalNewTags}`);

  } catch (error) {
    console.error('\n✗ 添加标签失败:', error.message);
    if (error.statusCode) {
      console.error('状态码:', error.statusCode);
    }
    if (error.response && error.response.body) {
      console.error('响应:', error.response.body);
    }
    process.exit(1);
  }
}

main();
