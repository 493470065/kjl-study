/**
 * 功能点健康度报告 HTML 生成器
 * 将 Markdown 报告转换为格式化的 HTML 报表
 */
const fs = require('fs');
const path = require('path');

const MD_FILE = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点健康度报告-20260820.md';
const HTML_FILE = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点健康度报告-20260820.html';

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const htmlParts = [];
  let inTable = false;
  let inTableHeader = false;
  let tableHtml = '';
  let listStack = [];
  let inCodeBlock = false;
  let codeBlockLang = '';

  function flushTable() {
    if (tableHtml) {
      htmlParts.push('<div class="table-wrapper">\n' + tableHtml + '</div>\n');
      tableHtml = '';
      inTable = false;
      inTableHeader = false;
    }
  }

  function closeList(level) {
    while (listStack.length > 0 && listStack[listStack.length - 1] >= level) {
      const tag = listStack.pop() > 0 ? 'ul' : 'ol';
      htmlParts.push(`</${tag}>\n`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // 代码块
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        htmlParts.push('</code></pre>\n');
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        flushTable();
        closeList(0);
        codeBlockLang = trimmed.slice(3).trim();
        htmlParts.push(`<pre><code class="language-${codeBlockLang}">`);
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      htmlParts.push(escapeHtml(line) + '\n');
      continue;
    }

    // 空行
    if (!trimmed) {
      flushTable();
      closeList(0);
      htmlParts.push('<br>\n');
      continue;
    }

    // 表格行
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // 分隔行
      if (/^\|[\s:-]+\|$/.test(trimmed)) {
        inTableHeader = false;
        continue;
      }

      if (!inTable) {
        flushTable();
        inTable = true;
        inTableHeader = true;
        tableHtml = '<table>\n';
      }

      const cells = trimmed.split('|').filter(c => c !== undefined).slice(1, -1);
      const tag = inTableHeader ? 'th' : 'td';
      tableHtml += '  <tr>\n';
      for (const cell of cells) {
        const content = cell.trim();
        // 处理健康等级图标
        let displayContent = content;
        if (content.includes('🔴')) displayContent = displayContent.replace('🔴', '<span class="health danger">🔴</span>');
        else if (content.includes('🟠')) displayContent = displayContent.replace('🟠', '<span class="health warning">🟠</span>');
        else if (content.includes('🟡')) displayContent = displayContent.replace('🟡', '<span class="health concern">🟡</span>');
        else if (content.includes('🟢')) displayContent = displayContent.replace('🟢', '<span class="health healthy">🟢</span>');

        // 数字对齐
        const align = /^\d+$/.test(content) || /^\d+\.\d+%?$/.test(content) ? ' class="num"' : '';
        tableHtml += `    <${tag}${align}>${displayContent}</${tag}>\n`;
      }
      tableHtml += '  </tr>\n';
      continue;
    }

    flushTable();

    // 标题
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      closeList(0);
      // 给章节标题加特殊样式
      const cls = level <= 2 ? ' class="section-title"' : '';
      htmlParts.push(`<h${level}${cls}>${processInline(text)}</h${level}>\n`);
      continue;
    }

    // 水平线
    if (/^---+\s*$/.test(trimmed)) {
      closeList(0);
      htmlParts.push('<hr>\n');
      continue;
    }

    // 引用
    if (trimmed.startsWith('>')) {
      closeList(0);
      const quote = trimmed.replace(/^>\s*/, '');
      htmlParts.push(`<blockquote>${processInline(quote)}</blockquote>\n`);
      continue;
    }

    // 无序列表
    const ulMatch = trimmed.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      const level = Math.floor(indent / 2) + 1;
      const content = ulMatch[2];
      closeList(level);
      if (listStack.length === 0 || listStack[listStack.length - 1] < level) {
        htmlParts.push('<ul>\n');
        listStack.push(level);
      }
      htmlParts.push(`  <li>${processInline(content)}</li>\n`);
      continue;
    }

    // 有序列表
    const olMatch = trimmed.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const level = Math.floor(indent / 2) + 1;
      const content = olMatch[2];
      closeList(level);
      if (listStack.length === 0 || listStack[listStack.length - 1] < level) {
        htmlParts.push('<ol>\n');
        listStack.push(level);
      } else {
        // 关闭之前的ul/ol，切换为ol
        closeList(level - 1);
        htmlParts.push('<ol>\n');
        listStack.push(level);
      }
      htmlParts.push(`  <li>${processInline(content)}</li>\n`);
      continue;
    }

    closeList(0);

    // 普通段落
    htmlParts.push(`<p>${processInline(trimmed)}</p>\n`);
  }

  flushTable();
  closeList(0);
  if (inCodeBlock) {
    htmlParts.push('</code></pre>\n');
  }

  return htmlParts.join('');
}

function processInline(text) {
  let result = escapeHtml(text);

  // 加粗 **text** 或 __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 斜体 *text* 或 _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // 行内代码 `code`
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');

  // 链接 [text](url)
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 健康等级图标已转义，还原
  result = result.replace(/&amp;#(?:x(?:[0-9a-fA-F]+)|[0-9]+);/g, (m) => {
    try {
      const code = m.startsWith('&#x') ? parseInt(m.slice(3, -1), 16) : parseInt(m.slice(2, -1), 10);
      return String.fromCodePoint(code);
    } catch (e) {
      return m;
    }
  });

  // 手动处理emoji
  const emojiMap = {
    '🔴': '<span class="health danger">🔴</span>',
    '🟠': '<span class="health warning">🟠</span>',
    '🟡': '<span class="health concern">🟡</span>',
    '🟢': '<span class="health healthy">🟢</span>',
    '🏥': '🏥',
    '🚑': '🚑',
    '🏪': '🏪',
    '⚠': '⚠️',
    '✅': '✅',
    '📁': '📁',
    '📝': '📝',
    '🔍': '🔍',
    '📡': '📡',
    '📦': '📦',
    '📚': '📚',
    '🗂': '🗂️',
  };

  for (const [emoji, replacement] of Object.entries(emojiMap)) {
    result = result.replace(new RegExp(emoji, 'g'), replacement);
  }

  return result;
}

