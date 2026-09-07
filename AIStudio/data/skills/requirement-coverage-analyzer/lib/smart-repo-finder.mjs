#!/usr/bin/env node
/**
 * 智能仓库识别器
 * 自动发现需求项目与代码仓库项目的关联关系
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中英文业务词汇映射
const KEYWORD_TRANSLATIONS = {
  '住院': 'inpatient',
  '门诊': 'outpatient',
  '急诊': 'emergency',
  '护理': 'nurse',
  '病案': 'casehistory',
  '药房': 'pharmacy',
  '检验': 'lis',
  '检查': 'pacs',
  '分诊': 'triage',
  '手术': 'surgery',
  '输血': 'blood',
  '麻醉': 'anesthesia'
};

// 停用词（过滤通用词）
const STOP_WORDS = new Set([
  'winning', 'web', 'api', 'service', 'java', 'vue', 'frontend', 'backend',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'lib', 'core',
  'common', 'utils', 'helper', 'config', 'test', 'spec', 'mock', 'src',
  'main', 'app', 'module', 'component', 'page', 'view', 'controller',
  'winning', 'wn', 'winex', 'winnning' // 注意: winnning 是仓库中的拼写
]);

/**
 * 智能仓库识别器
 */
export class SmartRepoFinder {
  constructor(repoCache, tfsClient, config = {}) {
    // 兼容两种格式：{ repositories: {...} } 或直接的仓库对象
    if (repoCache && repoCache.repositories) {
      this.repoCache = repoCache;
    } else if (repoCache && typeof repoCache === 'object') {
      // 直接传入的是仓库对象
      this.repoCache = { repositories: repoCache };
    } else {
      this.repoCache = { repositories: {} };
    }
    this.tfsClient = tfsClient;
    this.config = config;
    this.cachePath = config.mappingCachePath || path.join(__dirname, '../config/project-repo-mapping.json');
    this.mappingCache = this.loadMappingCache();
    this.namingPatterns = null;
  }

  /**
   * 加载映射缓存
   */
  loadMappingCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const content = fs.readFileSync(this.cachePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.log(`  警告: 加载映射缓存失败: ${e.message}`);
    }

