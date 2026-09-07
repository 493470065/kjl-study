#!/usr/bin/env node
/**
 * Code Repository Mapper
 * 将TFS Bug映射到本地代码仓库
 * 支持多种匹配策略：精确匹配、模糊匹配、关键词匹配
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件路径
const CONFIG_DIR = path.join(__dirname, '../config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'code-repositories.json');
const CONFIG_TEMPLATE = path.join(CONFIG_DIR, 'code-repositories.template.json');

/**
 * 从Bug信息中提取关键词
 */
function extractKeywords(bug) {
  const text = [
    bug.title || '',
    bug.description || '',
    bug.areaPath || '',
    bug.project || ''
  ].join(' ').toLowerCase();

  // 提取中文关键词（2-6个字符）
  const chineseKeywords = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];

  // 提取英文技术关键词
  const techKeywords = text.match(/\b(java|javascript|vue|react|angular|python|go|controller|service|dao|repository|component|directive)\b/gi) || [];

  // 提取类名模式
  const classPatterns = text.match(/\b[A-Z][a-zA-Z0-9]*\b/g) || [];

  return [...new Set([...chineseKeywords, ...techKeywords, ...classPatterns])];
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(bug, repository) {
  let score = 0;
  const text = (bug.title + ' ' + (bug.description || '') + ' ' + (bug.areaPath || '')).toLowerCase();

  // 1. TFS项目名精确匹配（最高权重）
  if (repository.tfsProject && bug.project === repository.tfsProject) {
    score += 100;
  }

  // 2. AreaPath 匹配
  if (repository.areaMapping && bug.areaPath) {
    for (const [key, value] of Object.entries(repository.areaMapping)) {
      if (bug.areaPath.includes(key) || bug.areaPath.includes(value)) {
        score += 50;
        break;
      }
    }
  }

  // 3. 仓库名关键词匹配
  if (repository.name && text.includes(repository.name.toLowerCase())) {
    score += 30;
  }

  // 4. 模块关键词匹配
  if (repository.moduleKeywords) {
    for (const keyword of repository.moduleKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 20;
      }
    }
  }

  // 5. 技术栈匹配
  if (repository.techStack) {
    const bugTechStack = extractTechStack(bug);
    for (const tech of repository.techStack) {
      if (bugTechStack.includes(tech.toLowerCase())) {
        score += 15;
      }
    }
  }

  // 6. 关键词匹配（基于堆栈跟踪）
  if (bug.stackTrace || bug.description) {
    const stackText = (bug.stackTrace || bug.description).toLowerCase();

    // 包名匹配
    if (repository.basePackage) {
      const packagePattern = repository.basePackage.toLowerCase().replace(/\./g, '/');
      if (stackText.includes(packagePattern) || stackText.includes(repository.basePackage.toLowerCase())) {
        score += 40;
      }
    }

    // 文件路径匹配
    if (repository.pathPatterns) {
      for (const pattern of repository.pathPatterns) {
        if (stackText.includes(pattern.toLowerCase())) {
          score += 25;
        }
      }
    }
  }

  return score;
}

/**
 * 从Bug信息中提取技术栈
 */
function extractTechStack(bug) {
  const text = (bug.title + ' ' + (bug.description || '') + ' ' + (bug.stackTrace || '')).toLowerCase();

  const techMap = {
    java: ['.java', 'java.', 'exception', 'nullpointer'],
    javascript: ['.js', '.vue', '.ts', '.tsx', 'javascript', 'typescript'],
    python: ['.py', 'python', 'django', 'flask'],
    go: ['.go', 'golang', 'go.'],
    csharp: ['.cs', 'csharp', 'dotnet'],
    php: ['.php', 'php']
  };

  const detected = [];
  for (const [tech, patterns] of Object.entries(techMap)) {
    if (patterns.some(p => text.includes(p))) {
      detected.push(tech);
    }
  }

  return detected;
}

/**
 * CodeRepositoryMapper 类
 */
class CodeRepositoryMapper {
  constructor(configPath = null) {
    this.configPath = configPath || CONFIG_FILE;
    this.repositories = [];
    this._loaded = false;
  }

