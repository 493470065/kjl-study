import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateMarkedReportFilename,
  generateTrackingMetadata,
  generateTrackingReportBlock
} from './skill-tracking-enhancement.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成终端输出报告
 * @param {Object} data - 分析结果数据
 * @param {Object} config - 配置对象
 */
export function generateConsoleReport(data, config) {
  const width = config.output?.console_width || 60;

  console.log('\n' + '═'.repeat(width));
  console.log('  需求覆盖率分析报告');
  console.log('═'.repeat(width));

  // 基本信息
  console.log(`\n需求ID: ${data.requirementId}`);
  console.log(`标题: ${data.requirementTitle}`);
  console.log(`状态: ${data.requirementState}`);
  if (data.dataSource) {
    console.log(`数据来源: ${data.dataSource}`);
  }

  // 需求分析内容（来自TFS需求分析字段）
  if (data.requirementAnalysis && data.requirementAnalysis.rawAnalysis) {
    console.log('\n' + '─'.repeat(width));
    console.log('  需求分析（来自TFS Winning.Demand.Analysis 字段）');
    console.log('─'.repeat(width));
    console.log('');
    // 直接显示原始内容
    const lines = data.requirementAnalysis.rawAnalysis.split('\n').slice(0, 20);
    lines.forEach(line => {
      console.log(`  ${line}`);
    });
    if (data.requirementAnalysis.rawAnalysis.split('\n').length > 20) {
      console.log(`  ... (共 ${data.requirementAnalysis.rawAnalysis.split('\n').length} 行，详见报告文件)`);
    }
  }

  // 需求质量评审
  if (data.qualityReview) {
    console.log('\n' + '─'.repeat(width));
    console.log('  需求质量评审');
    console.log('─'.repeat(width));

    const review = data.qualityReview;

    // 处理等待LLM评审的状态
    if (review.pending) {
      console.log(`\n状态: ⏳ 等待LLM评审\n`);
      console.log(`评审输入文件: ${review.inputPath || 'N/A'}`);
      console.log(`请根据输入文件进行评审，结果写入: ${review.resultPath || `/tmp/requirement-quality-review-result-${data.requirementId}.json`}`);
    } else {
      console.log(`\n整体评分: ${review.overallScore}/100\n`);

      const dimNames = {
        completeness: '完整性',
        clarity: '清晰度',
        consistency: '一致性'
      };

      console.log('维度评分:');
      for (const [key, dim] of Object.entries(review.dimensions)) {
        const name = dimNames[key] || key;
        const weight = Math.round(dim.weight * 100) + '%';
        const scoreDisplay = dim.score !== null ? `${dim.score}/100` : 'N/A';
        console.log(`  • ${name}: ${scoreDisplay} (权重: ${weight})`);
        if (dim.issues && dim.issues.length > 0) {
          dim.issues.filter(i => !i.includes('跳过')).forEach(issue => {
            console.log(`    - ${issue}`);
          });
        }
      }

      if (review.summary) {
        console.log(`\n评审摘要: ${review.summary}`);
      }
    }
  }

  // 子工作项关联情况
  if (data.subItems && data.subItems.length > 0) {
    console.log('\n' + '─'.repeat(width));
    console.log('  子工作项关联情况');
    console.log('─'.repeat(width));
    data.subItems.forEach(item => {
      const icon = (item.commitCount || 0) > 0 ? '✓' : '⚠';
      console.log(`  ${icon} ${item.type || '任务'} ${item.id} - ${item.title} (${item.commitCount || 0} 个提交)`);
    });
  }

  // 代码获取路径信息
  if (data.codePaths) {
    console.log('\n' + '─'.repeat(width));
    console.log('  代码获取路径');
    console.log('─'.repeat(width));
    console.log(`\n  本地仓库根目录: ${data.codePaths.reposRootDir}`);
    console.log(`  TFS 服务器地址: ${data.codePaths.tfsServerUrl}`);
    console.log(`  TFS 集合: ${data.codePaths.collection}`);
  }

  // 仓库信息
  if (data.repositories && data.repositories.length > 0) {
    console.log('\n' + '─'.repeat(width));
    console.log('  项目仓库列表');
    console.log('─'.repeat(width));
    console.log('');
    data.repositories.forEach((repo, idx) => {
      console.log(`  ${idx + 1}. ${repo.name}`);
      console.log(`     仓库ID: ${repo.id}`);
      console.log(`     默认分支: ${repo.defaultBranch || 'N/A'}`);
    });
  }

  // 仓库状态表
  if (data.reposStatus && data.reposStatus.length > 0) {
    console.log('\n' + '─'.repeat(width));
    console.log(`  扫描的仓库 (${data.reposStatus.length}个)`);
    console.log('─'.repeat(width));
    console.log('');

    data.reposStatus.forEach((repo, idx) => {
      const status = repo.localExists ? '✓ 已克隆' : '✗ 未克隆';
      const branch = repo.defaultBranch || 'N/A';
      console.log(`  ${idx + 1}    ${repo.name.padEnd(40)} ${status}    ${branch}`);
    });

    // 统计信息
    if (data.reposStatusSummary) {
      console.log('');
      console.log('─'.repeat(width));
      console.log('  本地仓库统计');
      console.log('─'.repeat(width));
      console.log(`  已克隆: ${data.reposStatusSummary.localExists} 个`);
      console.log(`  未克隆: ${data.reposStatusSummary.missing} 个`);
    }
  }

  // 统计信息
  console.log('\n' + '─'.repeat(width));
  console.log('  代码变更统计');
  console.log('─'.repeat(width));
  console.log(`\n  关联提交: ${data.commitCount || 0} 个`);
  console.log(`  变更文件: ${data.fileCount || 0} 个`);
  console.log(`  代码行数: +${data.linesAdded || 0} / -${data.linesDeleted || 0}`);

  // 变更代码详情
  if (data.rawCommits && data.rawCommits.length > 0) {
    console.log('\n' + '─'.repeat(width));
    console.log('  变更代码详情');
    console.log('─'.repeat(width));
    console.log('');
    data.rawCommits.slice(0, 10).forEach((commit, idx) => {
      console.log(`  提交 #${idx + 1}:`);
      console.log(`    仓库: ${commit.repositoryName || 'N/A'}`);
      console.log(`    Commit ID: ${commit.commitId || 'N/A'}`);
      console.log(`    作者: ${commit.author?.name || commit.author?.displayName || 'N/A'}`);
      console.log(`    日期: ${commit.author?.date ? new Date(commit.author.date).toLocaleString('zh-CN') : 'N/A'}`);
      console.log(`    备注: ${(commit.comment || '').substring(0, 100)}${(commit.comment || '').length > 100 ? '...' : ''}`);
      console.log('');
    });
    if (data.rawCommits.length > 10) {
      console.log(`  ... 还有 ${data.rawCommits.length - 10} 个提交未显示`);
    }
  }

  // 判断1：需求与代码匹配度
  console.log('\n' + '─'.repeat(width));
  console.log('  判断1: 需求与代码匹配度');
  console.log('─'.repeat(width));

  const score = data.score || { overall: 0, dimensions: {} };
  const scores = score.dimensions || {};

  // 维度权重配置
  const weights = {
    businessLogic: 0.35,
    functionalCoverage: 0.20,
    codeQuality: 0.20,
    testCoverage: 0.15,
    codeScale: 0.10
  };

  // 根据维度评分计算综合评分
  const calculatedOverall = Math.round(
    ((scores.businessLogic?.score || scores.businessLogic || 0) * weights.businessLogic) +
    ((scores.functionalCoverage || 0) * weights.functionalCoverage) +
    ((scores.codeQuality || 0) * weights.codeQuality) +
    ((scores.testCoverage || 0) * weights.testCoverage) +
    ((scores.codeScale || 0) * weights.codeScale)
  );
  const finalOverall = calculatedOverall > 0 ? calculatedOverall : (score.overall || 0);

  console.log(`\n综合评分: ${finalOverall}/100\n`);

  console.log('维度评分:');
  console.log(`  • 业务逻辑匹配度: ${scores.businessLogic?.score || scores.businessLogic || 0}/100 (权重35%)`);
  console.log(`  • 功能覆盖度: ${scores.functionalCoverage || 0}/100 (权重20%)`);
  console.log(`  • 代码质量: ${scores.codeQuality || 0}/100 (权重20%)`);
  console.log(`  • 测试完整性: ${scores.testCoverage || 0}/100 (权重15%)`);
  console.log(`  • 代码规模: ${scores.codeScale || 0}/100 (权重10%)`);

  // 业务逻辑详情
  // 业务逻辑详情
    if (scores.businessLogic?.details) {
      const details = scores.businessLogic.details;
      console.log('\n业务逻辑匹配详情:');
      if (details.businessRules !== undefined) {
        const ruleScore = typeof details.businessRules === 'number' ? details.businessRules : details.businessRules.score || 0;
        console.log(`  - 业务规则: ${ruleScore.toFixed(1)}%`);
      }
      if (details.workflows !== undefined) {
        const flowScore = typeof details.workflows === 'number' ? details.workflows : details.workflows.score || 0;
        console.log(`  - 业务流程: ${flowScore.toFixed(1)}%`);
      }
      if (details.constraints !== undefined) {
        const constraintScore = typeof details.constraints === 'number' ? details.constraints : details.constraints.score || 0;
        console.log(`  - 约束条件: ${constraintScore.toFixed(1)}%`);
      }
      if (details.dataMapping !== undefined) {
        const mappingScore = typeof details.dataMapping === 'number' ? details.dataMapping : details.dataMapping.score || 0;
        console.log(`  - 数据映射: ${mappingScore.toFixed(1)}%`);
      }
      if (details.edgeCases !== undefined) {
        const edgeScore = typeof details.edgeCases === 'number' ? details.edgeCases : details.edgeCases.score || 0;
        console.log(`  - 边界情况: ${edgeScore.toFixed(1)}%`);
      }
    }
  // 判断2：高风险问题
  console.log('\n' + '─'.repeat(width));
  console.log('  判断2: 高风险问题');
  console.log('─'.repeat(width));

  const scan = data.scanResults || {};

  // 支持新旧两种格式
  let scannedFilesCount = 0;
  let totalIssues = 0;
  let criticalIssues = [];
  let warningIssues = [];

  // 新格式（win-code-scanner 输出）
  if (scan.summary) {
    scannedFilesCount = scan.report_info?.scanned_files || scan.scannedFiles || 0;
    totalIssues = scan.summary.total || scan.total || 0;
    criticalIssues = (scan.issues || scan.critical || []).filter(i =>
      (i.severity || '').toLowerCase() === 'critical' || i.severity === '严重'
    );
    warningIssues = (scan.issues || scan.warning || []).filter(i =>
      (i.severity || '').toLowerCase() === 'warning' || i.severity === '警告'
    );
  }
  // 旧格式
  else {
    scannedFilesCount = scan.scannedFiles || 0;
    totalIssues = scan.total || 0;
    criticalIssues = scan.critical || [];
    warningIssues = scan.warning || [];
  }

  console.log(`\n扫描 ${scannedFilesCount} 个文件，发现 ${totalIssues} 个问题\n`);

  if (criticalIssues.length > 0) {
    console.log(`严重 (${criticalIssues.length}):`);
    criticalIssues.slice(0, 5).forEach(issue => {
      const ruleCode = issue.rule_code || issue.rule || 'N/A';
      const ruleName = issue.rule_name || issue.message || issue.description || '未知问题';
      console.log(`  [${ruleCode}] ${ruleName}`);
      console.log(`    文件: ${issue.file || '未知'}:${issue.line || '?'}`);
      if (issue.description) {
        console.log(`    描述: ${issue.description}`);
      }
    });
    if (criticalIssues.length > 5) {
      console.log(`  ... 还有 ${criticalIssues.length - 5} 个严重问题`);
    }
  }

  if (warningIssues.length > 0) {
    console.log(`\n警告 (${warningIssues.length}):`);
    warningIssues.slice(0, 3).forEach(issue => {
      const ruleCode = issue.rule_code || issue.rule || 'N/A';
      const desc = issue.description || issue.message || '未知问题';
      console.log(`  [${ruleCode}] ${desc}`);
    });
    if (warningIssues.length > 3) {
      console.log(`  ... 还有 ${warningIssues.length - 3} 个警告`);
    }
  }

  if (criticalIssues.length === 0 && warningIssues.length === 0) {
    console.log('未发现代码质量问题');
  }

  console.log('\n' + '═'.repeat(width));
}

