#!/usr/bin/env node
/**
 * 本地仓库索引管理模块
 * 扫描本地目录，建立 Git 仓库索引，通过 remote URL 匹配 TFS 仓库
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 索引文件默认路径
const DEFAULT_INDEX_PATH = '../config/local-repos-index.json';

/**
 * 加载本地仓库索引
 * @param {string} indexPath - 索引文件路径
 * @returns {Promise<Object>} 索引数据
 */
export async function loadLocalRepoIndex(indexPath = null) {
  const filePath = indexPath || path.join(__dirname, DEFAULT_INDEX_PATH);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 索引文件不存在，返回空结构
    return {
      version: '1.0',
      basePath: '',
      lastUpdated: null,
      repositories: {}
    };
  }
}

/**
 * 保存本地仓库索引
 * @param {Object} indexData - 索引数据
 * @param {string} indexPath - 索引文件路径
 */
export async function saveLocalRepoIndex(indexData, indexPath = null) {
  const filePath = indexPath || path.join(__dirname, DEFAULT_INDEX_PATH);
  const dir = path.dirname(filePath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });

  indexData.lastUpdated = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(indexData, null, 2), 'utf-8');
}

/**
 * 从目录读取 Git 远程 URL
 * @param {string} dirPath - 目录路径
 * @returns {string|null} 远程 URL 或 null
 */
function getGitRemoteUrl(dirPath) {
  try {
    const url = execSync('git remote get-url origin', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return url;
  } catch (error) {
    return null;
  }
}

/**
 * 获取当前分支
 * @param {string} dirPath - 目录路径
 * @returns {string|null} 分支名或 null
 */
function getCurrentBranch(dirPath) {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return branch;
  } catch (error) {
    return null;
  }
}

/**
 * 获取当前 HEAD 提交
 * @param {string} dirPath - 目录路径
 * @returns {string|null} 提交 ID 或 null
 */
