#!/usr/bin/env node
/**
 * 测试用例生成器 - 命令行入口
 *
 * 用法:
 *   node generate.mjs --title "<需求标题>" [--type <类型>] [--output <输出路径>]
 *
 * 选项:
 *   --title, -t      需求标题（必需）
 *   --type, -y       需求类型: feature|bug|userstory (默认: feature)
 *   --output, -o     输出目录路径
 *   --help, -h       显示帮助信息
 *
 * 注意: TFS 需求信息需通过 tfs2018-integration skill 获取后传入
 */

import path from 'path';
import { fileURLToPath } from 'url';
import TestCaseGenerator from './testcase-generator.mjs';
import ExcelExporter from './excel-exporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: null,
    type: 'feature',
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--title' || arg === '-t') {
      options.title = args[++i];
    } else if (arg === '--type' || arg === '-y') {
      options.type = args[++i] || 'feature';
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg.startsWith('--')) {
      console.warn(`未知选项: ${arg}`);
    }
  }

  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
用法: node generate.mjs --title "<需求标题>" [options]

参数:
  --title, -t        需求标题（必需）

选项:
  --type, -y         需求类型: feature|bug|userstory (默认: feature)
  --output, -o       输出目录路径（默认从配置文件读取）
  --help, -h         显示此帮助信息

注意: TFS 需求信息需通过 tfs2018-integration skill 获取后传入

示例:
  node generate.mjs --title "预约查询增加支付方式"
  node generate.mjs -t "用户登录功能" -y feature
  node generate.mjs -t "修复XXX问题" -y bug -o ./testcase
`);
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs();

  if (!options.title) {
    console.error('错误: 请提供需求标题 (--title)');
    showHelp();
    process.exit(1);
  }

  // 构造需求对象
  const requirement = {
    id: 0, // 命令行模式不涉及具体需求号
    title: options.title,
    workItemType: mapTypeToWorkItemType(options.type),
    priority: 3
  };

  console.log('='.repeat(50));
  console.log('测试用例生成器');
  console.log('='.repeat(50));
  console.log(`需求标题: ${requirement.title}`);
  console.log(`需求类型: ${requirement.workItemType}`);

  try {
    // 1. 生成测试用例
    console.log('\n[1/2] 生成测试用例...');

    const generator = new TestCaseGenerator();
    const testCases = generator.generate(requirement);

    console.log(`生成测试用例: ${testCases.length} 条`);

    // 显示用例统计
    const priorityCount = { P0: 0, P1: 0, P2: 0 };
    testCases.forEach(tc => {
      if (priorityCount[tc.priority] !== undefined) {
        priorityCount[tc.priority]++;
      }
    });
    console.log(`  - P0 (核心): ${priorityCount.P0} 条`);
    console.log(`  - P1 (重要): ${priorityCount.P1} 条`);
    console.log(`  - P2 (可选): ${priorityCount.P2} 条`);

    // 2. 导出Excel
    console.log('\n[2/2] 导出Excel文件...');

    const exporter = new ExcelExporter();
    // 如果指定了输出路径，临时修改配置
    if (options.output) {
      const configPath = path.resolve(__dirname, 'config/testcase-config.json');
      const fs = await import('fs');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.output.basePath = options.output;
      exporter.config = config;
    }

    const result = await exporter.export(testCases, requirement);

    console.log(`输出路径: ${result.path}`);
    console.log(`用例数量: ${result.count}`);

    // 完成
    console.log('\n' + '='.repeat(50));
    console.log('测试用例生成成功！');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n错误:', error.message);
    process.exit(1);
  }
}

/**
 * 映射类型字符串到 TFS 工作项类型
 */
function mapTypeToWorkItemType(type) {
  const typeMap = {
    'feature': 'Feature',
    'bug': 'Bug',
    'userstory': 'User Story'
  };
  return typeMap[type.toLowerCase()] || 'Feature';
}

// 执行主函数
main();