  /**
   * 确保配置已加载
   */
  _ensureLoaded() {
    if (this._loaded) return;

    // 尝试加载配置文件
    if (fs.existsSync(this.configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.repositories = config.repositories || [];
      } catch (error) {
        console.warn(`警告: 配置文件加载失败: ${error.message}`);
      }
    } else if (fs.existsSync(CONFIG_TEMPLATE)) {
      // 使用模板文件
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_TEMPLATE, 'utf-8'));
        this.repositories = config.repositories || [];
        console.log('提示: 使用配置模板文件');
      } catch (error) {
        console.warn(`警告: 配置模板加载失败: ${error.message}`);
      }
    }

    this._loaded = true;
  }

  /**
   * 重新加载配置
   */
  reload() {
    this._loaded = false;
    this._ensureLoaded();
  }

  /**
   * 获取所有仓库
   */
  getRepositories() {
    this._ensureLoaded();
    return this.repositories;
  }

  /**
   * 根据名称获取仓库
   */
  getRepositoryByName(name) {
    this._ensureLoaded();
    return this.repositories.find(r => r.name === name);
  }

  /**
   * 将Bug映射到仓库
   */
  mapBugToRepository(bug) {
    this._ensureLoaded();

    if (this.repositories.length === 0) {
      return null;
    }

    // 计算每个仓库的匹配分数
    const scoredRepos = this.repositories.map(repo => ({
      repository: repo,
      score: calculateMatchScore(bug, repo)
    }));

    // 按分数排序
    scoredRepos.sort((a, b) => b.score - a.score);

    // 返回分数最高的仓库（如果分数>0）
    const bestMatch = scoredRepos[0];
    if (bestMatch && bestMatch.score > 0) {
      return {
        ...bestMatch.repository,
        matchScore: bestMatch.score,
        matchReason: this._getMatchReason(bug, bestMatch.repository, bestMatch.score)
      };
    }

    return null;
  }

  /**
   * 获取匹配原因（用于调试）
   */
  _getMatchReason(bug, repository, score) {
    const reasons = [];

    if (repository.tfsProject && bug.project === repository.tfsProject) {
      reasons.push(`TFS项目匹配: ${bug.project}`);
    }

    if (repository.areaMapping && bug.areaPath) {
      for (const [key, value] of Object.entries(repository.areaMapping)) {
        if (bug.areaPath.includes(key)) {
          reasons.push(`AreaPath匹配: ${key}`);
          break;
        }
      }
    }

    if (bug.stackTrace || bug.description) {
      const stackText = (bug.stackTrace || bug.description).toLowerCase();
      if (repository.basePackage && stackText.includes(repository.basePackage.toLowerCase())) {
        reasons.push(`包名匹配: ${repository.basePackage}`);
      }
    }

    return reasons.join('; ') || '综合匹配';
  }

  /**
   * 从Bug推断可能的文件路径
   */
  inferFilePaths(bug, repository) {
    const filePaths = [];
    const { stackTrace, description, title } = bug;

    // 从堆栈跟踪提取文件路径
    if (stackTrace) {
      const patterns = [
        /at\s+([\w.]+)\(([^:]+):(\d+)\)/g,           // Java stack trace
        /at\s+([^(]+)\(([^:]+):(\d+)\)/g,            // Generic format
        /([\w\/.]+\.(?:java|js|ts|vue|py|go)):/g,    // File with extension
        /\\([\w\\]+\.java):/g,                       // Windows Java path
        /\/([\w\/]+\.java):/g                        // Unix Java path
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(stackTrace)) !== null) {
          const filePath = match[2] || match[1];
          if (filePath && filePath.includes('.')) {
            filePaths.push(filePath);
          }
        }
      }
    }

    // 从描述中提取文件路径
    const descText = description || '';
    const filePatterns = [
      /文件[：:]\s*([^\n\r]+)/gi,
      /file[：:]\s*([^\n\r]+)/gi,
      /path[：:]\s*([^\n\r]+)/gi,
      /([\w\/.]+\.(?:java|js|ts|vue|py|go|cs))/gi
    ];

    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(descText)) !== null) {
        const filePath = match[1]?.trim();
        if (filePath && filePath.includes('.')) {
          filePaths.push(filePath);
        }
      }
    }

    // 去重
    return [...new Set(filePaths)];
  }

  /**
   * 验证文件路径是否存在
   */
  verifyFilePath(filePath, repository) {
    if (!repository.localPath) {
      return { exists: false, fullPath: null };
    }

    // 尝试多种路径组合
    const possiblePaths = [
      path.join(repository.localPath, filePath),
      path.join(repository.localPath, 'src', 'main', 'java', filePath),
      path.join(repository.localPath, 'src', filePath),
      path.join(repository.localPath, filePath.replace(/\./g, '/')), // 包名转路径
      path.join(repository.localPath, 'src', 'main', 'java', filePath.replace(/\./g, '/'))
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        return { exists: true, fullPath: testPath };
      }
    }

    return { exists: false, fullPath: possiblePaths[0] };
  }

  /**
   * 批量映射Bug到仓库
   */
  mapBugsToRepositories(bugs) {
    const results = [];

    for (const bug of bugs) {
      const repository = this.mapBugToRepository(bug);
      if (repository) {
        const filePaths = this.inferFilePaths(bug, repository);
        const verifiedPaths = filePaths.map(fp => ({
          originalPath: fp,
          ...this.verifyFilePath(fp, repository)
        }));

        results.push({
          bugId: bug.id,
          bugTitle: bug.title,
          repository: repository.name,
          localPath: repository.localPath,
          matchScore: repository.matchScore,
          matchReason: repository.matchReason,
          inferredPaths: verifiedPaths,
          hasValidPath: verifiedPaths.some(p => p.exists)
        });
      } else {
        results.push({
          bugId: bug.id,
          bugTitle: bug.title,
          repository: null,
          localPath: null,
          matchScore: 0,
          matchReason: '未找到匹配的仓库',
          inferredPaths: [],
          hasValidPath: false
        });
      }
    }

    return results;
  }

  /**
   * 生成配置统计报告
   */
  getConfigStats() {
    this._ensureLoaded();

    const stats = {
      totalRepositories: this.repositories.length,
      byType: {},
      byTechStack: {},
      repositories: []
    };

    for (const repo of this.repositories) {
      // 按类型统计
      const type = repo.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 按技术栈统计
      if (repo.techStack) {
        for (const tech of repo.techStack) {
          stats.byTechStack[tech] = (stats.byTechStack[tech] || 0) + 1;
        }
      }

      stats.repositories.push({
        name: repo.name,
        type: repo.type,
        tfsProject: repo.tfsProject,
        localPath: repo.localPath ? '✓' : '✗'
      });
    }

    return stats;
  }
}

