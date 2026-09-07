#!/usr/bin/env node
/**
 * Bug Fixer - Main Entry Point
 * Bug修复工具主入口
 * 支持从TFS查询列表或单个Bug ID进行分析
 */

import TFSBugClient from './tfs-bug-client.mjs';
import BugAnalyzer from './bug-analyzer.mjs';
import BugFixReportGenerator from './report-generator.mjs';
import { CodeRepositoryMapper, ensureConfigTemplate } from './code-repository-mapper.mjs';
import { CodeSearcher } from './code-searcher.mjs';
import { FixSuggestionGenerator } from './fix-suggestion-generator.mjs';
import { AIFixEngine } from './ai-fix-engine.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 加载TFS配置
 */
function loadTFSConfig() {
  const configPaths = [
    path.join(__dirname, '../../tfs2018-integration/config/tfs-config.json'),
    path.join(__dirname, '../../../tfs2018-integration/config/tfs-config.json'),
    path.join(process.cwd(), 'skills/tfs2018-integration/config/tfs-config.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
      } catch (error) {
        console.log(`⚠️  TFS配置文件读取失败: ${configPath}`);
      }
    }
  }

  return null;
}

/**
 * 显示使用帮助
 */
function showHelp() {
  console.log(`
Bug Fixer - TFS Bug分析修复工具 (AI增强版)
============================================

使用方式:

【分析功能】

1. 从TFS查询列表URL分析Bug:
   node main.mjs query <查询URL> [选项]

   选项:
     --max, -m <数量>      最多获取的Bug数量 (默认: 不限)
     --output, -o <路径>   输出报告路径 (默认: ./reports/bug-fix-report.md)
     --format, -f <格式>   报告格式: markdown, excel (默认: markdown)
     --batch, -b <数量>    批量获取时的每批数量 (默认: 100)
     --save-bugs           保存Bug列表到JSON文件
     --enable-code-location 启用代码定位功能 (需要配置仓库映射)
     --enable-fix-suggestions 启用详细修复建议 (需要代码定位)
     --enable-image-analysis 启用图片分析 (分析Bug描述中的截图) ✨新增
     --use-tfs-git         使用TFS Git仓库映射 (推荐，自动启用代码定位和修复建议)
     --repo-config <路径>  仓库映射配置文件路径
     --init-config         初始化仓库映射配置模板
     --add-tag             为Bug添加AI-BUG-FIX标记到TFS

2. 分析单个Bug:
   node main.mjs bug <BugID> [选项]

   选项同上，但 --max 和 --batch 无效

3. 从已保存的Bug文件分析:
   node main.mjs analyze <bug-file.json> [选项]

   选项同 query 命令

【AI自动修复功能】✨新增

4. 自动修复单个Bug:
   node main.mjs fix <BugID> [选项]

   选项:
     --dry-run            仅生成修复计划，不实际应用
     --no-backup          不创建备份文件
     --no-verify          跳过修复验证
     --no-commit          不自动创建Git提交
     --config <路径>      AI修复配置文件路径

   说明: 修复成功后自动为Bug添加 AI-BUG-FIX 标记

5. 批量自动修复Bug:
   node main.mjs fix-batch <查询URL或文件> [选项]

   选项:
     --max, -m <数量>     最多修复的Bug数量 (默认: 不限)
     --concurrent <数量>  并发修复数量 (默认: 3)
     --continue-on-error  遇到错误继续处理
     其他选项同 fix 命令

6. 生成修复计划:
   node main.mjs fix-plan <BugID> [选项]

   生成详细的修复计划，包括要修改的文件和代码变化

7. 回滚修复:
   node main.mjs rollback <BugID> [选项]

   选项:
     --backup <路径>      指定备份文件路径
     --keep-backup        保留备份文件

【配置管理】

8. 初始化配置模板:
   node main.mjs init-config [ai-fix]
     初始化仓库映射配置模板
     添加 ai-fix 参数同时初始化AI修复配置

示例:

【分析功能】
  # 从查询URL获取并分析Bug (基础功能)
  node main.mjs query "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Public%20Query/_workitems?id=xxx&_a=query"

  # 启用代码定位和修复建议 (增强功能)
  node main.mjs query "查询URL" --enable-code-location --enable-fix-suggestions

  # 使用TFS Git仓库映射 (推荐)
  node main.mjs query "查询URL" --use-tfs-git

【AI自动修复】
  # 生成修复计划 (不实际应用)
  node main.mjs fix-plan 12345 --dry-run

  # 自动修复单个Bug
  node main.mjs fix 12345

  # 批量自动修复 (从查询URL)
  node main.mjs fix-batch "查询URL" --max 10

  # 批量自动修复 (从已保存的Bug文件)
  node main.mjs fix-batch ./bugs-cache.json --concurrent 5

  # 回滚修复
  node main.mjs rollback 12345

说明:
  - 查询URL格式: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Project/_workitems?id=xxx&_a=query
  - 支持的集合: WINNING-6.0, WN_PH-Platform, WN_TECH, wn_his
  - 报告默认保存在 ./reports/ 目录
  - AI自动修复会自动创建备份，可随时回滚
  - 修复会创建独立分支，不影响主分支代码

标记说明:
  - 使用 --add-tag 选项时，会为TFS Bug工作项添加固定标记: AI-BUG-FIX
  - fix 命令修复成功后会自动添加 AI-BUG-FIX 标记
`);
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {
    command: null,
    target: null,
    maxBugs: null,
    output: null,
    format: 'markdown',
    batchSize: 100,
    saveBugs: false,
    enableCodeLocation: false,
    enableFixSuggestions: false,
    enableImageAnalysis: false,
    repoConfig: null,
    useTfsGitRepository: false,
    addTag: false,
    // AI修复选项
    dryRun: false,
    noBackup: false,
    noVerify: false,
    noCommit: false,
    aiConfig: null,
    concurrent: 3,
    continueOnError: false,
    backupPath: null,
    keepBackup: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;

      case '--max':
      case '-m':
        options.maxBugs = parseInt(args[++i]);
        break;

      case '--output':
      case '-o':
        options.output = args[++i];
        break;

      case '--format':
      case '-f':
        options.format = args[++i];
        break;

      case '--batch':
      case '-b':
        options.batchSize = parseInt(args[++i]);
        break;

      case '--save-bugs':
        options.saveBugs = true;
        break;

      case '--enable-code-location':
        options.enableCodeLocation = true;
        break;

      case '--enable-fix-suggestions':
        options.enableFixSuggestions = true;
        break;

      case '--repo-config':
        options.repoConfig = args[++i];
        break;

      case '--use-tfs-git':
        options.useTfsGitRepository = true;
        options.enableCodeLocation = true; // 自动启用代码定位
        options.enableFixSuggestions = true; // 自动启用修复建议
        break;

      case '--enable-image-analysis':
        options.enableImageAnalysis = true;
        break;

      case '--add-tag':
        options.addTag = true;
        break;

      // AI修复选项
      case '--dry-run':
        options.dryRun = true;
        break;

      case '--no-backup':
        options.noBackup = true;
        break;

      case '--no-verify':
        options.noVerify = true;
        break;

      case '--no-commit':
        options.noCommit = true;
        break;

      case '--config':
        options.aiConfig = args[++i];
        break;

      case '--concurrent':
        options.concurrent = parseInt(args[++i]);
        break;

      case '--continue-on-error':
        options.continueOnError = true;
        break;

      case '--backup':
        options.backupPath = args[++i];
        break;

      case '--keep-backup':
        options.keepBackup = true;
        break;

      case 'init-config':
        options.command = 'init-config';
        break;

      default:
        if (!options.command) {
          options.command = arg;
        } else if (!options.target) {
          options.target = arg;
        }
        break;
    }

    i++;
  }

  return options;
}

