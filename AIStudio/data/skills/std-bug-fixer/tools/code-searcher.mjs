#!/usr/bin/env node
/**
 * Code Searcher
 * 代码搜索工具，集成Grep进行代码片段搜索和上下文提取
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CodeSearcher 类
 */
class CodeSearcher {
  constructor(repositoryPath = null) {
    this.repositoryPath = repositoryPath;
    this.searchCache = new Map();
  }

  /**
   * 设置仓库路径
   */
  setRepositoryPath(repositoryPath) {
    this.repositoryPath = repositoryPath;
  }

  /**
   * 验证仓库路径是否存在
   */
  validateRepositoryPath() {
    if (!this.repositoryPath) {
      throw new Error('仓库路径未设置');
    }
    if (!fs.existsSync(this.repositoryPath)) {
      throw new Error(`仓库路径不存在: ${this.repositoryPath}`);
    }
    return true;
  }

  /**
   * 使用 ripgrep 搜索代码
   */
  searchWithRipgrep(pattern, options = {}) {
    this.validateRepositoryPath();

    const {
      filePattern = '*',
      contextLines = 0,
      caseInsensitive = true,
      maxResults = 100
    } = options;

    try {
      // 构建 ripgrep 命令
      let cmd = `rg "${pattern}" "${this.repositoryPath}"`;

      // 添加选项
      cmd += ` -i`; // 不区分大小写
      cmd += ` -C ${contextLines}`; // 上下文行数
      cmd += ` -g "${filePattern}"`; // 文件模式
      cmd += ` --max-count ${maxResults}`; // 最大结果数
      cmd += ` --json`; // JSON 输出

      const output = execSync(cmd, { encoding: 'utf-8' });

      // 解析 JSON 输出
      const results = [];
      for (const line of output.split('\n')) {
        if (line.trim()) {
          try {
            const result = JSON.parse(line);
            if (result.type === 'match') {
              results.push(this._formatRipgrepResult(result));
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      return results;
    } catch (error) {
      // ripgrep 返回非零退出码时表示没有找到结果
      if (error.status === 1) {
        return [];
      }
      // ripgrep 不存在时回退到 grep
      if (error.code === 'ENOENT') {
        return this.searchWithGrep(pattern, options);
      }
      throw error;
    }
  }

  /**
   * 使用 grep 搜索代码（ripgrep 不可用时的后备方案）
   */
  searchWithGrep(pattern, options = {}) {
    this.validateRepositoryPath();

    const {
      filePattern = '*',
      contextLines = 0,
      caseInsensitive = true,
      maxResults = 100
    } = options;

    try {
      // 构建 grep 命令
      let cmd = `grep -r`;

      if (caseInsensitive) {
        cmd += ' -i';
      }

      if (contextLines > 0) {
        cmd += ` -C ${contextLines}`;
      }

      if (process.platform === 'win32') {
        // Windows 下使用 findstr（更简单但功能更少）
        cmd = `findstr /S /I /N /C:"${pattern}" "${path.join(this.repositoryPath, '*.' + filePattern)}"`;
      } else {
        cmd += ` -n "${pattern}" "${this.repositoryPath}"`;
      }

      const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

      // 解析 grep 输出
      return this._parseGrepOutput(output, this.repositoryPath);
    } catch (error) {
      // grep 返回非零退出码时表示没有找到结果
      if (error.status === 1 || error.status === 2) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 搜索包含关键词的代码片段
   */
  async searchKeywords(keywords, options = {}) {
    if (!Array.isArray(keywords)) {
      keywords = [keywords];
    }

    const allResults = [];
    const searchPromises = [];

    for (const keyword of keywords) {
      const cacheKey = `${this.repositoryPath}:${keyword}`;
      if (this.searchCache.has(cacheKey)) {
        allResults.push(...this.searchCache.get(cacheKey));
        continue;
      }

      const promise = this.searchWithRipgrep(keyword, options);
      searchPromises.push(promise);

      promise.then(results => {
        this.searchCache.set(cacheKey, results);
        allResults.push(...results);
      });
    }

    await Promise.all(searchPromises);

    // 去重并排序
    const uniqueResults = this._deduplicateResults(allResults);
    return uniqueResults;
  }

  /**
   * 根据类名搜索文件
   */
  async searchByClassName(className, options = {}) {
    const {
      extensions = ['.java', '.js', '.ts', '.vue', '.py']
    } = options;

    const results = [];

    for (const ext of extensions) {
      const pattern = `class\\s+${className}\\b`;
      const matches = this.searchWithRipgrep(pattern, {
        ...options,
        filePattern: `*${ext}`,
        contextLines: 5
      });
      results.push(...matches);
    }

    return results;
  }

  /**
   * 根据方法名搜索
   */
  async searchByMethodName(methodName, options = {}) {
    const pattern = `(function|def|func|func\\s*\\()\\s*${methodName}\\b`;
    return this.searchWithRipgrep(pattern, {
      ...options,
      contextLines: 5
    });
  }

  /**
   * 从堆栈跟踪解析并搜索
   */
  async searchFromStackTrace(stackTrace, options = {}) {
    const results = [];

    // 提取类名
    const classMatches = stackTrace.match(/at\s+([\w.]+)\./g) || [];
    const classNames = classMatches.map(m => m.replace(/at\s+/, '').replace(/\.$/, ''));

    // 提取方法名
    const methodMatches = stackTrace.match(/\.([\w]+)\(.*:\d+\)/g) || [];
    const methodNames = methodMatches.map(m => m.match(/\.([\w]+)\(/)?.[1]).filter(Boolean);

    // 提取文件路径
    const fileMatches = stackTrace.match(/([\w\/.]+\.(?:java|js|ts|vue|py|go))/g) || [];

    // 搜索类名
    for (const className of classNames) {
      const shortName = className.split('.').pop();
      const matches = await this.searchByClassName(shortName, options);
      results.push(...matches);
    }

    // 搜索方法名
    for (const methodName of methodNames) {
      const matches = await this.searchByMethodName(methodName, options);
      results.push(...matches);
    }

    // 搜索文件
    for (const filePath of fileMatches) {
      const fileName = path.basename(filePath);
      const matches = this.searchWithRipgrep('', {
        ...options,
        filePattern: fileName
      });
      results.push(...matches);
    }

    return this._deduplicateResults(results);
  }

  /**
   * 提取代码上下文
   */
  extractCodeContext(filePath, lineNumber, contextLines = 5) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.repositoryPath, filePath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      const start = Math.max(0, lineNumber - contextLines - 1);
      const end = Math.min(lines.length, lineNumber + contextLines);

      return {
        filePath,
        fullPath,
        lineNumber,
        before: lines.slice(start, lineNumber - 1).map((line, idx) => ({
          line: start + idx + 1,
          content: line
        })),
        current: {
          line: lineNumber,
          content: lines[lineNumber - 1]
        },
        after: lines.slice(lineNumber, end).map((line, idx) => ({
          line: lineNumber + idx + 1,
          content: line
        })),
        totalLines: lines.length
      };
    } catch (error) {
      console.error(`读取文件失败: ${fullPath}`, error.message);
      return null;
    }
  }

  /**
   * 获取文件内容摘要
   */
  getFileSummary(filePath) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.repositoryPath, filePath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      // 检测文件类型
      const ext = path.extname(filePath).toLowerCase();
      let language = 'text';
      switch (ext) {
        case '.java': language = 'java'; break;
        case '.js': language = 'javascript'; break;
        case '.ts': language = 'typescript'; break;
        case '.vue': language = 'vue'; break;
        case '.py': language = 'python'; break;
        case '.go': language = 'go'; break;
        case '.sql': language = 'sql'; break;
        case '.xml': language = 'xml'; break;
        case '.json': language = 'json'; break;
      }

      return {
        filePath,
        fullPath,
        language,
        totalLines: lines.length,
        size: content.length,
        isEmpty: content.trim().length === 0
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 格式化 ripgrep 结果
   */
  _formatRipgrepResult(result) {
    const { path: dataPath, lines, lines_with_number } = result.data;

    return {
      filePath: dataPath.text,
      lineNumber: lines_with_number?.[0]?.line_number || 0,
      lineContent: lines?.[0]?.text || '',
      before: (lines || []).slice(1).map(l => ({
        line: l.line_number,
        content: l.text
      })),
      after: []
    };
  }

  /**
   * 解析 grep 输出
   */
  _parseGrepOutput(output, basePath) {
    const results = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // 解析格式: 文件路径:行号:内容
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const [, filePath, lineNumber, content] = match;
        results.push({
          filePath: path.relative(basePath, filePath),
          lineNumber: parseInt(lineNumber, 10),
          lineContent: content,
          before: [],
          after: []
        });
      }
    }

    return results;
  }

  /**
   * 去重结果
   */
  _deduplicateResults(results) {
    const seen = new Set();
    const unique = [];

    for (const result of results) {
      const key = `${result.filePath}:${result.lineNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.searchCache.clear();
  }
}

/**
 * 创建代码搜索器实例
 */
function createCodeSearcher(repositoryPath) {
  return new CodeSearcher(repositoryPath);
}

export {
  CodeSearcher,
  createCodeSearcher
};

export default CodeSearcher;
