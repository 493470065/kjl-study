#!/usr/bin/env node
/**
 * Bug Analyzer
 * Bug分析工具，负责分析Bug并提供修复建议
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CodeRepositoryMapper } from './code-repository-mapper.mjs';
import { CodeSearcher } from './code-searcher.mjs';
import { FixSuggestionGenerator } from './fix-suggestion-generator.mjs';
import { TFSGitRepositoryMapper } from './tfs-git-repository-mapper.mjs';
import { ImageAnalyzer } from './image-analyzer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bug分析规则
 */
const BUG_ANALYSIS_RULES = {
  // 空指针异常
  NULL_POINTER: {
    patterns: [
      /NullPointerException/i,
      /null.*pointer/i,
      /Cannot read property.*of null/i,
      /undefined.*is not an object/i
    ],
    category: '代码质量',
    severity: 'high',
    suggestions: [
      '在使用对象前进行空值检查',
      '使用Optional类包装可能为null的值',
      '添加防御性编程判断'
    ]
  },

  // 数组越界
  INDEX_OUT_OF_BOUNDS: {
    patterns: [
      /IndexOutOfBounds/i,
      /Array index out of range/i,
      /undefined.*index/i
    ],
    category: '代码质量',
    severity: 'high',
    suggestions: [
      '在访问数组/列表前检查索引范围',
      '使用try-catch包裹数组访问',
      '使用安全的访问方法（如at()）'
    ]
  },

  // 类型转换错误
  TYPE_CONVERSION: {
    patterns: [
      /ClassCastException/i,
      /type.*conversion/i,
      /cannot convert.*type/i
    ],
    category: '代码质量',
    severity: 'medium',
    suggestions: [
      '使用instanceof检查类型',
      '使用泛型避免类型转换',
      '添加类型检查日志'
    ]
  },

  // 并发问题
  CONCURRENCY: {
    patterns: [
      /ConcurrentModificationException/i,
      /race condition/i,
      /deadlock/i,
      /thread.*safety/i
    ],
    category: '并发安全',
    severity: 'high',
    suggestions: [
      '使用线程安全的集合类',
      '添加同步锁或使用并发工具',
      '使用不可变对象'
    ]
  },

  // 资源泄漏
  RESOURCE_LEAK: {
    patterns: [
      /resource.*leak/i,
      /file.*not.*closed/i,
      /connection.*leak/i,
      /out of memory/i
    ],
    category: '性能问题',
    severity: 'high',
    suggestions: [
      '使用try-with-resources语句',
      '在finally块中关闭资源',
      '使用连接池管理资源'
    ]
  },

  // SQL注入
  SQL_INJECTION: {
    patterns: [
      /SQL.*injection/i,
      /sql.*syntax/i,
      /ORA-\d+/i,
      /syntax error.*SQL/i
    ],
    category: '安全漏洞',
    severity: 'critical',
    suggestions: [
      '使用参数化查询或预编译语句',
      '使用ORM框架',
      '对用户输入进行严格验证和转义'
    ]
  },

  // XSS漏洞
  XSS_VULNERABILITY: {
    patterns: [
      /XSS/i,
      /cross.*site.*scripting/i,
      /script.*injection/i
    ],
    category: '安全漏洞',
    severity: 'critical',
    suggestions: [
      '对用户输入进行HTML编码',
      '使用CSP (Content Security Policy)',
      '使用安全的模板引擎'
    ]
  },

  // 性能问题
  PERFORMANCE: {
    patterns: [
      /slow/i,
      /timeout/i,
      /performance/i,
      /latency/i,
      /响应慢/i,
      /超时/i
    ],
    category: '性能问题',
    severity: 'medium',
    suggestions: [
      '分析并优化SQL查询',
      '添加缓存机制',
      '使用异步处理',
      '优化算法复杂度'
    ]
  },

  // 数据验证
  DATA_VALIDATION: {
    patterns: [
      /validation.*error/i,
      /invalid.*data/i,
      /数据校验/i,
      /格式错误/i
    ],
    category: '业务逻辑',
    severity: 'medium',
    suggestions: [
      '添加前端数据验证',
      '添加后端数据验证',
      '使用正则表达式验证格式',
      '提供清晰的错误提示'
    ]
  },

  // 配置问题
  CONFIGURATION: {
    patterns: [
      /config/i,
      /配置.*错误/i,
      /properties/i,
      /missing.*property/i
    ],
    category: '配置问题',
    severity: 'low',
    suggestions: [
      '检查配置文件',
      '添加默认配置值',
      '提供配置示例',
      '添加配置验证'
    ]
  }
};