/**
 * 创建配置目录和模板文件
 */
function ensureConfigTemplate() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_TEMPLATE)) {
    const template = {
      _comment: "代码仓库映射配置文件",
      _instructions: {
        localPath: "本地代码仓库的绝对路径",
        tfsProject: "TFS项目名称（精确匹配）",
        areaMapping: "TFS AreaPath 到本地模块的映射",
        moduleKeywords: "模块关键词列表（用于模糊匹配）",
        techStack: "技术栈标签（如 java, javascript, python）",
        basePackage: "Java基础包名（如 com.winning.his）",
        pathPatterns: "代码路径模式（用于从堆栈跟踪中识别）",
        type: "仓库类型（java, javascript, python等）"
      },
      repositories: [
        {
          name: "HIS系统",
          localPath: "D:/Coding/his-system",
          tfsProject: "HIS",
          areaMapping: {
            "患者管理": "patient-management",
            "药品管理": "medicine-management",
            "医生工作站": "doctor-workstation"
          },
          moduleKeywords: ["患者", "药品", "医嘱", "诊断"],
          techStack: ["java", "vue"],
          basePackage: "com.winning.his",
          pathPatterns: ["com/winning/his", "his-system"],
          type: "java"
        },
        {
          name: "公共卫生平台",
          localPath: "D:/Coding/ph-platform",
          tfsProject: "WN_PH-Platform",
          areaMapping: {
            "健康档案": "health-record",
            "体检管理": "physical-exam"
          },
          moduleKeywords: ["健康", "档案", "体检", "公卫"],
          techStack: ["java", "vue"],
          basePackage: "com.winning.ph",
          type: "java"
        }
      ]
    };

    fs.writeFileSync(CONFIG_TEMPLATE, JSON.stringify(template, null, 2), 'utf-8');
    console.log(`\n已创建配置模板: ${CONFIG_TEMPLATE}`);
    console.log('请根据实际情况修改配置文件，然后重命名为 code-repositories.json');
  }

  return CONFIG_TEMPLATE;
}

export {
  CodeRepositoryMapper,
  extractKeywords,
  calculateMatchScore,
  extractTechStack,
  ensureConfigTemplate
};

export default CodeRepositoryMapper;