function getHeadCommit(dirPath) {
  try {
    const commit = execSync('git rev-parse HEAD', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return commit;
  } catch (error) {
    return null;
  }
}

/**
 * 从 TFS 仓库 URL 提取仓库 ID
 * @param {string} url - Git 远程 URL
 * @returns {string|null} 仓库 ID 或 null
 */
function extractRepoIdFromUrl(url) {
  if (!url) return null;

  // 匹配 TFS Git URL 格式
  // http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_apis/git/repositories/xxx-xxx-xxx
  const match = url.match(/repositories\/([a-f0-9-]+)/i);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * 从 TFS 仓库 URL 提取项目名
 * @param {string} url - Git 远程 URL
 * @returns {string|null} 项目名或 null
 */
function extractProjectFromUrl(url) {
  if (!url) return null;

  // 匹配 TFS 项目名
  // http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_git/repoName
  // 或 http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_apis/git/repositories/xxx
  let match = url.match(/tfs\/([^/]+)\/_git\/([^/]+)/i);
  if (match) {
    return match[2];
  }

  return null;
}

/**
 * 从 URL 提取仓库名
 * @param {string} url - Git 远程 URL
 * @returns {string|null} 仓库名或 null
 */
function extractRepoNameFromUrl(url) {
  if (!url) return null;

  // 尝试多种格式
  // 格式1: .../_git/repoName
  let match = url.match(/_git\/([^/]+?)(?:\.git)?$/i);
  if (match) {
    return match[1].replace(/\.git$/, '');
  }

  // 格式2: .../repoName.git
  match = url.match(/\/([^/]+?)(?:\.git)?$/i);
  if (match) {
    return match[1].replace(/\.git$/, '');
  }

  return null;
}

/**
 * 扫描目录查找 Git 仓库
 * 支持两种目录结构：
 * 1. 服务器结构: /storage/repos/{仓库编码}/{分支}/.git
 * 2. 本地结构: /repos/{仓库编码}/.git
 * @param {string} baseDir - 基础目录
 * @param {Object} tfsRepoCache - TFS 仓库缓存（用于匹配）
 * @param {number} maxDepth - 最大扫描深度
 * @returns {Promise<Object>} 仓库信息映射
 */
async function scanDirectoryForRepos(baseDir, tfsRepoCache = {}, maxDepth = 3) {
  const repositories = {};

  // 检测目录结构类型
  // 服务器结构: baseDir/{repoName}/{branch}/.git
  // 本地结构: baseDir/{repoName}/.git

  async function scanServerStructure() {
    // 服务器结构: storage/repos/{repoName}/{branch}/.git
    // 或 storage/repos/{repoName}/{branchGroup}/{branch}/.git (3层)
    try {
      const repoDirs = await fs.readdir(baseDir, { withFileTypes: true });

      for (const repoDir of repoDirs) {
        if (!repoDir.isDirectory()) continue;

        // 排除 reports 目录（报告输出目录，不是代码仓库）
        if (repoDir.name === 'reports') continue;

        const dirRepoName = repoDir.name;
        const repoPath = path.join(baseDir, dirRepoName);

        // 递归扫描分支目录，支持任意层级
        await scanBranchDir(repoPath, dirRepoName, '');
      }
    } catch (e) {
      // 无法读取基础目录
    }

    // 递归扫描分支目录
    async function scanBranchDir(currentPath, dirRepoName, branchPrefix) {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const entryPath = path.join(currentPath, entry.name);
          const gitPath = path.join(entryPath, '.git');

          // 构建完整的分支路径（包含前缀）
          const branchPath = branchPrefix ? `${branchPrefix}/${entry.name}` : entry.name;

          try {
            const stat = await fs.stat(gitPath);
            if (stat.isDirectory() || stat.isFile()) {
              // 这是一个 Git 仓库
              const remoteUrl = getGitRemoteUrl(entryPath);
              if (remoteUrl) {
                const repoId = extractRepoIdFromUrl(remoteUrl);
                // 从 remote URL 提取真实仓库名（唯一可靠来源）
                const actualRepoName = extractRepoNameFromUrl(remoteUrl) || dirRepoName;

                // 从 TFS 缓存匹配
                let tfsRepoInfo = null;
                if (repoId && tfsRepoCache[repoId]) {
                  tfsRepoInfo = tfsRepoCache[repoId];
                } else {
                  for (const [id, repo] of Object.entries(tfsRepoCache)) {
                    if (repo.url && remoteUrl.includes(repo.id)) {
                      tfsRepoInfo = repo;
                      break;
                    }
                  }
                }

                // 使用 仓库名@分支 作为 key，支持多分支
                const key = `${actualRepoName}@${branchPath}`;

                repositories[key] = {
                  relativePath: `${dirRepoName}/${branchPath}`,
                  remoteUrl: remoteUrl,
                  repoId: repoId || (tfsRepoInfo?.id) || null,
                  repoName: actualRepoName,
                  branch: branchPath,
                  projectName: tfsRepoInfo?.project || extractProjectFromUrl(remoteUrl) || null,
                  currentBranch: getCurrentBranch(entryPath),
                  lastCommit: getHeadCommit(entryPath),
                  lastScanned: new Date().toISOString(),
                  missing: false
                };

                // 同时记录一个默认版本（不带分支后缀），优先使用 sr-next 分支
                // 优先级: sr-next > master > main > 其他分支
                const currentDefault = repositories[actualRepoName];
                const shouldUpdate =
                  branchPath === 'sr-next' ||  // sr-next 最高优先级
                  (!currentDefault) ||  // 首次添加
                  (branchPath === 'master' && currentDefault?.branch !== 'sr-next') ||  // master 次优先级
                  (branchPath === 'main' && currentDefault?.branch !== 'sr-next' && currentDefault?.branch !== 'master');  // main 再次

                if (shouldUpdate) {
                  repositories[actualRepoName] = repositories[key];
                }
              }
            }
          } catch (e) {
            // 没有 .git，递归扫描下一层
            await scanBranchDir(entryPath, dirRepoName, branchPath);
          }
        }
      } catch (e) {
        // 无法读取目录
      }
    }
  }

  async function scanLocalStructure(dirPath, depth = 0) {
    // 本地结构: {basePath}/{repoName}/.git
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const fullPath = path.join(dirPath, entry.name);
        const gitPath = path.join(fullPath, '.git');

        try {
          const stat = await fs.stat(gitPath);
          if (stat.isDirectory() || stat.isFile()) {
            const remoteUrl = getGitRemoteUrl(fullPath);
            if (remoteUrl) {
              const repoId = extractRepoIdFromUrl(remoteUrl);
              const repoName = extractRepoNameFromUrl(remoteUrl) || entry.name;

              let tfsRepoInfo = null;
              if (repoId && tfsRepoCache[repoId]) {
                tfsRepoInfo = tfsRepoCache[repoId];
              } else {
                for (const [id, repo] of Object.entries(tfsRepoCache)) {
                  if (repo.url && remoteUrl.includes(repo.id)) {
                    tfsRepoInfo = repo;
                    break;
                  }
                }
              }

              // 只在条目不存在时才添加（不覆盖 scanServerStructure 的结果）
              if (!repositories[repoName]) {
                const relativePath = path.relative(baseDir, fullPath);
                repositories[repoName] = {
                  relativePath: relativePath,
                  remoteUrl: remoteUrl,
                  repoId: repoId || (tfsRepoInfo?.id) || null,
                  repoName: repoName,
                  projectName: tfsRepoInfo?.project || extractProjectFromUrl(remoteUrl) || null,
                  currentBranch: getCurrentBranch(fullPath),
                  lastCommit: getHeadCommit(fullPath),
                  lastScanned: new Date().toISOString(),
                  missing: false
                };
              }
            }
          }
        } catch (e) {
          if (depth < maxDepth) {
            await scanLocalStructure(fullPath, depth + 1);
          }
        }
      }
    } catch (error) {
      // 忽略
    }
  }

  // 同时扫描两种结构（服务器上可能混合存在）
  // 1. 服务器结构: baseDir/{repoName}/{branch}/.git
  await scanServerStructure();

  // 2. 本地结构: baseDir/{repoName}/.git（总是尝试，补充未找到的仓库）
  await scanLocalStructure(baseDir);

  return repositories;
}

