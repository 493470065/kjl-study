/**
 * Excel 导出器
 * 将测试用例导出为 Excel 格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 日期格式化
 */
function formatDate(date) {
  const o = {
    'YYYY': date.getFullYear(),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'DD': String(date.getDate()).padStart(2, '0'),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0')
  };
  return o;
}

/**
 * 加载配置
 */
function loadConfig() {
  const configPath = path.resolve(__dirname, '../config/testcase-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return null;
}

/**
 * Excel 导出器类
 */
export class ExcelExporter {
  constructor(config = null) {
    this.config = config || loadConfig();
    if (!this.config) {
      throw new Error('配置文件不存在: config/testcase-config.json');
    }
  }

  /**
   * 生成输出文件路径
   * @param {number} workItemId - 需求号
   */
  getOutputPath(workItemId) {
    const timestamp = formatDate(new Date());
    const tsStr = `${timestamp.YYYY}${timestamp.MM}${timestamp.DD}_${timestamp.HH}${timestamp.mm}${timestamp.ss}`;
    const fileName = this.config.output.fileNamePattern
      .replace('{workItemId}', workItemId)
      .replace('{timestamp}', tsStr);

    return path.resolve(this.config.output.basePath, fileName);
  }

  /**
   * 导出测试用例到 Excel
   * @param {Array} testCases - 测试用例数组
   * @param {object} requirementInfo - 需求信息
   */
  async export(testCases, requirementInfo) {
    const outputPath = this.getOutputPath(requirementInfo.id);
    const excelConfig = this.config.excel;

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(excelConfig.sheetName);

    // 设置列头
    worksheet.columns = excelConfig.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));

    // 设置表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    if (excelConfig.headerStyle.fill) {
      headerRow.fill = excelConfig.headerStyle.fill;
    }
    if (excelConfig.headerStyle.font) {
      headerRow.font = excelConfig.headerStyle.font;
    }

    // 添加测试用例
    testCases.forEach(tc => {
      worksheet.addRow({
        id: tc.id,
        name: tc.name,
        preCondition: tc.preCondition,
        steps: tc.steps,
        expected: tc.expected,
        priority: tc.priority
      });
    });

    // 设置优先级样式
    worksheet.eachRow({ min: 2 }, (row) => {
      const priority = row.getCell('priority').value;
      const color = excelConfig.priorityColors[priority];
      if (color) {
        row.getCell('priority').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        };
      }
    });

    // 添加需求信息摘要
    this.addSummary(worksheet, requirementInfo, testCases.length);

    // 冻结首行
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];

    await workbook.xlsx.writeFile(outputPath);

    return {
      path: outputPath,
      count: testCases.length
    };
  }

  /**
   * 添加需求信息摘要
   */
  addSummary(worksheet, requirementInfo, testCaseCount) {
    // 在Excel开头插入摘要信息
    worksheet.insertRow(1, []);
    worksheet.insertRow(1, []);

    // 标题信息
    const summaryRow1 = worksheet.getRow(1);
    summaryRow1.getCell(1).value = '需求信息';
    summaryRow1.getCell(1).font = { bold: true, size: 14 };

    const summaryRow2 = worksheet.getRow(2);
    summaryRow2.getCell(1).value = `需求编号: ${requirementInfo.id}`;
    summaryRow2.getCell(4).value = `用例总数: ${testCaseCount}`;
    summaryRow2.getCell(1).font = { bold: true };
    summaryRow2.getCell(4).font = { bold: true };
  }
}

export default ExcelExporter;
