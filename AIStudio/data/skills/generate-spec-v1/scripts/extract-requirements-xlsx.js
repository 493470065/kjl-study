#!/usr/bin/env node

/**
 * extract-requirements-xlsx.js
 *
 * 从历史需求 Excel 文件提取结构化 JSON 数据。
 *
 * 用法：
 *   node extract-requirements-xlsx.js <xlsx文件路径> [选项]
 *
 * 选项：
 *   --sheet <名称>     指定工作表名称（默认读取第一个工作表）
 *   --module <名称>    按模块名称过滤（如 "13 病案首页"）
 *   --output <路径>    输出 JSON 文件路径（默认输出到 stdout）
 *   --headers          将第一行作为表头，输出 key-value 对象（默认输出数组）
 *
 * 依赖：
 *   npm install xlsx
 *
 * 示例：
 *   # 提取全部数据，输出到 stdout
 *   node extract-requirements-xlsx.js "./历史需求.xlsx"
 *
 *   # 按模块过滤，输出到文件
 *   node extract-requirements-xlsx.js "./历史需求.xlsx" --module "13 病案首页" --output "./requirements.json"
 *
 *   # 指定工作表
 *   node extract-requirements-xlsx.js "./历史需求.xlsx" --sheet "Sheet2"
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 命令行参数解析
// ============================================================

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    } else if (argv[i].startsWith('-')) {
      const key = argv[i].slice(1);
      const val = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true;
      args[key] = val;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const args = parseArgs(process.argv);

  // 检查输入文件
  const inputPath = args._[0];
  if (!inputPath) {
    console.error('错误：请指定 xlsx 文件路径');
    console.error('用法：node extract-requirements-xlsx.js <xlsx文件路径> [选项]');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`错误：文件不存在 "${inputPath}"`);
    process.exit(1);
  }

  // 加载 xlsx 库
  let XLSX;
  try {
    XLSX = require('xlsx');
  } catch (e) {
    console.error('错误：未找到 xlsx 包，请先安装：');
    console.error('  npm install xlsx');
    console.error('或：');
    console.error('  mkdir _tmp && cd _tmp && npm init -y && npm install xlsx');
    console.error('  node ../scripts/extract-requirements-xlsx.js ...');
    process.exit(1);
  }

  // 读取工作簿
  console.error(`读取文件: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);

  // 选择工作表
  const sheetName = args.sheet || workbook.SheetNames[0];
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`错误：未找到工作表 "${sheetName}"`);
    console.error(`可用工作表: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
  }
  console.error(`工作表: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];

  // 转换为 JSON
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.error(`总行数: ${rawData.length}`);

  if (rawData.length === 0) {
    console.error('警告：工作表为空');
    console.log('[]');
    process.exit(0);
  }

  // 标准化列名（trim + 去换行）
  const normalizedData = rawData.map(row => {
    const normalized = {};
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().replace(/\n/g, '').replace(/\r/g, '');
      let value = row[key];
      if (typeof value === 'string') {
        value = value.trim();
      }
      normalized[cleanKey] = value;
    }
    return normalized;
  });

  // 模块过滤
  let filteredData = normalizedData;
  if (args.module) {
    const moduleFilter = args.module;
    // 查找可能的模块列名
    const moduleKey = Object.keys(normalizedData[0]).find(
      k => k.includes('模块') || k === 'module'
    );

    if (moduleKey) {
      filteredData = normalizedData.filter(row => {
        const val = String(row[moduleKey] || '');
        return val.includes(moduleFilter);
      });
      console.error(`模块过滤 "${moduleFilter}"：${filteredData.length} 行（过滤前 ${normalizedData.length} 行）`);
    } else {
      console.error(`警告：未找到模块名称列，跳过过滤。可用列: ${Object.keys(normalizedData[0]).join(', ')}`);
    }
  }

  // 输出关键列统计
  const columns = Object.keys(filteredData[0] || {});
  console.error(`列数: ${columns.length}`);
  console.error(`列名: ${columns.join(' | ')}`);

  // 统计非空行
  const keyColumns = columns.filter(c =>
    c.includes('需求') || c.includes('标题') || c.includes('分析') || c.includes('模块')
  );
  if (keyColumns.length > 0) {
    const nonEmptyCount = filteredData.filter(row =>
      keyColumns.some(c => String(row[c] || '').trim().length > 0)
    ).length;
    console.error(`有效行数（关键列非空）: ${nonEmptyCount}`);
  }

  // 输出 JSON
  const output = JSON.stringify(filteredData, null, 2);

  if (args.output) {
    fs.writeFileSync(args.output, output, 'utf-8');
    console.error(`输出文件: ${args.output}`);
  } else {
    console.log(output);
  }
}

main();
