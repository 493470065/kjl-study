/**
 * 病历片区需求归集 HTML 生成器 v3
 * 新增：左侧导航树 + 锚点定位 + 滚动高亮
 */
const fs = require('fs');
const path = require('path');

const MD_DIR = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\';
// 注：HTML 看板输入源改为「病历新增需求归集-*.md」（consolidate.js 的输出），
// 与每日归集报告保持一致；原「功能点健康度报告-*.md」为 8/20 全量看板，已不再生成。
const MD_PREFIX = '病历新增需求归集-';

// 自动查找最新的 MD 报告文件
function findLatestMd() {
  const files = fs.readdirSync(MD_DIR).filter(f => f.startsWith(MD_PREFIX) && f.endsWith('.md'));
  if (files.length === 0) {
    console.error('❌ 未找到病历片区需求归集 MD 文件');
    process.exit(1);
  }
  files.sort((a, b) => b.localeCompare(a)); // 按文件名倒序（最新日期在前）
  return files[0];
}

const mdFileName = findLatestMd();
const dateStr = mdFileName.replace(MD_PREFIX, '').replace('.md', '');
const MD_FILE = path.join(MD_DIR, mdFileName);
const HTML_FILE = path.join(MD_DIR, `病历片区需求归集-${dateStr}.html`);

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isTableSeparator(line) {
  const stripped = line.replace(/\|/g, '').trim();
  return stripped.length > 0 && /^[\s:-]+$/.test(stripped);
}

function parseTableRow(line) {
  const s = line.trim();
  if (!s.startsWith('|') || !s.endsWith('|')) return null;
  const inner = s.slice(1, -1);
  const cells = [];
  let current = '';
  let inCode = false; // 反引号代码块内的竖线不当作列分隔符
  for (const ch of inner) {
    if (ch === '`') { inCode = !inCode; current += ch; continue; }
    if (ch === '|' && !inCode) { cells.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  if (current) cells.push(current.trim());
  return cells;
}

function processInline(text) {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
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

function isNumericCell(text) {
  const t = text.trim();
  if (/^\d+$/.test(t)) return true;
  if (/^\d+\.\d+%?$/.test(t)) return true;
  if (/^\d+\/\d+$/.test(t)) return true;
  return false;
}

// 为标题生成锚点 ID
function headingId(text) {
  return 's-' + text
    .replace(/[🟢🟡🟠🔴🏥🚑🏪📊⚠✅]/g, '')
    .replace(/[^\w\u4e00-\u9fff]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'section';
}

// ============================================================
// 主转换 — 返回 { html, toc }
// ============================================================
function mdToHtml(md) {
  const lines = md.split('\n');
  const parts = [];
  const toc = []; // { id, level, text, children: [] }

  let inTable = false;
  let inTableHeader = false;
  let idCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inTable) { parts.push('</tbody>\n</table>\n</div>\n'); inTable = false; inTableHeader = false; }
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (isTableSeparator(trimmed)) { if (inTable) inTableHeader = false; continue; }
      const cells = parseTableRow(trimmed);
      if (!cells || cells.length === 0) {
        if (inTable) { parts.push('</tbody>\n</table>\n</div>\n'); inTable = false; inTableHeader = false; }
        parts.push(`<p>${processInline(trimmed)}</p>\n`);
        continue;
      }
      if (!inTable) { parts.push('<div class="table-wrap">\n<table>\n<thead>\n'); inTable = true; inTableHeader = true; }
      if (inTableHeader) {
        parts.push('  <tr>\n');
        for (const cell of cells) parts.push(`    <th>${processInline(cell)}</th>\n`);
        parts.push('  </tr>\n</thead>\n<tbody>\n');
        inTableHeader = false;
      } else {
        parts.push('  <tr>\n');
        for (const cell of cells) {
          const cls = isNumericCell(cell) ? ' class="num"' : '';
          parts.push(`    <td${cls}>${processInline(cell)}</td>\n`);
        }
        parts.push('  </tr>\n');
      }
      continue;
    }

    if (inTable) { parts.push('</tbody>\n</table>\n</div>\n'); inTable = false; inTableHeader = false; }

    // 标题
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      let text = hMatch[2].trim();
      // 子系统大标题（带 🏥/🚑/🏪 的 h1）降级为 h2 渲染并纳入导航，避免三大章节标题丢失
      const isSubsystemH1 = (level === 1 && /[🏥🚑🏪]/.test(text));
      const renderLevel = isSubsystemH1 ? 2 : level;
      // 跳过纯 h1（报告总标题已在页面头中）
      if (level === 1 && !isSubsystemH1) continue;
      // 收集 h2/h3/h4 到导航树
      if (renderLevel >= 2 && renderLevel <= 4) {
        const id = headingId(text) + '-' + (idCounter++);
        // 收集导航节点
        const cleanText = text.replace(/[🟢🟡🟠🔴🏥🚑🏪]/g, '').trim();
        const icon = text.match(/[🏥🚑🏪🔴🟠🟡🟢]/) || '';
        toc.push({ id, level: renderLevel, text: cleanText, icon: icon[0] || '' });
        parts.push(`<h${renderLevel} id="${id}">${processInline(text)}</h${renderLevel}>\n`);
        continue;
      }
      parts.push(`<h${renderLevel}>${processInline(text)}</h${renderLevel}>\n`);
      continue;
    }

    if (/^---+\s*$/.test(trimmed)) { parts.push('<hr>\n'); continue; }
    if (trimmed.startsWith('>')) { parts.push(`<blockquote>${processInline(trimmed.replace(/^>\s*/, ''))}</blockquote>\n`); continue; }

    const ulMatch = trimmed.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) { parts.push(`<li>${processInline(ulMatch[2])}</li>\n`); continue; }

    const olMatch = trimmed.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) { parts.push(`<li>${processInline(olMatch[2])}</li>\n`); continue; }

    if (trimmed) parts.push(`<p>${processInline(trimmed)}</p>\n`);
  }

  if (inTable) parts.push('</tbody>\n</table>\n</div>\n');

  return { html: parts.join(''), toc };
}

