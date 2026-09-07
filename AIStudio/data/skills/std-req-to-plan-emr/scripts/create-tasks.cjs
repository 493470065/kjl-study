const fs = require('fs');
const path = require('path');

/**
 * 需求任务自动创建脚本
 *
 * 获取需求工作项下的子任务，检查是否存在当前用户的子任务，
 * 如果不存在则自动创建一个任务（前端+后端合并为一个）。
 *
 * 环境变量：
 *   WORK_ITEM_ID    - 需求工作项ID（必填）
 *   CREATE_FRONTEND - 是否涉及前端 "true"/"false"（默认 false）
 *   CREATE_BACKEND  - 是否涉及后端 "true"/"false"（默认 false）
 *   CURRENT_USER    - 当前用户标识（可选），存在该用户的子任务时跳过创建
 *   TFS_CLIENT_DIR  - tfs-client.mjs 所在目录（必填）
 */

const CLOSED_STATES = new Set(['Closed', '已关闭', 'Done', '已完成', 'Resolved', '已解决']);

async function main() {
  // 环境变量校验
  const tfsClientDir = process.env.TFS_CLIENT_DIR;
  if (!tfsClientDir) {
    throw new Error('环境变量 TFS_CLIENT_DIR 未设置。请确保 tfs-client.mjs 已安装。');
  }
  const tfsClientPath = path.resolve(tfsClientDir);
  if (!fs.existsSync(path.join(tfsClientPath, 'tfs-client.mjs'))) {
    throw new Error(`TFS Client 未找到: ${tfsClientPath}/tfs-client.mjs 不存在。`);
  }

  if (!process.env.WORK_ITEM_ID || isNaN(parseInt(process.env.WORK_ITEM_ID))) {
    throw new Error('环境变量 WORK_ITEM_ID 未设置或不是有效数字。');
  }

  const { default: TFSClient } = await import(new URL('file://' + tfsClientPath + '/tfs-client.mjs'));
  const client = new TFSClient();
  const workItemId = parseInt(process.env.WORK_ITEM_ID);
  const needFrontend = process.env.CREATE_FRONTEND === 'true';
  const needBackend = process.env.CREATE_BACKEND === 'true';
  const currentUser = process.env.CURRENT_USER || '';

  const needCreateTask = needFrontend || needBackend;

  if (!needCreateTask) {
    console.log('无需创建任务');
    return;
  }

  // 获取父工作项信息
  const parent = await client.getWorkItem(workItemId);
  const parentTitle = parent.fields?.['System.Title'] || '';
  const project = parent.fields?.['System.TeamProject'] || '';
  const areaPath = parent.fields?.['System.AreaPath'] || '';
  const iterationPath = parent.fields?.['System.IterationPath'] || '';

  if (!project) {
    throw new Error('无法获取工作项所属项目');
  }

  // 从 relations 中获取子任务
  const relations = parent.relations || [];
  const childUrls = relations
    .filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward')
    .map(r => {
      const match = r.url.match(/workItems\/(\d+)$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(id => id !== null);

  console.log(`需求 [${workItemId}] ${parentTitle}，共有 ${childUrls.length} 个子任务`);

  // 获取子任务详情
  let hasCurrentUserTask = false;

  if (childUrls.length > 0) {
    const children = await client.getWorkItems(childUrls);
    for (const child of children) {
      const title = child.fields?.['System.Title'] || '';
      const state = child.fields?.['System.State'] || '';

      // 检查当前用户是否已有子任务（不限状态）
      if (currentUser) {
        const assignedTo = child.fields?.['System.AssignedTo'] || '';
        const assignedToStr = typeof assignedTo === 'string'
          ? assignedTo
          : (assignedTo?.displayName || assignedTo?.uniqueName || assignedTo?.id || '');
        if (assignedToStr && assignedToStr.toLowerCase().includes(currentUser.toLowerCase())) {
          hasCurrentUserTask = true;
          console.log(`  当前用户 [${currentUser}] 已有任务: [${child.id}] ${title} (${state})`);
        }
      }
    }
  }

  // 当前用户已有子任务，强制跳过创建
  if (hasCurrentUserTask) {
    console.log(`当前用户 [${currentUser}] 已有子任务，跳过创建`);
    return;
  }

  // 创建任务
  const scopeDesc = [];
  if (needFrontend) scopeDesc.push('前端');
  if (needBackend) scopeDesc.push('后端');

  console.log(`正在创建任务: ${parentTitle}`);
  const result = await client.createWorkItem({
    project,
    type: '任务',
    title: parentTitle,
    description: `自动创建的任务，涉及${scopeDesc.join('和')}开发，关联需求: ${parentTitle}`,
    areaPath,
    iterationPath,
    parentId: workItemId,
  });
  console.log(`  创建成功: [${result.id}] ${result.fields?.['System.Title'] || parentTitle}`);
  console.log('任务创建完成');
}

main().catch(err => {
  const safeMessage = err.message.replace(/Basic\s+[A-Za-z0-9+/=]+/g, 'Basic [REDACTED]');
  console.error(safeMessage);
  process.exit(1);
});