/**
 * 生成Markdown报告文件
 * @param {Object} data - 分析结果数据
 * @param {Object} config - 配置对象
 * @returns {Promise<string>} 报告文件路径
 */
export async function generateMarkdownReport(data, config) {
  // 优先使用代码根目录下的 reports 目录
  const reposRootDir = config.repos_root_dir || '/tmp';
  const reportsDir = path.join(reposRootDir, 'reports');

  // 确保 reports 目录存在
  try {
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (e) {
    // 目录可能已存在
  }

  // 生成带时间戳的文件名 (格式: yyyyMMddHHmmss)
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const reportPath = path.join(
    reportsDir,
    generateMarkedReportFilename(data.requirementId, now, data.score)
  );

  const content = buildMarkdownContent(data);

  await fs.writeFile(reportPath, content, 'utf-8');

  // 打印HTTP下载地址
  printHttpReportUrl(reportPath, reposRootDir, config);

  return reportPath;
}

/**
 * 打印HTTP报告下载地址
 * @param {string} reportPath - 本地报告路径
 * @param {string} reposRootDir - 仓库根目录
 * @param {Object} config - 配置对象
 */
function printHttpReportUrl(reportPath, reposRootDir, config) {
  const httpServerUrl = config.output?.http_server_url;
  if (!httpServerUrl) {
    return;
  }

  // 将本地路径转换为HTTP URL
  // 支持多种路径格式：
  // - /winning/winex-repo/storage/repos/reports/xxx.md -> http://172.17.1.173/repos/reports/xxx.md
  // - /Users/xxx/winex-repo/reports/xxx.md -> http://172.17.1.173/reports/xxx.md

  let relativePath = null;

  // 优先匹配 /repos/ 路径
  const reposIndex = reportPath.indexOf('/repos/');
  if (reposIndex !== -1) {
    relativePath = reportPath.substring(reposIndex);
  } else {
    // 匹配 /reports/ 路径
    const reportsIndex = reportPath.indexOf('/reports/');
    if (reportsIndex !== -1) {
      relativePath = reportPath.substring(reportsIndex);
    }
  }

  if (relativePath) {
    const httpUrl = `${httpServerUrl}${relativePath}`;

    console.log('\n' + '═'.repeat(60));
    console.log('  📄 报告下载地址');
    console.log('═'.repeat(60));
    console.log(`\n  ${httpUrl}\n`);
    console.log('═'.repeat(60));
  }
}

/**
 * 构建Markdown报告内容
 * @param {Object} data - 分析结果数据
 * @returns {string} Markdown内容
 */
function buildMarkdownContent(data) {
  const sections = [];

  // 添加SKILL追踪元数据
  sections.push(generateTrackingMetadata(data));

  // 标题
  sections.push('# 需求覆盖率分析报告\n');

  // ========== 1. 基本信息 ==========
  sections.push('## 1. 基本信息\n');
  sections.push('| 项目 | 内容 |');
  sections.push('|------|------|');
  sections.push(`| 需求ID | ${data.requirementId} |`);
  sections.push(`| 需求标题 | ${data.requirementTitle} |`);
  sections.push(`| 需求状态 | ${data.requirementState} |`);
  sections.push(`| 分析时间 | ${new Date().toLocaleString('zh-CN')} |`);
  if (data.dataSource) {
    sections.push(`| 数据来源 | ${data.dataSource} |`);
  }
  if (data.projectName) {
    sections.push(`| 所属项目 | ${data.projectName} |`);
  }
  if (data.requirementType) {
    sections.push(`| 需求类型 | ${data.requirementType} |`);
  }
  sections.push('');

  // ========== 2. 需求详情 ==========
  sections.push('## 2. 需求详情\n');

  // 需求描述（来自System.Description）
  if (data.requirementDescription) {
    sections.push('### 需求描述\n');
    sections.push('> 字段: `System.Description`\n');
    sections.push('');
    // 简单的HTML转文本
    const desc = data.requirementDescription
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '');
    sections.push(desc.substring(0, 1000) + (desc.length > 1000 ? '...' : ''));
    sections.push('');
  }

  // 需求分析内容（来自TFS需求分析字段 Winning.Demand.Analysis）
  if (data.requirementAnalysis && data.requirementAnalysis.rawAnalysis) {
    sections.push('### 需求分析\n');
    sections.push('> 字段: `Winning.Demand.Analysis`\n');
    sections.push('```');
    sections.push(data.requirementAnalysis.rawAnalysis);
    sections.push('```');
    sections.push('');
  }

  // ========== 2.5 需求质量评审 ==========
  if (data.qualityReview) {
    sections.push('### 需求质量评审\n');

    const review = data.qualityReview;

    // 处理等待LLM评审的状态
    if (review.pending) {
      sections.push('> 状态: ⏳ 等待LLM评审\n');
      sections.push(`**评审输入文件**: \`${review.inputPath || 'N/A'}\`\n`);
      sections.push(`请根据输入文件进行评审，结果写入 \`${review.resultPath || `/tmp/requirement-quality-review-result-${data.requirementId}.json`}\`\n`);
    } else {
      sections.push(`**整体评分**: ${review.overallScore}/100\n`);

      sections.push('| 维度 | 得分 | 权重 | 问题 |');
      sections.push('|------|------|------|------|');

      const dimNames = {
        completeness: '完整性',
        clarity: '清晰度',
        consistency: '一致性'
      };

      for (const [key, dim] of Object.entries(review.dimensions)) {
        const name = dimNames[key] || key;
        const weight = Math.round(dim.weight * 100) + '%';
        const scoreDisplay = dim.score !== null ? `${dim.score}/100` : 'N/A';
        const issues = dim.issues && dim.issues.length > 0
          ? dim.issues.filter(i => !i.includes('跳过')).join('、')
          : '-';
        sections.push(`| ${name} | ${scoreDisplay} | ${weight} | ${issues} |`);
      }
      sections.push('');

      // 对摘要进行格式化（要点换行）
      if (review.summary) {
        const formattedSummary = review.summary
          .replace(/([：:;；。])\s*(\d+[）\)])/g, '$1\n$2');
        sections.push(`**评审摘要**: ${formattedSummary}\n`);
      }
    }
  }

  // ========== 3. 代码追踪信息 ==========
  sections.push('## 3. 代码追踪信息\n');

  // 代码获取路径
  if (data.codePaths) {
    sections.push('### 代码获取路径\n');
    sections.push('| 项目 | 路径/地址 |');
    sections.push('|------|-----------|');
    sections.push(`| 本地仓库根目录 | \`${data.codePaths.reposRootDir}\` |`);
    sections.push(`| TFS 服务器地址 | \`${data.codePaths.tfsServerUrl}\` |`);
    sections.push(`| TFS 集合 | \`${data.codePaths.collection}\` |`);
    sections.push('');
  }

  // 扫描的仓库列表（带本地状态）
  if (data.reposStatus && data.reposStatus.length > 0) {
    sections.push('### 扫描的仓库\n');
    sections.push('| 序号 | 仓库名称 | 仓库ID | 默认分支 | 项目 | 本地状态 |');
    sections.push('|------|----------|--------|----------|------|----------|');
    data.reposStatus.forEach((repo, idx) => {
      const status = repo.localExists ? '✓ 已克隆' : '✗ 未克隆';
      sections.push(`| ${idx + 1} | ${repo.name} | \`${repo.id.substring(0, 8)}...\` | ${repo.defaultBranch || 'N/A'} | ${repo.project || 'N/A'} | ${status} |`);
    });
    sections.push('');

    // 添加统计信息
    if (data.reposStatusSummary) {
      sections.push(`**统计**: 已克隆 ${data.reposStatusSummary.localExists} 个 / 未克隆 ${data.reposStatusSummary.missing} 个\n`);
    }
  } else if (data.repositories && data.repositories.length > 0) {
    // 降级显示（无状态信息）
    sections.push('### 扫描的仓库\n');
    sections.push('| 序号 | 仓库名称 | 仓库ID | 默认分支 | 项目 |');
    sections.push('|------|----------|--------|----------|------|');
    data.repositories.forEach((repo, idx) => {
      sections.push(`| ${idx + 1} | ${repo.name} | \`${repo.id.substring(0, 8)}...\` | ${repo.defaultBranch || 'N/A'} | ${repo.project || 'N/A'} |`);
    });
    sections.push('');
  }

  // 提交来源统计
  sections.push('### 提交来源统计\n');
  sections.push('| 来源类型 | 数量 | 说明 |');
  sections.push('|----------|------|------|');
  sections.push(`| 消息匹配 | ${data.messageMatchedCount || 0} | 提交消息中包含需求ID |`);
  sections.push(`| ArtifactLink | ${data.artifactLinkCount || 0} | 工作项关联的Git提交 |`);
  sections.push(`| **合并去重** | **${data.commitCount || 0}** | 去除重复提交后 |`);
  sections.push('');

  // ========== 4. 关联提交详情 ==========
  sections.push('## 4. 关联提交详情\n');

  // 子工作项关联情况
  if (data.subItems && data.subItems.length > 0) {
    sections.push('### 子工作项关联\n');
    sections.push('| 类型 | ID | 标题 | 状态 | 关联提交 |');
    sections.push('|------|-----|------|------|----------|');
    data.subItems.forEach(item => {
      const commitInfo = item.commits && item.commits.length > 0
        ? item.commits.map(c => c.commitId?.substring(0, 8)).join(', ')
        : '-';
      sections.push(`| ${item.type || '任务'} | ${item.id} | ${item.title} | ${item.status || '-'} | ${commitInfo} |`);
    });
    sections.push('');
  }

  // 提交列表
  if (data.rawCommits && data.rawCommits.length > 0) {
    sections.push('### 提交列表\n');
    sections.push('| 序号 | 仓库 | Commit ID | 分支 | 作者 | 日期 | 来源 | 备注 |');
    sections.push('|------|------|-----------|------|------|------|------|------|');
    data.rawCommits.slice(0, 30).forEach((commit, idx) => {
      const date = commit.author?.date ? new Date(commit.author.date).toLocaleDateString('zh-CN') : 'N/A';
      const comment = (commit.comment || '').substring(0, 40).replace(/\n/g, ' ');
      const source = commit.source || (commit.linkedTaskId ? 'ArtifactLink' : '消息匹配');
      const branch = commit.branch || '-';
      sections.push(`| ${idx + 1} | ${commit.repositoryName || 'N/A'} | \`${(commit.commitId || 'N/A').substring(0, 8)}\` | ${branch} | ${commit.author?.name || commit.author?.displayName || 'N/A'} | ${date} | ${source} | ${comment}${(commit.comment || '').length > 40 ? '...' : ''} |`);
    });
    sections.push('');
    if (data.rawCommits.length > 30) {
      sections.push(`> *还有 ${data.rawCommits.length - 30} 个提交未显示*\n`);
    }
  } else {
    sections.push('### 提交列表\n');
    sections.push('无关联提交记录。\n');
  }

  // ========== 5. 变更统计 ==========
  sections.push('## 5. 变更统计\n');
  sections.push(`- 关联提交: **${data.commitCount || 0}** 个`);
  sections.push(`- 变更文件: **${data.fileCount || 0}** 个`);
  sections.push(`- 代码行数: +${data.linesAdded || 0} / -${data.linesDeleted || 0}`);
  sections.push('');

  // ========== 6. 代码上下文分析 ==========
  sections.push('## 6. 代码上下文分析\n');

  if (data.codeContextAnalysis) {
    const codeContext = data.codeContextAnalysis;

    // 6.1 变更文件详情
    if (codeContext.changedFiles && codeContext.changedFiles.length > 0) {
      sections.push('### 6.1 变更文件\n');
      sections.push('| 任务ID | 提交ID | 提交信息 | 文件路径 | 变更类型 | 行数变化 |');
      sections.push('|--------|--------|----------|----------|----------|----------|');

      codeContext.changedFiles.forEach(file => {
        const commitIdShort = (file.commitId || 'N/A').substring(0, 8);
        const commitMsg = (file.commitMessage || '').substring(0, 30).replace(/\n/g, ' ');
        sections.push(`| ${file.taskId || '-'} | \`${commitIdShort}\` | ${commitMsg}${(file.commitMessage || '').length > 30 ? '...' : ''} | \`${file.path}\` | ${file.changeType} | +${file.added || 0}/-${file.deleted || 0} |`);
      });
      sections.push('');
    }

    // 6.2 依赖文件（仅当有数据时显示）
    if (codeContext.dependencies && codeContext.dependencies.length > 0) {
      sections.push('### 6.2 依赖文件\n');
      sections.push('| 文件 | 依赖来源 | 关联逻辑 |');
      sections.push('|------|----------|----------|');

      const uniqueDeps = [...new Set(codeContext.dependencies)];
      uniqueDeps.slice(0, 20).forEach(dep => {
        const sources = Object.entries(codeContext.dependencyMap || {})
          .filter(([_, deps]) => deps.includes(dep))
          .map(([src]) => src);
        sections.push(`| \`${dep}\` | ${sources[0] || 'N/A'} | 被引用 |`);
      });
      if (uniqueDeps.length > 20) {
        sections.push(`> *还有 ${uniqueDeps.length - 20} 个依赖文件未显示*\n`);
      }
      sections.push('');
    }

    // 6.3 业务逻辑提取
    if (codeContext.analysisSummary) {
      const summary = codeContext.analysisSummary;
      sections.push('### 6.3 业务逻辑提取\n');

      // API 接口
      if (codeContext.apiEndpoints && codeContext.apiEndpoints.length > 0) {
        sections.push('#### API 接口\n');
        codeContext.apiEndpoints.slice(0, 10).forEach(api => {
          sections.push(`- \`${api.method || 'API'} ${api.path}\` - ${api.source || '接口'}`);
        });
        if (codeContext.apiEndpoints.length > 10) {
          sections.push(`- *还有 ${codeContext.apiEndpoints.length - 10} 个接口未显示*`);
        }
        sections.push('');
      }

      // 数据模型
      if (codeContext.dataModels && codeContext.dataModels.length > 0) {
        sections.push('#### 数据模型\n');
        codeContext.dataModels.slice(0, 10).forEach(model => {
          sections.push(`- \`${model.name}\` (${model.type})`);
        });
        sections.push('');
      }

      // 缓存操作
      if (codeContext.cacheOperations && codeContext.cacheOperations.length > 0) {
        sections.push('#### 缓存操作\n');
        codeContext.cacheOperations.slice(0, 10).forEach(op => {
          sections.push(`- \`${op.operation.toUpperCase()} ${op.key}\``);
        });
        sections.push('');
      }

      // 业务规则
      if (codeContext.businessRules && codeContext.businessRules.length > 0) {
        sections.push('#### 业务规则\n');
        const rules = codeContext.businessRules.filter(r => r.type === 'condition' || r.type === 'config');
        rules.slice(0, 5).forEach(rule => {
          const content = (rule.content || rule.value || '').substring(0, 60);
          sections.push(`- ${content}${(rule.content || rule.value || '').length > 60 ? '...' : ''}`);
        });
        sections.push('');
      }

      // 分析统计
      sections.push('#### 分析统计\n');
      sections.push(`- API 接口: ${summary.totalEndpoints || 0} 个`);
      sections.push(`- 函数/方法: ${summary.totalFunctions || 0} 个`);
      sections.push(`- 业务规则: ${summary.totalRules || 0} 个`);
      sections.push(`- 数据模型: ${summary.totalModels || 0} 个`);
      sections.push(`- 缓存操作: ${summary.totalCacheOps || 0} 个`);
      sections.push('');
    }

    // 6.4 需求匹配分析（优先使用 LLM 分析结果）
    sections.push('### 6.4 与需求匹配分析\n');

    // 优先使用 LLM 分析结果
    const llmResult = data.llmAnalysisResult;
    const ruleBasedMatch = codeContext.matchResult;

    if (llmResult) {
      // LLM 语义分析结果
      sections.push('> 分析方式: LLM 语义分析\n');

      if (llmResult.matches && llmResult.matches.length > 0) {
        sections.push('| 需求要点 | 代码实现 | 状态 | 置信度 |');
        sections.push('|----------|----------|------|--------|');
        llmResult.matches.forEach(m => {
          const status = m.status === 'implemented' ? '✓ 已实现' :
                        m.status === 'partial' ? '⚠ 部分' : '✗ 未实现';
          const confidence = m.confidence === 'high' ? '高' :
                            m.confidence === 'medium' ? '中' : '低';
          const impl = (m.implementation || 'N/A').substring(0, 35);
          sections.push(`| ${m.requirement} | \`${impl}\` | ${status} | ${confidence} |`);
        });
        sections.push('');
      }

      if (llmResult.unmatched && llmResult.unmatched.length > 0) {
        sections.push('**未匹配的需求要点**:\n');
        llmResult.unmatched.forEach(u => {
          sections.push(`- ${u.requirement}`);
          if (u.reason) {
            sections.push(`  - 原因: ${u.reason}`);
          }
          if (u.suggestion) {
            sections.push(`  - 建议: ${u.suggestion}`);
          }
        });
        sections.push('');
      }

      if (llmResult.summary) {
        sections.push(`**分析摘要**:\n`);
        // 对摘要中的要点进行换行处理（识别 1）2）3）或 1. 2. 3. 格式）
        const formattedSummary = llmResult.summary
          .replace(/([：:;；。])\s*(\d+[）\)])/g, '$1\n$2');
        sections.push(`${formattedSummary}\n`);
      }

      sections.push(`**匹配评分**: ${llmResult.score || 0}%\n`);

    } else if (ruleBasedMatch) {
      // 规则匹配结果（降级方案）
      sections.push('> 分析方式: 规则匹配（建议执行 LLM 语义分析以获得更准确结果）\n');

      if (ruleBasedMatch.matches && ruleBasedMatch.matches.length > 0) {
        sections.push('| 需求要点 | 代码实现 | 匹配状态 |');
        sections.push('|----------|----------|----------|');
        ruleBasedMatch.matches.slice(0, 15).forEach(m => {
          const impl = m.implementation || m.file || 'N/A';
          sections.push(`| ${m.requirement} | \`${impl.substring(0, 40)}\` | ✓ 已实现 |`);
        });
        sections.push('');
      }

      if (ruleBasedMatch.unmatched && ruleBasedMatch.unmatched.length > 0) {
        sections.push('**未匹配的需求要点**:\n');
        ruleBasedMatch.unmatched.slice(0, 10).forEach(u => {
          sections.push(`- ${u.requirement}`);
        });
        sections.push('');
      }

      sections.push(`**匹配评分**: ${ruleBasedMatch.score || 0}%\n`);
    } else {
      sections.push('**状态**: 等待 LLM 语义分析\n');
      sections.push(`请根据 \`${data.llmAnalysisInputPath}\` 中的数据进行分析，结果写入 \`/tmp/requirement-analysis-result-${data.requirementId}.json\`\n`);
    }
  } else {
    // 无数据情况处理
    sections.push('### 状态: ⚠ 无数据\n');

    // 根据错误类型显示不同原因
    const errorMessages = {
      'no_commits': 'TFS 无关联提交记录，但本地仓库已就绪（可手动查看本地代码）',
      'no_local_index': '本地仓库索引未初始化 - 请先刷新索引',
      'commits_not_local': '关联提交不存在于本地仓库 - 本地代码版本落后',
      'no_code_changes': '未能获取代码变更详情 - TFS API 请求失败',
      'no_file_content': '变更文件无内容可分析 - 代码获取不完整',
      'analysis_failed': '业务逻辑提取失败 - 代码解析错误'
    };

    const errorDetail = data.codeContextAnalysisError || 'unknown';
    const errorMessage = errorMessages[data.codeContextAnalysisError] || '未知原因';
    sections.push(`**错误代码**: \`${errorDetail}\`\n`);
    sections.push(`**原因**: ${errorMessage}\n`);

    // 提供操作建议
    sections.push('### 下一步操作建议\n');

    if (data.codeContextAnalysisError === 'no_local_index') {
      sections.push('1. 初始化本地仓库索引:');
      sections.push('   ```bash');
      sections.push('   node tools/main.mjs refresh-index');
      sections.push('   ```\n');
    } else if (data.codeContextAnalysisError === 'commits_not_local' || data.codeContextAnalysisError === 'no_file_content') {
      sections.push('1. 本地代码可能落后于远程仓库，请同步代码:');
      sections.push('   ```bash');
      sections.push('   # 进入对应仓库目录');
      sections.push('   cd <仓库路径>');
      sections.push('   git fetch --all');
      sections.push('   git pull origin <branch>');
      sections.push('   ```\n');
      sections.push('2. 更新本地仓库索引后重新分析:');
      sections.push('   ```bash');
      sections.push('   node tools/main.mjs refresh-index');
      sections.push('   node tools/main.mjs analyze <需求ID>');
      sections.push('   ```\n');
    } else if (data.codeContextAnalysisError === 'no_commits') {
      sections.push('1. 确认需求是否已关联代码提交');
      sections.push('2. 检查需求ID是否正确');
      sections.push('3. 查看是否有子任务关联了提交\n');
    } else if (data.codeContextAnalysisError === 'no_code_changes') {
      sections.push('1. TFS API 请求可能失败，请检查网络连接');
      sections.push('2. 确认 TFS PAT Token 配置正确');
      sections.push('3. 尝试手动同步代码后重新分析\n');
    } else {
      sections.push('1. 更新本地仓库索引:');
      sections.push('   ```bash');
      sections.push('   node tools/main.mjs refresh-index');
      sections.push('   ```\n');
      sections.push('2. 确认本地代码版本与TFS同步');
      sections.push('3. 重新运行分析\n');
    }

    // 添加手动查看代码的指导
    if (data.codePaths) {
      sections.push('### 手动查看代码\n');
      sections.push('如果自动获取失败，可以通过以下方式手动查看代码:\n');
      sections.push('1. **TFS 网页查看**:');
      sections.push(`   - 访问: ${data.codePaths.tfsServerUrl}`);
      sections.push('   - 在 "代码" -> "Git" 中查找对应仓库和提交\n');
      sections.push('2. **本地 Git 查看**:');
      sections.push('   ```bash');
      sections.push('   # 查看特定提交的变更');
      sections.push('   git show <commit-id>');
      sections.push('   # 查看提交的文件列表');
      sections.push('   git show --name-only <commit-id>');
      sections.push('   ```\n');
    }
  }

  // 显示同步警告
  if (data.syncWarnings && data.syncWarnings.length > 0) {
    sections.push('### ⚠ 代码同步建议\n');
    sections.push('以下仓库的本地代码可能落后于远程版本:\n');
    sections.push('| 仓库 | 本地路径 | 状态 | 建议操作 |');
    sections.push('|------|----------|------|----------|');
    data.syncWarnings.forEach(warning => {
      sections.push(`| ${warning.repoName} | \`${warning.localPath}\` | ${warning.message} | \`${warning.suggestion}\` |`);
    });
    sections.push('');
  }

  // ========== 判断结果 ==========
  sections.push('## 判断结果\n');

  // 判断1：需求与代码匹配度
  sections.push('### 判断1：需求与代码匹配度\n');
  const score = data.score || { overall: 0, dimensions: {} };
  const scoreSource = score.source === 'llm' ? 'LLM语义分析' : '规则匹配';

  // 维度权重配置
  const weights = {
    businessLogic: 0.35,
    functionalCoverage: 0.20,
    codeQuality: 0.20,
    testCoverage: 0.15,
    codeScale: 0.10
  };

  // 根据维度评分重新计算综合评分（确保一致性）
  const scores = score.dimensions || {};
  const calculatedOverall = Math.round(
    ((scores.businessLogic?.score || scores.businessLogic || 0) * weights.businessLogic) +
    ((scores.functionalCoverage || 0) * weights.functionalCoverage) +
    ((scores.codeQuality || 0) * weights.codeQuality) +
    ((scores.testCoverage || 0) * weights.testCoverage) +
    ((scores.codeScale || 0) * weights.codeScale)
  );

  // 如果计算值与原始值差异大，使用计算值
  const finalOverall = calculatedOverall > 0 ? calculatedOverall : (score.overall || 0);

  sections.push(`**综合评分**: ${finalOverall}/100 (来源: ${scoreSource})\n`);

  sections.push('#### 维度评分详情');
  sections.push('| 维度 | 得分 | 权重 | 加权分 | 说明 |');
  sections.push('|------|------|------|--------|------|');

  const businessLogicScore = scores.businessLogic?.score || scores.businessLogic || 0;
  const functionalScore = scores.functionalCoverage || 0;
  const qualityScore = scores.codeQuality || 0;
  const testScore = scores.testCoverage || 0;
  const scaleScore = scores.codeScale || 0;

  sections.push(`| 业务逻辑匹配度 | ${businessLogicScore}/100 | 35% | ${(businessLogicScore * weights.businessLogic).toFixed(1)} | 业务规则、流程、约束、映射、边界情况匹配 |`);
  sections.push(`| 功能覆盖度 | ${functionalScore}/100 | 20% | ${(functionalScore * weights.functionalCoverage).toFixed(1)} | 功能点覆盖情况 |`);
  sections.push(`| 代码质量 | ${qualityScore}/100 | 20% | ${(qualityScore * weights.codeQuality).toFixed(1)} | 代码规范和问题 |`);
  sections.push(`| 测试完整性 | ${testScore}/100 | 15% | ${(testScore * weights.testCoverage).toFixed(1)} | 测试覆盖情况 |`);
  sections.push(`| 代码规模 | ${scaleScore}/100 | 10% | ${(scaleScore * weights.codeScale).toFixed(1)} | 代码规模合理性 |`);
  sections.push(`| **加权总分** | | | **${finalOverall}** | |`);
  sections.push('');

  // 业务逻辑详情
  if (scores.businessLogic?.details) {
    const details = scores.businessLogic.details;
    sections.push('#### 业务逻辑匹配详情\n');
    sections.push('| 要素 | 匹配度 |');
    sections.push('|------|--------|');
    if (details.businessRules !== undefined) {
      const ruleScore = typeof details.businessRules === 'number' ? details.businessRules : details.businessRules.score || 0;
      sections.push(`| 业务规则 | ${ruleScore.toFixed(1)}% |`);
    }
    if (details.workflows !== undefined) {
      const flowScore = typeof details.workflows === 'number' ? details.workflows : details.workflows.score || 0;
      sections.push(`| 业务流程 | ${flowScore.toFixed(1)}% |`);
    }
    if (details.constraints !== undefined) {
      const constraintScore = typeof details.constraints === 'number' ? details.constraints : details.constraints.score || 0;
      sections.push(`| 约束条件 | ${constraintScore.toFixed(1)}% |`);
    }
    if (details.dataMapping !== undefined) {
      const mappingScore = typeof details.dataMapping === 'number' ? details.dataMapping : details.dataMapping.score || 0;
      sections.push(`| 数据映射 | ${mappingScore.toFixed(1)}% |`);
    }
    if (details.edgeCases !== undefined) {
      const edgeScore = typeof details.edgeCases === 'number' ? details.edgeCases : details.edgeCases.score || 0;
      sections.push(`| 边界情况 | ${edgeScore.toFixed(1)}% |`);
    }
    sections.push('');
  }

  // 判断2：高风险问题
  sections.push('### 判断2：高风险问题\n');
  const scan = data.scanResults || {};

  // 支持新旧两种格式
  let scannedFilesCount = 0;
  let totalIssues = 0;
  let criticalIssues = [];
  let warningIssues = [];

  // 新格式（win-code-scanner 输出）
  if (scan.summary) {
    scannedFilesCount = scan.report_info?.scanned_files || scan.scannedFiles || 0;
    totalIssues = scan.summary.total || scan.total || 0;
    criticalIssues = (scan.issues || scan.critical || []).filter(i =>
      (i.severity || '').toLowerCase() === 'critical' || i.severity === '严重'
    );
    warningIssues = (scan.issues || scan.warning || []).filter(i =>
      (i.severity || '').toLowerCase() === 'warning' || i.severity === '警告'
    );
  }
  // 旧格式
  else {
    scannedFilesCount = scan.scannedFiles || 0;
    totalIssues = scan.total || 0;
    criticalIssues = scan.critical || [];
    warningIssues = scan.warning || [];
  }

  sections.push(`**扫描文件**: ${scannedFilesCount} 个`);
  sections.push(`**发现问题**: ${totalIssues} 个\n`);

  if (criticalIssues.length > 0) {
    sections.push(`#### 严重问题 (${criticalIssues.length})\n`);
    criticalIssues.forEach(issue => {
      const ruleCode = issue.rule_code || issue.rule || 'N/A';
      const ruleName = issue.rule_name || issue.message || '';
      sections.push(`- **${ruleCode}** ${ruleName}`);
      sections.push(`  - 文件: \`${issue.file || '未知'}:${issue.line || '?'}\``);
      if (issue.description || issue.message) {
        sections.push(`  - 描述: ${issue.description || issue.message}`);
      }
      if (issue.suggestion) {
        sections.push(`  - 建议: ${issue.suggestion}`);
      }
      sections.push('');
    });
  }

  if (warningIssues.length > 0) {
    sections.push(`#### 警告问题 (${warningIssues.length})\n`);
    warningIssues.forEach(issue => {
      const ruleCode = issue.rule_code || issue.rule || 'N/A';
      const desc = issue.description || issue.message || '未知问题';
      sections.push(`- **${ruleCode}** ${desc}`);
      if (issue.file) {
        sections.push(`  - 文件: \`${issue.file}:${issue.line || '?'}\``);
      }
      if (issue.count && issue.count > 1) {
        sections.push(`  - 出现次数: ${issue.count}`);
      }
    });
    sections.push('');
  }

  if (criticalIssues.length === 0 && warningIssues.length === 0) {
    sections.push('未发现代码质量问题\n');
  }

  // 页脚
  sections.push('---\n');
  sections.push(`*报告生成时间: ${new Date().toLocaleString('zh-CN')}*`);
  sections.push(`*生成工具: Requirement Coverage Analyzer*`);

  // 添加SKILL追踪信息块
  sections.push(generateTrackingReportBlock(data));

  return sections.join('\n');
}

