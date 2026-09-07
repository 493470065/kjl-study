#!/usr/bin/env node
/**
 * AI Fix Analyzer
 * 分析哪些Bug可以用AI自动修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AI修复支持的Bug类型映射
 */
const AI_FIX_CAPABILITIES = {
  // 完全支持（有代码模板）
  fullySupported: {
    categories: [
      'UI问题',        // Vue组件修复、空状态处理、加载状态
      '代码质量',      // 空指针、数组越界等
      '安全漏洞',      // SQL注入、XSS等
      '数据处理'       // 数据验证、格式化等
    ],
    keywords: [
      '空指针', 'null', 'NullPointerException', 'NPE',
      '越界', 'IndexOutOfBounds', '数组越界',
      'SQL注入', 'SQL injection', 'SQL拼接',
      'XSS', '跨站脚本',
      '类型转换', 'ClassCastException',
      '并发', 'ConcurrentModification', 'race condition',
      '资源泄漏', 'resource leak', '未关闭',
      '显示', '渲染', '空白', '不显示',
      '加载', 'loading', '异步',
      '验证', '校验', '格式'
    ],
    templates: [
      'nullPointer',
      'sqlInjection',
      'xss',
      'indexOutOfBounds',
      'uiDisplay',
      'asyncError',
      'typeConversion',
      'reactiveData'
    ]
  },

  // 部分支持（需要人工辅助）
  partiallySupported: {
    categories: [
      '接口调用',
      '性能问题',
      '配置问题'
    ],
    keywords: [
      '接口', 'API', '调用失败',
      '超时', 'timeout', '慢',
      '配置', 'config', '参数'
    ],
    notes: 'AI可以生成修复建议，但需要人工确认'
  },

  // 不支持（需要人工分析）
  notSupported: {
    categories: [
      '其他问题',        // 业务逻辑、环境问题等
      '业务逻辑',        // 需要理解业务规则
      '权限认证'         // 涉及安全策略
    ],
    keywords: [
      '业务', '流程', '规则',
      '权限', '认证', '授权',
      '环境', '配置',
      '需求', '功能'
    ],
    notes: '需要人工分析和实现'
  }
};

/**
 * 分析Bug是否可以被AI修复
 */
function analyzeBugForAIFix(bug) {
  const title = (bug.title || '').toLowerCase();
  const description = (bug.description || '').toLowerCase();
  const combined = title + ' ' + description;

  // 检查完全支持的关键词
  for (const keyword of AI_FIX_CAPABILITIES.fullySupported.keywords) {
    if (combined.toLowerCase().includes(keyword.toLowerCase())) {
      return {
        canAIFix: true,
        confidence: 'high',
        reason: `匹配关键词: ${keyword}`,
        category: 'fullySupported'
      };
    }
  }

  // 检查类别
  if (bug.analysis) {
    const category = bug.analysis.category || '';
    if (AI_FIX_CAPABILITIES.fullySupported.categories.includes(category)) {
      return {
        canAIFix: true,
        confidence: 'medium',
        reason: `匹配类别: ${category}`,
        category: 'fullySupported'
      };
    }

    if (AI_FIX_CAPABILITIES.partiallySupported.categories.includes(category)) {
      return {
        canAIFix: true,
        confidence: 'low',
        reason: `匹配类别: ${category} (需要人工辅助)`,
        category: 'partiallySupported',
        requiresHumanReview: true
      };
    }

    if (AI_FIX_CAPABILITIES.notSupported.categories.includes(category)) {
      return {
        canAIFix: false,
        reason: `类别不支持: ${category}`,
        category: 'notSupported'
      };
    }
  }

  // 默认：其他问题不支持
  return {
    canAIFix: false,
    reason: '未匹配到AI修复模式',
    category: 'notSupported'
  };
}

/**
 * 分析Bug列表
 */
function analyzeBugsForAIFix(bugs) {
  const results = {
    total: bugs.length,
    fullySupported: 0,
    partiallySupported: 0,
    notSupported: 0,
    byCategory: {},
    byConfidence: {
      high: 0,
      medium: 0,
      low: 0
    },
    bugs: []
  };

  for (const bug of bugs) {
    const analysis = analyzeBugForAIFix(bug);

    // 统计
    if (analysis.canAIFix) {
      if (analysis.category === 'fullySupported') {
        results.fullySupported++;
        results.byConfidence[analysis.confidence]++;
      } else if (analysis.category === 'partiallySupported') {
        results.partiallySupported++;
        results.byConfidence[analysis.confidence]++;
      }
    } else {
      results.notSupported++;
    }

    // 按类别统计
    const category = bug.analysis?.category || '未知';
    if (!results.byCategory[category]) {
      results.byCategory[category] = { total: 0, aiFixable: 0 };
    }
    results.byCategory[category].total++;
    if (analysis.canAIFix) {
      results.byCategory[category].aiFixable++;
    }

    results.bugs.push({
      id: bug.id,
      title: bug.title,
      category: bug.analysis?.category || '未知',
      riskLevel: bug.analysis?.riskLevel || 'unknown',
      aiFix: analysis
    });
  }

  return results;
}

