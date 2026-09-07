/**
 * 病历片区需求归集 HTML 生成器 v4
 * 新增：健康度分析表点击展开详情（功能点问题数 → 具体需求明细）
 * 保留：左侧导航树 + 锚点定位 + 滚动高亮
 */
const fs = require('fs');
const path = require('path');

const MD_DIR = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\';
const MD_PREFIX = '病历新增需求归集-';

// 自动查找最新的 MD 报告文件
function findLatestMd() {
  const files = fs.readdirSync(MD_DIR).filter(f => f.startsWith(MD_PREFIX) && f.endsWith('.md'));
  if (files.length === 0) {
    console.error('❌ 未找到病历片区需求归集 MD 文件');
    process.exit(1);
  }
  files.sort((a, b) => b.localeCompare(a));
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
  let inCode = false;
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
// 提取功能点代码（如 "BLGL-05-HZGL-001"）
// ============================================================
const FP_CODE_RE = /[A-Z]{2,4}-\d{2}-[A-Z]+-\d{3}/;

function extractFpCode(text) {
  const m = text.match(FP_CODE_RE);
  return m ? m[0] : null;
}

// ============================================================
// 预解析：构建 功能点代码 → 需求明细列表 映射
// ============================================================
function buildFpDetailMap(md) {
  const map = {}; // fpCode -> [{ id, title, status, type }]
  const lines = md.split('\n');
  let inFpDetailSection = false;  // 是否在「四）功能点需求详情」中
  let inModuleTable = false;      // 是否在某个模块的表格中

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测进入功能点需求详情章节
    if (/^#{1,4}\s*[（(]四[）)]/.test(line) && /功能点需求详情/.test(line)) {
      inFpDetailSection = true;
      continue;
    }
    // 检测离开功能点需求详情章节（进入第五章）
    if (inFpDetailSection && /^#{1,4}\s*[（(]五[）)]/.test(line)) {
      inFpDetailSection = false;
      break;
    }

    if (!inFpDetailSection) continue;

    // 检测表格行（含 Spec 功能点信息的行）
    if (line.startsWith('|') && line.endsWith('|') && !isTableSeparator(line)) {
      const cells = parseTableRow(line);
      if (!cells || cells.length < 5) continue;

      // 跳过表头行
      if (cells[0] === 'Spec 功能点' || cells[0].includes('Spec 功能点')) {
        inModuleTable = true;
        continue;
      }

      if (inModuleTable) {
        const fpCell = cells[0].trim();
        const fpCode = extractFpCode(fpCell);
        if (fpCode) {
          if (!map[fpCode]) map[fpCode] = [];
          map[fpCode].push({
            id: cells[3] || '',
            title: cells[4] || '',
            status: cells[1] || '',
            type: cells[2] || '',
          });
        }
      }
    } else if (line.startsWith('#')) {
      // 遇到新标题，重置表格状态（新模块标题）
      inModuleTable = false;
    }
  }

  return map;
}

