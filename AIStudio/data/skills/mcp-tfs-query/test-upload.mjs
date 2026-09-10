#!/usr/bin/env node
/**
 * 测试附件上传功能
 */

import TFSClient from './tfs-client.mjs';

const tfsClient = new TFSClient();

// 请替换为实际的工作项ID和文件路径
const WORK_ITEM_ID = process.argv[2] || '12345';
const FILE_PATH = process.argv[3];

async function test() {
  console.log(`\n测试上传附件到工作项 ${WORK_ITEM_ID}...\n`);

  try {
    // 1. 获取工作项信息
    console.log('1. 获取工作项信息...');
    const workItem = await tfsClient.getWorkItem(WORK_ITEM_ID);
    console.log(`   标题: ${workItem.fields['System.Title']}`);
    console.log(`   状态: ${workItem.fields['System.State']}`);

    // 2. 列出现有附件
    console.log('\n2. 列出现有附件...');
    const attachments = tfsClient.getAttachments(workItem);
    console.log(`   当前附件数量: ${attachments.length}`);

    if (!FILE_PATH) {
      console.log('\n   请提供要上传的文件路径作为第二个参数');
      console.log('   用法: node test-upload.mjs <工作项ID> <文件路径>');
      return;
    }

    // 3. 上传附件
    console.log(`\n3. 上传文件: ${FILE_PATH}`);
    const result = await tfsClient.uploadAttachment(
      WORK_ITEM_ID,
      FILE_PATH,
      null,
      '通过 MCP 上传'
    );

    console.log(`   ${result.message}`);
    console.log(`   附件URL: ${result.attachmentUrl.substring(0, 80)}...`);

    // 4. 再次列出附件
    console.log('\n4. 验证上传结果...');
    const updatedWorkItem = await tfsClient.getWorkItem(WORK_ITEM_ID);
    const updatedAttachments = tfsClient.getAttachments(updatedWorkItem);
    console.log(`   更新后附件数量: ${updatedAttachments.length}`);

  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    console.error(error.stack);
  }
}

test();
