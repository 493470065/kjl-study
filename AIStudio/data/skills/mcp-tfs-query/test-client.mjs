#!/usr/bin/env node
/**
 * 测试脚本 - 验证 TFS 客户端功能
 */

import TFSClient from './tfs-client.mjs';

async function test() {
  console.log('🧪 开始测试 TFS 客户端...\n');

  const client = new TFSClient();

  try {
    // 测试1: 查询单个工作项
    console.log('📝 测试1: 查询单个工作项 1356193');
    const workItem = await client.getWorkItem(1356193);
    const formatted = client.formatWorkItem(workItem);
    console.log(JSON.stringify(formatted, null, 2));
    console.log('\n✅ 测试1通过\n');

    // 测试2: 列出所有项目
    console.log('📁 测试2: 列出所有项目');
    const projects = client.getProjects();
    console.log(`找到 ${projects.length} 个项目:`);
    projects.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name}`);
    });
    console.log('  ...');
    console.log('\n✅ 测试2通过\n');

    // 测试3: 批量查询
    console.log('📋 测试3: 批量查询工作项');
    const workItems = await client.getWorkItems([1356193]);
    console.log(`查找到 ${workItems.length} 个工作项`);
    console.log('\n✅ 测试3通过\n');

    console.log('🎉 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

test();
