#!/usr/bin/env node
/**
 * Fix Verifier
 * 修复验证器 - 验证修复的正确性和安全性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 修复验证器类
 */
class FixVerifier {
  constructor(options = {}) {
    this.config = options.config || {};
    this.testCommand = options.testCommand || 'npm test';
    this.timeout = options.timeout || 60000;
  }

  /**
   * 验证修复（综合验证）
   * @param {object} fixPlan - 修复计划
   * @param {string} originalCode - 原始代码
   * @param {string} modifiedCode - 修改后的代码
   * @returns {Promise<object>} 验证结果
   */
  async verifyFix(fixPlan, originalCode, modifiedCode) {
    const results = {
      syntax: { passed: true },
      staticAnalysis: { passed: true },
      tests: { passed: true, skipped: true },
      safety: { passed: true },
      compilation: { passed: true, skipped: true },
      overall: { passed: true }
    };

    const language = fixPlan.language || 'text';

    // 1. 语法检查
    if (this.config.syntaxCheck !== false) {
      results.syntax = await this.verifySyntax(modifiedCode, language);
    }

    // 2. 静态分析
    if (this.config.staticAnalysis !== false) {
      results.staticAnalysis = await this.runStaticAnalysis(modifiedCode, language);
    }

    // 3. 安全检查
    results.safety = this.safetyCheck(fixPlan, originalCode, modifiedCode);

    // 4. 编译检查（编译型语言）
    if (this._requiresCompilation(language)) {
      results.compilation = await this.verifyCompilation(fixPlan, modifiedCode);
    }

    // 5. 测试执行（可选）
    if (this.config.runTests && this.config.testCommand) {
      results.tests = await this.runTests(fixPlan.repository?.localPath);
    }

    // 计算总体结果
    results.overall = this._calculateOverallResult(results);

    return results;
  }

  /**
   * 验证语法
   */
  async verifySyntax(code, language) {
    const errors = [];
    const warnings = [];

    try {
      switch (language) {
        case 'java':
          return await this._verifyJavaSyntax(code);
        case 'javascript':
        case 'typescript':
          return await this._verifyJavaScriptSyntax(code, language === 'typescript');
        case 'python':
          return await this._verifyPythonSyntax(code);
        case 'vue':
          return await this._verifyVueSyntax(code);
        case 'go':
          return await this._verifyGoSyntax(code);
        default:
          return { passed: true, warnings: ['不支持该语言的语法检查'] };
      }
    } catch (error) {
      return {
        passed: false,
        errors: [`语法检查失败: ${error.message}`]
      };
    }
  }

  /**
   * 验证 Java 语法
   */
  async _verifyJavaSyntax(code) {
    const errors = [];

    // 基本语法检查
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // 跳过空行和注释
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // 检查语句结束
      if (line.includes('class ') || line.includes('interface ') || line.includes('enum ')) {
        if (!line.endsWith('{')) {
          errors.push(`第${lineNum}行: 类声明应该以 '{' 结尾`);
        }
      } else if (line.includes('import ') || line.includes('package ')) {
        if (!line.endsWith(';')) {
          errors.push(`第${lineNum}行: 语句应该以 ';' 结尾`);
        }
      }
    }

    // 检查括号平衡
    if (!this._checkBracketBalance(code)) {
      errors.push('括号不匹配');
    }

