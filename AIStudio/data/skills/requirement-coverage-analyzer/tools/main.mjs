#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入各模块
import { getRequirementAnalysis } from './requirement-analysis-fetcher.mjs';
import { scanLocalRepos, discoverRepo, loadRepoCache } from './repo-discovery.mjs';
import { extractBusinessLogic } from './business-logic-extractor.mjs';
import { calculateOverallScore } from './matching-scoring.mjs';
import { generateConsoleReport, generateMarkdownReport } from './report-generator.mjs';
import { printSkillTrackingHintWithTFS } from './skill-tracking-enhancement.mjs';
import { reviewRequirementQuality } from './requirement-quality-reviewer.mjs';

// 导入代码上下文分析模块
import { initOrUpdateIndex, findLocalRepoPath, getIndexStatus, checkReposStatus, getReposStatusSummary } from './local-repo-indexer.mjs';
import { getBatchCommitChanges, isRepoValid, commitExistsLocally, getCommitChangesFromTFS, checkRepoSyncStatus } from './code-fetcher.mjs';
import { analyzeDependencies } from './dependency-resolver.mjs';
import { analyzeMultipleFiles, matchWithRequirement } from './code-context-analyzer.mjs';

// 导入 TFS 工具链
import TFSClientClass, { loadConfig as loadTFSConfig } from '../../tfs2018-integration/tools/tfs-client.mjs';
import { TFSAttachmentUploader } from './tfs-attachment-uploader.mjs';

// 导入智能仓库识别器
import { SmartRepoFinder } from '../lib/smart-repo-finder.mjs';

/**
 * 严重级别映射（中文 -> 英文）
 */
const SEVERITY_MAPPING = {
  '严重': 'critical',
  '警告': 'warning',
  '提示': 'info'
};

/**
 * 过滤扫描结果中的严重级别
 */
function filterScanResultsBySeverity(scanResult, allowedSeverities) {
  if (!scanResult || !allowedSeverities || allowedSeverities.length === 0) {
    return scanResult;
  }

  const issues = scanResult.issues || [];
  const filteredIssues = issues.filter(issue => {
    const severity = (issue.severity || '').toLowerCase();
    return allowedSeverities.some(s => {
      const sLower = s.toLowerCase();
      const mappedSeverity = SEVERITY_MAPPING[s];
      return sLower === severity || mappedSeverity === severity;
    });
  });

  const bySeverity = {
    critical: filteredIssues.filter(i => (i.severity || '').toLowerCase() === 'critical').length,
    warning: filteredIssues.filter(i => (i.severity || '').toLowerCase() === 'warning').length,
    info: filteredIssues.filter(i => (i.severity || '').toLowerCase() === 'info').length
  };

  return {
    ...scanResult,
    issues: filteredIssues,
    summary: {
      ...(scanResult.summary || {}),
      total: filteredIssues.length,
      by_severity: bySeverity
    }
  };
}

/**
 * 将旧格式转换为新格式
 */
function convertToNewFormat(oldResult) {
  const criticalIssues = (oldResult.critical || []).map(issue => ({
    ...issue,
    rule_code: issue.rule,
    rule_name: issue.message,
    severity: 'critical',
    category: 'security'
  }));

  const warningIssues = (oldResult.warning || []).map(issue => ({
    ...issue,
    rule_code: issue.rule,
    rule_name: issue.message,
    severity: 'warning',
    category: 'quality'
  }));

  const infoIssues = (oldResult.info || []).map(issue => ({
    ...issue,
    rule_code: issue.rule,
    rule_name: issue.message,
    severity: 'info',
    category: 'style'
  }));

  const allIssues = [...criticalIssues, ...warningIssues, ...infoIssues];

  return {
    report_info: {
      scan_mode: 'simple',
      scanned_files: oldResult.scannedFiles || 0
    },
    summary: {
      total: oldResult.total || 0,
      by_severity: {
        critical: criticalIssues.length,
        warning: warningIssues.length,
        info: infoIssues.length
      }
    },
    issues: allIssues,
    scannedFiles: oldResult.scannedFiles || 0,
    total: oldResult.total || 0,
    critical: criticalIssues,
    warning: warningIssues,
    info: infoIssues
  };
}

/**
 * 返回空的扫描结果
 */
function getEmptyScanResult() {
  return {
    report_info: {
      scan_mode: 'none',
      scanned_files: 0
    },
    summary: {
      total: 0,
      by_severity: {
        critical: 0,
        warning: 0,
        info: 0
      }
    },
    issues: [],
    scannedFiles: 0,
    total: 0,
    critical: [],
    warning: [],
    info: []
  };
}

/**
 * 解析 Markdown 格式的扫描报告
 * @param {string} markdown - Markdown 报告内容
 * @returns {Object} 解析后的扫描结果
 */
function parseMarkdownScanReport(markdown) {
  const result = {
    scannedFiles: 0,
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    issues: []
  };

  if (!markdown || typeof markdown !== 'string') {
    return result;
  }

  // 解析扫描统计表格 - 支持多种格式
  // 格式1: | 扫描文件 | 14 |
  // 格式2: 扫描文件: 14
  const scannedMatch = markdown.match(/(?:\|\s*)?扫描文件(?:\s*\||:)\s*(\d+)/);
  if (scannedMatch) result.scannedFiles = parseInt(scannedMatch[1]);

  const totalMatch = markdown.match(/(?:\|\s*)?问题总数(?:\s*\||:)\s*(\d+)/);
  if (totalMatch) result.total = parseInt(totalMatch[1]);

  const criticalMatch = markdown.match(/(?:\|\s*)?严重(?:\s*\||:)\s*(\d+)/);
  if (criticalMatch) result.critical = parseInt(criticalMatch[1]);

  const warningMatch = markdown.match(/(?:\|\s*)?警告(?:\s*\||:)\s*(\d+)/);
  if (warningMatch) result.warning = parseInt(warningMatch[1]);

  const infoMatch = markdown.match(/(?:\|\s*)?提示(?:\s*\||:)\s*(\d+)/);
  if (infoMatch) result.info = parseInt(infoMatch[1]);

  // 转换为统一格式
  return {
    report_info: {
      scan_mode: 'win-code-scanner',
      scanned_files: result.scannedFiles
    },
    summary: {
      total: result.total,
      by_severity: {
        critical: result.critical,
        warning: result.warning,
        info: result.info
      }
    },
    issues: result.issues,
    // 兼容旧格式
    scannedFiles: result.scannedFiles,
    total: result.total,
    critical: result.critical,
    warning: result.warning,
    info: result.info
  };
}

/**
 * 代码质量扫描（集成 win-code-scanner skill）
 */
async function performSimpleCodeScan(codeContextAnalysis, config = {}) {
  const scannerConfig = config.code_scanner || {};

  if (scannerConfig.enabled) {
    try {
      // 收集文件绝对路径
      const filePaths = (codeContextAnalysis.changedFiles || [])
        .filter(f => f.path)
        .map(f => f.path);

      if (filePaths.length === 0) {
        return getEmptyScanResult();
      }

      console.log('  [代码扫描] 使用 win-code-scanner skill...');

      // 构造 Skill 调用参数
      const skillArgs = JSON.stringify({
        files: filePaths,
        severity_filter: scannerConfig.severity_filter || ['严重']
      });

      console.log(`  [代码扫描] 传递 ${filePaths.length} 个文件路径`);
      console.log(`  [代码扫描] 文件列表:`);
      filePaths.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
      console.log(`  [代码扫描] JSON 参数: ${skillArgs}`);

      // 注意：实际的 Skill 调用需要在 Claude Code 环境中执行
      // 这里使用简单扫描作为占位，Skill 调用由外部触发
      // 当 Skill 工具可用时，应该调用：
      // const skillResult = await Skill({ skill: 'win-code-scanner', args: skillArgs });

      // 当前使用简单扫描 + 转换作为占位实现
      const simpleResult = performSimpleRegexScan(codeContextAnalysis);
      const skillResult = convertToNewFormat(simpleResult);

      // 打印扫描结果
      console.log(`  [代码扫描] 扫描结果 (过滤前):`);
      console.log(`    - 扫描文件: ${skillResult.scannedFiles || 0}`);
      console.log(`    - 问题总数: ${skillResult.total || 0}`);
      if (skillResult.issues && skillResult.issues.length > 0) {
        console.log(`    - 问题详情:`);
        skillResult.issues.forEach(issue => {
          console.log(`      [${issue.rule_code || issue.rule}] ${issue.rule_name || issue.message}`);
          console.log(`        文件: ${issue.file}:${issue.line || '?'}`);
          console.log(`        严重程度: ${issue.severity}`);
        });
      }

      // 如果有 Markdown 结果，解析它
      // const parsedResult = parseMarkdownScanReport(skillResult.markdown);

      const filteredResult = filterScanResultsBySeverity(
        skillResult,
        scannerConfig.severity_filter
      );

      console.log(`  [代码扫描] 扫描结果 (过滤后):`);
      console.log(`    - 严重: ${filteredResult.summary?.by_severity?.critical || 0}`);
      console.log(`    - 警告: ${filteredResult.summary?.by_severity?.warning || 0}`);
      console.log(`    - 提示: ${filteredResult.summary?.by_severity?.info || 0}`);

      return filteredResult;
    } catch (error) {
      if (!scannerConfig.fallback_to_simple_scan) {
        throw error;
      }
      console.warn('  [代码扫描] win-code-scanner 调用失败，回退到简单扫描:', error.message);
    }
  }

  // 简单扫描（fallback 或未启用集成）
  const simpleResult = performSimpleRegexScan(codeContextAnalysis);
  return convertToNewFormat(simpleResult);
}

