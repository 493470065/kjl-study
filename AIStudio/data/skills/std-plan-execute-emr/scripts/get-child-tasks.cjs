/**
 * 获取需求工作项下的未关闭子任务
 *
 * 通过 TFS Client 直接获取工作项的 relations（MCP get_work_item 不返回 relations），
 * 筛选 Hierarchy-Forward 类型的子工作项，返回未关闭的 Task 列表。
 *
 * 环境变量：
 *   WORK_ITEM_ID - 需求工作项ID（必填）
 *   TFS_CLIENT_DIR - tfs-client.mjs 所在目录（必填）
 *
 * 输出格式（JSON）：
 *   [
 *     { "id": 123, "title": "...", "state": "Active", "type": "Task" },
 *     ...
 *   ]
 */

const fs = require('fs');
const path = require('path');

const CLOSED_STATES = new Set(['Closed', '已关闭', 'Done', '已完成', 'Resolved', '已解决', 'Removed', '已删除']);

function redactSensitive(msg) {
  return String(msg).replace(/Basic\s+[A-Za-z0-9+/=]+/g, '[REDACTED]');
}

async function main() {
  // 输入校验
  const tfsClientDir = process.env.TFS_CLIENT_DIR;
  if (!tfsClientDir) {
    throw new Error('环境变量 TFS_CLIENT_DIR 未设置');
  }
  const tfsClientPath = path.resolve(tfsClientDir);
  if (!fs.existsSync(tfsClientPath)) {
    throw new Error(`TFS_CLIENT_DIR 路径不存在: ${tfsClientPath}`);
  }
  const tfsClientFile = path.join(tfsClientPath, 'tfs-client.mjs');
  if (!fs.existsSync(tfsClientFile)) {
    throw new Error(`tfs-client.mjs 不存在于: ${tfsClientPath}`);
  }

  const workItemIdRaw = process.env.WORK_ITEM_ID;
  if (!workItemIdRaw || isNaN(Number(workItemIdRaw))) {
    throw new Error('环境变量 WORK_ITEM_ID 未设置或非数字');
  }
  const workItemId = parseInt(workItemIdRaw);

  const { default: TFSClient } = await import(new URL('file://' + tfsClientFile));
  const client = new TFSClient();

  // 获取父工作项（含 relations）
  const parent = await client.getWorkItem(workItemId);
  const parentTitle = parent.fields?.['System.Title'] || '';

  // 从 relations 中获取子工作项 ID
  const relations = parent.relations || [];
  const childIds = relations
    .filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward')
    .map(r => {
      const match = r.url.match(/workItems\/(\d+)$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(id => id !== null);

  console.error(`需求 [${workItemId}] ${parentTitle}，共有 ${childIds.length} 个子工作项`);

  if (childIds.length === 0) {
    console.log(JSON.stringify([]));
    return;
  }

  // 批量获取子工作项详情
  const children = await client.getWorkItems(childIds);

  // 筛选未关闭的 Task
  const openTasks = children
    .filter(child => {
      const state = child.fields?.['System.State'] || '';
      const type = child.fields?.['System.WorkItemType'] || '';
      return !CLOSED_STATES.has(state) && (type === 'Task' || type === '任务');
    })
    .map(child => ({
      id: child.id,
      title: child.fields?.['System.Title'] || '',
      state: child.fields?.['System.State'] || '',
      type: child.fields?.['System.WorkItemType'] || 'Task'
    }));

  console.error(`其中 ${openTasks.length} 个未关闭的 Task：`);
  for (const t of openTasks) {
    console.error(`  [${t.id}] ${t.title} (${t.state})`);
  }

  // JSON 输出到 stdout 供 Claude 解析
  console.log(JSON.stringify(openTasks));
}

main().catch(err => { console.error('获取子任务失败:', redactSensitive(err.message)); process.exit(1); });