/**
 * 从查询URL获取并分析Bug
 */
async function processQueryUrl(url, options) {
  console.log('\n' + '='.repeat(60));
  console.log('Bug Fixer - 从查询URL获取Bug');
  console.log('='.repeat(60));

  const client = new TFSBugClient();

  // 获取Bug列表
  const bugs = await client.getBugsFromQueryUrl(url, options.maxBugs);

  if (bugs.length === 0) {
    console.log('\n未找到Bug');
    return;
  }

  // 保存Bug列表
  if (options.saveBugs) {
    const bugsFile = path.join(__dirname, '../reports/bugs-cache.json');
    client.saveBugsToFile(bugs, bugsFile);
  }

  // 分析Bug
  await analyzeBugs(bugs, options, {
    source: 'TFS查询',
    queryUrl: url,
    collection: client.getCollectionName()
  });
}

/**
 * 获取并分析单个Bug
 */
async function processSingleBug(bugId, options) {
  console.log('\n' + '='.repeat(60));
  console.log('Bug Fixer - 分析单个Bug');
  console.log('='.repeat(60));

  const client = new TFSBugClient();

  const bug = await client.getBugById(bugId);
  console.log(`\n获取Bug: ${bug.id} - ${bug.title}`);

  await analyzeBugs([bug], options, {
    source: '单个Bug',
    bugId: bugId
  });
}

