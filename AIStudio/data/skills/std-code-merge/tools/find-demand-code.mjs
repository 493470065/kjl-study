#!/usr/bin/env node
/**
 * TFS 需求代码查询工具
 * 卫宁健康 WINNING-6.0 团队
 *
 * 一站式完成 需求 -> 任务 -> Bug -> 代码提交 的查询流程
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
 * 获取需求关联的任务
 */
async function getDemandTasks(demandId, client) {
  const witApi = await client.getWorkItemApi();
  const workItem = await witApi.getWorkItem(demandId, null, null, 'All', null);

  const tasks = [];
  if (workItem.relations) {
    for (const rel of workItem.relations) {
      if (rel.rel === 'System.LinkTypes.Hierarchy-Forward') {
        const targetId = parseInt(rel.url.split('/').pop());
        tasks.push(await client.getWorkItem(targetId));
      }
    }
  }

  return tasks;
}

/**
 * 获取任务关联的 Bug
 * @param {Object} task - 任务工作项对象
 * @param {Object} client - TFS 客户端实例
 * @returns {Promise<Object[]>} Bug 列表
 */
async function getTaskBugs(task, client) {
  const bugs = [];
  if (task.relations) {
    for (const rel of task.relations) {
      if (rel.rel === 'System.LinkTypes.Hierarchy-Forward') {
        const targetId = parseInt(rel.url.split('/').pop());
        const child = await client.getWorkItem(targetId);
        if (child.fields['System.WorkItemType'] === 'Bug') {
          bugs.push(child);
        }
      }
    }
  }
  return bugs;
}

/**
 * 在 Git 仓库中查找相关提交
 * @param {string[]} workItemIds - 工作项ID列表
 * @param {string} branch - 分支名称
 * @param {string} gitDir - Git 仓库路径（可选，默认为当前目录）
 */
function findCommits(workItemIds, branch, gitDir = '.') {
  const results = [];
  const ids = workItemIds.join('\\|');

  try {
    // 使用 cd 命令进入目录后执行 git，解决路径问题
    const cmd = `cd "${gitDir}" && git log ${branch} --grep="${ids}" --pretty=format:"%H|%s|%an|%ad" --date=iso`;
    const output = execSync(cmd, { encoding: 'utf-8', shell: true });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      const [hash, message, author, date] = line.split('|');
      if (!hash) continue;

      const showCmd = `cd "${gitDir}" && git show --name-only --pretty="" ${hash}`;
      const showOutput = execSync(showCmd, { encoding: 'utf-8', shell: true });

      const files = showOutput
        .trim()
        .split('\n')
        .filter(f => f && !f.startsWith('commit ') && !f.startsWith('Author:') && !f.startsWith('Date:'));

      results.push({
        hash,
        shortHash: hash.substring(0, 8),
        message,
        author,
        date: new Date(date).toLocaleString('zh-CN'),
        files: files.length,
        fileList: files
      });
    }
  } catch (error) {
    // 没有找到提交不算错误
  }

  return results;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const demandId = parseInt(args[0]);
  const branch = args[1] || 'HEAD';
  const gitDir = args[2] || '.';

  if (!demandId) {
    console.log(`
用法:
  node find-demand-code.mjs <需求号> [分支] [Git仓库路径]

示例:
  node find-demand-code.mjs 1205924 origin/sr-rc
  node find-demand-code.mjs 1205924 origin/sr-rc /d/dev/my-project
  node find-demand-code.mjs 1205924 HEAD
`);
    process.exit(1);
  }

  console.log('========================================');
  console.log('  TFS 需求代码查询工具');
  console.log('========================================\n');

  // 动态导入 TFS 客户端
  const TFSClient = await importTFSClient();
  const client = new TFSClient();

  // 1. 查询需求信息
  console.log('【1/4】查询需求信息...');
  const demand = await client.getWorkItem(demandId);

  console.log(`
需求信息:
  需求号: ${demand.id}
  标题: ${demand.fields['System.Title']}
  状态: ${demand.fields['System.State']}
  项目: ${demand.fields['System.TeamProject']}
  产品: ${demand.fields['Winning.Product.Name'] || '-'}
`);

  // 2. 查询关联任务
  console.log('【2/4】查询关联任务...');
  const tasks = await getDemandTasks(demandId, client);

  if (tasks.length === 0) {
    console.log('  未找到关联任务\n');
    return;
  }

  console.log(`  找到 ${tasks.length} 个任务:\n`);

  const taskIds = [];
  const bugIds = [];

  for (const task of tasks) {
    taskIds.push(task.id);
    console.log(`  任务 #${task.id}`);
    console.log(`    标题: ${task.fields['System.Title']}`);
    console.log(`    状态: ${task.fields['System.State']}`);

    // 3. 查询任务关联的 Bug
    const bugs = await getTaskBugs(task, client);
    if (bugs.length > 0) {
      console.log(`    关联 Bug: ${bugs.map(b => b.id).join(', ')}`);
      for (const bug of bugs) {
        bugIds.push(bug.id);
        console.log(`      - Bug #${bug.id}: ${bug.fields['System.Title']}`);
      }
    }
    console.log('');
  }

  // 4. 查找相关代码提交
  console.log('【3/4】查找代码提交...');
  const allIds = [...taskIds, ...bugIds];
  const commits = findCommits(allIds, branch, gitDir);

  if (commits.length === 0) {
    console.log(`  在分支 "${branch}" 上未找到相关提交\n`);
  } else {
    console.log(`  在分支 "${branch}" 上找到 ${commits.length} 个提交:\n`);

    for (const commit of commits) {
      console.log(`  ${commit.shortHash} - ${commit.message}`);
      console.log(`    作者: ${commit.author} | 日期: ${commit.date} | 文件: ${commit.files} 个`);
      console.log(`    修改的文件:`);
      for (const file of commit.fileList) {
        console.log(`      - ${file}`);
      }
      console.log('');
    }
  }

  // 汇总报告
  console.log('========================================');
  console.log('【4/4】汇总报告');
  console.log('========================================\n');

  console.log(`需求: #${demand.id} - ${demand.fields['System.Title']}`);
  console.log(`任务: ${tasks.length} 个 [${taskIds.join(', ')}]`);
  console.log(`Bug: ${bugIds.length} 个 [${bugIds.join(', ') || '无'}]`);
  console.log(`代码提交: ${commits.length} 个`);
  console.log(`查询分支: ${branch}\n`);

  console.log('========================================');
  console.log('查询完成！');
  console.log('========================================\n');

  // 输出 JSON 格式供其他工具使用
  console.log('JSON 输出:');
  console.log(JSON.stringify({
    demand: {
      id: demand.id,
      title: demand.fields['System.Title'],
      state: demand.fields['System.State']
    },
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.fields['System.Title'],
      state: t.fields['System.State']
    })),
    bugs: bugIds,
    commits: commits.map(c => ({
      hash: c.hash,
      shortHash: c.shortHash,
      message: c.message,
      author: c.author,
      date: c.date,
      files: c.files
    })),
    branch
  }, null, 2));
}

main().catch(error => {
  console.error('错误:', error.message);
  process.exit(1);
});