// ============================================================
// 主转换 — 返回 { html, toc, fpDetailMap }
// ============================================================
function mdToHtml(md, fpDetailMap) {
  const lines = md.split('\n');
  const parts = [];
  const toc = [];

  let inTable = false;
  let inTableHeader = false;
  let idCounter = 0;

  // 跟踪当前所在章节，用于判断是否在健康度分析表
  let currentSection = '';
  let inHealthSection = false;
  // 健康度分析表是否需要特殊处理（检测到表头即开启）
  let healthTableActive = false;
  // 健康度分析表格的列数
  let healthColCount = 5;

  // 已处理过的表头集合，避免重复添加 toggle-all 行
  let healthTableStarted = false;

  // 合并需求分页状态
  let inMergeSection = false;
  let mergeTableStarted = false;
  let mergeRowIndex = 0;
  const MERGE_PAGE_SIZE = 10;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inTable) {
        if (healthTableActive) {
          parts.push('</tbody>\n</table>\n</div>\n');
          healthTableActive = false;
          healthTableStarted = false;
        } else if (inMergeSection && mergeTableStarted) {
          const totalPages = Math.ceil(mergeRowIndex / MERGE_PAGE_SIZE);
          parts.push('</tbody>\n</table>\n');
          // 分页控制
          parts.push(`<div class="merge-pagination-controls" data-total-pages="${totalPages}" data-page-size="${MERGE_PAGE_SIZE}">\n`);
          parts.push(`  <button class="page-btn" onclick="changeMergePage(this, -1)" ${totalPages <= 1 ? 'disabled' : ''}>◀ 上一页</button>\n`);
          parts.push(`  <span class="page-info">第 <span class="page-current">1</span> / ${totalPages} 页</span>\n`);
          parts.push(`  <button class="page-btn" onclick="changeMergePage(this, 1)" ${totalPages <= 1 ? 'disabled' : ''}>下一页 ▶</button>\n`);
          parts.push('</div>\n');
          parts.push('</div>\n');
          mergeTableStarted = false;
        } else {
          parts.push('</tbody>\n</table>\n</div>\n');
        }
        inTable = false;
        inTableHeader = false;
      }
      continue;
    }

    // 检测章节标题
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      const text = hMatch[2].trim();
      // 检测合并需求详情章节
      if (/[（(]二[）)]/.test(text) && /合并需求详情/.test(text)) {
        currentSection = 'merge';
        inMergeSection = true;
        mergeTableStarted = false;
        mergeRowIndex = 0;
        inHealthSection = false;
      } else if (/[（(]六[）)]/.test(text) && /健康度分析/.test(text)) {
        currentSection = 'health';
        inHealthSection = true;
        inMergeSection = false;
      } else if (/[（(]五[）)]/.test(text) && /建议新增功能点/.test(text)) {
        currentSection = 'suggest';
        inHealthSection = false;
        inMergeSection = false;
      } else if (/[（(]四[）)]/.test(text) && /功能点需求详情/.test(text)) {
        currentSection = 'detail';
        inHealthSection = false;
        inMergeSection = false;
      } else if (hMatch[1].length >= 2) {
        // 二级及以上标题退出合并详情章节
        inMergeSection = false;
        inHealthSection = false;
      } else {
        inHealthSection = false;
      }
    }

    // ---- 表格处理 ----
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (isTableSeparator(trimmed)) {
        if (inTable) inTableHeader = false;
        continue;
      }
      const cells = parseTableRow(trimmed);
      if (!cells || cells.length === 0) {
        if (inTable) { parts.push('</tbody>\n</table>\n</div>\n'); inTable = false; inTableHeader = false; }
        parts.push(`<p>${processInline(trimmed)}</p>\n`);
        continue;
      }

      // 判断是否健康度分析表头
      const isHealthHeader = inHealthSection && cells.length >= 4 &&
        cells[0].includes('功能点') && cells[1].includes('问题数') && cells[2].includes('健康等级');

      if (isHealthHeader) {
        healthTableActive = true;
        healthTableStarted = false;
        healthColCount = cells.length;
      }

      if (!inTable) {
        // 合并需求分页表或健康度分析表使用特殊 class
        let tableClass = '';
        if (healthTableActive) tableClass = ' table-health';
        else if (inMergeSection && !mergeTableStarted) {
          tableClass = ' merge-pagination';
          mergeTableStarted = true;
          mergeRowIndex = 0;
        }
        parts.push(`<div class="table-wrap${tableClass}"${inMergeSection && mergeTableStarted ? ' id="merge-table-' + idCounter++ + '"' : ''}>\n<table>\n<thead>\n`);
        inTable = true;
        inTableHeader = true;
      }

      if (inTableHeader) {
        parts.push('  <tr>\n');
        for (let ci = 0; ci < cells.length; ci++) {
          parts.push(`    <th>${processInline(cells[ci])}</th>\n`);
        }
        // 健康度分析表头额外加一列操作列
        if (healthTableActive && !healthTableStarted) {
          parts.push('    <th class="th-toggle">明细</th>\n');
        }
        parts.push('  </tr>\n</thead>\n<tbody>\n');
        inTableHeader = false;
        healthTableStarted = true;
        continue;
      }

      // ---- 数据行处理 ----
      if (healthTableActive) {
        // 健康度分析表行：加点击展开功能
        const fpCell = cells[0] || '';
        const fpCode = extractFpCode(fpCell);
        const details = fpCode ? (fpDetailMap[fpCode] || []) : [];
        const detailCount = details.length;

        // 提取问题数用于显示
        const problemCount = cells[1] || '0';

        // 生成行 ID
        const rowId = `h-row-${idCounter++}`;

        parts.push(`  <tr class="health-row" data-fp="${fpCode || ''}" data-detail-count="${detailCount}" onclick="toggleHealthDetail('${rowId}')">\n`);
        for (let ci = 0; ci < cells.length; ci++) {
          const cls = isNumericCell(cells[ci]) ? ' class="num"' : '';
          parts.push(`    <td${cls}>${processInline(cells[ci])}</td>\n`);
        }
        // 操作列：显示详情条数
        const toggleIcon = detailCount > 0
          ? `<span class="toggle-icon">▶</span> <span class="detail-badge">${detailCount} 项</span>`
          : '<span class="toggle-icon dim">—</span>';
        parts.push(`    <td class="td-toggle">${toggleIcon}</td>\n`);
        parts.push('  </tr>\n');

        // 展开详情行（隐藏）
        if (detailCount > 0) {
          parts.push(`  <tr id="${rowId}" class="health-detail-row" style="display:none;">\n`);
          parts.push(`    <td colspan="${healthColCount + 1}" class="health-detail-cell">\n`);
          // 嵌套明细表格
          parts.push(`      <div class="detail-inner">\n`);
          parts.push(`        <div class="detail-header">📋 <strong>${escapeHtml(fpCell)}</strong> 需求明细（共 ${detailCount} 项）</div>\n`);
          parts.push(`        <table class="detail-table">\n`);
          parts.push(`          <thead><tr><th>ID</th><th>标题</th><th>状态</th><th>类型</th></tr></thead>\n`);
          parts.push(`          <tbody>\n`);
          for (const item of details) {
            parts.push(`            <tr>\n`);
            parts.push(`              <td class="num">${escapeHtml(item.id)}</td>\n`);
            parts.push(`              <td class="td-left">${escapeHtml(item.title)}</td>\n`);
            parts.push(`              <td>${processInline(item.status)}</td>\n`);
            parts.push(`              <td>${escapeHtml(item.type)}</td>\n`);
            parts.push(`            </tr>\n`);
          }
          parts.push(`          </tbody>\n`);
          parts.push(`        </table>\n`);
          parts.push(`      </div>\n`);
          parts.push(`    </td>\n`);
          parts.push(`  </tr>\n`);
        }
      } else {
        // 普通表格行
        const isMergeRow = inMergeSection && mergeTableStarted;
        if (isMergeRow) mergeRowIndex++;
        const pageNum = isMergeRow ? Math.ceil(mergeRowIndex / MERGE_PAGE_SIZE) : 0;
        parts.push(isMergeRow ? `  <tr class="merge-row" data-page="${pageNum}">\n` : '  <tr>\n');
        for (const cell of cells) {
          const cls = isNumericCell(cell) ? ' class="num"' : '';
          parts.push(`    <td${cls}>${processInline(cell)}</td>\n`);
        }
        parts.push('  </tr>\n');
      }
      continue;
    }

    if (inTable) {
      if (healthTableActive) {
        parts.push('</tbody>\n</table>\n</div>\n');
        healthTableActive = false;
        healthTableStarted = false;
      } else if (inMergeSection && mergeTableStarted) {
        const totalPages = Math.ceil(mergeRowIndex / MERGE_PAGE_SIZE);
        parts.push('</tbody>\n</table>\n');
        parts.push(`<div class="merge-pagination-controls" data-total-pages="${totalPages}" data-page-size="${MERGE_PAGE_SIZE}">\n`);
        parts.push(`  <button class="page-btn" onclick="changeMergePage(this, -1)" ${totalPages <= 1 ? 'disabled' : ''}>◀ 上一页</button>\n`);
        parts.push(`  <span class="page-info">第 <span class="page-current">1</span> / ${totalPages} 页</span>\n`);
        parts.push(`  <button class="page-btn" onclick="changeMergePage(this, 1)" ${totalPages <= 1 ? 'disabled' : ''}>下一页 ▶</button>\n`);
        parts.push('</div>\n</div>\n');
        mergeTableStarted = false;
      } else {
        parts.push('</tbody>\n</table>\n</div>\n');
      }
      inTable = false;
      inTableHeader = false;
    }

    // 标题
    if (hMatch) {
      const level = hMatch[1].length;
      let text = hMatch[2].trim();
      const isSubsystemH1 = (level === 1 && /[🏥🚑🏪]/.test(text));
      const renderLevel = isSubsystemH1 ? 2 : level;
      if (level === 1 && !isSubsystemH1) continue;
      if (renderLevel >= 2 && renderLevel <= 4) {
        const id = headingId(text) + '-' + (idCounter++);
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

  if (inTable) {
    if (healthTableActive) {
      parts.push('</tbody>\n</table>\n</div>\n');
    } else if (inMergeSection && mergeTableStarted) {
      const totalPages = Math.ceil(mergeRowIndex / MERGE_PAGE_SIZE);
      parts.push('</tbody>\n</table>\n');
      parts.push(`<div class="merge-pagination-controls" data-total-pages="${totalPages}" data-page-size="${MERGE_PAGE_SIZE}">\n`);
      parts.push(`  <button class="page-btn" onclick="changeMergePage(this, -1)" ${totalPages <= 1 ? 'disabled' : ''}>◀ 上一页</button>\n`);
      parts.push(`  <span class="page-info">第 <span class="page-current">1</span> / ${totalPages} 页</span>\n`);
      parts.push(`  <button class="page-btn" onclick="changeMergePage(this, 1)" ${totalPages <= 1 ? 'disabled' : ''}>下一页 ▶</button>\n`);
      parts.push('</div>\n</div>\n');
    } else {
      parts.push('</tbody>\n</table>\n</div>\n');
    }
  }

  return { html: parts.join(''), toc };
}

// ============================================================
// 生成导航树 HTML
// ============================================================
function generateTocHtml(toc) {
  let html = '';
  let levelStack = [];

  for (const item of toc) {
    const itemLevel = item.level;

    while (levelStack.length > 0 && levelStack[levelStack.length - 1] >= itemLevel) {
      levelStack.pop();
      html += '</div>\n';
    }

    const targetDepth = itemLevel - 2;
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

  while (levelStack.length > 0) {
    levelStack.pop();
    html += '</div>\n';
  }

  return html;
}

// ============================================================
// 主流程
// ============================================================
console.log('📝 生成 HTML 报告 v4（含导航树 + 健康度点击展开）...');

const md = fs.readFileSync(MD_FILE, 'utf8');

// 预解析：构建功能点需求明细映射
console.log('   🔍 预解析功能点需求明细...');
const fpDetailMap = buildFpDetailMap(md);
const fpCount = Object.keys(fpDetailMap).length;
const itemCount = Object.values(fpDetailMap).reduce((sum, arr) => sum + arr.length, 0);
console.log(`   ✅ 已解析 ${fpCount} 个功能点，${itemCount} 条需求明细`);

// 主转换
const { html: bodyContent, toc } = mdToHtml(md, fpDetailMap);
const tocHtml = generateTocHtml(toc);

// 从 MD 头部提取本次"总查询工作项"数
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

  h2 {
    font-size: 20px; margin: 28px 0 12px; padding-bottom: 8px;
    border-bottom: 3px solid var(--accent); color: var(--primary);
  }
  h3 { font-size: 17px; margin: 20px 0 10px; color: var(--primary); }
  h4 { font-size: 15px; margin: 16px 0 8px; }
  h5 { font-size: 14px; margin: 12px 0 6px; }

  h2[id], h3[id], h4[id] { scroll-margin-top: 16px; }

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
  td.desc, td:nth-child(2):not(.num) { text-align: left; }
  tbody tr:hover td { background: #f0f4ff; }
  td.num { text-align: center; font-variant-numeric: tabular-nums; }

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
  li { margin: 3px 0; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .report-footer {
    text-align: center; padding: 24px; color: var(--text2);
    font-size: 13px; border-top: 1px solid var(--border); margin-top: 40px;
  }

  /* ===== 健康度分析表交互样式 ===== */
  .table-health .health-row {
    cursor: pointer;
    transition: background 0.15s;
  }
  .table-health .health-row:hover td {
    background: #e8f0fe;
  }
  .table-health .health-row.active-row td {
    background: #e0eaff;
  }

  .th-toggle, .td-toggle {
    width: 60px;
    min-width: 60px;
    text-align: center;
    white-space: nowrap;
  }
  .td-toggle .toggle-icon {
    display: inline-block;
    transition: transform 0.2s;
    font-size: 12px;
    color: var(--accent);
    margin-right: 4px;
  }
  .td-toggle .toggle-icon.dim {
    color: #ccc;
  }
  .health-row.expanded .td-toggle .toggle-icon {
    transform: rotate(90deg);
  }
  .detail-badge {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
  }

  .health-detail-row {
    background: #f8faff;
  }
  .health-detail-cell {
    padding: 12px 16px 16px !important;
    border: 1px solid #d0d5dd;
    background: #fafcff;
  }
  .detail-inner {
    margin: 0;
  }
  .detail-header {
    font-size: 13px;
    color: var(--primary);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #d0d5dd;
  }
  .detail-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .detail-table thead { background: #e8ecf5; }
  .detail-table th {
    padding: 6px 8px;
    border: 1px solid #ccc;
    font-size: 12px;
  }
  .detail-table td {
    padding: 5px 8px;
    border: 1px solid #ddd;
    background: #fff;
  }
  .detail-table td.td-left {
    text-align: left;
  }
  .detail-table tbody tr:hover td {
    background: #f0f4ff;
  }
  .detail-table td.num {
    text-align: center;
    font-family: Consolas, monospace;
    font-size: 12px;
  }

  /* 展开/折叠动画 */
  .health-detail-row {
    animation: detailFadeIn 0.2s ease-out;
  }
  @keyframes detailFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ===== 合并需求分页 ===== */
  .merge-pagination .merge-row[data-page]:not([data-page="1"]) {
    display: none;
  }
  .merge-pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 10px 0 14px;
    border-top: 1px solid var(--border);
    margin: 0 8px;
  }
  .merge-pagination-controls .page-btn {
    padding: 5px 14px;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--card-bg);
    color: var(--text);
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }
  .merge-pagination-controls .page-btn:hover:not(:disabled) {
    background: #e8ecf5;
  }
  .merge-pagination-controls .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .merge-pagination-controls .page-info {
    font-size: 13px;
    color: var(--text2);
    min-width: 80px;
    text-align: center;
  }
  .merge-pagination-controls .page-current {
    font-weight: 600;
    color: var(--primary);
  }

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

<button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>

<div class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <h2>📊 报告导航</h2>
    <div class="sub">病历片区需求归集</div>
  </div>
  <div class="sidebar-nav" id="sidebarNav">
    ${tocHtml}
  </div>
</div>

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
  <p>合并需求识别正则: <code>/合并\\d{3,}|@1?\\d{6,}|（合并|合并多|合并代码|合代码|合并需求\\d|合并需求至|合并需求：|合并【\\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|至\\d{6}迭代|到\\d{6}迭代|至\\d{6}版本|至泰康\\d/</code></p>
  <p>医院需求识别规则: CreatedBy 含 TfsInterface</p>
</div>

</div>

</div>

<script>
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.innerWidth <= 900) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }
}

