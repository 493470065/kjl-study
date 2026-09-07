#!/usr/bin/env node
/**
 * 测试用例生成器 - 基于 TFS 需求ID
 *
 * 使用 skill 内置工具:
 * - tfs2018-integration/tfs-query.mjs: 获取需求信息
 * - winning-testcase-generator/tools/testcase-generator.mjs: 生成用例
 * - winning-testcase-generator/tools/excel-exporter.mjs: 导出Excel
 *
 * 用法: node generate-by-id.mjs <需求ID>
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 工具路径
const TFS_TOOLS_DIR = path.resolve(__dirname, '../tfs2018-integration/tools');

// 导入生成器和导出器
import { TestCaseGenerator } from './tools/testcase-generator.mjs';
import { ExcelExporter } from './tools/excel-exporter.mjs';

/**
 * 解析 tfs-query.mjs 输出获取需求信息
 */
function parseTFSOutput(output) {
  // 查找包含 "[数字]" 的行
  const titleLine = output.split('\n').find(l => /^\[\d+\]/.test(l.trim()));

  if (!titleLine) {
    return {
      id: 0,
      title: '未知',
      workItemType: 'Feature',
      state: '未知',
      project: '',
      description: output
    };
  }

  // 解析标题: [1463441] 预约查询列表和导出excel增加支付方式
  const titleMatch = titleLine.trim().match(/^\[(\d+)\] (.+)/);
  const id = titleMatch ? parseInt(titleMatch[1]) : 0;
  const title = titleMatch ? titleMatch[2] : titleLine.replace(/^\[\d+\]\s*/, '').trim();

  // 解析类型、状态等: 类型: 需求 | 状态: 活动
  const infoLine = output.split('\n').find(l => l.includes('类型:'));
  const typeMatch = infoLine?.match(/类型: (\S+)/);
  const stateMatch = infoLine?.match(/状态: (\S+)/);
  const projectMatch = infoLine?.match(/项目: (\S+)/);

  return {
    id,
    title,
    workItemType: mapTypeToWorkItemType(typeMatch?.[1] || '需求'),
    state: stateMatch?.[1] || '未知',
    project: projectMatch?.[1] || '',
    description: output
  };
}

function mapTypeToWorkItemType(type) {
  const map = {
    '需求': 'Feature',
    'User Story': 'User Story',
    'Bug': 'Bug',
    'Task': 'Task'
  };
  return map[type] || 'Feature';
}

async function main() {
  const args = process.argv.slice(2);
  const id = args[0];

  if (!id) {
    console.error('用法: node generate-by-id.mjs <需求ID>');
    console.error('示例: node generate-by-id.mjs 1463441');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('测试用例生成器 - 基于 TFS 需求ID');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: 使用 tfs-query.mjs 获取需求信息
    console.log('[Step 1/3] 使用 tfs-query.mjs 获取需求信息...');
    const tfsOutput = execSync(`node tfs-query.mjs get ${id}`, {
      encoding: 'utf-8',
      cwd: TFS_TOOLS_DIR
    });
    const requirement = parseTFSOutput(tfsOutput);
    console.log(`  编号: ${requirement.id}`);
    console.log(`  标题: ${requirement.title}`);
    console.log(`  类型: ${requirement.workItemType}`);
    console.log(`  状态: ${requirement.state}`);
    console.log();

    // Step 2: 使用 testcase-generator.mjs 生成用例
    console.log('[Step 2/3] 使用 testcase-generator.mjs 生成测试用例...');
    const generator = new TestCaseGenerator();
    const testCases = generator.generate(requirement);

    // 统计用例
    const priorityCount = { P0: 0, P1: 0, P2: 0 };
    testCases.forEach(tc => {
      if (priorityCount[tc.priority] !== undefined) {
        priorityCount[tc.priority]++;
      }
    });
    console.log(`  生成用例: ${testCases.length} 条`);
    console.log(`    - P0 (核心): ${priorityCount.P0} 条`);
    console.log(`    - P1 (重要): ${priorityCount.P1} 条`);
    console.log(`    - P2 (可选): ${priorityCount.P2} 条`);
    console.log();

    // Step 3: 使用 excel-exporter.mjs 导出
    console.log('[Step 3/3] 使用 excel-exporter.mjs 导出Excel...');
    const exporter = new ExcelExporter();
    const result = await exporter.export(testCases, requirement);

    console.log();
    console.log('='.repeat(60));
    console.log('完成!');
    console.log(`  文件: ${result.path}`);
    console.log(`  用例: ${result.count} 条`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n错误:', error.message);
    process.exit(1);
  }
}

main();