/**
 * Bug分析器类
 */
class BugAnalyzer {
  constructor(options = {}) {
    this.rules = BUG_ANALYSIS_RULES;
    this.repositoryMapper = options.repositoryMapper || new CodeRepositoryMapper();
    this.codeSearcher = options.codeSearcher || null;
    this.fixSuggestionGenerator = options.fixSuggestionGenerator || new FixSuggestionGenerator();
    this.tfsGitMapper = options.tfsGitMapper || new TFSGitRepositoryMapper();
    this.tfsConfig = options.tfsConfig || null;
    this.tfsClient = options.tfsClient || null;
    this.enableCodeLocation = options.enableCodeLocation !== false;
    this.enableFixSuggestions = options.enableFixSuggestions !== false;
    this.useTfsGitRepository = options.useTfsGitRepository || false;
    this.enableImageAnalysis = options.enableImageAnalysis !== false;
    this.imageAnalyzer = options.imageAnalyzer || null;
  }

  /**
   * 确保TFS客户端已初始化
   */
  async _ensureTFSClient() {
    if (!this.tfsClient && this.tfsConfig) {
      // 动态导入TFS客户端
      const TFSBugClient = (await import('./tfs-bug-client.mjs')).default;
      const client = new TFSBugClient();
      await client._ensureInitialized();
      this.tfsClient = client.tfsClient;
    }
  }

  /**
   * 设置代码搜索器
   */
  setCodeSearcher(repositoryPath) {
    this.codeSearcher = new CodeSearcher(repositoryPath);
    if (this.fixSuggestionGenerator) {
      this.fixSuggestionGenerator.codeSearcher = this.codeSearcher;
    }
  }

  /**
   * 设置仓库映射器配置路径
   */
  setRepositoryConfig(configPath) {
    this.repositoryMapper = new CodeRepositoryMapper(configPath);
  }

  /**
   * 设置使用TFS Git仓库
   */
  setUseTfsGitRepository(useTfsGit) {
    this.useTfsGitRepository = useTfsGit;
  }

  /**
   * 分析单个Bug
   * @param {object} bug - Bug对象
   * @returns {Promise<object>} 分析结果
   */
  async analyzeBug(bug) {
    const analysis = {
      bugId: bug.id,
      title: bug.title,
      state: bug.state,
      priority: bug.priority,
      severity: bug.severity,
      category: null,
      rootCause: null,
      suggestions: [],
      codeHints: [],
      relatedFiles: [],
      estimatedEffort: null,
      riskLevel: 'medium'
    };

    // 分析标题和描述
    const textToAnalyze = `${bug.title} ${bug.description} ${bug.stackTrace || ''}`;

    // 匹配规则
    for (const [ruleName, rule] of Object.entries(this.rules)) {
      for (const pattern of rule.patterns) {
        if (pattern.test(textToAnalyze)) {
          analysis.category = rule.category;
          analysis.riskLevel = rule.severity;
          analysis.suggestions = [...rule.suggestions];

          // 从堆栈跟踪中提取代码位置
          if (bug.stackTrace) {
            analysis.codeHints = this.extractCodeHints(bug.stackTrace);
          }

          break;
        }
      }
    }

    // 如果没有匹配到规则，使用通用分析
    if (!analysis.category) {
      analysis.category = this.guessCategory(bug);
      analysis.suggestions = [
        '详细复现问题',
        '查看日志获取更多信息',
        '分析代码逻辑找出问题点'
      ];
    }

    // 估算修复工作量
    analysis.estimatedEffort = this.estimateEffort(bug, analysis);

    // 提取相关文件
    analysis.relatedFiles = this.extractRelatedFiles(bug);

    // 新功能：代码仓库定位
    if (this.enableCodeLocation) {
      analysis.codeLocation = this.useTfsGitRepository
        ? await this.locateTfsGitRepository(bug)
        : await this.locateCode(bug);
    }

    // 新功能：详细修复建议
    if (this.enableFixSuggestions) {
      const repository = analysis.codeLocation?.repository || null;
      const codeContext = analysis.codeLocation?.codeContext || null;
      analysis.fixSuggestion = await this.fixSuggestionGenerator.generateFixSuggestion(
        bug,
        repository,
        codeContext
      );
    }

    // 新功能：图片分析
    if (this.enableImageAnalysis) {
      try {
        // 确保TFS客户端已初始化
        await this._ensureTFSClient();

        // 延迟加载图片分析器
        if (!this.imageAnalyzer) {
          const { default: ImageAnalyzer } = await import('./image-analyzer.mjs');
          this.imageAnalyzer = new ImageAnalyzer({
            tfsConfig: this.tfsConfig,
            tfsClient: this.tfsClient
          });
        }

        analysis.imageAnalysis = await this.imageAnalyzer.analyzeBugImages(bug);
      } catch (error) {
        console.log(`  ⚠️  图片分析失败: ${error.message}`);
        analysis.imageAnalysis = {
          error: error.message,
          bugId: bug.id
        };
      }
    }

    return analysis;
  }

