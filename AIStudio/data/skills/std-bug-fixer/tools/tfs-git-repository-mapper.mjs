#!/usr/bin/env node
/**
 * TFS Git Repository Mapper
 * 将TFS Bug映射到TFS Git仓库
 * 支持从TFS获取Git仓库列表并根据Bug信息匹配
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TFS仓库缓存路径
const REPOS_CACHE_FILE = path.join(__dirname, '../../tfs2018-integration/config/repos-cache.json');

/**
 * TFS Git仓库映射器类
 */
class TFSGitRepositoryMapper {
  constructor() {
    this.reposCache = null;
    this._loaded = false;
  }

  /**
   * 确保仓库缓存已加载
   */
  async _ensureLoaded() {
    if (this._loaded) return;

    try {
      // 尝试多个可能的路径
      const possiblePaths = [
        REPOS_CACHE_FILE,
        path.join(__dirname, '../../../tfs2018-integration/config/repos-cache.json'),
        path.join(process.cwd(), 'skills/tfs2018-integration/config/repos-cache.json')
      ];

      for (const cachePath of possiblePaths) {
        if (fs.existsSync(cachePath)) {
          const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          this.reposCache = cache.repositories || {};
          this._loaded = true;
          console.log(`✓ 已加载 ${Object.keys(this.reposCache).length} 个TFS Git仓库`);
          return;
        }
      }

      console.warn('⚠️  未找到TFS Git仓库缓存文件');
      console.warn('提示: 运行 node tfs2018-integration/tools/get-repos-cache.mjs 生成仓库缓存');
      this.reposCache = {};
      this._loaded = true;
    } catch (error) {
      console.error(`加载TFS Git仓库缓存失败: ${error.message}`);
      this.reposCache = {};
      this._loaded = true;
    }
  }

  /**
   * 根据Bug信息匹配TFS Git仓库
   * @param {object} bug - Bug对象
   * @returns {object|null} 匹配的仓库信息
   */
  async matchRepository(bug) {
    await this._ensureLoaded();

    if (Object.keys(this.reposCache).length === 0) {
      return null;
    }

    const { project, areaPath, title, description } = bug;
    const text = `${title} ${description || ''} ${areaPath || ''}`.toLowerCase();

    // 匹配分数最高的仓库
    let bestMatch = null;
    let bestScore = 0;
    let bestReason = '';

    for (const repo of Object.values(this.reposCache)) {
      let score = 0;
      let reason = '';

      // 1. 项目名精确匹配（最高优先级）
      if (project && repo.project === project) {
        score += 200;
        reason = `项目匹配: ${project}`;
      }

      // 2. 仓库名关键词匹配
      if (repo.name) {
        const repoNameLower = repo.name.toLowerCase();
        // 检查Bug标题是否包含仓库名的部分
        const repoNameWords = repoNameLower.replace(/[-_]/g, ' ').split(' ');
        for (const word of repoNameWords) {
          if (word.length > 2 && text.includes(word)) {
            score += 30;
            if (!reason) reason = `仓库名匹配: ${word}`;
          }
        }
      }

      // 3. AreaPath关键词匹配
      if (areaPath && repo.name) {
        const areaParts = areaPath.split('\\');
        for (const part of areaParts) {
          if (part.length > 2 && repo.name.toLowerCase().includes(part.toLowerCase())) {
            score += 50;
            if (!reason) reason = `AreaPath匹配: ${part}`;
          }
        }
      }

      // 4. 项目名称关键词匹配
      if (project) {
        const projectLower = project.toLowerCase();
        if (repo.name.toLowerCase().includes(projectLower) || projectLower.includes(repo.name.toLowerCase())) {
          score += 40;
          if (!reason) reason = `项目关键词匹配`;
        }
      }

      // 5. 常见模块关键词匹配
      const moduleKeywords = {
        '医生站': ['doctor', 'physician', 'outpatient', 'inpatient'],
        '护士站': ['nurse', 'nursing'],
        '门诊': ['outpatient', 'clinic'],
        '住院': ['inpatient', 'admission'],
        '急诊': ['emergency', 'er'],
        '药房': ['pharmacy', 'drug'],
        '医技': ['medical', 'exam', 'test'],
        '病案': ['medicalrecord', 'mr'],
        '手术': ['surgery', 'operation'],
        '检验': ['lab', 'laboratory'],
        '检查': ['exam', 'inspection']
      };

      for (const [module, keywords] of Object.entries(moduleKeywords)) {
        if (text.includes(module)) {
          const repoNameLower = repo.name.toLowerCase();
          for (const keyword of keywords) {
            if (repoNameLower.includes(keyword)) {
              score += 25;
              if (!reason) reason = `模块匹配: ${module}`;
            }
          }
        }
      }

      if (score > bestScore) {
        bestMatch = repo;
        bestScore = score;
        bestReason = reason;
      }
    }

    if (bestMatch) {
      return {
        id: bestMatch.id,
        name: bestMatch.name,
        project: bestMatch.project,
        projectId: bestMatch.projectId,
        collection: bestMatch.collection,
        url: bestMatch.url,
        defaultBranch: bestMatch.defaultBranch,
        webUrl: this._buildWebUrl(bestMatch),
        matchScore: bestScore,
        matchReason: bestReason
      };
    }

    return null;
  }