    // 检查分号
    const statementsMissingSemicolon = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 &&
             !trimmed.startsWith('//') &&
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('*') &&
             !trimmed.startsWith('@') &&
             !trimmed.includes('class ') &&
             !trimmed.includes('interface ') &&
             !trimmed.includes('package ') &&
             !trimmed.includes('import ') &&
             !trimmed.includes('{') &&
             !trimmed.includes('}') &&
             !trimmed.endsWith(';') &&
             !trimmed.endsWith('{');
    });

    if (statementsMissingSemicolon.length > 0) {
      errors.push('部分语句缺少分号');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 验证 JavaScript/TypeScript 语法
   */
  async _verifyJavaScriptSyntax(code, isTypeScript = false) {
    const errors = [];

    // 检查括号平衡
    if (!this._checkBracketBalance(code)) {
      errors.push('括号不匹配');
    }

    // 检查基本语法问题
    const hasUnclosedStrings = (code.match(/"/g) || []).length % 2 !== 0 ||
                                (code.match(/'/g) || []).length % 2 !== 0;
    if (hasUnclosedStrings) {
      errors.push('字符串未正确关闭');
    }

    // 检查异步函数
    const asyncKeywords = code.match(/async\s+function/g) || [];
    const awaitKeywords = code.match(/await\s+/g) || [];
    if (awaitKeywords.length > 0 && asyncKeywords.length === 0) {
      // 可能在非 async 函数中使用 await
      errors.push('在非异步函数中使用了 await');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 验证 Python 语法
   */
  async _verifyPythonSyntax(code) {
    const errors = [];
    const lines = code.split('\n');
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.search(/\S/);

      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // 检查缩进
      if (stack.length > 0 && indent <= stack[stack.length - 1]) {
        // 缩进减少，检查是否匹配
        while (stack.length > 0 && indent < stack[stack.length - 1]) {
          stack.pop();
        }
      } else if (trimmed.endsWith(':')) {
        // 需要增加缩进
        stack.push(indent);
      }
    }

    // 检查括号
    if (!this._checkBracketBalance(code)) {
      errors.push('括号不匹配');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 验证 Vue 语法
   */
  async _verifyVueSyntax(code) {
    const errors = [];

    // 检查 template, script, style 块
    const hasTemplate = code.includes('<template>');
    const hasScript = code.includes('<script>');
    const hasStyle = code.includes('<style>');

    if (!hasTemplate && !hasScript && !hasStyle) {
      errors.push('Vue 文件必须包含至少一个块（template/script/style）');
    }

    // 检查 template 部分的括号
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    if (templateMatch) {
      const templateContent = templateMatch[1];
      if (!this._checkHtmlTagBalance(templateContent)) {
        errors.push('template 中的 HTML 标签不匹配');
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 验证 Go 语法
   */
  async _verifyGoSyntax(code) {
    const errors = [];

    // 检查包声明
    if (!code.includes('package ')) {
      errors.push('Go 文件必须包含 package 声明');
    }

    // 检查括号
    if (!this._checkBracketBalance(code)) {
      errors.push('括号不匹配');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * 静态分析
   */
  async runStaticAnalysis(code, language) {
    const issues = [];

    // 通用检查
    issues.push(...this._checkCommonIssues(code));

    // 语言特定检查
    switch (language) {
      case 'java':
        issues.push(...this._analyzeJavaCode(code));
        break;
      case 'javascript':
      case 'typescript':
        issues.push(...this._analyzeJavaScriptCode(code));
        break;
      case 'python':
        issues.push(...this._analyzePythonCode(code));
        break;
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      summary: {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        infos: issues.filter(i => i.severity === 'info').length
      }
    };
  }

  /**
   * 检查通用问题
   */
  _checkCommonIssues(code) {
    const issues = [];

    // 检查硬编码的敏感信息
    const sensitivePatterns = [
      { pattern: /password\s*=\s*['"][^'"]+['"]/i, message: '可能包含硬编码的密码' },
      { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, message: '可能包含硬编码的 API 密钥' },
      { pattern: /secret\s*=\s*['"][^'"]+['"]/i, message: '可能包含硬编码的密钥' }
    ];

    for (const { pattern, message } of sensitivePatterns) {
      if (pattern.test(code)) {
        issues.push({
          severity: 'error',
          message,
          type: 'security'
        });
      }
    }

    // 检查TODO/FIXME
    if (/TODO|FIXME|HACK|XXX/.test(code)) {
      issues.push({
        severity: 'info',
        message: '代码中包含 TODO/FIXME 标记',
        type: 'code-quality'
      });
    }

    return issues;
  }

  /**
   * 分析 Java 代码
   */
  _analyzeJavaCode(code) {
    const issues = [];

    // 检查空的 catch 块
    if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(code)) {
      issues.push({
        severity: 'warning',
        message: '存在空的 catch 块，可能隐藏异常',
        type: 'code-quality'
      });
    }

    // 检查 System.out.println
    const printCount = (code.match(/System\.out\.print/g) || []).length;
    if (printCount > 0) {
      issues.push({
        severity: 'info',
        message: `包含 ${printCount} 个 System.out.print 调用，建议使用日志框架`,
        type: 'code-quality'
      });
    }

    return issues;
  }

  /**
   * 分析 JavaScript 代码
   */
  _analyzeJavaScriptCode(code) {
    const issues = [];

    // 检查 var 使用
    if (/\bvar\s+/.test(code)) {
      issues.push({
        severity: 'warning',
        message: '建议使用 const 或 let 代替 var',
        type: 'code-quality'
      });
    }

    // 检查 console.log
    const consoleCount = (code.match(/console\.(log|debug|info)/g) || []).length;
    if (consoleCount > 0) {
      issues.push({
        severity: 'info',
        message: `包含 ${consoleCount} 个 console 调用，建议在生产代码中移除`,
        type: 'code-quality'
      });
    }

    // 检查 == vs ===
    if (/[!=]=[^(]/.test(code)) {
      issues.push({
        severity: 'warning',
        message: '建议使用 === 和 !== 而不是 == 和 !=',
        type: 'code-quality'
      });
    }

    return issues;
  }

  /**
   * 分析 Python 代码
   */
  _analyzePythonCode(code) {
    const issues = [];

    // 检查裸 except
    if (/except:\s*$/.test(code)) {
      issues.push({
        severity: 'warning',
        message: '使用裸 except 可能捕获所有异常包括系统退出',
        type: 'code-quality'
      });
    }

    return issues;
  }

  /**
   * 安全检查
   */
  safetyCheck(fixPlan, originalCode, modifiedCode) {
    const issues = [];

    // 检查是否引入了安全问题
    const securityIssues = this._checkSecurityIssues(modifiedCode);
    issues.push(...securityIssues);

    // 检查代码行数变化（防止意外删除）
    const originalLines = originalCode.split('\n').length;
    const modifiedLines = modifiedCode.split('\n').length;
    const lineChangeRatio = modifiedLines / originalLines;

    if (lineChangeRatio > 10) {
      issues.push({
        severity: 'warning',
        message: `代码行数增加了 ${((lineChangeRatio - 1) * 100).toFixed(0)}%，请确认是否合理`,
        type: 'change-size'
      });
    }

    if (lineChangeRatio < 0.1) {
      issues.push({
        severity: 'error',
        message: '代码行数大幅减少，可能误删了内容',
        type: 'change-size'
      });
    }

    // 检查是否有调试代码
    if (/debugger|console\.log|System\.out\.print|print\(/.test(modifiedCode)) {
      // 检查是否是新增的调试代码
      const originalHasDebug = /debugger|console\.log|System\.out\.print|print\(/.test(originalCode);
      if (!originalHasDebug) {
        issues.push({
          severity: 'warning',
          message: '修复代码中包含调试语句，建议在提交前移除',
          type: 'debug-code'
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  /**
   * 检查安全问题
   */
  _checkSecurityIssues(code) {
    const issues = [];

    // SQL 注入检查
    if (/["'].*\+.*["'].*SELECT|SELECT.*\+.*["']/.i.test(code)) {
      issues.push({
        severity: 'error',
        message: '可能存在 SQL 注入风险',
        type: 'sql-injection'
      });
    }

    // XSS 检查
    if (/innerHTML\s*=.*\+|\.html\(/.test(code)) {
      issues.push({
        severity: 'warning',
        message: '可能存在 XSS 风险，请确保对用户输入进行转义',
        type: 'xss'
      });
    }

    // 硬编码密钥检查
    if (/password\s*=\s*['"][^'"]{8,}['"]|secret\s*=\s*['"][^'"]{16,}['"]/i.test(code)) {
      issues.push({
        severity: 'error',
        message: '可能包含硬编码的密码或密钥',
        type: 'hardcoded-secret'
      });
    }

    return issues;
  }

  /**
   * 编译验证
   */
  async verifyCompilation(fixPlan, code) {
    if (!fixPlan.filePath) {
      return { passed: true, skipped: true, reason: '没有文件路径' };
    }

    const language = fixPlan.language;
    const filePath = fixPlan.filePath;

    try {
      switch (language) {
        case 'java':
          return await this._compileJava(filePath);
        case 'typescript':
          return await this._compileTypeScript(filePath);
        case 'go':
          return await this._compileGo(filePath);
        default:
          return { passed: true, skipped: true, reason: '不支持该语言的编译检查' };
      }
    } catch (error) {
      return {
        passed: false,
        errors: [`编译失败: ${error.message}`]
      };
    }
  }

  /**
   * 编译 Java
   */
  async _compileJava(filePath) {
    try {
      const dir = path.dirname(filePath);
      execSync(`javac "${filePath}"`, {
        cwd: dir,
        stdio: 'pipe'
      });
      return { passed: true };
    } catch (error) {
      return {
        passed: false,
        errors: [error.stderr?.toString() || '编译失败']
      };
    }
  }

  /**
   * 编译 TypeScript
   */
  async _compileTypeScript(filePath) {
    try {
      const dir = path.dirname(filePath);
      execSync(`npx tsc --noEmit "${filePath}"`, {
        cwd: dir,
        stdio: 'pipe'
      });
      return { passed: true };
    } catch (error) {
      return {
        passed: false,
        errors: [error.stderr?.toString() || '编译失败']
      };
    }
  }

  /**
   * 编译 Go
   */
  async _compileGo(filePath) {
    try {
      const dir = path.dirname(filePath);
      execSync(`go build "${filePath}"`, {
        cwd: dir,
        stdio: 'pipe'
      });
      return { passed: true };
    } catch (error) {
      return {
        passed: false,
        errors: [error.stderr?.toString() || '编译失败']
      };
    }
  }

  /**
   * 运行测试
   */
  async runTests(projectPath) {
    if (!projectPath) {
      return {
        passed: true,
        skipped: true,
        reason: '没有项目路径'
      };
    }

    try {
      const result = execSync(this.testCommand, {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: this.timeout
      });

      return {
        passed: true,
        output: result.toString()
      };
    } catch (error) {
      return {
        passed: false,
        errors: [error.stderr?.toString() || error.message],
        output: error.stdout?.toString() || ''
      };
    }
  }

  /**
   * 判断是否需要编译
   */
  _requiresCompilation(language) {
    return ['java', 'typescript', 'go', 'c', 'cpp'].includes(language);
  }

  /**
   * 检查括号平衡
   */
  _checkBracketBalance(code) {
    const brackets = {
      '(': ')',
      '[': ']',
      '{': '}'
    };
    const stack = [];

    for (const char of code) {
      if (brackets[char]) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last] !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * 检查 HTML 标签平衡
   */
  _checkHtmlTagBalance(code) {
    const tags = code.match(/<\/?[\w-]+[^>]*>/g) || [];
    const stack = [];

    for (const tag of tags) {
      const isOpen = !tag.startsWith('</');
      const tagName = tag.match(/<\/?([\w-]+)/)?.[1];

      if (!tagName) continue;

      if (isOpen) {
        // 自闭合标签
        if (tag.endsWith('/>') || ['img', 'br', 'hr', 'input'].includes(tagName)) {
          continue;
        }
        stack.push(tagName);
      } else {
        if (stack.length === 0 || stack.pop() !== tagName) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * 计算总体验证结果
   */
  _calculateOverallResult(results) {
    const checks = [
      results.syntax,
      results.staticAnalysis,
      results.safety,
      results.compilation,
      results.tests
    ];

    const allPassed = checks.every(check => check.passed !== false);
    const hasErrors = checks.some(check =>
      check.passed === false ||
      (check.errors && check.errors.length > 0)
    );

    const hasWarnings = checks.some(check =>
      check.warnings && check.warnings.length > 0
    );

    return {
      passed: allPassed && !hasErrors,
      hasErrors,
      hasWarnings,
      checksRun: checks.filter(c => c.skipped !== true).length,
      checksSkipped: checks.filter(c => c.skipped === true).length
    };
  }
}

/**
 * 创建修复验证器实例
 */
function createFixVerifier(options) {
  return new FixVerifier(options);
}

export {
  FixVerifier,
  createFixVerifier
};

export default FixVerifier;