  /**
   * 批量分析Bug
   * @param {array} bugs - Bug数组
   * @param {object} options - 选项 { progressCallback }
   * @returns {Promise<array>} 分析结果数组
   */
  async analyzeBugs(bugs, options = {}) {
    const analyses = [];
    const total = bugs.length;

    for (let i = 0; i < total; i++) {
      const bug = bugs[i];
      const analysis = await this.analyzeBug(bug);
      analyses.push(analysis);

      // 进度回调
      if (options.progressCallback) {
        options.progressCallback(i + 1, total, bug);
      }
    }

    return analyses;
  }

  /**
   * 从堆栈跟踪中提取代码提示
   * @param {string} stackTrace - 堆栈跟踪文本
   * @returns {array} 代码提示数组
   */
  extractCodeHints(stackTrace) {
    const hints = [];
    const lines = stackTrace.split('\n');

    for (const line of lines) {
      // 匹配常见的堆栈跟踪格式
      const match = line.match(/at\s+([^(]+)\(([^:]+):(\d+)\)/) ||
                     line.match(/([A-Za-z0-9_.]+)\.([A-Za-z0-9_]+)\(([^:]+):(\d+)\)/);

      if (match) {
        hints.push({
          className: match[1],
          methodName: match[2] || '',
          fileName: match[match.length - 2] || '',
          lineNumber: match[match.length - 1] || ''
        });
      }
    }

    return hints.slice(0, 5); // 最多返回5个
  }

  /**
   * 猜测Bug类别
   * @param {object} bug - Bug对象
   * @returns {string} 类别
   */
  guessCategory(bug) {
    const title = bug.title.toLowerCase();
    const desc = (bug.description || '').toLowerCase();

    // UI相关
    if (title.includes('ui') || title.includes('界面') || title.includes('页面') ||
        title.includes('显示') || title.includes('样式')) {
      return 'UI问题';
    }

    // 数据相关
    if (title.includes('数据') || title.includes('data') ||
        title.includes('保存') || title.includes('查询')) {
      return '数据处理';
    }

    // 权限相关
    if (title.includes('权限') || title.includes('认证') || title.includes('登录')) {
      return '权限认证';
    }

    // 接口相关
    if (title.includes('接口') || title.includes('api') || title.includes('调用')) {
      return '接口调用';
    }

    return '其他问题';
  }

  /**
   * 估算修复工作量
   * @param {object} bug - Bug对象
   * @param {object} analysis - 分析结果
   * @returns {object} 工作量估算
   */
  estimateEffort(bug, analysis) {
    let baseHours = 2; // 基础工作量

    // 根据严重程度调整
    switch (analysis.riskLevel) {
      case 'critical':
        baseHours = 8;
        break;
      case 'high':
        baseHours = 4;
        break;
      case 'medium':
        baseHours = 2;
        break;
      case 'low':
        baseHours = 1;
        break;
    }

    // 根据Bug类型调整
    if (bug.priority === '1') {
      baseHours *= 1.5;
    }

    // 如果有堆栈跟踪，减少估算时间
    if (bug.stackTrace) {
      baseHours *= 0.7;
    }

    return {
      hours: Math.round(baseHours),
      level: baseHours <= 2 ? '简单' : baseHours <= 4 ? '中等' : '复杂'
    };
  }

  /**
   * 提取相关文件
   * @param {object} bug - Bug对象
   * @returns {array} 相关文件列表
   */
  extractRelatedFiles(bug) {
    const files = [];

    // 从描述中提取文件路径
    const desc = bug.description || '';
    const fileMatches = desc.match(/([A-Za-z0-9_/]+\.([A-Za-z]+))/g);

    if (fileMatches) {
      files.push(...fileMatches);
    }

    // 从堆栈跟踪中提取文件
    if (bug.stackTrace) {
      const stackFiles = bug.stackTrace.match(/\([A-Za-z0-9_/\\]+\.[A-Za-z]+\)/g);
      if (stackFiles) {
        files.push(...stackFiles.map(f => f.replace(/[()]/g, '')));
      }
    }

    return [...new Set(files)]; // 去重
  }

  /**
   * 生成分析报告
   * @param {array} analyses - 分析结果数组
   * @returns {string} Markdown格式的报告
   */
  generateReport(analyses) {
    let report = '# Bug分析报告\n\n';
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += `总计Bug: ${analyses.length}个\n\n`;

    // 按类别分组
    const byCategory = this.groupByCategory(analyses);

    // 统计信息
    report += '## 📊 统计概览\n\n';
    report += '| 类别 | 数量 | 占比 |\n';
    report += '|------|------|------|\n';

    const total = analyses.length;
    for (const [category, items] of Object.entries(byCategory)) {
      const count = items.length;
      const percent = ((count / total) * 100).toFixed(1);
      report += `| ${category} | ${count} | ${percent}% |\n`;
    }

    // 风险等级统计
    report += '\n### 风险等级分布\n\n';
    const byRisk = this.groupByRisk(analyses);
    report += '| 风险等级 | 数量 | 占比 |\n';
    report += '|----------|------|------|\n';
    for (const [risk, items] of Object.entries(byRisk)) {
      const count = items.length;
      const percent = ((count / total) * 100).toFixed(1);
      const emoji = risk === 'critical' ? '🔴' : risk === 'high' ? '🟠' : risk === 'medium' ? '🟡' : '🟢';
      report += `| ${emoji} ${risk.toUpperCase()} | ${count} | ${percent}% |\n`;
    }

    // 工作量估算
    report += '\n### 工作量估算\n\n';
    const totalHours = analyses.reduce((sum, a) => sum + (a.estimatedEffort?.hours || 0), 0);
    report += `- **总工时**: ${totalHours} 小时\n`;
    report += `- **平均工时**: ${(totalHours / total).toFixed(1)} 小时/Bug\n\n`;

    // 详细列表
    report += '## 📋 Bug详细分析\n\n';

    for (const [category, items] of Object.entries(byCategory)) {
      report += `### ${category}\n\n`;

      for (const analysis of items) {
        const riskEmoji = analysis.riskLevel === 'critical' ? '🔴' :
                         analysis.riskLevel === 'high' ? '🟠' :
                         analysis.riskLevel === 'medium' ? '🟡' : '🟢';

        report += `#### [${analysis.bugId}] ${analysis.title}\n\n`;
        report += `- **状态**: ${analysis.state}\n`;
        report += `- **风险等级**: ${riskEmoji} ${analysis.riskLevel.toUpperCase()}\n`;
        report += `- **工作量**: ${analysis.estimatedEffort?.hours || '?'}小时 (${analysis.estimatedEffort?.level || '?'})\n`;

        if (analysis.suggestions.length > 0) {
          report += `\n**修复建议**:\n`;
          analysis.suggestions.forEach(s => {
            report += `- ${s}\n`;
          });
        }

        if (analysis.codeHints.length > 0) {
          report += `\n**代码位置**:\n`;
          analysis.codeHints.forEach(hint => {
            report += `- \`${hint.fileName}:${hint.lineNumber}\` ${hint.methodName}\n`;
          });
        }

        report += '\n---\n\n';
      }
    }

    return report;
  }

  /**
   * 按类别分组
   */
  groupByCategory(analyses) {
    return analyses.reduce((groups, analysis) => {
      const category = analysis.category || '其他';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(analysis);
      return groups;
    }, {});
  }

  /**
   * 按风险等级分组
   */
  groupByRisk(analyses) {
    return analyses.reduce((groups, analysis) => {
      const risk = analysis.riskLevel || 'low';
      if (!groups[risk]) {
        groups[risk] = [];
      }
      groups[risk].push(analysis);
      return groups;
    }, {});
  }

  /**
   * 定位Bug相关的代码
   * @param {object} bug - Bug对象
   * @returns {Promise<object>} 代码位置信息
   */
  async locateCode(bug) {
    const result = {
      repository: null,
      localPath: null,
      matchScore: 0,
      matchReason: null,
      inferredPaths: [],
      verifiedPaths: [],
      codeContext: null
    };

    try {
      // 1. 使用仓库映射器匹配仓库
      const repository = this.repositoryMapper.mapBugToRepository(bug);

      if (repository) {
        result.repository = repository.name;
        result.localPath = repository.localPath;
        result.matchScore = repository.matchScore;
        result.matchReason = repository.matchReason;

        // 2. 推断文件路径
        const inferredPaths = this.repositoryMapper.inferFilePaths(bug, repository);
        result.inferredPaths = inferredPaths;

        // 3. 验证文件是否存在
        for (const filePath of inferredPaths) {
          const verified = this.repositoryMapper.verifyFilePath(filePath, repository);
          if (verified.exists) {
            result.verifiedPaths.push({
              originalPath: filePath,
              fullPath: verified.fullPath,
              exists: true
            });
          }
        }

        // 4. 如果有代码搜索器且找到有效文件，提取代码上下文
        if (this.codeSearcher && result.verifiedPaths.length > 0) {
          const firstFile = result.verifiedPaths[0];
          const context = this.extractCodeContextFromFile(firstFile.fullPath, bug);
          if (context) {
            result.codeContext = context;
          }
        }

        // 5. 如果没有找到文件但有堆栈跟踪，尝试搜索代码
        if (result.verifiedPaths.length === 0 && this.codeSearcher && bug.stackTrace) {
          this.codeSearcher.setRepositoryPath(repository.localPath);
          const searchResults = await this.codeSearcher.searchFromStackTrace(
            bug.stackTrace,
            { contextLines: 3 }
          );

          if (searchResults.length > 0) {
            result.searchResults = searchResults.slice(0, 3); // 最多返回3个搜索结果

            // 提取第一个结果的上下文
            const firstResult = searchResults[0];
            result.codeContext = this.codeSearcher.extractCodeContext(
              firstResult.filePath,
              firstResult.lineNumber,
              5
            );
          }
        }
      }
    } catch (error) {
      console.warn(`代码定位失败 (Bug ${bug.id}): ${error.message}`);
    }

    return result;
  }

  /**
   * 定位Bug相关的TFS Git仓库
   * @param {object} bug - Bug对象
   * @returns {Promise<object>} TFS Git仓库信息
   */
  async locateTfsGitRepository(bug) {
    const result = {
      repository: null,
      repositoryId: null,
      repositoryProject: null,
      webUrl: null,
      defaultBranch: null,
      matchScore: 0,
      matchReason: null
    };

    try {
      // 使用TFS Git仓库映射器匹配仓库
      const repo = await this.tfsGitMapper.matchRepository(bug);

      if (repo) {
        result.repository = repo.name;
        result.repositoryId = repo.id;
        result.repositoryProject = repo.project;
        result.webUrl = repo.webUrl;
        result.defaultBranch = repo.defaultBranch;
        result.matchScore = repo.matchScore;
        result.matchReason = repo.matchReason;

        // 从堆栈跟踪中推断文件路径
        if (bug.stackTrace) {
          result.inferredFiles = this.extractFilesFromStackTrace(bug.stackTrace);
        }

        // 从描述中提取文件路径
        if (bug.description) {
          const descFiles = this.extractFilesFromDescription(bug.description);
          if (descFiles.length > 0) {
            result.inferredFiles = [
              ...(result.inferredFiles || []),
              ...descFiles
            ];
          }
        }
      }
    } catch (error) {
      console.warn(`TFS Git仓库定位失败 (Bug ${bug.id}): ${error.message}`);
    }

    return result;
  }

  /**
   * 从堆栈跟踪中提取文件路径
   * @param {string} stackTrace - 堆栈跟踪文本
   * @returns {array} 文件路径数组
   */
  extractFilesFromStackTrace(stackTrace) {
    const files = [];

    // Java堆栈跟踪格式: at com.winning.his.controller.PatientController.savePatient(PatientController.java:125)
    const javaPattern = /at\s+[\w.]+\.([\w]+)\(([\w.]+\.java):(\d+)\)/g;
    let match;
    while ((match = javaPattern.exec(stackTrace)) !== null) {
      files.push({
        className: match[1],
        fileName: match[2],
        lineNumber: match[3],
        language: 'java'
      });
    }

    // 通用文件路径模式
    const filePattern = /([\w\/.]+\.(?:java|js|ts|vue|py|go|sql))[:\s]*(\d+)?/g;
    while ((match = filePattern.exec(stackTrace)) !== null) {
      if (!files.some(f => f.fileName === match[1])) {
        files.push({
          fileName: match[1],
          lineNumber: match[2] || null,
          language: this._detectLanguage(match[1])
        });
      }
    }

    return files;
  }

  /**
   * 从描述中提取文件路径
   * @param {string} description - Bug描述
   * @returns {array} 文件路径数组
   */
  extractFilesFromDescription(description) {
    const files = [];

    // 匹配文件路径模式
    const patterns = [
      /文件[：:]\s*([^\n\r]+)/gi,
      /file[：:]\s*([^\n\r]+)/gi,
      /path[：:]\s*([^\n\r]+)/gi,
      /([\w\/.]+\.(?:java|js|ts|vue|py|go|sql))/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        const filePath = (match[1] || match[0]).trim();
        if (filePath.includes('.')) {
          files.push({
            fileName: filePath,
            lineNumber: null,
            language: this._detectLanguage(filePath)
          });
        }
      }
    }

    return files;
  }

