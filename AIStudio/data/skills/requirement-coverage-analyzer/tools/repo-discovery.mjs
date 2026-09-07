import { execSync } from 'child_process';
import path from 'path';

/**
 * 从 Git 远程 URL 提取仓库名
 * @param {string} url - Git 远程 URL
 * @returns {string|null} 仓库名或 null
 */
function extractRepoNameFromUrl(url) {
  if (!url) return null;

  // 格式1: .../_git/repoName 或 .../_git/repoName.git
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
 * 扫描本地目录查找所有Git仓库
 * 支持多种目录结构：
 * - 2层: rootDir/{repoName}/{branch}/.git
 * - 3层: rootDir/{repoName}/{branchGroup}/{branch}/.git
 * - N层: 自动适配
 * @param {string} rootDir - 仓库根目录
 * @returns {Promise<Array>} 仓库列表
 */
export async function scanLocalRepos(rootDir) {
  try {
    const result = execSync(
      `find "${rootDir}" -name ".git" -type d 2>/dev/null`,
      { encoding: 'utf-8' }
    );

    const gitDirs = result.trim().split('\n').filter(Boolean);

    const repos = gitDirs.map(gitDir => {
      // .git 所在的目录（工作目录）
      const workDir = gitDir.substring(0, gitDir.lastIndexOf('/'));

      // 计算相对于 rootDir 的路径
      const relativePath = path.relative(rootDir, workDir);
      const pathParts = relativePath.split(path.sep);

      // 分离仓库名（第一段）和分支名（剩余部分）
      const dirRepoName = pathParts[0] || '';
      const branch = pathParts.length > 1 ? pathParts.slice(1).join('/') : null;

      try {
        const remoteUrl = execSync(
          `cd "${workDir}" && git remote get-url origin 2>/dev/null`,
          { encoding: 'utf-8' }
        ).trim();

        // 从 remote URL 提取真实仓库名（唯一可靠来源）
        const actualRepoName = extractRepoNameFromUrl(remoteUrl) || dirRepoName;

        return {
          dir: workDir,
          name: actualRepoName,
          branch: branch,
          relativePath: relativePath,
          remoteUrl: remoteUrl,
          exists: true
        };
      } catch (e) {
        return {
          dir: workDir,
          name: dirRepoName,
          branch: branch,
          relativePath: relativePath,
          remoteUrl: null,
          exists: true
        };
      }
    });

    return repos;
  } catch (error) {
    console.error(`扫描仓库目录失败: ${error.message}`);
    return [];
  }
}

/**
 * 根据repositoryId匹配本地仓库
 */
export async function discoverRepo(repositoryId, rootDir, repoCache = {}) {
  // 1. 从缓存获取仓库信息
  const repoInfo = repoCache[repositoryId];
  if (!repoInfo) {
    console.log(`  警告: 仓库缓存中未找到 ${repositoryId}`);
    return null;
  }

  // 2. 扫描本地目录
  const localRepos = await scanLocalRepos(rootDir);

  // 3. 匹配策略：仓库名或remote URL
  const matched = localRepos.find(repo => {
    // 精确匹配仓库名
    if (repo.name === repoInfo.name) return true;

    // 匹配remote URL
    if (repo.remoteUrl && repo.remoteUrl.includes(repoInfo.name)) return true;

    return false;
  });

  if (matched) {
    console.log(`  ✓ 匹配仓库: ${matched.name} (${matched.dir})`);
    return matched;
  }

  console.log(`  ✗ 未找到匹配的本地仓库: ${repoInfo.name}`);
  return null;
}

/**
 * 加载TFS仓库缓存
 */
export async function loadRepoCache(cachePath) {
  const fs = await import('fs/promises');
  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log(`  仓库缓存文件不存在: ${cachePath}`);
    return {};
  }
}