// ============================================================
// 主流程
// ============================================================
console.log('📝 生成 HTML 报告...');

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
    --bg: #f8f9fa;
    --card-bg: #ffffff;
    --text: #1a1a2e;
    --text-secondary: #555;
    --border: #dee2e6;
    --danger: #e74c3c;
    --warning: #e67e22;
    --concern: #f1c40f;
    --healthy: #27ae60;
    --primary: #2c3e50;
    --accent: #3498db;
    --header-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 0;
  }

  .report-header {
    background: var(--header-bg);
    color: #fff;
    padding: 40px 20px;
    text-align: center;
  }
  .report-header h1 {
    font-size: 28px;
    margin-bottom: 8px;
    letter-spacing: 2px;
  }
  .report-header .meta {
    color: #aab;
    font-size: 14px;
    margin-top: 8px;
  }
  .report-header .meta span {
    display: inline-block;
    margin: 0 12px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin: 24px 0;
  }
  .stat-card {
    background: var(--card-bg);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
  }
  .stat-card .value {
    font-size: 32px;
    font-weight: 700;
    color: var(--primary);
  }
  .stat-card .label {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
  .stat-card.danger .value { color: var(--danger); }
  .stat-card.warning .value { color: var(--warning); }
  .stat-card.healthy .value { color: var(--healthy); }

  h2 { font-size: 22px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 3px solid var(--accent); }
  h2.section-title { font-size: 24px; margin-top: 40px; border-bottom-color: var(--primary); }
  h3 { font-size: 18px; margin: 24px 0 12px; color: var(--primary); }
  h4 { font-size: 16px; margin: 20px 0 10px; color: var(--text); }
  h5 { font-size: 15px; margin: 16px 0 8px; }

  .table-wrapper {
    overflow-x: auto;
    margin: 12px 0 20px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card-bg);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 600px;
  }
  th {
    background: #f0f2f5;
    font-weight: 600;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 2px solid var(--border);
    white-space: nowrap;
    position: sticky;
    top: 0;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  tr:hover td { background: #f8f9ff; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }

  .health.danger { color: var(--danger); }
  .health.warning { color: var(--warning); }
  .health.concern { color: var(--concern); }
  .health.healthy { color: var(--healthy); }

  blockquote {
    background: #f0f4ff;
    border-left: 4px solid var(--accent);
    padding: 10px 16px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    font-size: 13px;
    color: #444;
  }

  hr {
    border: none;
    border-top: 2px solid var(--border);
    margin: 32px 0;
  }

  p { margin: 8px 0; font-size: 14px; }
  strong { color: var(--primary); }
  code {
    background: #f0f0f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  pre code {
    display: block;
    padding: 12px 16px;
    overflow-x: auto;
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 8px;
  }

  ul, ol { margin: 8px 0 8px 24px; }
  li { margin: 4px 0; font-size: 14px; }

  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .report-footer {
    text-align: center;
    padding: 24px;
    color: var(--text-secondary);
    font-size: 13px;
    border-top: 1px solid var(--border);
    margin-top: 40px;
  }

  /* 治理建议卡片 */
  .gov-card {
    background: var(--card-bg);
    border-radius: 10px;
    padding: 16px 20px;
    margin: 12px 0;
    border-left: 4px solid var(--danger);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .gov-card.warning { border-left-color: var(--warning); }
  .gov-card.concern { border-left-color: var(--concern); }
  .gov-card.healthy { border-left-color: var(--healthy); }
  .gov-card .fp-code { font-weight: 600; color: var(--primary); }
  .gov-card .fp-name { color: var(--text); }
  .gov-card .fp-stats { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
  .gov-card .fp-reason { font-size: 13px; margin-top: 6px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; }

  @media print {
    .report-header { background: #1a1a2e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { background: #f0f2f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-size: 12px; }
    .table-wrapper { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }

  @media (max-width: 768px) {
    .container { padding: 12px; }
    .stats-bar { grid-template-columns: repeat(2, 1fr); }
    table { font-size: 12px; }
    th, td { padding: 6px 8px; }
  }
</style>
</head>
<body>

<div class="report-header">
  <h1>📊 功能点健康度报告</h1>
  <div class="meta">
    <span>📅 2026-08-20</span>
    <span>📊 数据来源: TFS 查询</span>
    <span>📋 总工作项: 3,718 项</span>
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

<script>
  // 表格行悬停高亮
  document.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('mouseenter', () => {
      tr.style.backgroundColor = '#f0f4ff';
    });
    tr.addEventListener('mouseleave', () => {
      tr.style.backgroundColor = '';
    });
  });
</script>
</body>
</html>`;

fs.writeFileSync(HTML_FILE, html, 'utf8');
console.log('✅ HTML 报告已保存到: ' + HTML_FILE);
console.log('   文件大小: ' + (fs.statSync(HTML_FILE).size / 1024).toFixed(1) + ' KB');