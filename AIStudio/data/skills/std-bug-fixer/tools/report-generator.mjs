#!/usr/bin/env node
/**
 * Bug Fix Report Generator
 * Bug修复报告生成器
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 报告生成器类
 */
class BugFixReportGenerator {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates');
  }

  /**
   * 生成Markdown报告
   * @param {object} data - 报告数据 { bugs, analyses, summary }
   * @param {string} outputPath - 输出路径
   * @returns {string} 报告内容
   */
  generateMarkdown(data, outputPath) {
    const { bugs, analyses, summary } = data;

    let report = `# Bug修复分析报告\n\n`;

    // 报告头部
    report += this.generateHeader(summary);

    // 统计概览
    report += this.generateSummary(analyses, summary);

    // Bug详细分析
    report += this.generateDetailedAnalysis(bugs, analyses);

    // 修复优先级建议
    report += this.generatePriorityRecommendations(analyses);

    // 修复模板
    report += this.generateFixTemplates(analyses);

    // 保存报告
    if (outputPath) {
      this.saveReport(report, outputPath);
    }

    return report;
  }

  /**
   * 生成Excel报告（需要使用xlsx库）
   * @param {object} data - 报告数据
   * @param {string} outputPath - 输出路径
   */
  async generateExcel(data, outputPath) {
    // 这里需要安装 xlsx 库
    // npm install xlsx
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // 概览Sheet
      const summaryData = this.prepareSummaryData(data);
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, '概览');

      // Bug列表Sheet
      const bugListData = this.prepareBugListData(data);
      const bugListSheet = XLSX.utils.json_to_sheet(bugListData);
      XLSX.utils.book_append_sheet(workbook, bugListSheet, 'Bug列表');

      // 分析结果Sheet
      const analysisData = this.prepareAnalysisData(data);
      const analysisSheet = XLSX.utils.json_to_sheet(analysisData);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, '分析结果');

      // 写入文件
      XLSX.writeFile(workbook, outputPath);
      console.log(`\nExcel报告已生成: ${outputPath}`);

      return true;
    } catch (error) {
      console.error(`生成Excel报告失败: ${error.message}`);
      console.log('请安装xlsx库: npm install xlsx');
      return false;
    }
  }

  /**
   * 生成报告头部
   */
  generateHeader(summary) {
    let header = `## 📋 报告信息\n\n`;
    header += `- **生成时间**: ${new Date().toLocaleString('zh-CN')}\n`;
    header += `- **数据来源**: ${summary.source || 'TFS'}\n`;
    header += `- **Bug数量**: ${summary.totalBugs || 0}个\n`;

    if (summary.collection) {
      header += `- **TFS集合**: ${summary.collection}\n`;
    }
    if (summary.project) {
      header += `- **项目**: ${summary.project}\n`;
    }
    if (summary.queryUrl) {
      header += `- **查询URL**: ${summary.queryUrl}\n`;
    }

    header += '\n';
    return header;
  }

  /**
   * 生成统计概览
   */
  generateSummary(analyses, summary) {
    let section = `## 📊 统计概览\n\n`;

    // 按类别统计
    const byCategory = this.groupBy(analyses, 'category');
    section += `### 按类别分组\n\n`;
    section += `| 类别 | 数量 | 占比 |\n`;
    section += `|------|------|------|\n`;

    for (const [category, items] of Object.entries(byCategory)) {
      const count = items.length;
      const percent = ((count / analyses.length) * 100).toFixed(1);
      section += `| ${category} | ${count} | ${percent}% |\n`;
    }

    // 按风险等级统计
    const byRisk = this.groupBy(analyses, 'riskLevel');
    section += `\n### 风险等级分布\n\n`;
    section += `| 风险等级 | 数量 | 占比 |\n`;
    section += `|----------|------|------|\n`;

    const riskOrder = ['critical', 'high', 'medium', 'low'];
    for (const risk of riskOrder) {
      const items = byRisk[risk] || [];
      if (items.length > 0) {
        const count = items.length;
        const percent = ((count / analyses.length) * 100).toFixed(1);
        const emoji = risk === 'critical' ? '🔴' : risk === 'high' ? '🟠' : risk === 'medium' ? '🟡' : '🟢';
        section += `| ${emoji} ${risk.toUpperCase()} | ${count} | ${percent}% |\n`;
      }
    }

    // 工作量估算
    section += `\n### 工作量估算\n\n`;
    const totalHours = analyses.reduce((sum, a) => sum + (a.estimatedEffort?.hours || 0), 0);
    const simpleBugs = analyses.filter(a => a.estimatedEffort?.level === '简单').length;
    const mediumBugs = analyses.filter(a => a.estimatedEffort?.level === '中等').length;
    const complexBugs = analyses.filter(a => a.estimatedEffort?.level === '复杂').length;

    section += `- **总工时**: ${totalHours} 小时\n`;
    section += `- **平均工时**: ${(totalHours / analyses.length).toFixed(1)} 小时/Bug\n`;
    section += `- **简单Bug**: ${simpleBugs}个\n`;
    section += `- **中等Bug**: ${mediumBugs}个\n`;
    section += `- **复杂Bug**: ${complexBugs}个\n`;

    section += '\n';
    return section;
  }

  /**
   * 生成详细分析
   */
  generateDetailedAnalysis(bugs, analyses) {
    let section = `## 📋 Bug详细分析\n\n`;

    // 按风险等级排序
    const sortedAnalyses = [...analyses].sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
    });

    for (const analysis of sortedAnalyses) {
      const bug = bugs.find(b => b.id === analysis.bugId);
      if (!bug) continue;

      const riskEmoji = analysis.riskLevel === 'critical' ? '🔴' :
                       analysis.riskLevel === 'high' ? '🟠' :
                       analysis.riskLevel === 'medium' ? '🟡' : '🟢';

      section += `### ${riskEmoji} [${analysis.bugId}] ${analysis.title}\n\n`;

      // Bug基本信息
      section += `**基本信息**\n\n`;
      section += `- **状态**: ${bug.state}\n`;
      section += `- **优先级**: P${bug.priority || '-'}\n`;
      section += `- **严重程度**: ${bug.severity || '-'}\n`;
      section += `- **分配给**: ${bug.assignedTo || '未分配'}\n`;
      section += `- **创建时间**: ${new Date(bug.createdDate).toLocaleDateString('zh-CN')}\n`;

      if (bug.stackTrace) {
        section += `- **有堆栈跟踪**: ✓\n`;
      }

      // 分析结果
      section += `\n**分析结果**\n\n`;
      section += `- **类别**: ${analysis.category}\n`;
      section += `- **风险等级**: ${riskEmoji} ${analysis.riskLevel.toUpperCase()}\n`;
      section += `- **估算工时**: ${analysis.estimatedEffort?.hours || '?'}小时 (${analysis.estimatedEffort?.level || '?'})\n`;

      // 代码位置信息（新增）
      if (analysis.codeLocation) {
        section += this.generateCodeLocationSection(analysis.codeLocation);
      }

      // 详细修复建议（新增）
      if (analysis.fixSuggestion) {
        section += this.generateFixSuggestionSection(analysis.fixSuggestion);
      }

      // 修复建议
      if (analysis.suggestions.length > 0) {
        section += `\n**修复建议**\n\n`;
        analysis.suggestions.forEach((s, i) => {
          section += `${i + 1}. ${s}\n`;
        });
      }

      // 代码位置
      if (analysis.codeHints.length > 0) {
        section += `\n**代码位置**\n\n`;
        section += `| 类名 | 方法 | 文件 | 行号 |\n`;
        section += `|------|------|------|------|\n`;
        analysis.codeHints.forEach(hint => {
          section += `| ${hint.className || '-'} | ${hint.methodName || '-'} | \`${hint.fileName || '-'}\` | ${hint.lineNumber || '-'} |\n`;
        });
      }

      // 相关文件
      if (analysis.relatedFiles.length > 0) {
        section += `\n**相关文件**\n\n`;
        analysis.relatedFiles.slice(0, 5).forEach(f => {
          section += `- \`${f}\`\n`;
        });
      }

      // 重现步骤（新增）
      if (bug.reproSteps) {
        section += `\n**📝 重现步骤**\n\n`;
        // 清理重现步骤的格式
        const steps = this._formatReproSteps(bug.reproSteps);
        section += steps;
      }

      // 图片分析（新增）
      if (analysis.imageAnalysis && analysis.imageAnalysis.summary) {
        section += this._generateImageAnalysisSection(analysis.imageAnalysis);
      }

      // Bug描述摘要
      if (bug.description) {
        const descPreview = bug.description.substring(0, 200);
        section += `\n**问题描述**\n\n`;
        section += `\`\`\`\n${descPreview}${bug.description.length > 200 ? '...' : ''}\n\`\`\`\n`;
      }

      section += `\n---\n\n`;
    }

    return section;
  }

  /**
   * 生成代码位置部分
   */
  generateCodeLocationSection(codeLocation) {
    let section = `\n**代码位置**\n\n`;

    // 判断是TFS Git仓库还是本地仓库
    const isTfsGit = codeLocation.webUrl && !codeLocation.localPath;

    if (isTfsGit) {
      // TFS Git仓库信息
      if (codeLocation.repository) {
        section += `- **Git仓库**: ${codeLocation.repository}\n`;
      }
      if (codeLocation.repositoryProject) {
        section += `- **TFS项目**: ${codeLocation.repositoryProject}\n`;
      }
      if (codeLocation.webUrl) {
        section += `- **仓库地址**: [${codeLocation.webUrl}](${codeLocation.webUrl})\n`;
      }
      if (codeLocation.defaultBranch) {
        section += `- **默认分支**: ${codeLocation.defaultBranch}\n`;
      }
    } else {
      // 本地仓库信息
      if (codeLocation.repository) {
        section += `- **仓库**: ${codeLocation.repository}\n`;
      }
      if (codeLocation.localPath) {
        section += `- **本地路径**: \`${codeLocation.localPath}\`\n`;
      }
    }

    if (codeLocation.matchScore > 0) {
      section += `- **匹配分数**: ${codeLocation.matchScore}\n`;
    }
    if (codeLocation.matchReason) {
      section += `- **匹配原因**: ${codeLocation.matchReason}\n`;
    }

    // TFS Git仓库：推断的文件信息
    if (isTfsGit && codeLocation.inferredFiles && codeLocation.inferredFiles.length > 0) {
      section += `\n**推断的相关文件**:\n`;
      codeLocation.inferredFiles.slice(0, 5).forEach(f => {
        section += `- \`${f.fileName}${f.lineNumber ? ':' + f.lineNumber : ''}\` (${f.language})\n`;
      });
    }

    // 本地仓库：已验证的文件路径
    if (!isTfsGit && codeLocation.verifiedPaths && codeLocation.verifiedPaths.length > 0) {
      section += `\n**已验证的文件**:\n`;
      codeLocation.verifiedPaths.slice(0, 3).forEach(p => {
        section += `- \`${p.fullPath}\`\n`;
      });
    }

    // 本地仓库：推断的文件路径
    if (!isTfsGit && codeLocation.inferredPaths && codeLocation.inferredPaths.length > 0) {
      const unverified = codeLocation.inferredPaths.filter(ip =>
        !codeLocation.verifiedPaths?.some(vp => vp.originalPath === ip)
      );
      if (unverified.length > 0) {
        section += `\n**推断的文件**（未验证）:\n`;
        unverified.slice(0, 3).forEach(p => {
          section += `- \`${p}\`\n`;
        });
      }
    }

    // 代码上下文
    if (codeLocation.codeContext) {
      const ctx = codeLocation.codeContext;
      section += `\n**代码上下文**:\n\n`;
      section += `\`\`\`${ctx.language || ''}\n`;
      section += `文件: ${ctx.filePath}\n`;
      section += `行号: ${ctx.lineNumber}\n\n`;
      section += `${ctx.snippet}\n`;
      section += `\`\`\`\n`;
    }

    // 搜索结果
    if (codeLocation.searchResults && codeLocation.searchResults.length > 0) {
      section += `\n**搜索到的相关代码**:\n\n`;
      codeLocation.searchResults.slice(0, 2).forEach(result => {
        section += `- \`${result.filePath}:${result.lineNumber}\`\n`;
        if (result.lineContent) {
          section += `  \`${result.lineContent.trim().substring(0, 80)}\`\n`;
        }
      });
    }

    return section;
  }

  /**
   * 生成修复建议部分
   */
  generateFixSuggestionSection(fixSuggestion) {
    let section = `\n**详细修复建议**\n\n`;

    section += `- **Bug类型**: ${fixSuggestion.bugTypeName}\n`;
    section += `- **严重程度**: ${fixSuggestion.severity}\n`;
    section += `- **问题摘要**: ${fixSuggestion.summary}\n\n`;

    if (fixSuggestion.causes && fixSuggestion.causes.length > 0) {
      section += `**可能原因**:\n`;
      fixSuggestion.causes.forEach(c => {
        section += `- ${c}\n`;
      });
      section += `\n`;
    }

    if (fixSuggestion.solutions && fixSuggestion.solutions.length > 0) {
      section += `**解决方案**:\n`;
      fixSuggestion.solutions.forEach(s => {
        section += `- ${s}\n`;
      });
      section += `\n`;
    }

    if (fixSuggestion.codeExamples && fixSuggestion.codeExamples.length > 0) {
      section += `**代码示例**:\n\n`;
      fixSuggestion.codeExamples.forEach(example => {
        section += `**${example.title}**:\n\n`;
        section += `\`\`\`\n${example.code}\n\`\`\`\n\n`;
      });
    }

    if (fixSuggestion.testing && fixSuggestion.testing.length > 0) {
      section += `**测试建议**:\n`;
      fixSuggestion.testing.forEach(t => {
        section += `- ${t}\n`;
      });
      section += `\n`;
    }

    if (fixSuggestion.prevention && fixSuggestion.prevention.length > 0) {
      section += `**预防措施**:\n`;
      fixSuggestion.prevention.forEach(p => {
        section += `- ${p}\n`;
      });
    }

    return section;
  }

  /**
   * 生成优先级建议
   */
  generatePriorityRecommendations(analyses) {
    let section = `## 🎯 修复优先级建议\n\n`;

    // 按风险等级和工时排序
    const sorted = [...analyses].sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const riskDiff = (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
      if (riskDiff !== 0) return riskDiff;
      return (b.estimatedEffort?.hours || 0) - (a.estimatedEffort?.hours || 0);
    });

    section += `建议按以下优先级修复Bug：\n\n`;

    const priorityGroups = {
      P0: sorted.filter(a => a.riskLevel === 'critical'),
      P1: sorted.filter(a => a.riskLevel === 'high'),
      P2: sorted.filter(a => a.riskLevel === 'medium'),
      P3: sorted.filter(a => a.riskLevel === 'low')
    };

    for (const [priority, items] of Object.entries(priorityGroups)) {
      if (items.length === 0) continue;

      section += `### ${priority} - ${items.length}个\n\n`;
      items.forEach(item => {
        const hours = item.estimatedEffort?.hours || '?';
        section += `- [${item.bugId}] ${item.title} (~${hours}h)\n`;
      });
      section += '\n';
    }

    return section;
  }

  /**
   * 生成修复模板
   */
  generateFixTemplates(analyses) {
    let section = `## 📝 修复模板\n\n`;

    section += `### 通用修复流程\n\n`;
    section += `1. **复现问题** - 根据Bug描述复现问题\n`;
    section += `2. **定位代码** - 使用堆栈跟踪或日志定位问题代码\n`;
    section += `3. **编写测试** - 先编写失败的单元测试\n`;
    section += `4. **修复代码** - 修复问题使测试通过\n`;
    section += `5. **验证修复** - 运行所有测试确保没有引入新问题\n`;
    section += `6. **代码审查** - 提交代码进行审查\n\n`;

    // 按类别生成模板
    const byCategory = this.groupBy(analyses, 'category');

    for (const [category, items] of Object.entries(byCategory)) {
      if (items.length === 0) continue;

      section += `### ${category}修复模板\n\n`;
      section += `**适用Bug**:\n`;
      items.slice(0, 3).forEach(item => {
        section += `- [${item.bugId}] ${item.title}\n`;
      });
      section += '\n';

      // 修复建议
      const suggestions = items.flatMap(i => i.suggestions);
      const uniqueSuggestions = [...new Set(suggestions)];

      if (uniqueSuggestions.length > 0) {
        section += `**通用修复步骤**:\n`;
        uniqueSuggestions.forEach(s => {
          section += `- ${s}\n`;
        });
        section += '\n';
      }
    }

    return section;
  }

  /**
   * 辅助方法：分组
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const k = item[key] || 'other';
      if (!groups[k]) {
        groups[k] = [];
      }
      groups[k].push(item);
      return groups;
    }, {});
  }

  /**
   * 格式化重现步骤
   * @param {string} steps - 重现步骤文本
   * @returns {string} 格式化后的步骤
   */
  _formatReproSteps(steps) {
    if (!steps) return '';

    // 清理HTML标签（如果有）
    let cleanSteps = steps
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();

    // 按行分割并清理
    const lines = cleanSteps.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return '';

    // 检测是否已经是编号列表
    const isNumbered = lines.some(l => /^\d+[、.．]/.test(l));

    let formatted = '';

    if (isNumbered) {
      // 已经有编号，直接使用
      formatted = lines.map((line, index) => {
        // 如果行首没有编号，添加编号
        if (/^\d+[、.．]/.test(line)) {
          return `${index + 1}. ${line.replace(/^\d+[、.．]\s*/, '')}`;
        }
        return line;
      }).join('\n');
    } else {
      // 添加编号
      formatted = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
    }

    return formatted + '\n';
  }

  /**
   * 生成图片分析部分
   * @param {object} imageAnalysis - 图片分析结果
   * @returns {string} 图片分析报告部分
   */
  _generateImageAnalysisSection(imageAnalysis) {
    let section = `\n**🖼️ 图片分析**\n\n`;

    if (!imageAnalysis.images || imageAnalysis.images.length === 0) {
      section += `未找到图片附件\n`;
      return section;
    }

    section += `发现 ${imageAnalysis.images.length} 张图片\n\n`;

    for (let i = 0; i < imageAnalysis.images.length; i++) {
      const img = imageAnalysis.images[i];
      section += `**图片 ${i + 1}**: ${img.filename}\n`;

      if (img.error) {
        section += `- ❌ 分析失败: ${img.error}\n`;
      } else if (img.analysis) {
        if (img.analysis.imageInfo) {
          const info = img.analysis.imageInfo;
          section += `- 格式: ${info.format || '-'}\n`;
          if (info.dimensions) {
            section += `- 尺寸: ${info.dimensions.width}x${info.dimensions.height}\n`;
          }
        }

        if (img.analysis.analysis?.basic) {
          const basic = img.analysis.analysis.basic;
          section += `- 大小: ${basic.sizeKB}KB\n`;
          if (basic.aspectRatio) {
            section += `- 宽高比: ${basic.aspectRatio}\n`;
          }
        }

        if (img.analysis.analysis?.ai) {
          section += `- AI分析: 已启用（需要集成AI API进行详细分析）\n`;
        }
      }

      section += `\n`;
    }

    section += `📊 统计\n`;
    section += `- 总数: ${imageAnalysis.summary.total}\n`;
    section += `- 成功: ${imageAnalysis.summary.success}\n`;
    section += `- 失败: ${imageAnalysis.summary.failed}\n`;

    return section;
  }

  /**
   * 保存报告
   */
  saveReport(content, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`\n报告已保存: ${outputPath}`);
  }

  /**
   * 准备Excel概览数据
   */
  prepareSummaryData(data) {
    const { analyses, summary } = data;
    const byCategory = this.groupBy(analyses, 'category');

    return Object.entries(byCategory).map(([category, items]) => ({
      '类别': category,
      '数量': items.length,
      '占比': `${((items.length / analyses.length) * 100).toFixed(1)}%`,
      '总工时': items.reduce((sum, a) => sum + (a.estimatedEffort?.hours || 0), 0) + '小时'
    }));
  }

  /**
   * 准备Excel Bug列表数据
   */
  prepareBugListData(data) {
    return data.bugs.map(bug => ({
      'ID': bug.id,
      '标题': bug.title,
      '状态': bug.state,
      '优先级': `P${bug.priority || '-'}`,
      '严重程度': bug.severity || '-',
      '分配给': bug.assignedTo || '未分配',
      '创建时间': new Date(bug.createdDate).toLocaleDateString('zh-CN'),
      'URL': bug.url || ''
    }));
  }

  /**
   * 准备Excel分析数据
   */
  prepareAnalysisData(data) {
    return data.analyses.map(analysis => {
      const bug = data.bugs.find(b => b.id === analysis.bugId);
      return {
        'Bug ID': analysis.bugId,
        '标题': analysis.title,
        '类别': analysis.category,
        '风险等级': analysis.riskLevel.toUpperCase(),
        '估算工时': analysis.estimatedEffort?.hours || '?',
        '难度': analysis.estimatedEffort?.level || '?',
        '状态': bug?.state || '',
        '修复建议': analysis.suggestions.join('; '),
        '相关文件': analysis.relatedFiles.join('; ')
      };
    });
  }
}

export { BugFixReportGenerator };
export default BugFixReportGenerator;
