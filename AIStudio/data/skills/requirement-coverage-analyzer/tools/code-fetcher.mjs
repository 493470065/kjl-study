#!/usr/bin/env node
/**
 * 代码获取模块
 * 根据提交信息获取代码变更和文件内容
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 获取提交的变更文件列表
 * @param {string} repoPath - 仓库路径
 * @param {string} commitId - 提交 ID
 * @returns {Array} 变更文件列表
 */
export function getCommitChangedFiles(repoPath, commitId) {
  try {
    // 获取变更文件统计
    const output = execSync(
      `git show ${commitId} --stat --format="" --name-status`,
      {
        cwd: repoPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB
      }
    ).trim();

    if (!output) return [];

    const files = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // 格式: A/M/D\tfilename
      const match = line.match(/^([AMD])\s+(.+)$/);
      if (match) {
        const changeType = match[1];
        const filePath = match[2].trim();

        files.push({
          path: filePath,
          changeType: changeType === 'A' ? '新增' : changeType === 'M' ? '修改' : '删除',
          changeTypeCode: changeType
        });
      }
    }

    return files;
  } catch (error) {
    console.error(`获取提交变更失败: ${error.message}`);
    return [];
  }
}

/**
 * 获取提交的详细 diff
 * @param {string} repoPath - 仓库路径
 * @param {string} commitId - 提交 ID
 * @param {string} filePath - 文件路径（可选，指定文件）
 * @returns {string} diff 内容
 */
export function getCommitDiff(repoPath, commitId, filePath = null) {
  try {
    let cmd = `git show ${commitId} --format="" -p`;
    if (filePath) {
      cmd += ` -- "${filePath}"`;
    }

    const output = execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB
    });

    return output;
  } catch (error) {
    console.error(`获取 diff 失败: ${error.message}`);
    return '';
  }
}

/**
 * 获取文件在特定提交时的内容
 * @param {string} repoPath - 仓库路径
 * @param {string} commitId - 提交 ID
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件内容或 null
 */
export function getFileContentAtCommit(repoPath, commitId, filePath) {
  try {
    const output = execSync(
      `git show ${commitId}:"${filePath}"`,
      {
        cwd: repoPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB
      }
    );

    return output;
  } catch (error) {
    // 文件可能不存在或已删除
    return null;
  }
}

/**
 * 获取文件的当前内容
 * @param {string} repoPath - 仓库路径
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件内容或 null
 */
export async function getCurrentFileContent(repoPath, filePath) {
  try {
    const fullPath = path.join(repoPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    return null;
  }
}

/**
 * 解析 diff 统计行数变化
 * @param {string} diff - diff 内容
 * @returns {Object} { added, deleted }
 */
export function parseDiffStats(diff) {
  let added = 0;
  let deleted = 0;

  const lines = diff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deleted++;
    }
  }

  return { added, deleted };
}

/**
 * 获取提交的完整变更信息
 * @param {string} repoPath - 仓库路径
 * @param {string} commitId - 提交 ID
 * @param {Object} commitInfo - 提交基本信息（包含作者、日期、备注等）
 * @param {number} maxFileSize - 最大文件大小限制（字节）
 * @returns {Promise<Object>} 变更信息
 */
export async function getCommitChanges(repoPath, commitId, commitInfo = {}, maxFileSize = 1024 * 1024) {
  const result = {
    commitId: commitId,
    taskId: commitInfo.linkedTaskId || null,
    commitMessage: commitInfo.comment || '',
    author: commitInfo.author?.name || commitInfo.author?.displayName || 'Unknown',
    date: commitInfo.author?.date || null,
    files: [],
    totalAdded: 0,
    totalDeleted: 0
  };

  // 获取变更文件列表
  const changedFiles = getCommitChangedFiles(repoPath, commitId);

  for (const file of changedFiles) {
    // 获取该文件的 diff
    const diff = getCommitDiff(repoPath, commitId, file.path);
    const stats = parseDiffStats(diff);

    // 获取文件内容（如果文件不太大）
    let content = null;
    if (file.changeTypeCode !== 'D') { // 不获取已删除的文件
      try {
        const contentPath = path.join(repoPath, file.path);
        const stat = await fs.stat(contentPath);
        if (stat.size <= maxFileSize) {
          content = await getCurrentFileContent(repoPath, file.path);
        }
      } catch (e) {
        // 文件可能不存在
      }
    }

    result.files.push({
      path: file.path,
      changeType: file.changeType,
      changeTypeCode: file.changeTypeCode,
      added: stats.added,
      deleted: stats.deleted,
      diff: diff,
      content: content
    });

    result.totalAdded += stats.added;
    result.totalDeleted += stats.deleted;
  }

  return result;
}

