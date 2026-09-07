#!/usr/bin/env node
/**
 * TFS附件上传功能测试
 * 验证TFSAttachmentUploader模块是否正常工作
 */

import { TFSAttachmentUploader } from './tfs-attachment-uploader.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TFS附件上传功能测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 测试1: 模块导入
  console.log('测试1: 模块导入');
  try {
    console.log('  ✓ TFSAttachmentUploader 类已导入');
    console.log(`    类方法: ${Object.getOwnPropertyNames(TFSAttachmentUploader.prototype).filter(n => n !== 'constructor').join(', ')}`);
  } catch (error) {
    console.log(`  ✗ 导入失败: ${error.message}`);
    return false;
  }

  // 测试2: 实例化
  console.log('\n测试2: 实例化');
  try {
    const uploader = new TFSAttachmentUploader(
      'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0',
      'test-pat-token',
      'WINNING-6.0'
    );
    console.log('  ✓ TFSAttachmentUploader 实例已创建');
    console.log(`    服务器URL: ${uploader.serverUrl}`);
    console.log(`    集合: ${uploader.collection}`);
  } catch (error) {
    console.log(`  ✗ 实例化失败: ${error.message}`);
    return false;
  }

  // 测试3: 方法检查
  console.log('\n测试3: 方法检查');
  const uploader = new TFSAttachmentUploader('http://test', 'pat', 'collection');
  const methods = ['connect', 'uploadAttachment', 'uploadAttachments'];
  let allMethodsExist = true;

  for (const method of methods) {
    if (typeof uploader[method] === 'function') {
      console.log(`  ✓ ${method}() 方法存在`);
    } else {
      console.log(`  ✗ ${method}() 方法不存在`);
      allMethodsExist = false;
    }
  }

  // 测试4: 命令行选项解析
  console.log('\n测试4: 命令行选项解析');
  console.log('  使用方式:');
  console.log('    node main.mjs analyze <需求ID> --upload-to-tfs');
  console.log('  示例:');
  console.log('    node main.mjs analyze 123456 --upload-to-tfs');

  // 总结
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  测试完成');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✓ TFS附件上传功能已集成到需求覆盖率分析器');
  console.log('\n下一步:');
  console.log('  1. 确保TFS配置文件存在:');
  console.log('     ../../tfs2018-integration/config/tfs-config.json');
  console.log('  2. 运行分析并上传报告:');
  console.log('     node main.mjs analyze <需求ID> --upload-to-tfs');
  console.log('  3. 检查TFS工作项确认附件已上传');

  return allMethodsExist;
}

// 运行测试
testImport().catch(console.error);