/**
 * 生成JSON格式报告
 * @param {Object} data - 分析结果数据
 * @param {Object} config - 配置对象
 * @returns {Promise<string>} 报告文件路径
 */
export async function generateJsonReport(data, config) {
  // 使用代码根目录下的 reports 目录
  const reposRootDir = config.repos_root_dir || '/tmp';
  const reportsDir = path.join(reposRootDir, 'reports');

  // 确保 reports 目录存在
  try {
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (e) {
    // 目录可能已存在
  }

  const reportPath = path.join(
    reportsDir,
    `requirement-coverage-${data.requirementId}.json`
  );

  const reportData = {
    meta: {
      requirementId: data.requirementId,
      requirementTitle: data.requirementTitle,
      requirementState: data.requirementState,
      dataSource: data.dataSource,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    implementation: {
      status: data.implementation?.status,
      message: data.implementation?.message,
      commitCount: data.commitCount,
      fileCount: data.fileCount,
      linesAdded: data.linesAdded,
      linesDeleted: data.linesDeleted,
      subItems: data.subItems
    },
    score: {
      overall: data.score?.overall,
      dimensions: data.score?.dimensions
    },
    scanResults: data.scanResults
  };

  await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');

  return reportPath;
}

/**
 * 显示进度条
 * @param {number} current - 当前进度
 * @param {number} total - 总数
 * @param {string} message - 进度消息
 */
export function showProgress(current, total, message = '处理中') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((percentage / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  process.stdout.write(`\r${message} ${bar} ${percentage}% (${current}/${total})`);

  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * 创建带动画的加载指示器
 * @param {string} message - 加载消息
 * @returns {Object} 加载器对象，包含start和stop方法
 */
export function createLoader(message = '加载中') {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let interval = null;

  return {
    start: () => {
      interval = setInterval(() => {
        process.stdout.write(`\r${frames[i = ++i % frames.length]} ${message}`);
      }, 80);
    },
    stop: (finalMessage = '') => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      process.stdout.write(`\r${finalMessage ? '✓ ' + finalMessage : '✓'}\n`);
    }
  };
}

/**
 * 打印表格数据
 * @param {Array<Array>} rows - 表格行数据
 * @param {Object} options - 选项
 */
export function printTable(rows, options = {}) {
  const { headers = [], align = [] } = options;

  if (headers.length > 0) {
    rows = [headers, ...rows];
  }

  // 计算每列最大宽度
  const colWidths = rows[0].map((_, colIndex) => {
    return Math.max(...rows.map(row => String(row[colIndex] || '').length));
  });

  // 打印分隔线
  const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';

  console.log(separator);

  rows.forEach((row, rowIndex) => {
    const cells = row.map((cell, i) => {
      const text = String(cell || '');
      const alignType = align[i] || 'left';
      let padding = colWidths[i] - text.length;

      if (alignType === 'center') {
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' ' + ' '.repeat(leftPad) + text + ' '.repeat(rightPad) + ' ';
      } else if (alignType === 'right') {
        return ' ' + ' '.repeat(padding) + text + ' ';
      } else {
        return ' ' + text + ' '.repeat(padding) + ' ';
      }
    });
    console.log('|' + cells.join('|') + '|');
    console.log(separator);
  });
}

/**
 * 生成摘要报告
 * @param {Object} data - 分析结果数据
 * @returns {Object} 摘要数据
 */
export function generateSummary(data) {
  const impl = data.implementation || {};
  const score = data.score || {};
  const scan = data.scanResults || {};

  return {
    requirementId: data.requirementId,
    title: data.requirementTitle,
    status: impl.status,
    overallScore: score.overall || 0,
    criticalIssues: scan.critical?.length || 0,
    warningIssues: scan.warning?.length || 0,
    commitCount: data.commitCount || 0,
    isImplemented: impl.status === 'implemented',
    hasRisks: (scan.critical?.length || 0) > 0
  };
}

/**
 * 批量生成报告
 * @param {Array} dataList - 多个分析结果数据数组
 * @param {Object} config - 配置对象
 * @returns {Promise<Array>} 报告文件路径数组
 */
export async function generateBatchReports(dataList, config) {
  const reportPaths = [];

  for (const data of dataList) {
    const reportPath = await generateMarkdownReport(data, config);
    reportPaths.push(reportPath);
  }

  return reportPaths;
}