/**
 * 批量获取多个提交的变更
 * @param {string} repoPath - 仓库路径
 * @param {Array} commits - 提交列表
 * @param {number} maxFileSize - 最大文件大小限制
 * @returns {Promise<Array>} 变更信息列表
 */
export async function getBatchCommitChanges(repoPath, commits, maxFileSize = 1024 * 1024) {
  const results = [];
  const processedFiles = new Set(); // 避免重复处理同一文件

  for (const commit of commits) {
    try {
      const changes = await getCommitChanges(repoPath, commit.commitId, commit, maxFileSize);
      results.push(changes);
    } catch (error) {
      console.error(`处理提交 ${commit.commitId} 失败: ${error.message}`);
    }
  }

  return results;
}

/**
 * 从 TFS API 获取提交变更（降级方案）
 * @param {Object} tfsClient - TFS 客户端
 * @param {string} repoId - 仓库 ID
 * @param {string} commitId - 提交 ID
 * @param {string} project - 项目名
 * @param {number} maxFileSize - 最大文件大小（字节）
 * @returns {Promise<Object>} 变更信息
 */
export async function getCommitChangesFromTFS(tfsClient, repoId, commitId, project, maxFileSize = 1048576) {
  try {
    const gitApi = await tfsClient.client.getGitApi();

    // 获取提交变更列表
    const changes = await gitApi.getChanges(commitId, repoId, project);

    const result = {
      commitId: commitId,
      files: [],
      totalAdded: 0,
      totalDeleted: 0,
      source: 'tfs-api'
    };

    if (changes && changes.changes) {
      // 只处理前20个文件，避免请求过多
      const filesToProcess = changes.changes.slice(0, 20);

      for (const change of filesToProcess) {
        const filePath = change.item?.path || change.path || 'unknown';
        const changeType = mapTfsChangeType(change.changeType);

        const fileEntry = {
          path: filePath,
          changeType: changeType,
          changeTypeCode: change.changeType,
          added: 0,
          deleted: 0,
          diff: null,
          content: null
        };

        // 尝试获取文件内容（仅对新增和修改的文件）
        if (change.item?.objectId && (change.changeType === 'add' || change.changeType === 'edit')) {
          try {
            // 检查文件大小
            const fileSize = change.item?.size || 0;
            if (fileSize <= maxFileSize) {
              const content = await getFileContentFromTFS(gitApi, repoId, change.item.objectId, project);
              if (content) {
                fileEntry.content = content;
                // 简单估算行数
                const lines = content.split('\n').length;
                if (change.changeType === 'add') {
                  fileEntry.added = lines;
                } else {
                  // 对于编辑的文件，无法准确计算增删行数
                  fileEntry.added = Math.ceil(lines / 2);
                }
              }
            }
          } catch (contentError) {
            // 获取内容失败，继续处理其他文件
          }
        }

        result.files.push(fileEntry);
        result.totalAdded += fileEntry.added;
        result.totalDeleted += fileEntry.deleted;
      }

      // 如果还有更多文件未处理，添加提示
      if (changes.changes.length > 20) {
        result.moreFilesCount = changes.changes.length - 20;
      }
    }

    return result;
  } catch (error) {
    console.error(`从 TFS 获取变更失败: ${error.message}`);
    return null;
  }
}

/**
 * 映射 TFS 变更类型到中文
 * @param {string|number} changeType - TFS 变更类型
 * @returns {string} 中文变更类型
 */