  /**
   * 检测文件语言
   * @param {string} filePath - 文件路径
   * @returns {string} 语言类型
   */
  _detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.java': 'java',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.vue': 'vue',
      '.py': 'python',
      '.go': 'go',
      '.sql': 'sql',
      '.xml': 'xml',
      '.json': 'json'
    };
    return langMap[ext] || 'text';
  }

  /**
   * 从文件中提取代码上下文
   * @param {string} filePath - 文件路径
   * @param {object} bug - Bug对象
   * @returns {object|null} 代码上下文
   */
  extractCodeContextFromFile(filePath, bug) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // 如果堆栈跟踪中有行号，使用它
      let lineNumber = null;
      if (bug.stackTrace) {
        const lineMatch = bug.stackTrace.match(new RegExp(`${path.basename(filePath).replace('.', '\\.')}:(\\d+)`));
        if (lineMatch) {
          lineNumber = parseInt(lineMatch[1], 10);
        }
      }

      // 如果没有行号，尝试搜索关键词
      if (!lineNumber) {
        const keywords = this._extractSearchKeywords(bug);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          for (const keyword of keywords) {
            if (line.includes(keyword.toLowerCase())) {
              lineNumber = i + 1;
              break;
            }
          }
          if (lineNumber) break;
        }
      }

      const contextLines = 5;
      const start = lineNumber ? Math.max(0, lineNumber - contextLines - 1) : 0;
      const end = lineNumber ? Math.min(lines.length, lineNumber + contextLines) : Math.min(10, lines.length);

      return {
        filePath,
        lineNumber: lineNumber || 1,
        snippet: lines.slice(start, end).join('\n'),
        totalLines: lines.length,
        language: this._detectLanguage(filePath)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 提取搜索关键词
   */
  _extractSearchKeywords(bug) {
    const keywords = [];

    // 从标题中提取
    const titleWords = bug.title.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z]{3,}/g) || [];
    keywords.push(...titleWords.slice(0, 3));

    // 从描述中提取类名
    const classMatches = (bug.description || '').match(/\b[A-Z][a-zA-Z0-9]*\b/g) || [];
    keywords.push(...classMatches.slice(0, 2));

    return keywords;
  }

  /**
   * 检测文件语言
   */
  _detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.java': 'java',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.vue': 'vue',
      '.py': 'python',
      '.go': 'go',
      '.sql': 'sql'
    };
    return langMap[ext] || 'text';
  }
}

export { BugAnalyzer, BUG_ANALYSIS_RULES };
export default BugAnalyzer;
