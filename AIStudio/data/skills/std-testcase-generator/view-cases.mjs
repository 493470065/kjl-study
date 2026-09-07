#!/usr/bin/env node
/**
 * 查看测试用例内容
 */
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filePath = 'D:/workspace/workspace-vibe-coding/claude/autotest/testcase/1445554-testcase_20260203_072123.xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('测试用例');

  console.log('测试用例列表：\n');
  sheet.eachRow({ min: 3 }, (row) => {
    const id = String(row.getCell(1).value).padEnd(4);
    const name = row.getCell(2).value || '';
    const priority = row.getCell(6).value;
    console.log(`[${id}] ${priority} ${name}`);
  });
}

main().catch(console.error);
