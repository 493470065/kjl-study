/**
 * 功能点健康度报告 HTML 生成器 v2
 * 将 Markdown 报告转换为格式化的 HTML 报表
 * 修复：表格分隔行过滤、行内处理、表格结构
 */
const fs = require('fs');
const path = require('path');

const MD_FILE = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点健康度报告-20260820.md';
const HTML_FILE = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点健康度报告-20260820.html';

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 判断一行是否为表格分隔行（只包含 | - : 空格）
function isTableSeparator(line) {
  const stripped = line.replace(/\|/g, '').trim();
  return stripped.length > 0 && /^[\s:-]+$/.test(stripped);
}

// 解析表格行 → 单元格数组
function parseTableRow(line) {
  const s = line.trim();
  if (!s.startsWith('|') || !s.endsWith('|')) return null;
  const inner = s.slice(1, -1);
  // 按 | 分割，保留空单元格
  const cells = [];
  let current = '';
  let inCell = false;
  for (const ch of inner) {
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      inCell = false;
    } else {
      current += ch;
      inCell = true;
    }
  }
  if (inCell || current) cells.push(current.trim());
  return cells;
}

// 行内 Markdown 处理（加粗、斜体、代码、链接、emoji）
function processInline(text) {
  let result = escapeHtml(text);

  // 加粗 **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 斜体 *text* （但不能匹配到加粗的 **）
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // 行内代码
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  // 链接
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 健康等级图标
  const healthIcons = {
    '🔴': '<span class="hl hl-danger">🔴</span>',
    '🟠': '<span class="hl hl-warning">🟠</span>',
    '🟡': '<span class="hl hl-concern">🟡</span>',
    '🟢': '<span class="hl hl-healthy">🟢</span>',
  };
  for (const [emoji, replacement] of Object.entries(healthIcons)) {
    result = result.replace(new RegExp(emoji, 'g'), replacement);
  }

  return result;
}

// 判断单元格是否为数字
function isNumericCell(text) {
  const t = text.trim();
  if (/^\d+$/.test(t)) return true;
  if (/^\d+\.\d+%?$/.test(t)) return true;
  if (/^\d+\/\d+$/.test(t)) return true;  // 如 349/74
  return false;
}

// ============================================================
// 主转换
// ============================================================
function mdToHtml(md) {
  const lines = md.split('\n');
  const parts = [];

  // 状态
  let inTable = false;
  let inTableHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行 → 刷新表格
    if (!trimmed) {
      if (inTable) {
        parts.push('</tbody>\n</table>\n</div>\n');
        inTable = false;
        inTableHeader = false;
      }
      continue;
    }

    // 检查是否为表格行
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // 分隔行 → 跳过
      if (isTableSeparator(trimmed)) {
        if (inTable) inTableHeader = false;
        continue;
      }

      const cells = parseTableRow(trimmed);
      if (!cells || cells.length === 0) {
        // 不是有效表格行，按普通段落处理
        if (inTable) {
          parts.push('</tbody>\n</table>\n</div>\n');
          inTable = false;
          inTableHeader = false;
        }
        parts.push(`<p>${processInline(trimmed)}</p>\n`);
        continue;
      }

      // 开始新表格
      if (!inTable) {
        parts.push('<div class="table-wrap">\n<table>\n<thead>\n');
        inTable = true;
        inTableHeader = true;
      }

      if (inTableHeader) {
        // 第一行数据行 → 表头
        parts.push('  <tr>\n');
        for (const cell of cells) {
          parts.push(`    <th>${processInline(cell)}</th>\n`);
        }
        parts.push('  </tr>\n');
        parts.push('</thead>\n<tbody>\n');
        inTableHeader = false;
      } else {
        // 数据行
        parts.push('  <tr>\n');
        for (const cell of cells) {
          const cls = isNumericCell(cell) ? ' class="num"' : '';
          parts.push(`    <td${cls}>${processInline(cell)}</td>\n`);
        }
        parts.push('  </tr>\n');
      }
      continue;
    }

    // 非表格行 → 刷新表格
    if (inTable) {
      parts.push('</tbody>\n</table>\n</div>\n');
      inTable = false;
      inTableHeader = false;
    }

    // 标题
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      parts.push(`<h${level}>${processInline(text)}</h${level}>\n`);
      continue;
    }

    // 水平线
    if (/^---+\s*$/.test(trimmed)) {
      parts.push('<hr>\n');
      continue;
    }

    // 引用
    if (trimmed.startsWith('>')) {
      const quote = trimmed.replace(/^>\s*/, '');
      parts.push(`<blockquote>${processInline(quote)}</blockquote>\n`);
      continue;
    }

    // 无序列表
    const ulMatch = trimmed.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      const content = ulMatch[2];
      parts.push(`<li>${processInline(content)}</li>\n`);
      continue;
    }

    // 有序列表
    const olMatch = trimmed.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      const content = olMatch[2];
      parts.push(`<li>${processInline(content)}</li>\n`);
      continue;
    }

    // 普通段落
    if (trimmed) {
      parts.push(`<p>${processInline(trimmed)}</p>\n`);
    }
  }

  // 关闭最后的表格
  if (inTable) {
    parts.push('</tbody>\n</table>\n</div>\n');
  }

  return parts.join('');
}