/**
 * 简单的代码质量扫描
 * 检测常见问题：TODO、FIXME、console.log、调试代码等
 * @param {Object} codeContextAnalysis - 代码上下文分析结果
 * @returns {Object} 扫描结果
 */
function performSimpleRegexScan(codeContextAnalysis) {
  const results = {
    scannedFiles: 0,
    total: 0,
    critical: [],
    warning: [],
    info: []
  };

  if (!codeContextAnalysis || !codeContextAnalysis.changedFiles) {
    return results;
  }

  // 扫描规则
  const rules = [
    // 严重问题
    { pattern: /password\s*=\s*["'][^"']+["']/gi, severity: 'critical', rule: 'SEC-001', message: '硬编码密码' },
    { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, severity: 'critical', rule: 'SEC-002', message: '硬编码 API Key' },
    { pattern: /secret\s*=\s*["'][^"']+["']/gi, severity: 'critical', rule: 'SEC-003', message: '硬编码密钥' },

    // 警告问题
    { pattern: /console\.(log|debug|info)\s*\(/g, severity: 'warning', rule: 'WARN-001', message: '调试日志未清理' },
    { pattern: /debugger\s*;/g, severity: 'warning', rule: 'WARN-002', message: 'debugger 语句' },
    { pattern: /TODO\s*[:\(]/gi, severity: 'warning', rule: 'WARN-003', message: 'TODO 未完成' },
    { pattern: /FIXME\s*[:\(]/gi, severity: 'warning', rule: 'WARN-004', message: 'FIXME 待修复' },
    { pattern: /System\.out\.print/g, severity: 'warning', rule: 'WARN-005', message: 'Java 调试输出' },
    { pattern: /e\.printStackTrace\(\)/g, severity: 'warning', rule: 'WARN-006', message: '异常堆栈直接打印' },

    // 信息提示
    { pattern: /@Deprecated/g, severity: 'info', rule: 'INFO-001', message: '使用已废弃的 API' },
    { pattern: /SuppressWarnings/g, severity: 'info', rule: 'INFO-002', message: '抑制警告' },
    { pattern: /\/\/\s*XXX/gi, severity: 'info', rule: 'INFO-003', message: 'XXX 标记' }
  ];

  for (const file of codeContextAnalysis.changedFiles) {
    if (!file.content) continue;

    results.scannedFiles++;
    const content = file.content;

    for (const rule of rules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        const issue = {
          rule: rule.rule,
          severity: rule.severity === 'critical' ? '严重' :
                   rule.severity === 'warning' ? '警告' : '提示',
          message: rule.message,
          file: file.path,
          count: matches.length
        };

        if (rule.severity === 'critical') {
          results.critical.push(issue);
        } else if (rule.severity === 'warning') {
          results.warning.push(issue);
        } else {
          results.info.push(issue);
        }
        results.total++;
      }
    }
  }

  return results;
}

/**
 * 从提交备注中提取分支信息
 * 支持格式：
 * - "将 feature/xxx 合并到 sr-next" -> source: feature/xxx, target: sr-next
 * - "Merged PR #123: feature/xxx to main" -> source: feature/xxx, target: main
 * - "#12345 功能开发" -> 无分支信息
 * @param {string} comment - 提交备注
 * @returns {Object} {source: string, target: string} 或 {source: null, target: null}
 */
function extractBranchFromComment(comment) {
  if (!comment) return { source: null, target: null };

  // 匹配 "将 xxx 合并到 yyy" 或 "Merge xxx into yyy" 格式
  const mergePattern1 = /(?:将|merge)\s+([^\s]+)\s+(?:合并到|into|to)\s+([^\s--]+)/i;
  const match1 = comment.match(mergePattern1);
  if (match1) {
    return {
      source: match1[1].replace(/['"]/g, ''),
      target: match1[2].replace(/['"]/g, '').replace(/--.*$/, '').trim()
    };
  }

  // 匹配 "feature/xxx" 或 "bugfix/xxx" 等分支名格式
  const branchPattern = /((?:feature|bugfix|hotfix|release|develop|master|main|sr-)[\/\w\-]+)/gi;
  const branches = comment.match(branchPattern);
  if (branches && branches.length > 0) {
    // 去重
    const uniqueBranches = [...new Set(branches)];
    return {
      source: uniqueBranches[0],
      target: uniqueBranches.length > 1 ? uniqueBranches[uniqueBranches.length - 1] : null
    };
  }

  return { source: null, target: null };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'analyze':
    case 'a':
      await handleAnalyze(args.slice(1));
      break;
    case 'refresh-index':
    case 'ri':
      await handleRefreshIndex(args.slice(1));
      break;
    case 'index-status':
    case 'is':
      await handleIndexStatus(args.slice(1));
      break;
    case 'cache':
    case 'c':
      await handleCache(args.slice(1));
      break;
    case 'help':
    case 'h':
      showHelp();
      break;
    case 'version':
    case 'v':
      showVersion();
      break;
    default:
      console.log(`错误: 未知命令 "${command}"\n`);
      showHelp();
      process.exit(1);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
需求覆盖率分析工具

用法:
  node main.mjs <command> [options]

命令:
  analyze, a <需求ID>     分析指定需求的覆盖率
  refresh-index, ri       刷新本地仓库索引
  index-status, is        查看索引状态
  cache <子命令>          缓存管理 (见下方)
  help, h                 显示帮助信息
  version, v              显示版本信息

分析选项:
  --repos-dir <路径>       指定仓库根目录
  --config <路径>          指定配置文件路径
  --output <路径>          指定报告输出目录
  --format <格式>          报告格式 (markdown, json)
  --code-project <项目>    指定代码仓库所在项目
  --upload-to-tfs          将生成的报告上传到TFS工作项作为附件
  --add-tag                自动为TFS工作项添加AI标记(基于评分)

缓存管理命令:
  cache status            查看缓存状态
  cache list              列出所有映射
  cache add <需求项目> <代码项目>  添加映射
  cache remove <需求项目>  删除映射
  cache clear             清除所有映射

示例:
  node main.mjs analyze 123456
  node main.mjs a 123456 --repos-dir /data/git-repos
  node main.mjs a 123456 --code-project W.in-MVP
  node main.mjs a 123456 --upload-to-tfs
  node main.mjs a 123456 --add-tag
  node main.mjs cache status
  node main.mjs cache add WiNEX-Inpatient-2 W.in-MVP
  node main.mjs refresh-index

标记说明:
  使用 --add-tag 或 --upload-to-tfs 时，会为TFS工作项添加固定标记:
    - AI-Coverage (表示已使用需求覆盖率分析技能分析过)
`);
}

/**
 * 显示版本信息
 */
function showVersion() {
  console.log('requirement-coverage-analyzer v1.0.0');
}

/**
 * 处理缓存命令
 */
async function handleCache(args) {
  const subCommand = args[0] || 'status';

  // 动态导入 SmartRepoFinder
  const { SmartRepoFinder } = await import('../lib/smart-repo-finder.mjs');

  // 加载仓库缓存
  let repoCache = { repositories: {} };
  try {
    repoCache = await loadRepoCacheFromMultiplePaths();
  } catch (e) {
    // 忽略
  }

  const cachePath = path.join(__dirname, '../config/project-repo-mapping.json');
  const repoFinder = new SmartRepoFinder(repoCache, null, { mappingCachePath: cachePath });

  switch (subCommand) {
    case 'status':
      const status = repoFinder.getCacheStatus();
      console.log('\n════════════════════════════════════════');
      console.log('  缓存状态');
      console.log('════════════════════════════════════════');
      console.log(`  映射数量: ${status.mappingCount}`);
      console.log(`  高置信度: ${status.highConfidence}`);
      console.log(`  中置信度: ${status.mediumConfidence}`);
      console.log(`  低置信度: ${status.lowConfidence}`);
      console.log(`  历史记录: ${status.historyCount}`);
      console.log(`  最后更新: ${status.lastUpdate || 'N/A'}`);
      console.log('════════════════════════════════════════\n');
      break;

    case 'list':
    case 'ls':
      const mappings = repoFinder.listMappings();
      if (mappings.length === 0) {
        console.log('\n  暂无映射缓存\n');
      } else {
        console.log('\n════════════════════════════════════════');
        console.log('  已缓存的映射');
        console.log('════════════════════════════════════════');
        for (const m of mappings) {
          console.log(`\n  需求项目: ${m.requirementProject}`);
          console.log(`  代码项目: ${m.codeProjects.join(', ')}`);
          console.log(`  置信度:   ${m.confidence}`);
          console.log(`  来源:     ${m.source}`);
          console.log(`  使用次数: ${m.usageCount}`);
        }
        console.log('\n════════════════════════════════════════\n');
      }
      break;

    case 'add':
      const reqProject = args[1];
      const codeProject = args[2];
      if (!reqProject || !codeProject) {
        console.log('用法: cache add <需求项目> <代码项目>');
        console.log('示例: cache add WiNEX-Inpatient-2 W.in-MVP');
        process.exit(1);
      }
      await repoFinder.addMapping(reqProject, codeProject);
      console.log(`\n  ✓ 已添加映射: ${reqProject} → ${codeProject}\n`);
      break;

    case 'remove':
    case 'rm':
      const rmProject = args[1];
      if (!rmProject) {
        console.log('用法: cache remove <需求项目>');
        process.exit(1);
      }
      const removed = await repoFinder.removeMapping(rmProject);
      if (removed) {
        console.log(`\n  ✓ 已删除映射: ${rmProject}\n`);
      } else {
        console.log(`\n  ✗ 未找到映射: ${rmProject}\n`);
      }
      break;

    case 'clear':
      // 清除所有映射
      repoFinder.mappingCache.mappings = {};
      repoFinder.mappingCache.historyStats = {};
      await repoFinder.saveMappingCache();
      console.log('\n  ✓ 已清除所有映射缓存\n');
      break;

    default:
      console.log(`未知子命令: ${subCommand}`);
      console.log('可用子命令: status, list, add, remove, clear');
      process.exit(1);
  }
}

/**
 * 处理分析命令
 */
async function handleAnalyze(args) {
  if (args.length === 0) {
    console.error('错误: 请提供需求ID');
    console.log('用法: node main.mjs analyze <需求ID>');
    process.exit(1);
  }

  const requirementId = args[0];

  // 解析选项
  const options = parseOptions(args.slice(1));

  // 加载配置
  const config = await loadConfig(options.config);

  // 覆盖配置
  if (options.reposDir) {
    config.repos_root_dir = options.reposDir;
  }
  if (options.output) {
    config.output.report_dir = options.output;
  }

  // 执行分析
  await analyzeRequirement(requirementId, config, options);
}

/**
 * 解析命令行选项
 */
function parseOptions(args) {
  const options = {
    reposDir: null,
    config: null,
    output: null,
    format: 'markdown',
    codeProject: null,
    collection: null,
    uploadToTfs: false,
    addTag: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--repos-dir':
        options.reposDir = args[++i];
        break;
      case '--config':
        options.config = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--code-project':
        options.codeProject = args[++i];
        break;
      case '--collection':
        options.collection = args[++i];
        break;
      case '--upload-to-tfs':
        options.uploadToTfs = true;
        break;
      case '--add-tag':
        options.addTag = true;
        break;
    }
  }

  return options;
}

/**
 * 检测仓库根目录
 * 自动检测服务器或本地环境
 * @returns {Promise<string>} 仓库根目录路径
 */
async function detectReposRootDir(config) {
  // 优先使用命令行指定的目录
  if (process.env.REPOS_DIR) {
    return process.env.REPOS_DIR;
  }

  // 服务器路径: /winning/winex-repo/storage/repos
  const serverPath = config.repos_root_dir || '/winning/winex-repo/storage/repos';
  // 本地路径: /Users/leishi/work/winning/winex-repo
  const localPath = config.repos_root_dir_local || '/Users/leishi/work/winning/winex-repo';

  // 检测服务器路径是否存在
  try {
    await fs.access(serverPath);
    const entries = await fs.readdir(serverPath);
    if (entries.length > 0) {
      console.log(`  检测到服务器环境: ${serverPath}`);
      return serverPath;
    }
  } catch (e) {
    // 服务器路径不存在
  }

  // 检测本地路径
  try {
    await fs.access(localPath);
    console.log(`  检测到本地环境: ${localPath}`);
    return localPath;
  } catch (e) {
    // 本地路径也不存在
  }

  // 默认返回配置中的路径
  return config.repos_root_dir || localPath;
}

/**
 * 查找仓库缓存文件
 * 支持多个可能的路径
 */
async function findRepoCachePath() {
  const possiblePaths = [
    // WinAi-Skills 中的 tfs2018-integration
    path.join(__dirname, '../../tfs2018-integration/config/repos-cache.json'),
    // .claude/skills 中的 tfs2018-integration
    path.join('/root/.claude/skills/tfs2018-integration/config/repos-cache.json'),
    // 用户目录
    path.join(process.env.HOME || '', '.claude/skills/tfs2018-integration/config/repos-cache.json')
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch (e) {
      // 继续尝试下一个路径
    }
  }

  // 默认返回第一个路径
  return possiblePaths[0];
}

/**
 * 加载仓库缓存（支持多路径查找）
 */
async function loadRepoCacheFromMultiplePaths() {
  const cachePath = await findRepoCachePath();
  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    console.log(`  仓库缓存: ${cachePath}`);
    return JSON.parse(content);
  } catch (e) {
    console.log(`  仓库缓存文件不存在: ${cachePath}`);
    return { repositories: {} };
  }
}

/**
 * 加载配置
 */
async function loadConfig(configPath) {
  const defaultConfigPath = path.join(__dirname, '../config/default.json');
  const filePath = configPath || defaultConfigPath;

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(content);

    // 自动检测并设置正确的仓库根目录
    if (!process.env.REPOS_DIR) {
      config._originalReposRootDir = config.repos_root_dir;
      config.repos_root_dir = await detectReposRootDir(config);
    }

    return config;
  } catch (error) {
    console.error(`警告: 无法加载配置文件 ${filePath}, 使用默认配置`);

    // 尝试自动检测
    const defaultConfig = {
      repos_root_dir: '/winning/winex-repo/storage/repos',
      repos_root_dir_local: '/Users/leishi/work/winning/winex-repo',
      tfs: {
        collection: 'WINNING-6.0',
        server_url: 'http://tfs2018-web.winning.com.cn:8080/tfs'
      },
      requirement_analysis: {
        priority_order: ['stored', 'tfs', 'llm'],
        stored_analysis_path: '../tfs2018-integration/assets/references/user/content.md',
        llm: {
          provider: 'claude',
          model: 'claude-3-5-sonnet-20241022',
          api_key_env: 'ANTHROPIC_API_KEY',
          timeout: 60000
        }
      },
      scoring: {
        weights: {
          business_logic: 0.35,
          functional_coverage: 0.20,
          code_quality: 0.20,
          test_coverage: 0.15,
          code_scale: 0.10
        },
        thresholds: {
          implemented_min_lines: 50,
          implemented_min_commits: 1
        }
      },
      output: {
        report_dir: '/tmp',
        console_width: 60
      }
    };

    // 自动检测仓库根目录
    defaultConfig.repos_root_dir = await detectReposRootDir(defaultConfig);
    return defaultConfig;
  }
}

/**
 * 创建TFS客户端 (使用真实TFS工具链)
 */
async function createTFSClient(config) {
  const collectionName = config.tfs?.collection || 'WINNING-6.0';
  const client = new TFSClientClass(collectionName);

  // 设置全局 TFS 配置，供 local-repo-indexer.mjs 使用
  try {
    const tfsConfig = loadTFSConfig();
    global.tfsConfig = tfsConfig;
  } catch (e) {
    // 忽略加载失败
  }

  // 包装为统一的接口
  return {
    collectionName,
    serverUrl: client.serverUrl,
    client,

    async getWorkItem(id) {
      return await client.getWorkItem(id);
    },

    async getWorkItems(ids) {
      return await client.getWorkItems(ids);
    },

    async getCommits(repositoryId, project, top = 20, days = null) {
      return await client.getCommits(repositoryId, project, top, days);
    }
  };
}

/**
 * 分析需求
 */
async function analyzeRequirement(requirementId, config, options = {}) {
  const width = config.output?.console_width || 60;
  console.log('\n' + '═'.repeat(width));
  console.log('  需求覆盖率分析');
  console.log('═'.repeat(width));

  const result = {
    requirementId: requirementId,
    requirementTitle: '',
    requirementState: '',
    dataSource: '',
    subItems: [],
    commitCount: 0,
    fileCount: 0,
    linesAdded: 0,
    linesDeleted: 0,
    score: { overall: 0, dimensions: {} },
    scanResults: {}
  };

  let commits = [];
  let changedFiles = [];
  let localRepoIndex = null;  // 移到 try 块之前声明

  try {
    // 步骤1：获取需求分析
    console.log(`\n[1/7] 获取需求分析...`);
    const tfsClient = await createTFSClient(config);
    const analysisResult = await getRequirementAnalysis(requirementId, tfsClient, config);

    if (analysisResult.requirement) {
      const req = analysisResult.requirement;
      result.requirementTitle = req.fields && req.fields['System.Title'] ? req.fields['System.Title'] : `需求 ${req.id}`;
      result.requirementState = req.fields && req.fields['System.State'] ? req.fields['System.State'] : '未知';
      result.dataSource = analysisResult.source;

      // 保存需求描述
      if (req.fields && req.fields['System.Description']) {
        result.requirementDescription = req.fields['System.Description'];
      }

      // 保存所属项目
      if (req.fields && req.fields['System.TeamProject']) {
        result.projectName = req.fields['System.TeamProject'];
      }

      // 保存需求类型
      if (req.fields && req.fields['System.WorkItemType']) {
        result.requirementType = req.fields['System.WorkItemType'];
      }

      // 保存需求分析内容（用于报告生成）
      if (analysisResult.analysis) {
        result.requirementAnalysis = analysisResult.analysis;
        if (analysisResult.analysis.rawAnalysis) {
          console.log(`  需求分析: 已获取 (来自 Winning.Demand.Analysis 字段)`);
        }
      }

      // 执行需求质量评审
      console.log(`\n  执行需求质量评审...`);
      const qualityReview = await reviewRequirementQuality(
        requirementId,
        result.requirementDescription || '',
        result.requirementAnalysis?.rawAnalysis || ''
      );
      result.qualityReview = qualityReview;

      if (qualityReview.pending) {
        console.log(`  评审输入文件: ${qualityReview.inputPath}`);
        console.log(`  状态: 等待LLM评审`);
        console.log(`  评审完成: null/100 - 等待LLM评审`);
      } else {
        console.log(`  评审完成: ${qualityReview.overallScore}/100 - ${qualityReview.summary}`);
      }

      console.log(`  标题: ${result.requirementTitle}`);
      console.log(`  状态: ${result.requirementState}`);
      console.log(`  类型: ${result.requirementType || '未知'}`);
      console.log(`  所属项目: ${result.projectName || '未知'}`);
      console.log(`  数据来源: ${result.dataSource}`);
    } else {
      console.log(`  警告: 无法获取需求信息`);
    }

    // 步骤2：获取子工作项和提交
    console.log(`\n[2/7] 获取子工作项和提交记录...`);

    // 代码获取路径信息
    const codePaths = {
      reposRootDir: config.repos_root_dir,
      tfsServerUrl: config.tfs?.server_url || 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0',
      collection: config.tfs?.collection || 'WINNING-6.0'
    };
    console.log(`\n  === 代码获取路径信息 ===`);
    console.log(`  本地仓库根目录: ${codePaths.reposRootDir}`);
    console.log(`  TFS 服务器地址: ${codePaths.tfsServerUrl}`);
    console.log(`  TFS 集合: ${codePaths.collection}`);

    // 加载仓库缓存
    let repoCache = {};
    let repoCacheRaw = {};
    try {
      repoCacheRaw = await loadRepoCacheFromMultiplePaths();
      // 仓库缓存结构: { repositories: {...}, totalCount: ..., lastUpdate: ... }
      repoCache = repoCacheRaw.repositories || repoCacheRaw;
      console.log(`  仓库缓存: ${Object.keys(repoCache).length} 个仓库`);

      // 提前初始化本地仓库索引（用于显示本地分支信息）
      try {
        localRepoIndex = await initOrUpdateIndex(config.repos_root_dir, repoCache, false);
      } catch (idxErr) {
        console.log(`  警告: 本地仓库索引初始化失败: ${idxErr.message}`);
      }
    } catch (e) {
      console.log(`  警告: 无法加载仓库缓存: ${e.message}`);
    }

    try {
      // 获取工作项详情（包含 relations）
      const workItem = await tfsClient.getWorkItem(requirementId);
      const projectName = workItem.fields?.['System.TeamProject'];

      // 显示获取提交记录的方法
      console.log(`\n  === 提交记录获取方法 ===`);
      console.log(`  1. 通过 TFS Git API 获取项目仓库列表`);
      console.log(`  2. 遍历仓库获取最近提交记录`);
      console.log(`  3. 筛选包含工作项 #${requirementId} 的提交`);
      console.log(`  API 端点: GET {serverUrl}/_apis/git/repositories/{repoId}/commits`);

      // 提取子工作项
      if (workItem.relations && workItem.relations.length > 0) {
        const childRelations = workItem.relations.filter(rel =>
          rel.rel === 'System.LinkTypes.Hierarchy-Forward'
        );

        // 获取子工作项 ID
        const childIds = childRelations.map(rel => {
          const url = rel.url;
          return parseInt(url.substring(url.lastIndexOf('/') + 1));
        }).filter(id => !isNaN(id));

        if (childIds.length > 0) {
          // 批量获取子工作项详情（包含relations）
          const childItems = await tfsClient.getWorkItems(childIds);

          // 处理子工作项的 ArtifactLink 关联提交
          const artifactCommits = [];
          // 用于缓存从 TFS API 获取的仓库列表
          let tfsRepoCache = null;

          for (const child of childItems) {
            // 获取子工作项通过 ArtifactLink 关联的提交
            const linkedCommits = await tfsClient.client.getArtifactLinkedCommits(child);
            if (linkedCommits.length > 0) {
              for (const commit of linkedCommits) {
                // 查找仓库名称（依次尝试：本地缓存 -> TFS API -> 本地仓库索引）
                let repo = Object.values(repoCache).find(r => r.id === commit.repoId);
                let repoName = repo?.name;

                // 如果本地缓存没找到，从 TFS API 获取（不限项目）
                if (!repoName) {
                  if (!tfsRepoCache) {
                    try {
                      // 不传项目名，获取整个集合的所有仓库
                      tfsRepoCache = await tfsClient.client.getRepositories();
                    } catch (e) {
                      console.log(`  警告: 无法从 TFS 获取仓库列表: ${e.message}`);
                      tfsRepoCache = [];
                    }
                  }
                  const tfsRepo = tfsRepoCache?.find(r => r.id === commit.repoId);
                  repoName = tfsRepo?.name;
                }

                // 从提交备注提取分支信息
                const branchInfo = extractBranchFromComment(commit.comment);
                artifactCommits.push({
                  ...commit,
                  repositoryName: repoName || commit.repoId,
                  repositoryId: commit.repoId,
                  linkedTaskId: child.id,
                  linkedTaskTitle: child.fields?.['System.Title'] || '',
                  branch: branchInfo.source || branchInfo.target || null,
                  sourceBranch: branchInfo.source,
                  targetBranch: branchInfo.target
                });
              }
            }
          }

          result.subItems = childItems.map(child => {
            // 计算该子工作项的关联提交数
            const taskCommits = artifactCommits.filter(c => c.linkedTaskId === child.id);
            return {
              id: child.id,
              type: child.fields?.['System.WorkItemType'] || '任务',
              title: child.fields?.['System.Title'] || '',
              status: child.fields?.['System.State'] || '',
              commitCount: taskCommits.length,
              commits: taskCommits
            };
          });

          // 保存 ArtifactLink 提交
          result.artifactCommits = artifactCommits;
          console.log(`\n  通过 ArtifactLink 获取到 ${artifactCommits.length} 个关联提交`);
        }
      }

      if (projectName) {
        console.log(`\n  项目: ${projectName}`);

        // === 智能仓库识别 ===
        const repoFinder = new SmartRepoFinder(repoCache, tfsClient, config);
        const repoResult = await repoFinder.findCodeRepos(
          projectName,
          workItem.fields['System.Title'],
          options
        );

        // 保存识别结果
        result.repoMatchInfo = {
          originalProject: projectName,
          matchedProject: repoResult.matchedProject,
          source: repoResult.source,
          matchedBy: repoResult.matchedBy,
          score: repoResult.score,
          repoCount: repoResult.repos.length,
          needConfirm: repoResult.needConfirm
        };

        // 显示识别结果
        if (repoResult.source === 'smart' || repoResult.source === 'not_found') {
          repoFinder.displayResult(repoResult, projectName);
        }

        // 首次识别需要确认
        if (repoResult.needConfirm && repoResult.matchedProject && !options.codeProject) {
          if (repoResult.score >= 50) {
            // 自动确认（置信度>=50）
            console.log(`\n  💡 自动确认使用 ${repoResult.matchedProject} (置信度: ${repoResult.score}分)`);
            await repoFinder.confirmMapping(projectName, repoResult.matchedProject, repoResult.score);
          } else {
            console.log(`\n  ⚠️  置信度较低 (${repoResult.score}分)，建议使用 --code-project 手动指定`);
          }
        }

        // 获取项目的仓库列表
        console.log(`\n  === 项目仓库信息 ===`);
        const projectRepos = repoResult.repos;
        console.log(`  项目仓库数量: ${projectRepos.length} 个`);

        // 记录使用的仓库项目
        if (repoResult.matchedProject && repoResult.matchedProject !== projectName) {
          console.log(`  仓库所在项目: ${repoResult.matchedProject} (智能匹配)`);
        }

        if (projectRepos.length > 0) {
          // 先检查本地仓库状态，获取本地分支信息
          let reposStatus = projectRepos;
          if (localRepoIndex) {
            reposStatus = checkReposStatus(projectRepos, localRepoIndex);
            const statusSummary = getReposStatusSummary(reposStatus);
            result.reposStatus = reposStatus;
            result.reposStatusSummary = statusSummary;
          }

          console.log(`\n  仓库列表 (前10个):`);
          reposStatus.slice(0, 10).forEach((repo, idx) => {
            console.log(`    ${idx + 1}. ${repo.name}`);
            console.log(`       ID: ${repo.id}`);
            console.log(`       URL: ${repo.url}`);
            console.log(`       默认分支: ${repo.defaultBranch || 'N/A'}`);
          });
          if (reposStatus.length > 10) {
            console.log(`    ... 还有 ${reposStatus.length - 10} 个仓库`);
          }

          // 显示本地仓库状态统计
          if (localRepoIndex && result.reposStatusSummary) {
            console.log(`\n  === 本地仓库状态 ===`);
            console.log(`  已克隆: ${result.reposStatusSummary.localExists} 个`);
            console.log(`  未克隆: ${result.reposStatusSummary.missing} 个`);

            // 显示已克隆的仓库
            const existingRepos = reposStatus.filter(r => r.localExists);
            if (existingRepos.length > 0) {
              console.log(`\n  已克隆的仓库:`);
              existingRepos.forEach((repo, idx) => {
                console.log(`    ✓ ${repo.name}`);
              });
            }
          }
        }

        // 获取提交记录
        console.log(`\n  === 获取提交记录 ===`);
        commits = [];
        const allWorkItemIds = [requirementId, ...result.subItems.map(s => s.id)];

        for (const repo of projectRepos.slice(0, 5)) { // 限制查询前5个仓库避免太慢
          try {
            const repoCommits = await tfsClient.getCommits(repo.id, projectName, 50, 365);
            // 筛选关联到当前需求的提交
            const relatedCommits = repoCommits.filter(commit => {
              // 检查提交消息中是否包含工作项ID
              const message = commit.comment || '';
              return allWorkItemIds.some(id => message.includes(`#${id}`) || message.includes(id.toString()));
            });

            if (relatedCommits.length > 0) {
              relatedCommits.forEach(commit => {
                commits.push({
                  ...commit,
                  repositoryName: repo.name,
                  repositoryId: repo.id,
                  repositoryUrl: repo.url
                });
              });
              console.log(`  ✓ 仓库 ${repo.name}: 找到 ${relatedCommits.length} 个相关提交`);
            }
          } catch (e) {
            console.log(`  ✗ 仓库 ${repo.name}: 获取提交失败 - ${e.message}`);
          }
        }

        console.log(`\n  总计找到 ${commits.length} 个相关提交（消息匹配）`);

        // 保存代码路径信息到结果
        result.codePaths = codePaths;
        // 优先使用 reposStatus（带本地分支信息），否则使用原始数据
        result.repositories = result.reposStatus ? result.reposStatus.slice(0, 10) : projectRepos.slice(0, 10);
        result.messageMatchedCommits = commits;
      }

      // 合并所有提交来源
      const artifactCommits = result.artifactCommits || [];
      const messageCommits = result.messageMatchedCommits || [];

      // 去重合并（按commitId去重）
      const allCommitsMap = new Map();
      [...messageCommits, ...artifactCommits].forEach(commit => {
        const key = commit.commitId;
        if (!allCommitsMap.has(key)) {
          allCommitsMap.set(key, commit);
        }
      });
      commits = Array.from(allCommitsMap.values());
      result.rawCommits = commits;

      result.commitCount = commits.length;
      result.messageMatchedCount = messageCommits.length;
      result.artifactLinkCount = artifactCommits.length;

      // 统计代码变更
      changedFiles = commits.flatMap(c => c.changes || []);
      result.fileCount = changedFiles.length;
      result.linesAdded = commits.reduce((sum, c) => sum + (c.additions || 0), 0);
      result.linesDeleted = commits.reduce((sum, c) => sum + (c.deletions || 0), 0);

      console.log(`\n  === 提交来源统计 ===`);
      console.log(`  子工作项: ${result.subItems.length} 个`);
      console.log(`  消息匹配提交: ${result.messageMatchedCount || 0} 个`);
      console.log(`  ArtifactLink提交: ${result.artifactLinkCount || 0} 个`);
      console.log(`  合并去重后: ${result.commitCount} 个`);

    } catch (error) {
      console.log(`  警告: 无法获取提交记录: ${error.message}`);
      // 使用空数据
      result.commitCount = 0;
      result.fileCount = 0;
    }

    // 步骤3：发现仓库
    console.log(`\n[3/8] 初始化本地仓库索引...`);
    try {
      // 如果步骤2已经初始化过，则只显示状态
      if (!localRepoIndex) {
        const tfsRepoCache = await loadRepoCacheFromMultiplePaths();
        localRepoIndex = await initOrUpdateIndex(config.repos_root_dir, tfsRepoCache.repositories || tfsRepoCache, false);
      }
      const indexStatus = getIndexStatus(localRepoIndex);
      console.log(`  索引状态: ${indexStatus.activeRepos} 个有效仓库, ${indexStatus.missingRepos} 个缺失`);

      const localRepos = await scanLocalRepos(config.repos_root_dir);
      console.log(`  发现本地仓库: ${localRepos.length} 个`);
    } catch (error) {
      console.log(`  警告: 仓库索引初始化失败: ${error.message}`);
    }

    // 步骤4：获取代码变更详情
    console.log(`\n[4/8] 获取代码变更详情...`);
    let codeChangesResult = null;
    let codeContextAnalysisError = null; // 记录代码分析失败原因

    if (commits.length === 0) {
      codeContextAnalysisError = 'no_commits';
    } else if (!localRepoIndex) {
      codeContextAnalysisError = 'no_local_index';
    }

    if (commits.length > 0 && localRepoIndex) {
      // 按仓库分组提交
      const commitsByRepo = {};
      for (const commit of commits) {
        const repoName = commit.repositoryName || commit.repoName || 'unknown';
        if (!commitsByRepo[repoName]) {
          commitsByRepo[repoName] = {
            repoId: commit.repoId || commit.repositoryId,
            repoName: repoName,
            commits: []
          };
        }
        commitsByRepo[repoName].commits.push(commit);
      }

      // 获取每个仓库的代码变更
      const allChanges = [];
      for (const [repoName, repoData] of Object.entries(commitsByRepo)) {
        // 查找本地仓库路径
        const localRepo = findLocalRepoPath(repoName, localRepoIndex) ||
          findLocalRepoPath(repoData.repoId, localRepoIndex);

        // 从仓库缓存获取仓库的项目名（可能与需求项目不同）
        const tfsRepoInfo = Object.values(repoCache).find(r => r.id === repoData.repoId || r.name === repoName);
        const repoProjectName = tfsRepoInfo?.project || result.projectName;

        if (localRepo && await isRepoValid(localRepo.localPath)) {
          console.log(`  处理仓库: ${repoName} (${localRepo.localPath})`);
          let repoNeedsSync = false;
          let repoSyncMessage = '';

          for (const commit of repoData.commits) {
            if (commitExistsLocally(localRepo.localPath, commit.commitId)) {
              try {
                const changes = await getBatchCommitChanges(localRepo.localPath, [commit], config.code_analysis?.max_file_size || 1048576);
                allChanges.push(...changes);
                console.log(`    提交 ${commit.commitId.substring(0, 8)}: ${changes[0]?.files?.length || 0} 个文件变更`);
              } catch (e) {
                console.log(`    警告: 获取提交变更失败 - ${e.message}`);
              }
            } else {
              // 提交不存在于本地，检测同步状态
              const remoteCommitDate = commit.author?.date ? new Date(commit.author.date) : null;
              const syncStatus = checkRepoSyncStatus(localRepo.localPath, remoteCommitDate);
              if (syncStatus.needsSync && !repoNeedsSync) {
                repoNeedsSync = true;
                repoSyncMessage = syncStatus.message;
              }

              console.log(`    提交 ${commit.commitId.substring(0, 8)}: 不存在于本地${syncStatus.needsSync ? ` (${syncStatus.message})` : ''}，尝试 TFS API`);
              try {
                const tfsChanges = await getCommitChangesFromTFS(tfsClient, repoData.repoId, commit.commitId, repoProjectName);
                if (tfsChanges) {
                  allChanges.push(tfsChanges);
                }
              } catch (e) {
                console.log(`    警告: TFS API 获取失败 - ${e.message}`);
              }
            }
          }

          // 记录需要同步的仓库信息
          if (repoNeedsSync) {
            if (!result.syncWarnings) result.syncWarnings = [];
            result.syncWarnings.push({
              repoName: repoName,
              localPath: localRepo.relativePath,
              message: repoSyncMessage,
              suggestion: `cd ${localRepo.relativePath} && git pull origin ${localRepo.currentBranch || 'master'}`
            });
          }
        } else {
          console.log(`  仓库 ${repoName}: 本地未找到，跳过代码分析`);
        }
      }

      codeChangesResult = allChanges;

      // 汇总变更文件
      const allChangedFiles = allChanges.flatMap(c => c.files || []);
      result.fileCount = allChangedFiles.length;
      result.linesAdded = allChanges.reduce((sum, c) => sum + (c.totalAdded || 0), 0);
      result.linesDeleted = allChanges.reduce((sum, c) => sum + (c.totalDeleted || 0), 0);
      console.log(`\n  总计: ${allChangedFiles.length} 个文件变更, +${result.linesAdded}/-${result.linesDeleted} 行`);

      // 修复：将文件变更数据赋值给 changedFiles（用于评分计算）
      changedFiles = allChangedFiles;

      // 记录获取失败的原因
      if (allChanges.length === 0 && commits.length > 0) {
        codeContextAnalysisError = 'commits_not_local';
      }
    } else {
      console.log(`  无提交或索引未初始化，跳过代码变更获取`);
      if (!codeContextAnalysisError) {
        codeContextAnalysisError = commits.length === 0 ? 'no_commits' : 'no_local_index';
      }
    }

    // 步骤5：依赖分析
    console.log(`\n[5/8] 分析代码依赖...`);
    let dependencyResult = null;
    if (codeChangesResult && codeChangesResult.length > 0 && localRepoIndex) {
      const allFiles = codeChangesResult.flatMap(c => c.files || []);
      if (allFiles.length > 0) {
        // 找到第一个有效的本地仓库路径
        const firstCommit = commits[0];
        const localRepo = findLocalRepoPath(firstCommit?.repositoryName, localRepoIndex) ||
          findLocalRepoPath(firstCommit?.repoId, localRepoIndex);

        if (localRepo) {
          try {
            dependencyResult = await analyzeDependencies(
              localRepo.localPath,
              allFiles,
              config.code_analysis?.max_dependency_depth || 2
            );
            console.log(`  发现 ${dependencyResult.dependencies.length} 个依赖文件`);
          } catch (e) {
            console.log(`  警告: 依赖分析失败 - ${e.message}`);
          }
        }
      }
    }

    // 步骤6：代码上下文分析
    console.log(`\n[6/8] 提取业务逻辑...`);
    let codeContextAnalysis = null;
    if (codeChangesResult && codeChangesResult.length > 0) {
      // 收集所有变更文件的内容
      const allFiles = codeChangesResult.flatMap(c =>
        (c.files || []).map(f => ({
          path: f.path,
          content: f.content,
          changeType: f.changeType,
          commitId: c.commitId,
          taskId: c.taskId,
          commitMessage: c.commitMessage,
          added: f.added,
          deleted: f.deleted
        }))
      ).filter(f => f.content);

      if (allFiles.length > 0) {
        codeContextAnalysisError = null; // 有数据，清除错误
        try {
          const analysisResult = analyzeMultipleFiles(allFiles);

          // 合并分析结果
          const allEndpoints = analysisResult.files.flatMap(f => f.apiEndpoints || []);
          const allFunctions = analysisResult.files.flatMap(f => f.functions || []);
          const allRules = analysisResult.files.flatMap(f => f.businessRules || []);
          const allModels = analysisResult.files.flatMap(f => f.dataModels || []);
          const allCacheOps = analysisResult.files.flatMap(f => f.cacheOperations || []);

          codeContextAnalysis = {
            changedFiles: allFiles,
            analysisSummary: analysisResult.summary,
            apiEndpoints: allEndpoints,
            dataModels: allModels,
            cacheOperations: allCacheOps,
            businessRules: allRules
          };

          // 添加依赖信息
          if (dependencyResult) {
            codeContextAnalysis.dependencies = dependencyResult.dependencies;
            codeContextAnalysis.dependencyMap = dependencyResult.dependencyMap;
          }

          // 与需求匹配分析
          const requirementText = result.requirementAnalysis?.rawAnalysis || '';
          if (requirementText) {
            const combinedAnalysis = {
              apiEndpoints: allEndpoints,
              functions: allFunctions,
              businessRules: allRules,
              dataModels: allModels,
              cacheOperations: allCacheOps
            };
            codeContextAnalysis.matchResult = matchWithRequirement(combinedAnalysis, requirementText);
          }

          console.log(`  API 接口: ${allEndpoints.length} 个`);
          console.log(`  函数/方法: ${allFunctions.length} 个`);
          console.log(`  业务规则: ${allRules.length} 个`);
          console.log(`  数据模型: ${allModels.length} 个`);
          console.log(`  缓存操作: ${allCacheOps.length} 个`);
          if (codeContextAnalysis.matchResult) {
            console.log(`  需求匹配: ${codeContextAnalysis.matchResult.score}%`);
          }
        } catch (e) {
          console.log(`  警告: 业务逻辑提取失败 - ${e.message}`);
          codeContextAnalysisError = 'analysis_failed';
        }
      } else {
        console.log(`  无文件内容可分析`);
        codeContextAnalysisError = 'no_file_content';
      }
    } else {
      console.log(`  无代码变更，跳过业务逻辑提取`);
      if (!codeContextAnalysisError) {
        codeContextAnalysisError = 'no_code_changes';
      }
    }

    result.codeContextAnalysis = codeContextAnalysis;
    result.codeContextAnalysisError = codeContextAnalysisError;

    // 步骤6.5: 生成 LLM 语义分析输入文件（带时间戳）
    const analysisTimestamp = new Date().getFullYear().toString() +
      String(new Date().getMonth() + 1).padStart(2, '0') +
      String(new Date().getDate()).padStart(2, '0') +
      String(new Date().getHours()).padStart(2, '0') +
      String(new Date().getMinutes()).padStart(2, '0') +
      String(new Date().getSeconds()).padStart(2, '0');

    const analysisInputPath = `/tmp/requirement-analysis-input-${requirementId}-${analysisTimestamp}.json`;
    const analysisResultPath = `/tmp/requirement-analysis-result-${requirementId}-${analysisTimestamp}.json`;

    // 提取关键代码片段（前5个变更最大的文件）
    const keyCodeSnippets = [];
    if (codeContextAnalysis?.changedFiles) {
      const sortedFiles = [...codeContextAnalysis.changedFiles]
        .sort((a, b) => (b.added || 0) - (a.added || 0))
        .slice(0, 5);

      for (const file of sortedFiles) {
        if (file.content) {
          // 提取关键方法/函数
          const methodMatches = file.content.match(/(?:public|private|protected)?\s+(?:static\s+)?(?:\w+\s+)?\w+\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*\{[^}]{50,500}\}/g);
          if (methodMatches) {
            keyCodeSnippets.push({
              file: file.path,
              methods: methodMatches.slice(0, 3).map(m => m.substring(0, 300))
            });
          }
        }
      }
    }

    const analysisInput = {
      requirementId: requirementId,
      requirementTitle: result.requirementTitle,
      requirementState: result.requirementState,
      requirementDescription: result.requirementDescription,
      requirementAnalysis: result.requirementAnalysis?.rawAnalysis || '',
      codeAnalysis: {
        changedFiles: codeContextAnalysis?.changedFiles?.map(f => ({
          path: f.path,
          changeType: f.changeType,
          added: f.added,
          deleted: f.deleted
        })) || [],
        functions: codeContextAnalysis?.analysisSummary?.totalFunctions || 0,
        dataModels: (codeContextAnalysis?.dataModels || []).map(m => ({
          name: m.name,
          type: m.type,
          fields: m.fields?.slice(0, 20) || [] // 增加到20个字段
        })),
        businessRules: (codeContextAnalysis?.businessRules || []).slice(0, 30).map(r => ({
          type: r.type,
          content: r.content?.substring(0, 200) // 增加内容长度
        })),
        apiEndpoints: codeContextAnalysis?.apiEndpoints || [],
        cacheOperations: codeContextAnalysis?.cacheOperations || [],
        keyCodeSnippets: keyCodeSnippets // 新增：关键代码片段
      },
      commits: commits.slice(0, 10).map(c => ({
        commitId: c.commitId?.substring(0, 8),
        comment: c.comment?.substring(0, 200), // 增加长度
        author: c.author?.name,
        date: c.author?.date
      })),
      testCoverage: {
        hasTests: codeContextAnalysis?.changedFiles?.some(f =>
          f.path.includes('test') || f.path.includes('Test') || f.path.includes('spec')
        ) || false,
        testFileCount: codeContextAnalysis?.changedFiles?.filter(f =>
          f.path.includes('test') || f.path.includes('Test') || f.path.includes('spec')
        ).length || 0
      }
    };

    await fs.writeFile(analysisInputPath, JSON.stringify(analysisInput, null, 2), 'utf-8');
    result.llmAnalysisInputPath = analysisInputPath;
    result.llmAnalysisResultPath = analysisResultPath;
    result.llmAnalysisTimestamp = analysisTimestamp;
    console.log(`\n  LLM分析输入文件: ${analysisInputPath}`);
    console.log(`  LLM分析结果文件: ${analysisResultPath}`);

    // 检查是否存在 LLM 分析结果文件（使用同一时间戳）
    try {
      const resultContent = await fs.readFile(analysisResultPath, 'utf-8');
      const llmResult = JSON.parse(resultContent);
      result.llmAnalysisResult = llmResult;
      console.log(`  已加载 LLM 分析结果: 匹配度 ${llmResult.score || 0}%`);
    } catch (e) {
      console.log(`  等待 LLM 语义分析... (结果文件: ${analysisResultPath})`);
    }

    // 兼容旧的业务逻辑提取
    let codeLogic;
    if (commits.length > 0) {
      const repoPath = config.repos_root_dir;
      codeLogic = await extractBusinessLogic(commits, repoPath);
    } else {
      codeLogic = {
        validationRules: [],
        stateTransitions: [],
        calculations: [],
        dataOperations: [],
        exceptionHandling: []
      };
    }

    // 步骤7：计算匹配度
    console.log(`\n[7/8] 计算匹配度...`);
    const requirementAnalysis = analysisResult.analysis || {
      businessRules: [],
      workflows: [],
      constraints: [],
      dataMapping: [],
      edgeCases: []
    };

    // 步骤7: 先执行代码质量扫描（评分依赖扫描结果）
    console.log(`\n[7/8] 代码质量扫描...`);
    const scanResults = await performSimpleCodeScan(codeContextAnalysis, config);
    result.scanResults = scanResults;
    console.log(`  扫描 ${scanResults.scannedFiles || 0} 个文件，发现 ${scanResults.total || 0} 个问题`);

    // 步骤7.5: LLM 语义匹配分析（只使用 LLM 评分）
    console.log(`\n[7.5/8] 等待 LLM 语义分析结果...`);

    // 尝试读取 LLM 分析结果（使用带时间戳的路径）
    const llmResultPath = analysisResultPath;

    try {
      const llmResultContent = await fs.readFile(llmResultPath, 'utf-8');
      const llmResult = JSON.parse(llmResultContent);

      if (typeof llmResult.score === 'number') {
        // 使用 LLM 语义分析评分
        result.score = {
          overall: llmResult.score,
          dimensions: llmResult.dimensions || {
            businessLogic: llmResult.score,
            functionalCoverage: llmResult.score,
            codeQuality: 100 - (scanResults.total || 0) * 5,
            testCoverage: 0,
            codeScale: result.fileCount > 10 ? 80 : (result.fileCount > 5 ? 60 : 40)
          },
          source: 'llm',
          details: llmResult
        };
        console.log(`  ✓ LLM 语义分析完成: ${result.score.overall}/100`);
      } else {
        throw new Error('LLM 分析结果缺少 score 字段');
      }
    } catch (e) {
      // LLM 分析结果不存在或格式错误 - 不降级，报错
      console.error(`  ✗ LLM 分析失败: ${e.message}`);
      console.error(`  等待 LLM 分析结果文件: ${llmResultPath}`);
      console.error(`  请确保已运行 LLM 分析并生成结果文件`);

      result.score = {
        overall: null,
        dimensions: {},
        source: 'pending',
        error: '等待 LLM 语义分析'
      };
    }

  } catch (error) {
    console.error(`\n错误: 分析失败 - ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  // 步骤8: 等待所有评审完成
  console.log(`\n[8/8] 等待评审完成...`);

  // 8.1 等待需求质量评审（查找最新结果文件）
  let qualityReviewCompleted = !result.qualityReview?.pending;
  let qualityReviewWaitCount = 0;
  const maxWaitCount = 120; // 最多等待120次（约120秒）

  while (!qualityReviewCompleted && qualityReviewWaitCount < maxWaitCount) {
    // 不指定时间戳，查找最新的结果文件
    const reviewResult = await (await import('./requirement-quality-reviewer.mjs')).loadQualityReviewResult(requirementId, null);
    if (reviewResult) {
      result.qualityReview = reviewResult;
      qualityReviewCompleted = true;
      console.log(`  ✓ 需求质量评审完成: ${reviewResult.overallScore}/100`);
    } else {
      qualityReviewWaitCount++;
      if (qualityReviewWaitCount === 1) {
        console.log(`  ⏳ 等待需求质量评审...`);
        console.log(`     评审输入文件: ${result.qualityReview?.inputPath || 'N/A'}`);
        console.log(`     请执行 LLM 评审，结果写入: ${result.qualityReview?.resultPath || 'N/A'}`);
      }
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 每10秒提示一次
      if (qualityReviewWaitCount % 10 === 0) {
        console.log(`  已等待 ${qualityReviewWaitCount} 秒...`);
      }
    }
  }

  if (!qualityReviewCompleted) {
    console.log(`  ⚠ 需求质量评审超时，继续生成报告（评审部分将显示待完成）`);
  }

  // 8.2 等待LLM语义分析（查找最新结果文件）
  let llmAnalysisCompleted = result.score?.overall !== null && result.score?.source !== 'pending';
  let llmWaitCount = 0;

  while (!llmAnalysisCompleted && llmWaitCount < maxWaitCount) {
    // 查找最新的结果文件
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir('/tmp');
      const resultFiles = files
        .filter(f => f.match(new RegExp(`^requirement-analysis-result-${requirementId}-\\d{14}\\.json$`)))
        .sort()
        .reverse();

      if (resultFiles.length > 0) {
        const llmResultPath = `/tmp/${resultFiles[0]}`;
        const llmResultContent = await fs.readFile(llmResultPath, 'utf-8');
        const llmResult = JSON.parse(llmResultContent);

        if (typeof llmResult.score === 'number') {
          result.score = {
            overall: llmResult.score,
            dimensions: llmResult.dimensions || {
              businessLogic: llmResult.score,
              functionalCoverage: llmResult.score,
              codeQuality: 100 - (result.scanResults?.total || 0) * 5,
              testCoverage: 0,
              codeScale: result.fileCount > 10 ? 80 : (result.fileCount > 5 ? 60 : 40)
            },
            source: 'llm',
            details: llmResult
          };
          // 同时更新 llmAnalysisResult，用于报告生成
          result.llmAnalysisResult = llmResult;
          llmAnalysisCompleted = true;
          console.log(`  ✓ LLM语义分析完成: ${llmResult.score}/100`);
        }
      }
    } catch (e) {
      // 继续等待
    }

    if (!llmAnalysisCompleted) {
      llmWaitCount++;
      if (llmWaitCount === 1) {
        console.log(`  ⏳ 等待LLM语义分析...`);
        console.log(`     分析输入文件: ${result.llmAnalysisInputPath || 'N/A'}`);
        console.log(`     请执行 LLM 分析，结果写入: ${result.llmAnalysisResultPath || 'N/A'}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (llmWaitCount % 10 === 0) {
        console.log(`  已等待 ${llmWaitCount} 秒...`);
      }
    }
  }

  if (!llmAnalysisCompleted) {
    console.log(`  ⚠ LLM语义分析超时，报告将显示待完成状态`);
  }

  // 生成报告
    console.log(`\n生成报告...`);
    generateConsoleReport(result, config);

  try {
    const reportPath = await generateMarkdownReport(result, config);
    console.log(`\n报告已保存: ${reportPath}`);

    // 添加SKILL追踪提示
    printSkillTrackingHintWithTFS(result, reportPath);

    // 可选：上传报告到TFS工作项
    if (options.uploadToTfs) {
      try {
        console.log(`\n正在上传报告到TFS工作项 ${result.requirementId}...`);

        // 加载TFS配置
        const tfsConfigPath = path.join(__dirname, '../../tfs2018-integration/config/tfs-config.json');
        const tfsConfig = await loadTFSConfig(tfsConfigPath);

        if (!tfsConfig || !tfsConfig.pat) {
          console.log(`  ⚠️  未配置TFS认证信息，跳过上传`);
          console.log(`  提示: 请在 ${tfsConfigPath} 中配置PAT Token`);
        } else {
          const serverUrl = tfsConfig.serverUrl || `http://tfs2018-web.winning.com.cn:8080/tfs/${tfsConfig.collection || 'WINNING-6.0'}`;

          const uploader = new TFSAttachmentUploader(
            serverUrl,
            tfsConfig.pat,
            tfsConfig.collection || 'WINNING-6.0'
          );

          const uploadResult = await uploader.uploadAttachment(
            result.requirementId,
            reportPath,
            `需求覆盖率分析报告 - 评分: ${result.score?.overall || 'N/A'}/100`
          );

          if (uploadResult.success) {
            console.log(`  ✓ 报告已上传到TFS`);
            console.log(`    附件ID: ${uploadResult.attachmentId}`);
            console.log(`    工作项: ${result.requirementId}`);

            // 自动添加标记到TFS工作项
            console.log(`\n正在为工作项添加标记...`);
            const tag = TFSAttachmentUploader.generateFixedTag();
            const tagResult = await uploader.addTag(result.requirementId, tag);

            if (tagResult.success) {
              if (!tagResult.skipped) {
                console.log(`    标记: ${tagResult.tag}`);
              }
            }
          } else {
            console.log(`  ✗ 上传失败: ${uploadResult.error}`);
          }
        }
      } catch (uploadError) {
        console.log(`  ⚠️  TFS上传失败: ${uploadError.message}`);
      }
    }

    // 单独添加标记（不上传报告）
    if (options.addTag && !options.uploadToTfs) {
      try {
        console.log(`\n正在为工作项添加标记...`);

        // 加载TFS配置
        const tfsConfigPath = path.join(__dirname, '../../tfs2018-integration/config/tfs-config.json');
        const tfsConfig = await loadTFSConfig(tfsConfigPath);

        if (!tfsConfig || !tfsConfig.pat) {
          console.log(`  ⚠️  未配置TFS认证信息，跳过添加标记`);
          console.log(`  提示: 请在 ${tfsConfigPath} 中配置PAT Token`);
        } else {
          const serverUrl = tfsConfig.serverUrl || `http://tfs2018-web.winning.com.cn:8080/tfs/${tfsConfig.collection || 'WINNING-6.0'}`;

          const uploader = new TFSAttachmentUploader(
            serverUrl,
            tfsConfig.pat,
            tfsConfig.collection || 'WINNING-6.0'
          );

          const tag = TFSAttachmentUploader.generateFixedTag();
          const tagResult = await uploader.addTag(result.requirementId, tag);

          if (tagResult.success) {
            if (!tagResult.skipped) {
              console.log(`  ✓ 标记已添加: ${tagResult.tag}`);
            } else {
              console.log(`  ℹ️  ${tagResult.message}`);
            }
          } else {
            console.log(`  ✗ 添加标记失败: ${tagResult.error}`);
          }
        }
      } catch (tagError) {
        console.log(`  ⚠️  添加标记失败: ${tagError.message}`);
      }
    }
  } catch (error) {
    console.error(`警告: 无法保存报告文件 - ${error.message}`);
  }
}

/**
 * 处理刷新索引命令
 */
async function handleRefreshIndex(args) {
  const options = parseOptions(args);
  const config = await loadConfig(options.config);

  if (options.reposDir) {
    config.repos_root_dir = options.reposDir;
  }

  console.log('\n刷新本地仓库索引...');
  console.log(`仓库根目录: ${config.repos_root_dir}\n`);

  try {
    const tfsRepoCache = await loadRepoCacheFromMultiplePaths();

    const indexData = await initOrUpdateIndex(
      config.repos_root_dir,
      tfsRepoCache.repositories || tfsRepoCache,
      true // 强制刷新
    );

    const status = getIndexStatus(indexData);
    console.log('\n索引刷新完成:');
    console.log(`  有效仓库: ${status.activeRepos} 个`);
    console.log(`  缺失仓库: ${status.missingRepos} 个`);
    console.log(`  更新时间: ${status.lastUpdated || 'N/A'}`);
  } catch (error) {
    console.error(`错误: 刷新索引失败 - ${error.message}`);
    process.exit(1);
  }
}

/**
 * 处理索引状态命令
 */
async function handleIndexStatus(args) {
  const options = parseOptions(args);
  const config = await loadConfig(options.config);

  if (options.reposDir) {
    config.repos_root_dir = options.reposDir;
  }

  console.log('\n本地仓库索引状态\n');

  try {
    const indexData = await initOrUpdateIndex(config.repos_root_dir, {}, false);
    const status = getIndexStatus(indexData);

    console.log(`基准目录: ${status.basePath || 'N/A'}`);
    console.log(`更新时间: ${status.lastUpdated || 'N/A'}`);
    console.log(`有效仓库: ${status.activeRepos} 个`);
    console.log(`缺失仓库: ${status.missingRepos} 个`);
    console.log(`总 计: ${status.totalRepos} 个`);

    if (status.repositories.length > 0) {
      console.log('\n仓库列表:');
      status.repositories.slice(0, 20).forEach((name, idx) => {
        const repo = indexData.repositories[name];
        const missing = repo?.missing ? ' (缺失)' : '';
        console.log(`  ${idx + 1}. ${name}${missing}`);
      });
      if (status.repositories.length > 20) {
        console.log(`  ... 还有 ${status.repositories.length - 20} 个仓库`);
      }
    }
  } catch (error) {
    console.error(`错误: 获取索引状态失败 - ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('致命错误:', error);
  process.exit(1);
});
