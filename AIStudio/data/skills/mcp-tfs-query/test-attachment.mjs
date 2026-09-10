#!/usr/bin/env node
/**
 * 测试附件下载功能
 */

import TFSClient from './tfs-client.mjs';

const tfsClient = new TFSClient();

// 请替换为实际的工作项ID
const WORK_ITEM_ID = process.argv[2] || '12345';

async function test() {
  console.log(`\n测试工作项 ${WORK_ITEM_ID} 的附件功能...\n`);

  try {
    // 1. 获取工作项信息
    console.log('1. 获取工作项信息...');
    const workItem = await tfsClient.getWorkItem(WORK_ITEM_ID);
    console.log(`   标题: ${workItem.fields['System.Title']}`);
    console.log(`   状态: ${workItem.fields['System.State']}`);

    // 2. 列出附件
    console.log('\n2. 列出附件...');
    const attachments = tfsClient.getAttachments(workItem);
    console.log(`   附件数量: ${attachments.length}`);
    attachments.forEach((att, i) => {
      console.log(`   [${i + 1}] ${att.name}`);
      console.log(`       URL: ${att.url.substring(0, 80)}...`);
    });

    if (attachments.length === 0) {
      console.log('\n   该工作项没有附件，请使用有附件的工作项ID测试');
      return;
    }

    // 3. 下载附件
    console.log('\n3. 开始下载附件到 PRD 目录...');
    const result = await tfsClient.downloadWorkItemAttachments(WORK_ITEM_ID);

    console.log(`   ${result.message}`);
    console.log(`   下载目录: ${result.downloadDir}`);
    console.log('\n   已下载文件:');
    result.downloaded.forEach(f => console.log(`     - ${f}`));

  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    console.error(error.stack);
  }
}

test();