// ============================================================
// 主流程
// ============================================================
console.log('📝 生成 HTML 报告 v2...');

const md = fs.readFileSync(MD_FILE, 'utf8');
const bodyContent = mdToHtml(md);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>功能点健康度报告 - 2026-08-20</title>
<style>
  :root {
    --bg: #f5f6fa;
    --card-bg: #ffffff;
    --text: #1a1a2e;
    --text2: #555;
    --border: #d0d5dd;
    --danger: #e74c3c;
    --warning: #e67e22;
    --concern: #d4a017;
    --healthy: #27ae60;
    --primary: #2c3e50;
    --accent: #2b6cb0;
    --header-bg: linear-gradient(135deg, #1a1a2e, #16213e 60%, #0f3460);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    font-size: 14px;
  }

  /* 页头 */
  .report-header {
    background: var(--header-bg);
    color: #fff;
    padding: 36px 20px;
    text-align: center;
  }
  .report-header h1 { font-size: 26px; letter-spacing: 2px; }
  .report-header .meta { color: #aab; font-size: 13px; margin-top: 8px; }
  .report-header .meta span { display: inline-block; margin: 0 10px; }

  .container { max-width: 1280px; margin: 0 auto; padding: 20px; }

  /* 标题 */
  h2 {
    font-size: 20px; margin: 28px 0 12px; padding-bottom: 8px;
    border-bottom: 3px solid var(--accent); color: var(--primary);
  }
  h3 { font-size: 17px; margin: 20px 0 10px; color: var(--primary); }
  h4 { font-size: 15px; margin: 16px 0 8px; }
  h5 { font-size: 14px; margin: 12px 0 6px; }

  /* 表格 */
  .table-wrap {
    overflow-x: auto;
    margin: 10px 0 18px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card-bg);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 500px;
  }
  thead { background: #eef1f7; }
  th {
    padding: 9px 10px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border);
    white-space: nowrap;
    font-size: 12.5px;
    color: var(--primary);
  }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: top;
  }
  tbody tr:hover td { background: #f0f4ff; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }

  /* 健康等级 */
  .hl { font-size: 14px; }
  .hl-danger { color: var(--danger); font-weight: 600; }
  .hl-warning { color: var(--warning); font-weight: 600; }
  .hl-concern { color: var(--concern); font-weight: 600; }
  .hl-healthy { color: var(--healthy); font-weight: 600; }

  /* 引用 */
  blockquote {
    background: #edf2f9;
    border-left: 4px solid var(--accent);
    padding: 8px 14px;
    margin: 10px 0;
    border-radius: 0 6px 6px 0;
    font-size: 13px;
    color: #444;
  }

  hr { border: none; border-top: 2px solid var(--border); margin: 28px 0; }

  p { margin: 6px 0; }
  strong { color: var(--primary); }
  code {
    background: #eef0f5;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  li { margin: 3px 0; }

  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .report-footer {
    text-align: center; padding: 24px; color: var(--text2);
    font-size: 13px; border-top: 1px solid var(--border); margin-top: 40px;
  }

  @media print {
    .report-header { background: #1a1a2e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead { background: #eef1f7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-size: 12px; }
    .table-wrap { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }

  @media (max-width: 768px) {
    .container { padding: 12px; }
    table { font-size: 12px; }
    th, td { padding: 5px 6px; }
  }
</style>
</head>
<body>

<div class="report-header">
  <h1>📊 功能点健康度报告</h1>
  <div class="meta">
    <span>📅 2026-08-20</span>
    <span>📋 数据来源: TFS 查询</span>
    <span>📎 总工作项: 3,718 项</span>
  </div>
</div>

<div class="container">

${bodyContent}

<div class="report-footer">
  <p>📊 功能点健康度报告 | 由 consolidate-requirements-v1 增强版自动生成</p>
  <p>合并需求识别正则: <code>合并\\d{4,}|@1?\\d{6,}|（合并|合并多|合并代码|合代码|合并需求\\d|合并【\\d+】|克隆主数据|历史需求合并|至\\d{6}迭代|到\\d{6}迭代|至\\d{6}版本|至泰康\\d</code></p>
  <p>医院需求识别规则: CreatedBy 含 TfsInterface</p>
</div>

</div>

</body>
</html>`;

fs.writeFileSync(HTML_FILE, html, 'utf8');
console.log('✅ HTML 报告 v2 已保存到: ' + HTML_FILE);
console.log('   文件大小: ' + (fs.statSync(HTML_FILE).size / 1024).toFixed(1) + ' KB');