// 滚动跟踪
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

/**
 * 健康度分析表：点击展开/折叠详情
 */
function toggleHealthDetail(rowId) {
  const detailRow = document.getElementById(rowId);
  if (!detailRow) return;

  // 找到对应的父行
  const parentRow = detailRow.previousElementSibling;
  if (!parentRow || !parentRow.classList.contains('health-row')) return;

  const isExpanded = detailRow.style.display !== 'none';

  if (isExpanded) {
    // 折叠
    detailRow.style.display = 'none';
    parentRow.classList.remove('expanded');
  } else {
    // 展开
    detailRow.style.display = 'table-row';
    parentRow.classList.add('expanded');
  }
}

/**
 * 合并需求分页切换
 */
function changeMergePage(btn, direction) {
  const controls = btn.closest('.merge-pagination-controls');
  if (!controls) return;
  const totalPages = parseInt(controls.dataset.totalPages) || 1;
  const pageInfo = controls.querySelector('.page-current');
  let currentPage = parseInt(pageInfo.textContent) || 1;

  const newPage = Math.max(1, Math.min(totalPages, currentPage + direction));
  if (newPage === currentPage) return;

  // 更新页码
  pageInfo.textContent = newPage;
  currentPage = newPage;

  // 切换表格行显隐
  const tableWrap = controls.parentElement;
  const rows = tableWrap.querySelectorAll('.merge-row');
  rows.forEach(row => {
    const page = parseInt(row.dataset.page) || 1;
    row.style.display = page === currentPage ? '' : 'none';
  });

  // 更新按钮状态
  const prevBtn = controls.querySelector('.page-btn:first-child');
  const nextBtn = controls.querySelector('.page-btn:last-child');
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}
</script>

</body>
</html>`;

fs.writeFileSync(HTML_FILE, html, 'utf8');
console.log('✅ HTML 报告 v4 已保存到: ' + HTML_FILE);
console.log('   文件大小: ' + (fs.statSync(HTML_FILE).size / 1024).toFixed(1) + ' KB');
console.log('   导航节点: ' + toc.length + ' 个');
console.log('   功能点明细映射: ' + fpCount + ' 个功能点, ' + itemCount + ' 条需求明细');