/**
 * 主函数
 */
async function main() {
  const bugsFile = path.join(__dirname, '../reports/bugs-cache.json');

  if (!fs.existsSync(bugsFile)) {
    console.error('Bug缓存文件不存在，请先运行: node main.mjs query "查询URL" --save-bugs');
    process.exit(1);
  }

  const bugs = JSON.parse(fs.readFileSync(bugsFile, 'utf-8'));
  console.log(`\n分析 ${bugs.length} 个Bug的AI修复能力...\n`);

  const results = analyzeBugsForAIFix(bugs);

  // 生成报告
  console.log('═'.repeat(70));
  console.log('AI修复能力分析报告');
  console.log('═'.repeat(70));

  console.log(`\n📊 总体统计`);
  console.log('─'.repeat(70));
  console.log(`总Bug数: ${results.total}`);
  console.log(`✅ 可AI修复: ${results.fullySupported + results.partiallySupported} (${((results.fullySupported + results.partiallySupported) / results.total * 100).toFixed(1)}%)`);
  console.log(`  └─ 完全支持: ${results.fullySupported} (${(results.fullySupported / results.total * 100).toFixed(1)}%)`);
  console.log(`  └─ 部分支持: ${results.partiallySupported} (${(results.partiallySupported / results.total * 100).toFixed(1)}%)`);
  console.log(`❌ 不支持: ${results.notSupported} (${(results.notSupported / results.total * 100).toFixed(1)}%)`);

  console.log(`\n📈 按类别分组`);
  console.log('─'.repeat(70));
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const percentage = (stats.aiFixable / stats.total * 100).toFixed(1);
    const icon = stats.aiFixable > 0 ? '✅' : '❌';
    console.log(`${icon} ${category.padEnd(15)} ${stats.aiFixable}/${stats.total} (${percentage}%)`);
  }

  console.log(`\n🎯 修复置信度`);
  console.log('─'.repeat(70));
  console.log(`高置信度: ${results.byConfidence.high} (可直接AI修复)`);
  console.log(`中置信度: ${results.byConfidence.medium} (AI修复+人工验证)`);
  console.log(`低置信度: ${results.byConfidence.low} (AI辅助+人工主导)`);

  console.log(`\n🚀 可AI修复的Bug列表`);
  console.log('─'.repeat(70));

  const fixableBugs = results.bugs.filter(b => b.aiFix.canAIFix);
  const highConfidence = fixableBugs.filter(b => b.aiFix.confidence === 'high');
  const mediumConfidence = fixableBugs.filter(b => b.aiFix.confidence === 'medium');
  const lowConfidence = fixableBugs.filter(b => b.aiFix.confidence === 'low');

  console.log(`\n【高置信度 - 可直接AI修复】(${highConfidence.length}个)`);
  for (const bug of highConfidence.slice(0, 20)) {
    console.log(`  [${bug.id}] ${bug.title.substring(0, 50)}...`);
    console.log(`    类别: ${bug.category} | 原因: ${bug.aiFix.reason}`);
  }
  if (highConfidence.length > 20) {
    console.log(`  ... 还有 ${highConfidence.length - 20} 个`);
  }

  console.log(`\n【中置信度 - AI修复+人工验证】(${mediumConfidence.length}个)`);
  for (const bug of mediumConfidence.slice(0, 10)) {
    console.log(`  [${bug.id}] ${bug.title.substring(0, 50)}...`);
  }
  if (mediumConfidence.length > 10) {
    console.log(`  ... 还有 ${mediumConfidence.length - 10} 个`);
  }

  console.log(`\n【低置信度 - AI辅助+人工主导】(${lowConfidence.length}个)`);
  for (const bug of lowConfidence.slice(0, 10)) {
    console.log(`  [${bug.id}] ${bug.title.substring(0, 50)}...`);
  }
  if (lowConfidence.length > 10) {
    console.log(`  ... 还有 ${lowConfidence.length - 10} 个`);
  }

  console.log(`\n⏱️  修复时间估算`);
  console.log('─'.repeat(70));
  const avgTimePerBug = 2; // 小时
  const aiFixTime = avgTimePerBug * 0.1; // AI修复只需要10%时间
  const manualTime = avgTimePerBug;
  console.log(`传统人工修复: ${results.total * manualTime} 小时`);
  console.log(`AI辅助修复: ${highConfidence.length * aiFixTime + mediumConfidence.length * aiFixTime * 2 + lowConfidence.length * manualTime} 小时`);
  console.log(`节省时间: ${((results.total * manualTime - (highConfidence.length * aiFixTime + mediumConfidence.length * aiFixTime * 2 + lowConfidence.length * manualTime)) / results.total * manualTime * 100).toFixed(1)}%`);

  console.log(`\n💾 详细分析结果已保存`);
  const outputFile = path.join(__dirname, '../reports/ai-fix-analysis.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`  ${outputFile}`);

  console.log('\n' + '═'.repeat(70));
}

main().catch(error => {
  console.error('分析失败:', error);
  process.exit(1);
});