  /**
   * 构建Web URL用于在浏览器中打开
   */
  _buildWebUrl(repo) {
    if (!repo.url) return null;

    // TFS Git仓库URL格式转换
    // API URL: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_apis/git/repositories/{id}
    // Web URL: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_git/{name}

    try {
      const urlObj = new URL(repo.url);
      const parts = urlObj.pathname.split('/');

      // 处理 API URL 格式: /_apis/git/repositories/{id}
      const apisIndex = parts.indexOf('_apis');
      if (apisIndex > 0 && parts.includes('git') && parts.includes('repositories')) {
        // 获取collection路径（如 /tfs/WINNING-6.0）
        const collectionPath = parts.slice(0, apisIndex).join('/');
        // 构建Web URL: /tfs/WINNING-6.0/_git/{name}
        return `${urlObj.protocol}//${urlObj.host}${collectionPath}/_git/${repo.name}`;
      }

      // 处理已有 _git 的URL格式
      const gitIndex = parts.indexOf('_git');
      if (gitIndex > 0) {
        const basePath = parts.slice(0, gitIndex + 2).join('/');
        return `${urlObj.protocol}//${urlObj.host}${basePath}`;
      }

      return repo.url.split('.git')[0];
    } catch (e) {
      return repo.url;
    }
  }

  /**
   * 批量匹配Bug到仓库
   * @param {array} bugs - Bug数组
   * @returns {Promise<object>} 匹配结果 {matched, unmatched, stats}
   */
  async matchBugs(bugs) {
    await this._ensureLoaded();

    const results = {
      matched: [],
      unmatched: [],
      stats: {
        total: bugs.length,
        matched: 0,
        unmatched: 0,
        byProject: {},
        byRepository: {}
      }
    };

    for (const bug of bugs) {
      const repo = await this.matchRepository(bug);

      if (repo) {
        results.matched.push({
          bugId: bug.id,
          bugTitle: bug.title,
          bugProject: bug.project,
          repository: repo.name,
          repositoryId: repo.id,
          repositoryProject: repo.project,
          webUrl: repo.webUrl,
          matchScore: repo.matchScore,
          matchReason: repo.matchReason
        });

        results.stats.matched++;

        // 统计
        results.stats.byProject[bug.project] = (results.stats.byProject[bug.project] || 0) + 1;
        results.stats.byRepository[repo.name] = (results.stats.byRepository[repo.name] || 0) + 1;
      } else {
        results.unmatched.push({
          bugId: bug.id,
          bugTitle: bug.title,
          bugProject: bug.project
        });

        results.stats.unmatched++;
      }
    }

    return results;
  }

  /**
   * 获取所有仓库列表
   * @returns {Promise<array>} 仓库列表
   */
  async getAllRepositories() {
    await this._ensureLoaded();

    return Object.values(this.reposCache).map(repo => ({
      id: repo.id,
      name: repo.name,
      project: repo.project,
      collection: repo.collection,
      url: repo.url,
      webUrl: this._buildWebUrl(repo),
      defaultBranch: repo.defaultBranch
    }));
  }

  /**
   * 根据项目获取仓库列表
   * @param {string} projectName - 项目名称
   * @returns {Promise<array>} 仓库列表
   */
  async getRepositoriesByProject(projectName) {
    await this._ensureLoaded();

    return Object.values(this.reposCache)
      .filter(repo => repo.project === projectName)
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        project: repo.project,
        collection: repo.collection,
        url: repo.url,
        webUrl: this._buildWebUrl(repo),
        defaultBranch: repo.defaultBranch
      }));
  }

  /**
   * 生成仓库统计报告
   * @returns {Promise<object>} 统计信息
   */
  async getStats() {
    await this._ensureLoaded();

    const stats = {
      totalRepositories: Object.keys(this.reposCache).length,
      byProject: {},
      byCollection: {},
      topRepositories: []
    };

    for (const repo of Object.values(this.reposCache)) {
      // 按项目统计
      stats.byProject[repo.project] = (stats.byProject[repo.project] || 0) + 1;
      // 按集合统计
      stats.byCollection[repo.collection] = (stats.byCollection[repo.collection] || 0) + 1;
    }

    // 仓库最多的项目
    stats.topRepositories = Object.entries(stats.byProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return stats;
  }
}

/**
 * 创建TFS Git仓库映射器实例
 */
function createTFSGitRepositoryMapper() {
  return new TFSGitRepositoryMapper();
}

export {
  TFSGitRepositoryMapper,
  createTFSGitRepositoryMapper
};

export default TFSGitRepositoryMapper;