/**
 * 从文件分析Bug
 */
async function processBugFile(filepath, options) {
  console.log('\n' + '='.repeat(60));
  console.log('Bug Fixer - 从文件分析Bug');
  console.log('='.repeat(60));

  const client = new TFSBugClient();
  const bugs = client.loadBugsFromFile(filepath);

  console.log(`\n从文件加载 ${bugs.length} 个Bug`);

  await analyzeBugs(bugs, options, {
    source: '文件',
    file: filepath
  });
}

/**
 * 分析Bug并生成报告
 */
async function analyzeBugs(bugs, options, summary = {}) {
  console.log('\n开始分析Bug...');
  console.log('-'.repeat(60));

  // 创建分析器选项
  const analyzerOptions = {
    enableCodeLocation: options.enableCodeLocation,
    enableFixSuggestions: options.enableFixSuggestions,
    useTfsGitRepository: options.useTfsGitRepository,
    enableImageAnalysis: options.enableImageAnalysis,
    tfsConfig: loadTFSConfig()
  };

  // 如果启用代码定位，初始化相关模块
  if (options.enableCodeLocation || options.enableFixSuggestions) {
    if (options.useTfsGitRepository) {
      console.log('\n初始化TFS Git仓库映射模块...');

      // 初始化TFS Git仓库映射器
      analyzerOptions.tfsGitMapper = new (await import('./tfs-git-repository-mapper.mjs')).default();

      // 显示仓库统计
      const stats = await analyzerOptions.tfsGitMapper.getStats();
      console.log(`✓ 已加载 ${stats.totalRepositories} 个TFS Git仓库`);

      if (stats.topRepositories.length > 0) {
        console.log('  仓库最多的项目:');
        for (const [project, count] of stats.topRepositories.slice(0, 5)) {
          console.log(`    ${project}: ${count} 个仓库`);
        }
      }
    } else {
      console.log('\n初始化本地代码仓库映射模块...');

      // 初始化本地仓库映射器
      if (options.repoConfig) {
        analyzerOptions.repositoryMapper = new CodeRepositoryMapper(options.repoConfig);
      } else {
        analyzerOptions.repositoryMapper = new CodeRepositoryMapper();
      }

      // 检查配置是否存在
      const configStats = analyzerOptions.repositoryMapper.getConfigStats();
      if (configStats.totalRepositories === 0) {
        console.log('⚠️  未找到仓库配置，代码定位功能将被禁用');
        console.log('提示: 运行 "node main.mjs init-config" 初始化配置模板');
        analyzerOptions.enableCodeLocation = false;
        analyzerOptions.enableFixSuggestions = false;
      } else {
        console.log(`✓ 已加载 ${configStats.totalRepositories} 个仓库配置`);
      }
    }
  }

  const analyzer = new BugAnalyzer(analyzerOptions);
  const startTime = Date.now();

  // 分析Bug
  const analyses = await analyzer.analyzeBugs(bugs, {
    progressCallback: (current, total, bug) => {
      const percent = ((current / total) * 100).toFixed(1);
      process.stdout.write(`\r进度: ${current}/${total} (${percent}%) - [${bug.id}] ${bug.title.substring(0, 30)}...`);
    }
  });

  console.log('\n');
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`分析完成，耗时: ${duration}秒`);

  // 统计代码定位结果
  if (options.enableCodeLocation) {
    const locatedCount = analyses.filter(a => a.codeLocation?.repository).length;
    console.log(`✓ 成功定位代码: ${locatedCount}/${analyses.length}`);
  }

  // 添加统计信息
  summary.totalBugs = bugs.length;
  summary.analyzedBugs = analyses.length;
  summary.analyzeDuration = duration;
  summary.codeLocationEnabled = options.enableCodeLocation;
  summary.fixSuggestionsEnabled = options.enableFixSuggestions;

  // 生成报告
  const generator = new BugFixReportGenerator();

  // 确定输出路径
  const defaultExt = options.format === 'excel' ? '.xlsx' : '.md';
  const defaultName = `bug-fix-report_${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}${defaultExt}`;
  const outputPath = options.output || path.join(__dirname, '../reports', defaultName);

  const reportData = {
    bugs,
    analyses,
    summary
  };

  if (options.format === 'excel') {
    await generator.generateExcel(reportData, outputPath);
  } else {
    generator.generateMarkdown(reportData, outputPath);
  }

  // 显示报告位置
  console.log('\n' + '='.repeat(60));
  console.log('报告生成完成');
  console.log('='.repeat(60));
  console.log(`报告路径: ${outputPath}`);
  console.log('='.repeat(60));

  // 如果启用标记功能，为所有Bug添加标记
  if (options.addTag) {
    console.log('\n正在为Bug添加标记...');
    const client = new TFSBugClient();
    const tag = TFSBugClient.generateFixedTag();

    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    for (const bug of bugs) {
      try {
        const result = await client.addTag(bug.id, tag);
        if (result.success) {
          if (result.skipped) {
            skippedCount++;
          } else {
            successCount++;
          }
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`  ✗ Bug ${bug.id} 添加标记失败: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n标记添加完成:`);
    console.log(`  成功: ${successCount}`);
    console.log(`  跳过: ${skippedCount}`);
    console.log(`  失败: ${failCount}`);
    console.log('='.repeat(60));
  }
}

/**
 * 初始化配置模板
 */
async function initConfig(options = {}) {
  console.log('\n' + '='.repeat(60));
  console.log('初始化配置模板');
  console.log('='.repeat(60));

  try {
    // 初始化仓库映射配置
    const templatePath = ensureConfigTemplate();
    console.log(`\n✓ 仓库映射配置模板已创建: ${templatePath}`);

    // 如果指定了 ai-fix 参数，同时初始化AI修复配置
    if (options.initAiFix) {
      const aiFixConfigTemplate = path.join(__dirname, '../config/ai-fix-config.template.json');
      const aiFixConfigPath = path.join(__dirname, '../config/ai-fix-config.json');

      if (!fs.existsSync(aiFixConfigPath)) {
        fs.copyFileSync(aiFixConfigTemplate, aiFixConfigPath);
        console.log(`✓ AI修复配置模板已创建: ${aiFixConfigPath}`);
      } else {
        console.log(`⚠ AI修复配置已存在: ${aiFixConfigPath}`);
      }
    }

    console.log('\n请按照以下步骤配置:');
    console.log('1. 编辑仓库映射配置模板文件');
    console.log('2. 配置本地代码仓库路径');
    console.log('3. 配置TFS项目映射关系');
    console.log('4. 将配置文件重命名为 code-repositories.json');
    console.log('5. 重新运行分析命令时添加 --enable-code-location 选项');

    if (options.initAiFix) {
      console.log('\nAI修复配置:');
      console.log('6. 编辑 ai-fix-config.json 配置AI修复参数');
      console.log('7. 配置备份、验证、Git等选项');
      console.log('8. 使用 fix、fix-batch 命令进行自动修复');
    }
  } catch (error) {
    console.error(`\n初始化失败: ${error.message}`);
    throw error;
  }
}

/**
 * AI自动修复单个Bug
 */
async function processAIFix(bugId, options) {
  console.log('\n' + '='.repeat(60));
  console.log('AI自动修复 - Bug ' + bugId);
  console.log('='.repeat(60));

  // 加载AI修复配置
  const aiConfig = _loadAIFixConfig(options.aiConfig);

  // 创建AI修复引擎
  const engine = new AIFixEngine({
    dryRun: options.dryRun,
    verbose: true,
    config: aiConfig
  });

  // 获取Bug信息
  const client = new TFSBugClient();
  const bug = await client.getBugById(bugId);

  console.log(`\nBug标题: ${bug.title}`);
  console.log(`Bug状态: ${bug.state}`);
  console.log(`优先级: ${bug.priority}`);

  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN 模式：仅生成修复计划，不会实际应用');
  }

  // 执行修复
  const result = await engine.analyzeAndFix(bug);

  // 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('修复结果');
  console.log('='.repeat(60));

  if (result.success) {
    console.log('✓ 修复成功');
    console.log(`  修复ID: ${result.fixId}`);
    console.log(`  修改文件: ${result.applyResult?.filesModified?.length || 0} 个`);
    console.log(`  备份文件: ${result.applyResult?.backupsCreated?.length || 0} 个`);
    console.log(`  验证结果: ${result.verificationResult?.passed ? '✓ 通过' : '✗ 未通过'}`);

    // 保存修复报告
    const reportPath = path.join(__dirname, '../reports', `fix-${bugId}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`\n修复报告已保存: ${reportPath}`);
  } else {
    console.log('✗ 修复失败');
    console.log(`  错误: ${result.error}`);
  }

  // 自动添加标记
  console.log('\n正在为Bug添加标记...');
  const tag = TFSBugClient.generateFixedTag();
  const tagResult = await client.addTag(bugId, tag);
  if (tagResult.success) {
    if (!tagResult.skipped) {
      console.log(`  ✓ 标记已添加: ${tagResult.tag}`);
    }
  }

  console.log('='.repeat(60));
}

/**
 * AI批量自动修复Bug
 */
async function processAIFixBatch(target, options) {
  console.log('\n' + '='.repeat(60));
  console.log('AI批量自动修复');
  console.log('='.repeat(60));

  // 获取Bug列表
  let bugs;
  const client = new TFSBugClient();

  if (target.startsWith('http')) {
    // 从查询URL获取
    bugs = await client.getBugsFromQueryUrl(target, options.maxBugs);
    console.log(`\n从查询URL获取 ${bugs.length} 个Bug`);
  } else if (fs.existsSync(target)) {
    // 从文件获取
    bugs = client.loadBugsFromFile(target);
    console.log(`\n从文件加载 ${bugs.length} 个Bug`);
  } else {
    throw new Error(`无法识别的目标: ${target}`);
  }

  if (bugs.length === 0) {
    console.log('\n没有需要修复的Bug');
    return;
  }

  console.log(`并发数量: ${options.concurrent}`);
  if (options.continueOnError) {
    console.log('遇到错误时继续处理');
  }

  // 加载AI修复配置
  const aiConfig = _loadAIFixConfig(options.aiConfig);

  // 创建AI修复引擎
  const engine = new AIFixEngine({
    dryRun: options.dryRun,
    verbose: true,
    config: aiConfig
  });

  // 执行批量修复
  const result = await engine.analyzeAndFixBatch(bugs);

  // 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('批量修复结果');
  console.log('='.repeat(60));
  console.log(`总数: ${result.total}`);
  console.log(`成功: ${result.success}`);
  console.log(`失败: ${result.failed}`);
  console.log(`跳过: ${result.skipped}`);

  // 保存批量修复报告
  const reportPath = path.join(__dirname, '../reports', `fix-batch-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n批量修复报告已保存: ${reportPath}`);
  console.log('='.repeat(60));
}

/**
 * 生成修复计划
 */
async function processFixPlan(bugId, options) {
  console.log('\n' + '='.repeat(60));
  console.log('生成修复计划 - Bug ' + bugId);
  console.log('='.repeat(60));

  // 获取Bug信息
  const client = new TFSBugClient();
  const bug = await client.getBugById(bugId);

  // 分析Bug
  const analyzer = new BugAnalyzer({
    enableCodeLocation: true,
    enableFixSuggestions: true,
    useTfsGitRepository: true,
    tfsConfig: loadTFSConfig()
  });

  const analysis = await analyzer.analyzeBug(bug);

  // 生成修复计划
  const fixPlan = {
    bugId: bug.id,
    title: bug.title,
    description: bug.description,
    analysis: {
      category: analysis.category,
      severity: analysis.severity,
      riskLevel: analysis.riskLevel
    },
    codeLocation: analysis.codeLocation,
    estimatedFiles: analysis.codeLocation?.inferredFiles?.length || 0,
    estimatedTime: analysis.estimatedTime || '未知',
    recommendedActions: [
      '1. 备份相关文件',
      '2. 应用修复代码',
      '3. 运行测试验证',
      '4. 提交到独立分支',
      '5. 创建Pull Request'
    ],
    warnings: analysis.riskLevel === 'HIGH' ? [
      '⚠️  高风险Bug，建议人工审核修复代码'
    ] : []
  };

  // 显示修复计划
  console.log('\n修复计划:');
  console.log(JSON.stringify(fixPlan, null, 2));

  // 保存修复计划
  const planPath = path.join(__dirname, '../reports', `fix-plan-${bugId}.json`);
  fs.writeFileSync(planPath, JSON.stringify(fixPlan, null, 2));
  console.log(`\n修复计划已保存: ${planPath}`);

  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN 模式：不会实际应用修复');
    console.log('如需应用修复，请运行: node main.mjs fix ' + bugId);
  }

  console.log('='.repeat(60));
}

/**
 * 回滚修复
 */
async function processRollback(bugId, options) {
  console.log('\n' + '='.repeat(60));
  console.log('回滚修复 - Bug ' + bugId);
  console.log('='.repeat(60));

  // 查找修复备份
  const backupDir = path.join(__dirname, '../fix-backups');
  const backupPattern = new RegExp(`fix-.*-${bugId}-`);

  if (!fs.existsSync(backupDir)) {
    console.log('✗ 未找到备份目录');
    return;
  }

  const files = fs.readdirSync(backupDir);
  const backupFiles = files.filter(f => backupPattern.test(f));

  if (backupFiles.length === 0) {
    console.log('✗ 未找到相关备份文件');
    return;
  }

  console.log(`找到 ${backupFiles.length} 个备份文件:`);
  backupFiles.forEach(f => console.log(`  - ${f}`));

  // 使用指定的备份或最新的备份
  let backupToUse;
  if (options.backupPath) {
    backupToUse = options.backupPath;
  } else {
    // 按时间排序，使用最新的
    backupFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(backupDir, a));
      const statB = fs.statSync(path.join(backupDir, b));
      return statB.mtimeMs - statA.mtimeMs;
    });
    backupToUse = path.join(backupDir, backupFiles[0]);
  }

  console.log(`\n使用备份: ${backupToUse}`);

  // 加载修复结果（如果存在）
  const reportsDir = path.join(__dirname, '../reports');
  const reportPattern = new RegExp(`fix-${bugId}-.*\\.json$`);
  const reportFiles = fs.readdirSync(reportsDir).filter(f => reportPattern.test(f));

  if (reportFiles.length > 0) {
    const reportPath = path.join(reportsDir, reportFiles[0]);
    const fixResult = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    // 恢复备份
    const backupPath = fixResult.applyResult?.backupsCreated?.[0];
    if (backupPath && fs.existsSync(backupPath)) {
      const originalFile = backupPath.replace(/fix-backups.*?-(\d+)-/, '');
      fs.copyFileSync(backupPath, originalFile);
      console.log(`✓ 已恢复文件: ${originalFile}`);

      // 删除备份
      if (!options.keepBackup) {
        fs.unlinkSync(backupPath);
        console.log('✓ 已删除备份文件');
      }
    } else {
      console.log('✗ 备份文件不存在');
    }
  } else {
    console.log('⚠️  未找到修复记录，请手动恢复备份');
  }

  console.log('='.repeat(60));
}

/**
 * 加载AI修复配置
 */
function _loadAIFixConfig(configPath) {
  const defaultConfigPath = path.join(__dirname, '../config/ai-fix-config.json');
  const configToLoad = configPath || defaultConfigPath;

  if (fs.existsSync(configToLoad)) {
    try {
      return JSON.parse(fs.readFileSync(configToLoad, 'utf-8'));
    } catch (error) {
      console.warn(`⚠️  配置文件加载失败: ${error.message}，使用默认配置`);
    }
  }

  // 返回 undefined 让引擎使用默认配置
  return undefined;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // 处理 init-config 命令
  if (options.command === 'init-config') {
    await initConfig({ initAiFix: options.target === 'ai-fix' });
    return;
  }

  if (!options.command || !options.target) {
    showHelp();
    process.exit(1);
  }

  try {
    switch (options.command) {
      case 'query':
        await processQueryUrl(options.target, options);
        break;

      case 'bug':
        await processSingleBug(options.target, options);
        break;

      case 'analyze':
        await processBugFile(options.target, options);
        break;

      // AI自动修复命令
      case 'fix':
        await processAIFix(options.target, options);
        break;

      case 'fix-batch':
        await processAIFixBatch(options.target, options);
        break;

      case 'fix-plan':
        await processFixPlan(options.target, options);
        break;

      case 'rollback':
        await processRollback(options.target, options);
        break;

      default:
        console.error(`未知命令: ${options.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('程序异常退出:', error);
  process.exit(1);
});