function mapTfsChangeType(changeType) {
  // TFS API 可能返回数字类型的 changeType
  const numericTypeMap = {
    1: '新增',
    2: '修改',
    3: '删除',
    4: '重命名',
    5: '恢复',
    6: '分支'
  };

  // 字符串类型的映射
  const stringTypeMap = {
    'add': '新增',
    'edit': '修改',
    'delete': '删除',
    'rename': '重命名',
    'undelete': '恢复',
    'branch': '分支'
  };

  if (typeof changeType === 'number') {
    return numericTypeMap[changeType] || '未知';
  }

  if (typeof changeType === 'string') {
    return stringTypeMap[changeType.toLowerCase()] || changeType || '未知';
  }

  return '未知';
}

/**
 * 从 TFS 获取文件内容
 * @param {Object} gitApi - Git API 客户端
 * @param {string} repoId - 仓库 ID
 * @param {string} objectId - 文件对象 ID
 * @param {string} project - 项目名
 * @returns {Promise<string|null>} 文件内容
 */
async function getFileContentFromTFS(gitApi, repoId, objectId, project) {
  try {
    // 使用 getItemContent 获取文件内容
    const contentStream = await gitApi.getItemContent(repoId, project, undefined, undefined, undefined, false, false, false, {
      versionType: 0,  // commit
      version: objectId
    });

    if (!contentStream) return null;

    // 将流转换为字符串
    const chunks = [];
    for await (const chunk of contentStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * 检查本地仓库是否存在且有效
 * @param {string} repoPath - 仓库路径
 * @returns {Promise<boolean>} 是否有效
 */
export async function isRepoValid(repoPath) {
  try {
    const gitPath = path.join(repoPath, '.git');
    const stat = await fs.stat(gitPath);
    return stat.isDirectory() || stat.isFile();
  } catch (e) {
    return false;
  }
}

/**
 * 检查提交是否存在于本地
 * @param {string} repoPath - 仓库路径
 * @param {string} commitId - 提交 ID
 * @returns {boolean} 是否存在
 */
export function commitExistsLocally(repoPath, commitId) {
  try {
    execSync(`git cat-file -t ${commitId}`, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取本地仓库最新提交的信息
 * @param {string} repoPath - 仓库路径
 * @returns {Object|null} 提交信息 {commitId, date, author, message} 或 null
 */
export function getLocalHeadCommitInfo(repoPath) {
  try {
    const output = execSync(
      'git log -1 --format="%H|%aI|%an|%s"',
      {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    ).trim();

    if (!output) return null;

    const [commitId, date, author, message] = output.split('|');
    return {
      commitId: commitId,
      date: new Date(date),
      author: author,
      message: message
    };
  } catch (error) {
    return null;
  }
}

/**
 * 检测本地仓库是否需要同步
 * @param {string} repoPath - 仓库路径
 * @param {Date} remoteCommitDate - 远程提交日期
 * @returns {Object} {needsSync: boolean, localCommit: Object|null, message: string}
 */
export function checkRepoSyncStatus(repoPath, remoteCommitDate) {
  const result = {
    needsSync: false,
    localCommit: null,
    message: ''
  };

  const localCommit = getLocalHeadCommitInfo(repoPath);
  result.localCommit = localCommit;

  if (!localCommit) {
    result.needsSync = true;
    result.message = '无法获取本地仓库最新提交信息';
    return result;
  }

  if (!remoteCommitDate) {
    result.message = '无法获取远程提交日期进行比较';
    return result;
  }

  // 比较日期（考虑时区，只比较日期部分）
  const localDate = new Date(localCommit.date);
  localDate.setHours(0, 0, 0, 0);
  const remoteDate = new Date(remoteCommitDate);
  remoteDate.setHours(0, 0, 0, 0);

  if (localDate < remoteDate) {
    result.needsSync = true;
    const daysDiff = Math.ceil((remoteDate - localDate) / (1000 * 60 * 60 * 24));
    result.message = `本地代码落后远程 ${daysDiff} 天，建议同步`;
  } else {
    result.message = '本地代码已是最新';
  }

  return result;
}

export default {
  getCommitChangedFiles,
  getCommitDiff,
  getFileContentAtCommit,
  getCurrentFileContent,
  parseDiffStats,
  getCommitChanges,
  getBatchCommitChanges,
  getCommitChangesFromTFS,
  isRepoValid,
  commitExistsLocally,
  getLocalHeadCommitInfo,
  checkRepoSyncStatus
};
