#!/usr/bin/env node
/**
 * 功能集成验证脚本
 * 快速验证所有集成的功能是否正常工作
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyIntegration() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  需求覆盖率分析器 - 功能集成验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    passed: 0,
    failed: 0,
    checks: []
  };

  function check(name, passed, details = '') {
    results.checks.push({ name, passed, details });
    if (passed) {
      results.passed++;
      console.log(`  ✓ ${name}`);
    } else {
      results.failed++;
      console.log(`  ✗ ${name}`);
      if (details) console.log(`    ${details}`);
    }
  }

  // 1. 检查增强模块
  console.log('1. SKILL追踪增强模块');
  try {
    const enhancementPath = path.join(__dirname, 'skill-tracking-enhancement.mjs');
    await fs.access(enhancementPath);
    check('增强模块文件存在', true);

    const { generateMarkedReportFilename, generateTrackingMetadata, generateTrackingReportBlock } = await import('./skill-tracking-enhancement.mjs');

    // 测试文件名生成
    const filename = generateMarkedReportFilename(123456, new Date(), { overall: 75 });
    check('文件名生成函数', filename.includes('requirement-coverage-analysis-123456-score75'));

    // 测试元数据生成
    const metadata = generateTrackingMetadata({ requirementId: 123456, score: 75 });
    check('元数据生成函数', metadata.includes('SKILL-TRACKING-METADATA'));

    // 测试追踪块生成
    const block = generateTrackingReportBlock({ requirementId: 123456, score: 75 });
    check('追踪块生成函数', block.includes('SKILL使用追踪信息'));
  } catch (error) {
    check('增强模块', false, error.message);
  }

  // 2. 检查TFS附件上传器
  console.log('\n2. TFS附件上传器');
  try {
    const uploaderPath = path.join(__dirname, 'tfs-attachment-uploader.mjs');
    await fs.access(uploaderPath);
    check('上传器文件存在', true);

    const { TFSAttachmentUploader } = await import('./tfs-attachment-uploader.mjs');
    const uploader = new TFSAttachmentUploader('http://test', 'pat', 'collection');

    check('上传器类实例化', true);
    check('connect方法存在', typeof uploader.connect === 'function');
    check('uploadAttachment方法存在', typeof uploader.uploadAttachment === 'function');
  } catch (error) {
    check('TFS附件上传器', false, error.message);
  }

  // 3. 检查主入口集成
  console.log('\n3. 主入口集成');
  try {
    const mainPath = path.join(__dirname, 'main.mjs');
    const mainContent = await fs.readFile(mainPath, 'utf-8');

    check('main.mjs导入追踪增强', mainContent.includes("printSkillTrackingHintWithTFS"));
    check('main.mjs导入TFS上传器', mainContent.includes("TFSAttachmentUploader"));
    check('main.mjs支持--upload-to-tfs', mainContent.includes("uploadToTfs"));
    check('main.mjs有上传逻辑', mainContent.includes("uploadToTfs") && mainContent.includes("uploadAttachment"));
  } catch (error) {
    check('主入口集成', false, error.message);
  }

  // 4. 检查报告生成器集成
  console.log('\n4. 报告生成器集成');
  try {
    const reportGenPath = path.join(__dirname, 'report-generator.mjs');
    const reportGenContent = await fs.readFile(reportGenPath, 'utf-8');

    check('report-generator.mjs导入增强', reportGenContent.includes("generateMarkedReportFilename"));
    check('使用标记文件名', reportGenContent.includes("generateMarkedReportFilename("));
    check('添加元数据', reportGenContent.includes("generateTrackingMetadata("));
    check('添加追踪块', reportGenContent.includes("generateTrackingReportBlock("));
  } catch (error) {
    check('报告生成器集成', false, error.message);
  }

  // 5. 检查依赖
  console.log('\n5. 依赖检查');
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    check('azure-devops-node-api依赖', !!packageJson.dependencies['azure-devops-node-api']);
    check('依赖已安装', await fs.access(path.join(__dirname, '../node_modules/azure-devops-node-api')).then(() => true).catch(() => false));
  } catch (error) {
    check('依赖检查', false, error.message);
  }

  // 6. 检查文档
  console.log('\n6. 文档检查');
  try {
    const docsPath = path.join(__dirname, '..');
    const docs = [
      'SKILL_TRACKING_QUICKSTART.md',
      'demo-tracking-report.md',
      'TFS_ATTACHMENT_FEATURE.md',
      'INTEGRATION_COMPLETE.md'
    ];

    for (const doc of docs) {
      const exists = await fs.access(path.join(docsPath, doc)).then(() => true).catch(() => false);
      check(`文档: ${doc}`, exists);
    }
  } catch (error) {
    check('文档检查', false, error.message);
  }

  // 总结
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  验证结果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n总计: ${results.checks.length} 项检查`);
  console.log(`通过: ${results.passed} 项`);
  console.log(`失败: ${results.failed} 项`);

  if (results.failed === 0) {
    console.log('\n✅ 所有功能集成验证通过！');
    console.log('\n下一步:');
    console.log('  1. 运行分析测试: node main.mjs analyze <需求ID>');
    console.log('  2. 测试TFS上传: node main.mjs analyze <需求ID> --upload-to-tfs');
    console.log('  3. 验证追踪器: cd ../skill-usage-tracker && node tools/main.mjs stats');
  } else {
    console.log('\n⚠️  部分检查失败，请查看详细信息');
  }

  return results.failed === 0;
}

// 运行验证
verifyIntegration().catch(console.error);
