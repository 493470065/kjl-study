#!/usr/bin/env node
/**
 * AI Fix Engine
 * AI 自动修复引擎 - 协调整个自动修复工作流
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BugAnalyzer from './bug-analyzer.mjs';
import { FixSuggestionGenerator } from './fix-suggestion-generator.mjs';
import { CodeGenerator } from './code-generator.mjs';
import { CodeApplier } from './code-applier.mjs';
import { FixVerifier } from './fix-verifier.mjs';
import { GitIntegration } from './git-integration.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AI 修复引擎主类
 */
class AIFixEngine {
  constructor(options = {}) {
    this.bugAnalyzer = options.bugAnalyzer || new BugAnalyzer(options);
    this.fixSuggestionGenerator = options.fixSuggestionGenerator || new FixSuggestionGenerator();
    this.codeGenerator = options.codeGenerator || new CodeGenerator(options.ai || {});
    this.codeApplier = options.codeApplier || new CodeApplier();
    this.fixVerifier = options.fixVerifier || new FixVerifier();
    this.gitIntegration = options.gitIntegration || new GitIntegration();

    // 配置 - 始终与默认配置合并
    const defaultConfig = this._getDefaultConfig();
    this.config = options.config
      ? this._mergeConfig(defaultConfig, options.config)
      : this._loadConfig();

    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  /**
   * 加载配置
   */
  _loadConfig() {
    const configPath = path.join(__dirname, '../config/ai-fix-config.json');
    try {
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        // 合并用户配置和默认配置
        return this._mergeConfig(this._getDefaultConfig(), userConfig);
      }
    } catch (error) {
      // 使用默认配置
    }
    return this._getDefaultConfig();
  }

