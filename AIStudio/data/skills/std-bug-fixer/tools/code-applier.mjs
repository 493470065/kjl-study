#!/usr/bin/env node
/**
 * Code Applier
 * 代码应用器 - 安全地将修复应用到文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 代码应用器类
 */
class CodeApplier {
  constructor(options = {}) {
    this.backupDir = options.backupDir || './fix-backups';
    this.createBackup = options.createBackup !== false;
    this.dryRun = options.dryRun || false;
  }

  /**
   * 应用修复
   * @param {string} filePath - 文件路径
   * @param {object} fixPlan - 修复计划
   * @param {object} options - 选项
   * @returns {Promise<object>} 应用结果
   */
  async applyFix(filePath, fixPlan, options = {}) {
    const {
      backup = this.createBackup,
      backupDir = this.backupDir,
      fixId
    } = options;

    // 解析文件路径
    const resolvedPath = this._resolveFilePath(filePath, fixPlan.repository);

    if (!resolvedPath) {
      throw new Error(`无法解析文件路径: ${filePath}`);
    }

    // 检查文件是否存在
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`文件不存在: ${resolvedPath}`);
    }

    // 读取原始代码
    const originalCode = fs.readFileSync(resolvedPath, 'utf-8');

    // 备份原始文件
    let backupPath = null;
    if (backup) {
      backupPath = await this._createBackup(resolvedPath, fixId);
    }

    try {
      // 应用修复
      const modifiedCode = await this._applyChanges(
        originalCode,
        fixPlan,
        resolvedPath
      );

      // 验证修改后的代码
      const validation = this._validateModifiedCode(modifiedCode, fixPlan.language);

      if (!validation.valid) {
        throw new Error(`代码验证失败: ${validation.errors.join(', ')}`);
      }

      // 写入修改后的文件（非 dry-run 模式）
      if (!this.dryRun) {
        fs.writeFileSync(resolvedPath, modifiedCode, 'utf-8');
      }

      return {
        success: true,
        filePath: resolvedPath,
        originalCode,
        modifiedCode,
        backupPath,
        changes: this._calculateChanges(originalCode, modifiedCode),
        dryRun: this.dryRun
      };

    } catch (error) {
      // 如果出错，尝试恢复备份
      if (backupPath && fs.existsSync(backupPath)) {
        await this._restoreBackup(resolvedPath, backupPath);
      }

      throw error;
    }
  }

  /**
   * 创建备份
   */
  async _createBackup(filePath, fixId) {
    const timestamp = Date.now();
    const filename = path.basename(filePath);
    const backupPath = path.join(
      this.backupDir,
      `${fixId || 'fix'}-${timestamp}-${filename}`
    );

    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // 复制文件
    fs.copyFileSync(filePath, backupPath);

    return backupPath;
  }

  /**
   * 应用代码修改
   */
  async _applyChanges(originalCode, fixPlan, filePath) {
    const { modifiedCode, newCode, changes } = fixPlan;

    // 如果有完整的修改后代码，直接使用
    if (modifiedCode && modifiedCode.length > 0) {
      return modifiedCode;
    }

    // 如果有新代码，尝试智能合并
    if (newCode && newCode.length > 0) {
      return await this._smartMerge(originalCode, newCode, changes, filePath);
    }

    // 尝试基于 changes 进行修改
    if (changes && changes.length > 0) {
      return await this._applyChangeList(originalCode, changes);
    }

    throw new Error('没有可应用的代码修改');
  }

  /**
   * 智能合并代码
   */
  async _smartMerge(originalCode, newCode, changes, filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // 简单策略：如果是替换整个文件
    if (this._shouldReplaceWholeFile(changes)) {
      return newCode;
    }

    // 尝试基于 AST 的精确修改（需要相应的解析器）
    try {
      return await this._astBasedMerge(originalCode, newCode, changes, ext);
    } catch (error) {
      // AST 合并失败，使用基于模式的合并
      return await this._patternBasedMerge(originalCode, newCode, changes);
    }
  }

  /**
   * 判断是否应该替换整个文件
   */
  _shouldReplaceWholeFile(changes) {
    if (!changes || changes.length === 0) return false;

    // 如果修改涉及整个文件结构
    return changes.some(change =>
      change.type === 'replace' &&
      change.scope === 'whole-file'
    );
  }

  /**
   * 基于 AST 的代码合并
   */
  async _astBasedMerge(originalCode, newCode, changes, ext) {
    // 对于不同语言使用不同的 AST 解析器
    switch (ext) {
      case '.java':
        return await this._mergeJava(originalCode, newCode, changes);
      case '.js':
      case '.ts':
        return await this._mergeJavaScript(originalCode, newCode, changes);
      case '.py':
        return await this._mergePython(originalCode, newCode, changes);
      default:
        // 不支持 AST 的语言，使用模式匹配
        return await this._patternBasedMerge(originalCode, newCode, changes);
    }
  }

  /**
   * 合并 Java 代码
   */
  async _mergeJava(originalCode, newCode, changes) {
    // 简化版本：使用正则表达式匹配和替换
    // 实际应该使用 JavaParser 等库

    if (!changes) return newCode;

    let result = originalCode;

    for (const change of changes) {
      if (change.type === 'replace-method') {
        // 替换方法
        const methodRegex = new RegExp(
          `(public|private|protected)?\\s*(static)?\\s*${change.returnType}\\s+${change.methodName}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`,
          'gs'
        );
        result = result.replace(methodRegex, change.newCode);
      } else if (change.type === 'add-import') {
        // 添加导入
        if (!result.includes(change.importStatement)) {
          const packageEnd = result.indexOf(';');
          result = result.slice(0, packageEnd + 1) +
                   '\n' + change.importStatement +
                   result.slice(packageEnd + 1);
        }
      }
    }

    return result;
  }

  /**
   * 合并 JavaScript/TypeScript 代码
   */
  async _mergeJavaScript(originalCode, newCode, changes) {
    // 简化版本：使用正则表达式
    // 实际应该使用 @babel/parser

    if (!changes) return newCode;

    let result = originalCode;

    for (const change of changes) {
      if (change.type === 'replace-function') {
        const funcRegex = new RegExp(
          `(function|const|let)\\s+${change.functionName}\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>)[^;]*\\{[^}]*\\}`,
          'gs'
        );
        result = result.replace(funcRegex, change.newCode);
      }
    }

    return result;
  }

  /**
   * 合并 Python 代码
   */
  async _mergePython(originalCode, newCode, changes) {
    // 简化版本
    if (!changes) return newCode;

    let result = originalCode;

    for (const change of changes) {
      if (change.type === 'replace-function') {
        const funcRegex = new RegExp(
          `def\\s+${change.functionName}\\s*\\([^)]*\\):[^\\n]*((?:\\n\\s+[^\n]+)*)`,
          'gm'
        );
        result = result.replace(funcRegex, change.newCode);
      }
    }

    return result;
  }

  /**
   * 基于模式的代码合并
   */
  async _patternBasedMerge(originalCode, newCode, changes) {
    // 如果没有具体的修改信息，返回新代码
    if (!changes || changes.length === 0) {
      return newCode;
    }

    let result = originalCode;

    // 尝试查找并替换标记的代码块
    for (const change of changes) {
      if (change.pattern) {
        const regex = new RegExp(change.pattern, change.flags || 'gm');
        result = result.replace(regex, change.replacement || '');
      } else if (change.oldCode) {
        result = result.replace(change.oldCode, change.newCode || '');
      }
    }

    return result;
  }

  /**
   * 应用修改列表
   */
  async _applyChangeList(originalCode, changes) {
    let result = originalCode;

    for (const change of changes) {
      switch (change.type) {
        case 'replace':
          result = result.replace(change.oldText, change.newText);
          break;
        case 'insert-before':
          result = result.replace(
            change.marker,
            change.newText + '\n' + change.marker
          );
          break;
        case 'insert-after':
          result = result.replace(
            change.marker,
            change.marker + '\n' + change.newText
          );
          break;
        case 'delete':
          result = result.replace(change.text, '');
          break;
      }
    }

    return result;
  }

  /**
   * 验证修改后的代码
   */
  _validateModifiedCode(code, language) {
    const errors = [];

    // 基本检查
    if (!code || code.trim().length === 0) {
      errors.push('修改后的代码为空');
      return { valid: false, errors };
    }

    // 检查括号匹配
    if (!this._checkBracketBalance(code)) {
      errors.push('括号不匹配');
    }

    // 语言特定检查
    switch (language) {
      case 'java':
        if (!this._checkJavaSyntax(code)) {
          errors.push('Java 语法可能有误');
        }
        break;
      case 'javascript':
      case 'typescript':
        if (!this._checkJavaScriptSyntax(code)) {
          errors.push('JavaScript/TypeScript 语法可能有误');
        }
        break;
      case 'python':
        if (!this._checkPythonSyntax(code)) {
          errors.push('Python 缩进可能有误');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查括号平衡
   */
  _checkBracketBalance(code) {
    const brackets = {
      '(': ')',
      '[': ']',
      '{': '}',
      '<': '>'
    };
    const stack = [];

    for (const char of code) {
      if (brackets[char]) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (brackets[last] !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * 检查 Java 语法（简化版）
   */
  _checkJavaSyntax(code) {
    // 检查基本语法元素
    const hasSemicolons = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 &&
             !trimmed.startsWith('//') &&
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('*') &&
             !trimmed.includes('class ') &&
             !trimmed.includes('interface ') &&
             !trimmed.includes('import ') &&
             !trimmed.includes('package ') &&
             !trimmed.startsWith('{') &&
             !trimmed.startsWith('}') &&
             !trimmed.startsWith('@');
    }).every(line => line.endsWith(';') || line.includes('{') || line.includes('}'));

    return hasSemicolons || this._checkBracketBalance(code);
  }

  /**
   * 检查 JavaScript 语法（简化版）
   */
  _checkJavaScriptSyntax(code) {
    // 简化检查
    return this._checkBracketBalance(code);
  }

  /**
   * 检查 Python 语法（简化版）
   */
  _checkPythonSyntax(code) {
    // 检查缩进一致性
    const lines = code.split('\n');
    let currentIndent = 0;

    for (const line of lines) {
      if (line.trim().length === 0) continue;

      const indent = line.search(/\S/);

      // Python 缩进必须是4的倍数或保持一致
      if (indent % 4 !== 0 && indent !== currentIndent) {
        return false;
      }

      currentIndent = indent;
    }

    return true;
  }

  /**
   * 计算代码变更
   */
  _calculateChanges(original, modified) {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const additions = [];
    const deletions = [];
    const modifications = [];

    let originalIndex = 0;
    let modifiedIndex = 0;

    while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
      const origLine = originalLines[originalIndex];
      const modLine = modifiedLines[modifiedIndex];

      if (origLine === modLine) {
        originalIndex++;
        modifiedIndex++;
      } else if (!origLine) {
        additions.push({ line: modifiedIndex + 1, content: modLine });
        modifiedIndex++;
      } else if (!modLine) {
        deletions.push({ line: originalIndex + 1, content: origLine });
        originalIndex++;
      } else {
        modifications.push({
          line: originalIndex + 1,
          original: origLine,
          modified: modLine
        });
        originalIndex++;
        modifiedIndex++;
      }
    }

    return {
      additions: additions.length,
      deletions: deletions.length,
      modifications: modifications.length,
      linesAdded: additions.length,
      linesDeleted: deletions.length,
      totalChanges: additions.length + deletions.length + modifications.length
    };
  }

  /**
   * 解析文件路径
   */
  _resolveFilePath(filePath, repository) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    if (repository && repository.localPath) {
      return path.join(repository.localPath, filePath);
    }

    return filePath;
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }

    // 从备份路径推断原始文件路径
    const parts = path.basename(backupPath).split('-');
    if (parts.length >= 3) {
      const filename = parts.slice(2).join('-');
      const originalDir = path.dirname(backupPath).replace('-fix-backups', '');

      // 简化版本：假设文件名相同
      const originalPath = path.join(path.dirname(originalDir), filename);

      if (fs.existsSync(originalPath)) {
        await this._restoreBackup(originalPath, backupPath);
        return { success: true, originalPath };
      }
    }

    throw new Error('无法确定原始文件路径');
  }

  /**
   * 恢复备份
   */
  async _restoreBackup(filePath, backupPath) {
    fs.copyFileSync(backupPath, filePath);
  }

  /**
   * 清理备份
   */
  async cleanupBackup(backupPath) {
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  }

  /**
   * 批量应用修复
   */
  async applyFixBatch(fixes) {
    const results = [];
    const errors = [];

    for (const fix of fixes) {
      try {
        const result = await this.applyFix(fix.filePath, fix);
        results.push(result);
      } catch (error) {
        errors.push({
          filePath: fix.filePath,
          error: error.message
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors
    };
  }
}

/**
 * 创建代码应用器实例
 */
function createCodeApplier(options) {
  return new CodeApplier(options);
}

export {
  CodeApplier,
  createCodeApplier
};

export default CodeApplier;