/**
 * 初始化或更新本地仓库索引
 * @param {string} basePath - 仓库根目录
 * @param {Object} tfsRepoCache - TFS 仓库缓存
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<Object>} 索引数据
 */
export async function initOrUpdateIndex(basePath, tfsRepoCache = {}, forceRefresh = false) {
  let indexData = await loadLocalRepoIndex();

  // 检查是否需要全量扫描
  const needFullScan = forceRefresh ||
    !indexData.lastUpdated ||
    indexData.basePath !== basePath;

  if (needFullScan) {
    console.log('  扫描本地仓库目录...');
    const repositories = await scanDirectoryForRepos(basePath, tfsRepoCache);

    indexData = {
      version: '1.0',
      basePath: basePath,
      lastUpdated: new Date().toISOString(),
      repositories: repositories
    };

    await saveLocalRepoIndex(indexData);
    console.log(`  已建立索引: ${Object.keys(repositories).length} 个仓库`);
  }

  return indexData;
}

/**
 * 根据仓库名或 ID 查找本地路径
 * @param {string} repoNameOrId - 仓库名或 ID
 * @param {Object} indexData - 索引数据
 * @param {string} preferredBranch - 首选分支（可选）
 * @returns {Object|null} { localPath, repoInfo } 或 null
 */
