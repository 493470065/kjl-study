#!/usr/bin/env node
/**
 * 需求覆盖率分析器 - SKILL追踪增强快速应用脚本
 *
 * 使用方法:
 *   node apply-skill-tracking-enhancement.mjs
 *
 * 本脚本会自动修改 report-generator.mjs 和 main.mjs，
 * 添加SKILL统计特征标记功能。
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 应用补丁到文件
 */
async function applyPatch(filePath, patches) {
  console.log(`  处理文件: ${path.basename(filePath)}`);

  let content = await fs.readFile(filePath, 'utf-8');
  let modified = false;

  for (const patch of patches) {
    if (content.includes(patch.search)) {
      console.log(`    ✓ 已存在: ${patch.description}`);
      continue;
    }

    if (!content.includes(patch.before)) {
      console.log(`    ⚠ 未找到: ${patch.description}`);
      console.log(`      查找: ${patch.before.substring(0, 50)}...`);
      continue;
    }

    content = content.replace(patch.before, patch.after);
    console.log(`    ✏ 已应用: ${patch.description}`);
    modified = true;
  }

  if (modified) {
    // 备份原文件
    const backupPath = filePath + '.backup';
    await fs.writeFile(backupPath, await fs.readFile(filePath, 'utf-8'), 'utf-8');
    console.log(`    📦 备份: ${path.basename(backupPath)}`);

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`    💾 保存: ${path.basename(filePath)}`);
  }

  return modified;
}

/**
 * 主函数
 */
async function main() {
  console.log('\n━'.repeat(60));
  console.log('  需求覆盖率分析器 - SKILL追踪增强应用工具');
  console.log('━'.repeat(60));
  console.log();

  const toolsDir = path.join(__dirname, 'tools');
  const reportGeneratorPath = path.join(toolsDir, 'report-generator.mjs');
  const mainPath = path.join(toolsDir, 'main.mjs');

  // 检查增强模块是否存在
  const enhancementPath = path.join(toolsDir, 'skill-tracking-enhancement.mjs');
  try {
    await fs.access(enhancementPath);
    console.log('✓ 增强模块已就位');
  } catch {
    console.error('✗ 增强模块不存在，请先创建 skill-tracking-enhancement.mjs');
    console.error(`  路径: ${enhancementPath}`);
    process.exit(1);
  }

  console.log();

  // 补丁1: report-generator.mjs - 导入增强模块
  console.log('应用补丁到 report-generator.mjs...');
  const reportGeneratorPatches = [
    {
      description: '导入增强模块',
      search: "import { generateMarkedReportFilename }",
      before: "import fs from 'fs/promises';\nimport path from 'path';\nimport { fileURLToPath } from 'url';",
      after: "import fs from 'fs/promises';\nimport path from 'path';\nimport { fileURLToPath } from 'url';\nimport {\n  generateMarkedReportFilename,\n  generateTrackingMetadata,\n  generateTrackingReportBlock\n} from './skill-tracking-enhancement.mjs';"
    },
    {
      description: '使用带标记的文件名',
      search: "generateMarkedReportFilename",
      before: /const reportPath = path\.join\(\s*reportsDir,\s*`requirement-coverage-\$\{data\.requirementId\}-\$\{timestamp\}\.md`\s*\);/,
      after: `const reportPath = path.join(
    reportsDir,
    generateMarkedReportFilename(data.requirementId, now, data.score)
  );`
    },
    {
      description: '添加SKILL追踪元数据',
      search: "generateTrackingMetadata",
      before: /function buildMarkdownContent\(data\) \{\s*const sections = \[\];\s*$/,
      after: `function buildMarkdownContent(data) {
  const sections = [];

  // 添加SKILL追踪元数据
  sections.push(generateTrackingMetadata(data));

`
    },
    {
      description: '添加SKILL追踪信息块',
      search: "generateTrackingReportBlock",
      before: /(\s*sections\.push\('---'\);\s*return sections\.join\('\\n'\);)/,
      after: `$1

  // 添加SKILL追踪信息块
  sections.push(generateTrackingReportBlock(data));`
    }
  ];

  const reportModified = await applyPatch(reportGeneratorPath, reportGeneratorPatches);

  console.log();

  // 补丁2: main.mjs - 添加追踪提示输出
  console.log('应用补丁到 main.mjs...');
  const mainPatches = [
    {
      description: '导入追踪提示模块',
      search: "printSkillTrackingHintWithTFS",
      before: "import { generateMarkdownReport } from './report-generator.mjs';",
      after: "import { generateMarkdownReport } from './report-generator.mjs';\nimport { printSkillTrackingHintWithTFS } from './skill-tracking-enhancement.mjs';"
    },
    {
      description: '添加追踪提示输出',
      search: "printSkillTrackingHintWithTFS",
      before: /try \{\s*const reportPath = await generateMarkdownReport\(result, config\);\s*console\.log\(`\\n报告已保存: \$\{reportPath\}`\);\s*\} catch/,
      after: `try {
    const reportPath = await generateMarkdownReport(result, config);
    console.log(\`\\n报告已保存: \${reportPath}\`);

    // 添加SKILL追踪提示
    printSkillTrackingHintWithTFS(result, reportPath);
  } catch`
    }
  ];

  const mainModified = await applyPatch(mainPath, mainPatches);

  console.log();
  console.log('━'.repeat(60));

  if (reportModified || mainModified) {
    console.log('  ✅ SKILL追踪增强应用成功！');
    console.log();
    console.log('下一步:');
    console.log('  1. 测试生成报告:');
    console.log('     node tools/main.mjs analyze 123456');
    console.log();
    console.log('  2. 检查生成的报告文件名和内容');
    console.log('  3. 运行追踪器测试:');
    console.log('     cd ../../skill-usage-tracker && node tools/test.mjs');
    console.log();
    console.log('如需回退，已生成备份文件 (*.backup)');
  } else {
    console.log('  ℹ 所有补丁已应用，无需重复操作');
  }

  console.log('━'.repeat(60));
  console.log();
}

// 运行主函数
main().catch(error => {
  console.error('错误:', error.message);
  process.exit(1);
});