// ============================================================
// 生成导航树 HTML
// ============================================================
function generateTocHtml(toc) {
  let html = '';
  let levelStack = []; // tracks nesting levels of nav-children

  for (const item of toc) {
    const itemLevel = item.level;

    // 关闭需要退出的 nav-children 层
    while (levelStack.length > 0 && levelStack[levelStack.length - 1] >= itemLevel) {
      levelStack.pop();
      html += '</div>\n';
    }

    // 打开需要进入的 nav-children 层
    const targetDepth = itemLevel - 2; // h2→0, h3→1, h4→2
    while (levelStack.length < targetDepth) {
      const newLevel = levelStack.length + 2;
      levelStack.push(newLevel);
      html += '<div class="nav-children">\n';
    }

    const iconHtml = item.icon ? `<span class="nav-icon">${item.icon}</span> ` : '';
    html += `<div class="nav-item nav-l${itemLevel}">\n`;
    html += `  <a href="#${item.id}" onclick="scrollToSection('${item.id}');return false;">${iconHtml}${escapeHtml(item.text)}</a>\n`;
    html += '</div>\n';
  }

  // 关闭剩余的 nav-children
  while (levelStack.length > 0) {
    levelStack.pop();
    html += '</div>\n';
  }

  return html;
}

// ============================================================
// 主流程
// ============================================================
console.log('📝 生成 HTML 报告 v3（含导航树）...');

const md = fs.readFileSync(MD_FILE, 'utf8');
const { html: bodyContent, toc } = mdToHtml(md);
const tocHtml = generateTocHtml(toc);