  /**
   * 合并配置
   */
  _mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };

    for (const key in userConfig) {
      if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        merged[key] = { ...defaultConfig[key], ...userConfig[key] };
      } else {
        merged[key] = userConfig[key];
      }
    }

    return merged;
  }

  /**
   * 获取默认配置
   */
  _getDefaultConfig() {
    return {
      ai: {
        provider: 'claude',
        model: 'claude-opus-4-6',
        maxTokens: 4000,
        temperature: 0.2,
        timeout: 60000
      },
      fixApplication: {
        createBackup: true,
        backupDir: './fix-backups',
        maxRetries: 3,
        confirmBeforeApply: false
      },
      verification: {
        enabled: true,
        runTests: false,
        testCommand: 'npm test',
        staticAnalysis: true,
        syntaxCheck: true
      },
      git: {
        autoCommit: true,
        commitTemplate: 'fix: [Bug {bugId}] {title}\n\nAuto-generated fix for bug {bugId}',
        createBranch: true,
        branchTemplate: 'fix/bug-{bugId}',
        createPR: false,
        prTemplate: null
      },
      safety: {
        maxFileSize: 100000,
        allowedFileExtensions: ['.java', '.js', '.ts', '.vue', '.py', '.go', '.sql'],
        forbiddenPatterns: ['password', 'secret', 'api_key', 'token', 'private_key'],
        requireHumanReview: ['critical', 'high']
      },
      batch: {
        maxConcurrent: 3,
        delayBetweenFixes: 1000,
        continueOnError: false
      }
    };
  }

  /**
   * 分析并修复单个 Bug
   * @param {object} bug - Bug 对象
   * @returns {Promise<object>} 修复结果
   */
  async analyzeAndFix(bug) {
    const fixId = `fix-${bug.id}-${Date.now()}`;
    this._log(`开始修复 Bug ${bug.id}...`);

    try {
      // 1. 分析 Bug
      this._log('  [1/6] 分析 Bug...');
      const analysis = await this.bugAnalyzer.analyzeBug(bug);

      // 2. 定位代码
      this._log('  [2/6] 定位代码...');
      const codeLocation = analysis.codeLocation;
      if (!codeLocation || !codeLocation.repository) {
        throw new Error('无法定位代码仓库');
      }

      // 3. 生成修复代码
      this._log('  [3/6] 生成修复代码...');
      const fixPlan = await this.generateFixCode(bug, analysis, codeLocation);

      // 安全检查
      this._log('  [4/6] 安全检查...');
      await this._safetyCheck(fixPlan, codeLocation);

      // 5. 应用修复
      this._log('  [5/6] 应用修复...');
      const applyResult = await this.applyFix(fixPlan, codeLocation, fixId);

      // 6. 验证修复
      this._log('  [6/6] 验证修复...');
      const verificationResult = await this.verifyFix(bug, fixPlan, applyResult);

      // 7. Git 操作
      if (this.config.git.autoCommit && !this.dryRun) {
        this._log('  [Git] 提交修复...');
        await this.gitIntegration.commitFix(bug.id, applyResult);
      }

      return {
        success: true,
        bugId: bug.id,
        fixId,
        analysis,
        fixPlan,
        applyResult,
        verificationResult,
        duration: Date.now() - fixId
      };

    } catch (error) {
      this._log(`  ✗ 修复失败: ${error.message}`);

      // 尝试回滚
      if (error.fixResult) {
        await this.rollbackFix(error.fixResult);
      }

      return {
        success: false,
        bugId: bug.id,
        error: error.message,
        fixId
      };
    }
  }

  /**
   * 批量修复 Bug
   * @param {array} bugs - Bug 数组
   * @returns {Promise<object>} 批量修复结果
   */
  async analyzeAndFixBatch(bugs) {
    this._log(`开始批量修复 ${bugs.length} 个 Bug...`);
    this._log(`并发数: ${this.config.batch.maxConcurrent}`);

    const results = {
      total: bugs.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // 分批处理
    const batchSize = this.config.batch.maxConcurrent;
    for (let i = 0; i < bugs.length; i += batchSize) {
      const batch = bugs.slice(i, i + batchSize);
      this._log(`处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(bugs.length / batchSize)}...`);

      const batchResults = await Promise.all(
        batch.map(bug => this.analyzeAndFix(bug).catch(e => ({ success: false, error: e.message, bugId: bug.id })))
      );

      for (const result of batchResults) {
        results.details.push(result);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          if (!this.config.batch.continueOnError) {
            break;
          }
        }
      }

      // 批次间延迟
      if (i + batchSize < bugs.length) {
        await this._delay(this.config.batch.delayBetweenFixes);
      }
    }

    this._log(`批量修复完成: ${results.success} 成功, ${results.failed} 失败`);
    return results;
  }

  /**
   * 生成修复代码
   * @param {object} bug - Bug 对象
   * @param {object} analysis - 分析结果
   * @param {object} codeLocation - 代码位置
   * @returns {Promise<object>} 修复计划
   */
  async generateFixCode(bug, analysis, codeLocation) {
    // 提取代码上下文
    const codeContext = await this._extractCodeContext(codeLocation);

    // 构建修复计划
    const fixPlan = {
      bugId: bug.id,
      title: bug.title,
      bugType: analysis.category,
      riskLevel: analysis.riskLevel,
      repository: codeLocation.repository,
      files: []
    };

    // 为每个需要修改的文件生成修复
    const filesToFix = this._identifyFilesToFix(analysis, codeLocation);

    for (const fileInfo of filesToFix) {
      this._log(`    生成修复: ${fileInfo.path}`);

      const fileFix = await this.codeGenerator.generateFix(
        {
          bug,
          analysis,
          fileInfo,
          codeContext
        },
        this._detectLanguage(fileInfo.path)
      );

      fixPlan.files.push(fileFix);
    }

    return fixPlan;
  }

  /**
   * 应用修复
   * @param {object} fixPlan - 修复计划
   * @param {object} codeLocation - 代码位置
   * @param {string} fixId - 修复 ID
   * @returns {Promise<object>} 应用结果
   */
  async applyFix(fixPlan, codeLocation, fixId) {
    const results = {
      fixId,
      filesModified: [],
      backupsCreated: [],
      errors: []
    };

    for (const fileFix of fixPlan.files) {
      try {
        this._log(`    应用修复: ${fileFix.filePath}`);

        const result = await this.codeApplier.applyFix(fileFix.filePath, fileFix, {
          backup: this.config.fixApplication.createBackup,
          backupDir: this.config.fixApplication.backupDir,
          fixId
        });

        results.filesModified.push(result);
        if (result.backupPath) {
          results.backupsCreated.push(result.backupPath);
        }

      } catch (error) {
        this._log(`    ✗ 修复失败: ${error.message}`);
        results.errors.push({
          file: fileFix.filePath,
          error: error.message
        });

        if (!this.config.fixApplication.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * 验证修复
   * @param {object} bug - Bug 对象
   * @param {object} fixPlan - 修复计划
   * @param {object} applyResult - 应用结果
   * @returns {Promise<object>} 验证结果
   */
  async verifyFix(bug, fixPlan, applyResult) {
    if (!this.config.verification.enabled) {
      return { skipped: true, reason: '验证已禁用' };
    }

    const results = {
      syntax: { passed: true },
      staticAnalysis: { passed: true },
      tests: { passed: true, skipped: true },
      safety: { passed: true }
    };

    // 语法检查
    if (this.config.verification.syntaxCheck) {
      for (const fileFix of fixPlan.files) {
        const syntaxResult = await this.fixVerifier.verifySyntax(
          fileFix.modifiedCode || fileFix.newCode,
          fileFix.language
        );
        if (!syntaxResult.passed) {
          results.syntax.passed = false;
          results.syntax.errors = syntaxResult.errors;
        }
      }
    }

    // 静态分析
    if (this.config.verification.staticAnalysis) {
      for (const fileFix of fixPlan.files) {
        const analysisResult = await this.fixVerifier.runStaticAnalysis(
          fileFix.modifiedCode || fileFix.newCode,
          fileFix.language
        );
        if (!analysisResult.passed) {
          results.staticAnalysis.passed = false;
          results.staticAnalysis.issues = analysisResult.issues;
        }
      }
    }

    // 测试执行
    if (this.config.verification.runTests && this.config.verification.testCommand) {
      const testResult = await this.fixVerifier.runTests(codeLocation.repository.localPath);
      results.tests = testResult;
    }

    // 安全检查
    for (const fileFix of fixPlan.files) {
      const safetyResult = await this.fixVerifier.safetyCheck(
        fileFix,
        fileFix.originalCode,
        fileFix.modifiedCode || fileFix.newCode
      );
      if (!safetyResult.passed) {
        results.safety.passed = false;
        results.safety.issues = safetyResult.issues;
      }
    }

    const allPassed = results.syntax.passed && results.staticAnalysis.passed &&
                      results.tests.passed && results.safety.passed;

    return {
      passed: allPassed,
      results,
      details: results
    };
  }

  /**
   * 回滚修复
   * @param {object} fixResult - 修复结果
   */
  async rollbackFix(fixResult) {
    this._log(`回滚修复 ${fixResult.fixId}...`);

    try {
      // 回滚文件修改
      for (const backup of fixResult.backupsCreated || []) {
        await this.codeApplier.restoreFromBackup(backup);
      }

      // Git 回滚
      if (this.config.git.autoCommit) {
        await this.gitIntegration.rollbackLastCommit();
      }

      this._log(`✓ 回滚完成`);

    } catch (error) {
      this._log(`✗ 回滚失败: ${error.message}`);
    }
  }

  /**
   * 提取代码上下文
   */
  async _extractCodeContext(codeLocation) {
    // 从 codeLocation 中提取相关文件的上下文
    const context = {
      repository: codeLocation.repository,
      files: []
    };

    // TODO: 实现代码上下文提取逻辑
    return context;
  }

  /**
   * 识别需要修复的文件
   */
  _identifyFilesToFix(analysis, codeLocation) {
    // 基于分析结果确定需要修改的文件
    const files = [];

    // 如果有推断的文件路径
    if (codeLocation.inferredFiles && codeLocation.inferredFiles.length > 0) {
      for (const inferredFile of codeLocation.inferredFiles) {
        files.push({
          path: inferredFile.fileName,
          language: this._detectLanguage(inferredFile.fileName)
        });
      }
    }

    return files;
  }

  /**
   * 检测编程语言
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

  /**
   * 安全检查
   */
  async _safetyCheck(fixPlan, codeLocation) {
    // 检查文件大小
    for (const fileFix of fixPlan.files) {
      const filePath = path.join(codeLocation.repository.localPath || '', fileFix.filePath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.config.safety.maxFileSize) {
          throw new Error(`文件过大 (${stats.size} bytes): ${fileFix.filePath}`);
        }
      }
    }

    // 检查文件扩展名
    for (const fileFix of fixPlan.files) {
      const ext = path.extname(fileFix.filePath).toLowerCase();
      if (!this.config.safety.allowedFileExtensions.includes(ext)) {
        throw new Error(`不支持的文件类型: ${ext}`);
      }
    }

    // 检查禁止模式
    const content = JSON.stringify(fixPlan);
    for (const pattern of this.config.safety.forbiddenPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        throw new Error(`检测到敏感词: ${pattern}`);
      }
    }

    // 高危Bug需要人工审核
    if (this.config.safety.requireHumanReview.includes(fixPlan.riskLevel)) {
      this._log(`⚠️  高危Bug需要人工审核: ${fixPlan.bugId}`);
      // TODO: 实现人工审核流程
    }
  }

  /**
   * 延迟函数
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 日志输出
   */
  _log(message) {
    if (this.verbose) {
      console.log(`[AIFixEngine] ${message}`);
    }
  }
}

/**
 * 创建 AI 修复引擎实例
 */
function createAIFixEngine(options) {
  return new AIFixEngine(options);
}

export {
  AIFixEngine,
  createAIFixEngine
};

export default AIFixEngine;