export function findLocalRepoPath(repoNameOrId, indexData, preferredBranch = null) {
  if (!indexData || !indexData.repositories) return null;

  // 如果没有指定分支，优先尝试 sr-next 分支
  const branchPriority = preferredBranch ? [preferredBranch] : ['sr-next'];

  // 按分支优先级查找
  for (const branch of branchPriority) {
    const keyWithBranch = `${repoNameOrId}@${branch}`;
    if (indexData.repositories[keyWithBranch]) {
      const repoInfo = indexData.repositories[keyWithBranch];
      if (!repoInfo.missing) {
        return {
          localPath: path.join(indexData.basePath, repoInfo.relativePath),
          repoInfo: repoInfo
        };
      }
    }
  }

  // 如果指定了分支，优先查找 仓库名@分支 格式
  if (preferredBranch) {
    const keyWithBranch = `${repoNameOrId}@${preferredBranch}`;
    if (indexData.repositories[keyWithBranch]) {
      const repoInfo = indexData.repositories[keyWithBranch];
      if (!repoInfo.missing) {
        return {
          localPath: path.join(indexData.basePath, repoInfo.relativePath),
          repoInfo: repoInfo
        };
      }
    }
  }

  // 先按仓库名查找（这里已经根据优先级设置了默认版本）
  if (indexData.repositories[repoNameOrId]) {
    const repoInfo = indexData.repositories[repoNameOrId];
    if (!repoInfo.missing) {
      return {
        localPath: path.join(indexData.basePath, repoInfo.relativePath),
        repoInfo: repoInfo
      };
    }
  }

  // 按 repoId 查找
  for (const [name, repo] of Object.entries(indexData.repositories)) {
    if (repo.repoId === repoNameOrId && !repo.missing) {
      // 跳过带分支后缀的 key，只返回主版本
      if (name.includes('@')) continue;
      return {
        localPath: path.join(indexData.basePath, repo.relativePath),
        repoInfo: repo
      };
    }
  }

  // 如果 repoNameOrId 是 UUID 格式，尝试通过 TFS API URL 匹配
  // 因为本地索引的 remoteUrl 是 _git 格式，不包含 UUID
  // 但 TFS API 支持通过 UUID 查询仓库，返回的 URL 中包含 UUID
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (uuidPattern.test(repoNameOrId)) {
    // 尝试调用 TFS API 获取仓库名称
    try {
      const tfsConfig = global.tfsConfig || {};
      const serverUrl = tfsConfig.serverUrl || 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0';
      const pat = tfsConfig.pat || process.env.TFS_PAT;

      if (pat) {
        const apiUrl = `${serverUrl}/_apis/git/repositories/${repoNameOrId}?api-version=4.1`;
        const response = execSync(`curl -s -u :${pat} "${apiUrl}"`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        const repoData = JSON.parse(response);
        if (repoData && repoData.name) {
          // 递归调用，用仓库名查找
          return findLocalRepoPath(repoData.name, indexData, preferredBranch);
        }
      }
    } catch (e) {
      // API 调用失败，忽略
    }
  }

  return null;
}

/**
 * 标记仓库为缺失
 * @param {string} repoName - 仓库名
 * @param {string} indexPath - 索引文件路径
 */
export async function markRepoMissing(repoName, indexPath = null) {
  const indexData = await loadLocalRepoIndex(indexPath);
  if (indexData.repositories[repoName]) {
    indexData.repositories[repoName].missing = true;
    await saveLocalRepoIndex(indexData, indexPath);
  }
}

/**
 * 获取索引状态摘要
 * @param {Object} indexData - 索引数据
 * @returns {Object} 状态摘要
 */
export function getIndexStatus(indexData) {
  const repos = indexData?.repositories || {};
  const total = Object.keys(repos).length;
  const missing = Object.values(repos).filter(r => r.missing).length;
  const active = total - missing;

  return {
    basePath: indexData?.basePath || '',
    lastUpdated: indexData?.lastUpdated || null,
    totalRepos: total,
    activeRepos: active,
    missingRepos: missing,
    repositories: Object.keys(repos)
  };
}

/**
 * 按需添加仓库到索引
 * @param {string} repoName - 仓库名
 * @param {string} basePath - 基础路径
 * @param {Object} tfsRepoCache - TFS 仓库缓存
 * @param {string} indexPath - 索引文件路径
 * @returns {Promise<Object|null>} 仓库信息或 null
 */
export async function addRepoToIndex(repoName, basePath, tfsRepoCache = {}, indexPath = null) {
  const indexData = await loadLocalRepoIndex(indexPath);

  // 确保 basePath 一致
  if (indexData.basePath !== basePath) {
    indexData.basePath = basePath;
  }

  // 检查是否已存在
  if (indexData.repositories[repoName] && !indexData.repositories[repoName].missing) {
    return indexData.repositories[repoName];
  }

  // 扫描查找该仓库
  const dirPath = path.join(basePath, repoName);
  try {
    const gitPath = path.join(dirPath, '.git');
    const stat = await fs.stat(gitPath);

    if (stat.isDirectory() || stat.isFile()) {
      const remoteUrl = getGitRemoteUrl(dirPath);
      if (remoteUrl) {
        const repoId = extractRepoIdFromUrl(remoteUrl);

        // 从 TFS 缓存匹配
        let tfsRepoInfo = null;
        if (repoId && tfsRepoCache[repoId]) {
          tfsRepoInfo = tfsRepoCache[repoId];
        }

        indexData.repositories[repoName] = {
          relativePath: repoName,
          remoteUrl: remoteUrl,
          repoId: repoId || (tfsRepoInfo?.id) || null,
          repoName: repoName,
          projectName: tfsRepoInfo?.project || null,
          currentBranch: getCurrentBranch(dirPath),
          lastCommit: getHeadCommit(dirPath),
          lastScanned: new Date().toISOString(),
          missing: false
        };

        await saveLocalRepoIndex(indexData, indexPath);
        return indexData.repositories[repoName];
      }
    }
  } catch (e) {
    // 目录不存在或不是 Git 仓库
  }

  return null;
}

/**
 * 批量检查仓库本地状态
 * @param {Array} tfsRepos - TFS 仓库列表
 * @param {Object} indexData - 本地索引数据
 * @returns {Array} 带本地状态的仓库列表
 */
export function checkReposStatus(tfsRepos, indexData) {
  if (!tfsRepos || tfsRepos.length === 0) {
    return [];
  }

  if (!indexData || !indexData.repositories) {
    return tfsRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      project: repo.project,
      defaultBranch: repo.defaultBranch,
      url: repo.url,
      localExists: false,
      localPath: null
    }));
  }

  return tfsRepos.map(repo => {
    const localPath = findLocalRepoPath(repo.name, indexData) ||
                      findLocalRepoPath(repo.id, indexData);
    // 优先使用本地仓库的实际分支，没有则使用 TFS 默认分支
    const actualBranch = localPath?.repoInfo?.branch || repo.defaultBranch;
    return {
      id: repo.id,
      name: repo.name,
      project: repo.project,
      defaultBranch: actualBranch,
      url: repo.url,
      localExists: !!localPath,
      localPath: localPath?.localPath || null
    };
  });
}

/**
 * 获取仓库状态统计
 * @param {Array} reposStatus - 仓库状态列表
 * @returns {Object} 统计信息
 */
export function getReposStatusSummary(reposStatus) {
  const total = reposStatus.length;
  const localExists = reposStatus.filter(r => r.localExists).length;
  const missing = total - localExists;

  return {
    total,
    localExists,
    missing,
    existsPercent: total > 0 ? Math.round((localExists / total) * 100) : 0
  };
}

export default {
  loadLocalRepoIndex,
  saveLocalRepoIndex,
  initOrUpdateIndex,
  findLocalRepoPath,
  markRepoMissing,
  getIndexStatus,
  addRepoToIndex,
  checkReposStatus,
  getReposStatusSummary
};