    return {
      version: '1.0',
      lastUpdate: new Date().toISOString(),
      mappings: {},
      namingPatterns: {},
      historyStats: {}
    };
  }

  /**
   * 保存映射缓存
   */
  async saveMappingCache() {
    try {
      this.mappingCache.lastUpdate = new Date().toISOString();

      // 确保目录存在
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.cachePath, JSON.stringify(this.mappingCache, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.log(`  警告: 保存映射缓存失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 智能查找代码仓库
   * @param {string} requirementProject - 需求所在项目
   * @param {string} requirementTitle - 需求标题
   * @param {object} options - 选项
   */
  async findCodeRepos(requirementProject, requirementTitle, options = {}) {
    const result = {
      repos: [],
      source: 'unknown',
      matchedProject: null,
      matchedBy: null,
      score: 0,
      needConfirm: false,
      details: {}
    };

    // 1. 如果命令行指定了项目，直接使用
    if (options.codeProject) {
      const repos = Object.values(this.repoCache.repositories)
        .filter(r => r.project === options.codeProject);
      result.repos = repos;
      result.source = 'cli';
      result.matchedProject = options.codeProject;
      result.matchedBy = 'command-line';
      result.score = 100;
      return result;
    }

    // 2. 检查缓存（高置信度直接使用）
    const cached = this.mappingCache.mappings[requirementProject];
    if (cached && (cached.confidence === 'high' || cached.confidence === 'medium')) {
      const repos = Object.values(this.repoCache.repositories)
        .filter(r => cached.codeProjects.includes(r.project));

      if (repos.length > 0) {
        result.repos = repos;
        result.source = 'cache';
        result.matchedProject = cached.codeProjects[0];
        result.matchedBy = `cached_${cached.source}`;
        result.score = cached.confidence === 'high' ? 95 : 75;
        result.details.cached = cached;

        // 更新使用计数
        cached.usageCount = (cached.usageCount || 0) + 1;
        await this.saveMappingCache();

        return result;
      }
    }

    // 3. 检查原项目是否有仓库
    const originalRepos = Object.values(this.repoCache.repositories)
      .filter(r => r.project === requirementProject);

    if (originalRepos.length > 0) {
      result.repos = originalRepos;
      result.source = 'original';
      result.matchedProject = requirementProject;
      result.matchedBy = 'original_project';
      result.score = 100;
      return result;
    }

    // 4. 启动智能识别
    console.log('  🔍 启动智能仓库识别...');

    // 4.1 命名分析
    const namingResult = this.analyzeNaming(requirementProject, requirementTitle);
    if (namingResult.bestMatch) {
      console.log(`  📊 命名分析: ${namingResult.bestMatch.project} (${namingResult.bestMatch.score}分, ${namingResult.bestMatch.repoCount}个仓库)`);
    }

    // 4.2 语义匹配
    const semanticResult = this.semanticMatch(requirementTitle, requirementProject);
    if (semanticResult.bestMatch) {
      console.log(`  🎯 语义匹配: ${semanticResult.bestMatch.project} (${semanticResult.bestMatch.score}分)`);
    }

    // 4.3 历史学习（如果之前有数据）
    const historyResult = this.getHistoryMatch(requirementProject);
    if (historyResult.bestMatch) {
      console.log(`  📈 历史学习: ${historyResult.bestMatch.project} (${historyResult.bestMatch.count}次关联)`);
    }

    // 5. 综合评分
    const finalScores = this.aggregateScores([
      { result: namingResult, weight: 0.4 },
      { result: semanticResult, weight: 0.35 },
      { result: historyResult, weight: 0.25 }
    ]);

    if (finalScores.length > 0 && finalScores[0].score > 30) {
      const bestMatch = finalScores[0];
      const repos = Object.values(this.repoCache.repositories)
        .filter(r => r.project === bestMatch.project);

      result.repos = repos;
      result.source = 'smart';
      result.matchedProject = bestMatch.project;
      result.matchedBy = 'auto_detected';
      result.score = Math.round(bestMatch.score);
      result.details.sources = bestMatch.sources;
      result.details.allScores = finalScores.slice(0, 3);

      // 需要确认（首次识别）
      result.needConfirm = true;

      return result;
    }

    // 6. 无法自动识别
    result.source = 'not_found';
    result.needConfirm = true;
    result.message = '无法自动识别关联仓库，请使用 --code-project 指定';

    return result;
  }

  /**
   * 命名分析：从项目名和标题提取关键词，匹配仓库
   */
  analyzeNaming(requirementProject, requirementTitle) {
    const result = {
      source: 'naming',
      scores: [],
      bestMatch: null
    };

    // 提取需求项目的关键词
    const projectKeywords = this.extractKeywords(requirementProject);

    // 提取标题关键词（中文转英文）
    const titleKeywords = this.extractKeywords(requirementTitle, true);

    // 合并关键词
    const allKeywords = new Set([...projectKeywords, ...titleKeywords]);

    // 统计每个项目的匹配分数
    const projectScores = new Map();

    for (const [repoId, repo] of Object.entries(this.repoCache.repositories)) {
      const repoKeywords = new Set(this.extractKeywords(repo.name));
      const repoName = repo.name.toLowerCase();

      let matchScore = 0;
      const matchedKeywords = [];

      for (const keyword of allKeywords) {
        // 直接匹配
        if (repoKeywords.has(keyword)) {
          matchScore += 10;
          matchedKeywords.push(keyword);
        }
        // 包含匹配
        if (repoName.includes(keyword.toLowerCase())) {
          matchScore += 5;
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
        }
      }

      if (matchScore > 0) {
        const current = projectScores.get(repo.project) || { score: 0, repoCount: 0, keywords: [] };
        current.score += matchScore;
        current.repoCount += 1;
        current.keywords = [...new Set([...current.keywords, ...matchedKeywords])];
        projectScores.set(repo.project, current);
      }
    }

    // 转换为排序后的数组
    result.scores = Array.from(projectScores.entries())
      .map(([project, data]) => ({
        project,
        score: Math.min(100, data.score), // 限制最高100分
        repoCount: data.repoCount,
        keywords: data.keywords
      }))
      .sort((a, b) => b.score - a.score);

    result.bestMatch = result.scores[0] || null;
    return result;
  }

  /**
   * 语义匹配：基于业务词汇映射
   */
  semanticMatch(requirementTitle, requirementProject) {
    const result = {
      source: 'semantic',
      scores: [],
      bestMatch: null
    };

    // 从标题和项目名提取中文业务词
    const chineseTerms = [];
    for (const [chinese, english] of Object.entries(KEYWORD_TRANSLATIONS)) {
      if (requirementTitle?.includes(chinese) || requirementProject?.toLowerCase().includes(english)) {
        chineseTerms.push({ chinese, english });
      }
    }

    if (chineseTerms.length === 0) {
      return result;
    }

    // 统计每个项目的匹配分数
    const projectScores = new Map();

    for (const [repoId, repo] of Object.entries(this.repoCache.repositories)) {
      const repoName = repo.name.toLowerCase();

      let matchScore = 0;
      const matchedTerms = [];

      for (const { chinese, english } of chineseTerms) {
        if (repoName.includes(english)) {
          matchScore += 20;
          matchedTerms.push(`${chinese}→${english}`);
        }
      }

      if (matchScore > 0) {
        const current = projectScores.get(repo.project) || { score: 0, terms: [] };
        current.score += matchScore;
        current.terms = [...new Set([...current.terms, ...matchedTerms])];
        projectScores.set(repo.project, current);
      }
    }

    result.scores = Array.from(projectScores.entries())
      .map(([project, data]) => ({
        project,
        score: Math.min(100, data.score),
        terms: data.terms
      }))
      .sort((a, b) => b.score - a.score);

    result.bestMatch = result.scores[0] || null;
    return result;
  }

  /**
   * 从历史统计获取匹配
   */
  getHistoryMatch(requirementProject) {
    const result = {
      source: 'history',
      scores: [],
      bestMatch: null
    };

    const stats = this.mappingCache.historyStats || {};

    for (const [key, count] of Object.entries(stats)) {
      if (key.startsWith(requirementProject + '→')) {
        const project = key.split('→')[1];
        result.scores.push({
          project,
          score: Math.min(100, count * 5), // 每次关联5分，最高100
          count
        });
      }
    }

    result.scores.sort((a, b) => b.score - a.score);
    result.bestMatch = result.scores[0] || null;
    return result;
  }

  /**
   * 综合评分
   */
  aggregateScores(weightedResults) {
    const projectScores = new Map();

    for (const { result, weight } of weightedResults) {
      for (const match of result.scores || []) {
        const current = projectScores.get(match.project) || { score: 0, sources: [], details: {} };
        current.score += match.score * weight;
        current.sources.push(result.source);
        current.details[result.source] = match;
        projectScores.set(match.project, current);
      }
    }

    return Array.from(projectScores.entries())
      .map(([project, data]) => ({
        project,
        score: Math.round(data.score),
        sources: [...new Set(data.sources)],
        details: data.details
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 提取关键词
   */
  extractKeywords(text, translateChinese = false) {
    if (!text) return [];

    let processedText = text;

    // 如果需要翻译中文
    if (translateChinese) {
      for (const [chinese, english] of Object.entries(KEYWORD_TRANSLATIONS)) {
        processedText = processedText.replace(new RegExp(chinese, 'g'), ` ${english} `);
      }
    }

    return processedText
      .replace(/[-_.\/]/g, ' ')
      .replace(/([A-Z])/g, ' $1') // 驼峰转空格
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  }

  /**
   * 用户确认后保存映射
   */
  async confirmMapping(requirementProject, codeProject, score = 0) {
    const confidence = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

    this.mappingCache.mappings[requirementProject] = {
      codeProjects: [codeProject],
      confidence,
      source: 'user_confirmed',
      learnedAt: new Date().toISOString(),
      confirmedBy: 'user',
      confirmedAt: new Date().toISOString(),
      usageCount: 1,
      lastScore: score
    };

    // 更新历史统计
    const key = `${requirementProject}→${codeProject}`;
    this.mappingCache.historyStats[key] = (this.mappingCache.historyStats[key] || 0) + 1;

    await this.saveMappingCache();
    console.log(`  ✓ 已保存映射: ${requirementProject} → ${codeProject} (置信度: ${confidence})`);

    return true;
  }

  /**
   * 显示识别结果
   */
  displayResult(result, requirementProject) {
    console.log(`\n  ╔══════════════════════════════════════════════════╗`);
    console.log(`  ║  🔍 智能识别结果                                  ║`);
    console.log(`  ╠══════════════════════════════════════════════════╣`);
    console.log(`  ║  需求项目: ${requirementProject.padEnd(38)}║`);
    console.log(`  ║  匹配项目: ${(result.matchedProject || '未找到').padEnd(38)}║`);
    console.log(`  ║  仓库数量: ${String(result.repos.length + '个').padEnd(38)}║`);
    console.log(`  ║  置信度:   ${String(result.score + '分').padEnd(38)}║`);
    console.log(`  ║  识别方式: ${result.matchedBy?.padEnd(38) || 'N/A'.padEnd(38)}║`);

    if (result.details?.allScores && result.details.allScores.length > 1) {
      console.log(`  ╠══════════════════════════════════════════════════╣`);
      console.log(`  ║  其他候选项目:                                     ║`);
      result.details.allScores.slice(1, 3).forEach(s => {
        console.log(`  ║    - ${s.project.padEnd(30)} ${String(s.score + '分').padEnd(8)}║`);
      });
    }

    console.log(`  ╚══════════════════════════════════════════════════╝`);
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    const mappings = this.mappingCache.mappings || {};
    const stats = this.mappingCache.historyStats || {};

    return {
      mappingCount: Object.keys(mappings).length,
      historyCount: Object.keys(stats).length,
      lastUpdate: this.mappingCache.lastUpdate,
      highConfidence: Object.values(mappings).filter(m => m.confidence === 'high').length,
      mediumConfidence: Object.values(mappings).filter(m => m.confidence === 'medium').length,
      lowConfidence: Object.values(mappings).filter(m => m.confidence === 'low').length
    };
  }

  /**
   * 列出所有映射
   */
  listMappings() {
    const mappings = this.mappingCache.mappings || {};
    const list = [];

    for (const [reqProject, mapping] of Object.entries(mappings)) {
      list.push({
        requirementProject: reqProject,
        codeProjects: mapping.codeProjects,
        confidence: mapping.confidence,
        source: mapping.source,
        usageCount: mapping.usageCount || 0,
        confirmedAt: mapping.confirmedAt
      });
    }

    return list;
  }

  /**
   * 手动添加映射
   */
  async addMapping(requirementProject, codeProject) {
    this.mappingCache.mappings[requirementProject] = {
      codeProjects: [codeProject],
      confidence: 'high',
      source: 'manual',
      learnedAt: new Date().toISOString(),
      confirmedBy: 'user',
      confirmedAt: new Date().toISOString(),
      usageCount: 0
    };

    await this.saveMappingCache();
    return true;
  }

  /**
   * 删除映射
   */
  async removeMapping(requirementProject) {
    if (this.mappingCache.mappings[requirementProject]) {
      delete this.mappingCache.mappings[requirementProject];
      await this.saveMappingCache();
      return true;
    }
    return false;
  }
}

export default SmartRepoFinder;