// 从 MD 头部提取本次"总查询工作项"数（避免硬编码过期数字）
const totalItemsMatch = md.match(/总查询工作项[^0-9]*?(\d[\d,]*)\s*项/);
const totalItemsStr = totalItemsMatch ? totalItemsMatch[1] + ' 项' : '未提取';

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>病历片区需求归集 - ${dateStr}</title>
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
    --sidebar-w: 260px;
    --sidebar-bg: #1e293b;
    --sidebar-text: #cbd5e1;
    --sidebar-hover: #334155;
    --sidebar-active: #2b6cb0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    font-size: 14px;
    display: flex;
  }

  /* ===== 侧边栏 ===== */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--sidebar-bg);
    color: var(--sidebar-text);
    overflow-y: auto;
    z-index: 100;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s;
  }
  .sidebar-header {
    padding: 16px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .sidebar-header h2 {
    font-size: 15px;
    color: #f1f5f9;
    font-weight: 600;
    border: none;
    margin: 0 0 4px;
    padding: 0;
  }
  .sidebar-header .sub {
    font-size: 12px;
    color: #94a3b8;
  }
  .sidebar-nav {
    padding: 8px 0;
    flex: 1;
    overflow-y: auto;
  }

  .nav-item a {
    display: block;
    padding: 6px 14px;
    color: var(--sidebar-text);
    text-decoration: none;
    font-size: 13px;
    line-height: 1.4;
    border-left: 3px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
  }
  .nav-item a:hover {
    background: var(--sidebar-hover);
    color: #f1f5f9;
  }
  .nav-item a.active {
    background: rgba(43,108,176,0.2);
    color: #93c5fd;
    border-left-color: var(--sidebar-active);
  }
  .nav-icon { margin-right: 2px; }
  .nav-l2 a { padding-left: 14px; font-weight: 500; font-size: 13px; }
  .nav-l3 a { padding-left: 28px; font-size: 12.5px; }
  .nav-l4 a { padding-left: 42px; font-size: 12px; }
  .nav-children { }

  /* 侧边栏折叠按钮 */
  .sidebar-toggle {
    display: none;
    position: fixed;
    top: 10px; left: 10px;
    z-index: 200;
    background: var(--sidebar-bg);
    color: #fff;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
  }

  /* ===== 主内容区 ===== */
  .main-content {
    margin-left: var(--sidebar-w);
    flex: 1;
    min-width: 0;
  }

  .report-header {
    background: linear-gradient(135deg, #1a1a2e, #16213e 60%, #0f3460);
    color: #fff;
    padding: 32px 24px;
  }
  .report-header h1 { font-size: 24px; letter-spacing: 1px; }
  .report-header .meta { color: #aab; font-size: 13px; margin-top: 6px; }
  .report-header .meta span { display: inline-block; margin: 0 10px; }

  .container { max-width: 1680px; padding: 20px 28px; }

  /* 标题 */
  h2 {
    font-size: 20px; margin: 28px 0 12px; padding-bottom: 8px;
    border-bottom: 3px solid var(--accent); color: var(--primary);
  }
  h3 { font-size: 17px; margin: 20px 0 10px; color: var(--primary); }
  h4 { font-size: 15px; margin: 16px 0 8px; }
  h5 { font-size: 14px; margin: 12px 0 6px; }

  /* 锚点偏移 */
  h2[id], h3[id], h4[id] { scroll-margin-top: 16px; }

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
    text-align: center;
    font-weight: 600;
    border: 1px solid var(--border);
    border-bottom: 2px solid var(--border);
    white-space: nowrap;
    font-size: 12.5px;
    color: var(--primary);
  }
  td {
    padding: 7px 10px;
    border: 1px solid #e8e8e8;
    vertical-align: middle;
    text-align: center;
  }
  /* 长说明列左对齐、单元格自动换行（避免被强制断字） */
  td.desc, td:nth-child(2):not(.num) { text-align: left; }
  tbody tr:hover td { background: #f0f4ff; }
  td.num { text-align: center; font-variant-numeric: tabular-nums; }
  /* 行内 code：长正则/标识符在单元格内正常换行 */
  code {
    background: #f4f6fb;
    color: #c0392b;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: Consolas, "Courier New", monospace;
    font-size: 12.5px;
    word-break: break-word;
    white-space: pre-wrap;
    display: inline-block;
    max-width: 100%;
  }

  .hl { font-size: 14px; }
  .hl-danger { color: var(--danger); font-weight: 600; }
  .hl-warning { color: var(--warning); font-weight: 600; }
  .hl-concern { color: var(--concern); font-weight: 600; }
  .hl-healthy { color: var(--healthy); font-weight: 600; }

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
    padding: 1px 5px; border-radius: 3px;
    font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace;
  }
  li { margin: 3px 0; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .report-footer {
    text-align: center; padding: 24px; color: var(--text2);
    font-size: 13px; border-top: 1px solid var(--border); margin-top: 40px;
  }

  /* 滚动条美化 */
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-track { background: transparent; }
  .sidebar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }

  @media print {
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .report-header { background: #1a1a2e !important; -webkit-print-color-adjust: exact; }
    thead { background: #eef1f7 !important; -webkit-print-color-adjust: exact; }
    body { font-size: 12px; }
    .table-wrap { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }

  @media (max-width: 900px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .sidebar-toggle { display: block; }
    .main-content { margin-left: 0; }
    .container { padding: 12px 16px; }
    table { font-size: 12px; }
    th, td { padding: 5px 6px; }
  }
</style>
</head>
<body>

<!-- 侧边栏折叠按钮（移动端） -->
<button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>

<!-- 侧边栏 -->
<div class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <h2>📊 报告导航</h2>
    <div class="sub">病历片区需求归集</div>
  </div>
  <div class="sidebar-nav" id="sidebarNav">
    ${tocHtml}
  </div>
</div>

<!-- 主内容 -->
<div class="main-content">

<div class="report-header">
  <h1>📊 病历片区需求归集</h1>
  <div class="meta">
    <span>📅 ${dateStr}</span>
    <span>📋 数据来源: TFS 查询</span>
    <span>📎 总工作项: ${totalItemsStr}</span>
  </div>
</div>

<div class="container">

${bodyContent}

<div class="report-footer">
  <p>📊 病历片区需求归集 | 由 consolidate-requirements-v1 增强版自动生成</p>
  <p>合并需求识别正则: <code>/合并\d{3,}|@1?\d{6,}|（合并|合并多|合并代码|合代码|合并需求\d|合并需求至|合并需求：|合并【\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|至\d{6}迭代|到\d{6}迭代|至\d{6}版本|至泰康\d/</code></p>
  <p>医院需求识别规则: CreatedBy 含 TfsInterface</p>
</div>

</div>

</div>

<script>
// 切换侧边栏（移动端）
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// 平滑滚动到锚点
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 移动端自动关闭侧边栏
    if (window.innerWidth <= 900) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }
}

// 滚动跟踪：高亮当前可视的导航项
(function() {
  const navItems = document.querySelectorAll('.nav-item a');
  const sections = [];
  navItems.forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) sections.push({ el, a });
    }
  });

  function updateActive() {
    let current = null;
    const scrollTop = window.scrollY + 100;
    for (const s of sections) {
      if (s.el.offsetTop <= scrollTop) {
        current = s;
      } else {
        break;
      }
    }
    navItems.forEach(a => a.classList.remove('active'));
    if (current) current.a.classList.add('active');
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('load', updateActive);
})();
</script>

</body>
</html>`;

fs.writeFileSync(HTML_FILE, html, 'utf8');
console.log('✅ HTML 报告 v3 已保存到: ' + HTML_FILE);
console.log('   文件大小: ' + (fs.statSync(HTML_FILE).size / 1024).toFixed(1) + ' KB');
console.log('   导航节点: ' + toc.length + ' 个');