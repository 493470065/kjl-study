/**
 * build-spec-index.js
 * 构建 Spec 正文证据索引（spec-evidence.json）
 *
 * 目的：健康度分析不仅用功能结构树（骨架），还用 Spec 正文（三件套）做证据。
 * 扫描本地 Spec 资料区三线目录下的功能点文件夹，从三件套文档中抽取：
 *   - scopeInclude  纳入范围（研发 Spec 1.2.1 / PM-Spec 排除范围反推）
 *   - scopeExclude  排除范围（含被排除的兄弟功能点编码 → 匹配否决证据）
 *   - rules         业务规则清单（Analyst-Spec 第五章 BR-*）
 *   - acceptance    验收标准（PM-Spec 第三章 AC-*）
 *   - keywords      从正文提取的高频业务短语（供归集匹配加分）
 *
 * 输出：references/spec-evidence.json
 *   { 'BLGL-05-HZGL-001': { name, module, sys, hasSpec, includeCount, excludeCount,
 *                           excludeCodes: [], rules: [...], acceptance: [...], keywords: [] }, ... }
 *
 * 使用：node build-spec-index.js [specRoot]
 *   默认 specRoot = E:\37结构性问题治理\01WiNEX 病历管理
 *
 * 说明：
 *   - 文档缺失（功能点无 Spec 三件套）时登记 hasSpec=false —— 该功能点评估时
 *     触发 V4 零覆盖核查（有明确需求但设计文档完全未提及）。
 *   - 索引是快照，Spec 正文更新后需重跑本脚本刷新。
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_SPEC_ROOT = 'E:/37结构性问题治理/01WiNEX 病历管理';
const SYS_DIRS = [
  { dir: '住院病历Spec', sys: '住院病历', prefix: 'BLGL' },
  { dir: '急诊病历Spec', sys: '急诊病历', prefix: 'JZBL' },
  { dir: '门诊病历Spec', sys: '门诊病历', prefix: 'MZBL' }
];

// 编码正则：{ProductCode}-{ModNN}-{SSS}-{NNN}；产品码 BLGL/JZBL/MZBL（B 开头是 BLGL 而非 BZBL）
const FP_CODE_RE = /(BLGL|JZBL|MZBL)-\d{2}-[A-Z]+-\d{3}/g;

const args = process.argv.slice(2);
const specRoot = args[0] || DEFAULT_SPEC_ROOT;

// ---------- 文本抽取工具 ----------

/** 截取两个标题锚点之间的正文（不区分标题级别） */
function sectionBetween(md, startRe, endRes) {
  const lines = md.split('\n');
  let capturing = false;
  const out = [];
  for (const line of lines) {
    if (!capturing && startRe.test(line)) { capturing = true; continue; }
    if (capturing) {
      if (endRes.some(re => re.test(line))) break;
      out.push(line);
    }
  }
  return out.join('\n');
}

/** 从表格行中提取单元格文本 */
function tableCells(line) {
  return line.split('|').map(s => s.trim()).filter(s => s.length > 0 && !/^[-:]+$/.test(s));
}

/** 提取编码（去重保序） */
function extractCodes(text) {
  const m = text.match(FP_CODE_RE) || [];
  return [...new Set(m)];
}

/** 提取正文中出现的 2~6 字业务短语（用于关键词加分） */
const STOP_PHRASES = ['本文档', '以下内容', '详见其他', '功能点或模块', '本次不做', '明确边界', '完整业务', '背景与设计', '包括以下'];
function extractPhrases(text, limit) {
  // 以标点/空白切分，保留 3~8 字的连续中文片段作为短语
  const raw = text.split(/[，。、；：,\.;:（）()\[\]{}「」《》\s\/|>#*\-]+/);
  const freq = {};
  for (let seg of raw) {
    seg = seg.trim();
    if (seg.length < 3 || seg.length > 8) continue;
    if (/^[0-9a-zA-Z]+$/.test(seg)) continue;
    if (STOP_PHRASES.some(sp => seg.includes(sp))) continue;
    freq[seg] = (freq[seg] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

// ---------- 三件套章节抽取 ----------

function parseRdSpec(md) {
  // 研发 Spec：#### 1.2.1 纳入范围 / #### 1.2.2 排除范围
  const includeSec = sectionBetween(md, /1\.2\.1\s*纳入范围/, [/^#{2,4}\s*1\.2\.2/, /^###\s*1\.3/]);
  const excludeSec = sectionBetween(md, /1\.2\.2\s*排除范围/, [/^###\s*1\.3/, /^##\s*2/]);
  return { includeSec, excludeSec };
}

function parsePmSpec(md) {
  // PM-Spec：## 二、约束（BC-）/ ## 三、验收标准（AC-）/ ## 四、排除范围（EX- 表 + 编码）
  const excludeSec = sectionBetween(md, /^#{2,3}\s*四、\s*排除范围/, [/^#{2,3}\s*五、/, /^##\s*五/]);
  const acSection = sectionBetween(md, /^#{2,3}\s*三、\s*验收标准/, [/^#{2,3}\s*四、/]);
  const acceptance = [];
  for (const line of acSection.split('\n')) {
    if (/^\|\s*AC-/.test(line)) {
      const cells = tableCells(line);
      if (cells.length >= 2) acceptance.push(cells[1]);
    }
  }
  return { excludeSec, acceptance };
}

function parseAnalystSpec(md) {
  // Analyst-Spec：## 五、业务规则清单（BR- 表）
  const ruleSection = sectionBetween(md, /^#{2,3}\s*五、\s*业务规则清单/, [/^#{2,3}\s*六、/, /^##\s*六/]);
  const rules = [];
  for (const line of ruleSection.split('\n')) {
    if (/^\|\s*BR-/.test(line)) {
      const cells = tableCells(line);
      if (cells.length >= 3) rules.push(cells[2]); // 规则描述
    }
  }
  return { rules };
}

// ---------- 主流程 ----------

const index = {};
let scannedDocs = 0;

for (const sysDir of SYS_DIRS) {
  const absSys = path.join(specRoot, sysDir.dir);
  if (!fs.existsSync(absSys)) {
    console.log('⚠ 跳过（目录不存在）: ' + absSys);
    continue;
  }
  for (const modDir of fs.readdirSync(absSys, { withFileTypes: true })) {
    if (!modDir.isDirectory() || !modDir.name.includes(sysDir.prefix)) continue;
    const modAbs = path.join(absSys, modDir.name);
    for (const fpDir of fs.readdirSync(modAbs, { withFileTypes: true })) {
      if (!fpDir.isDirectory()) continue;
      const m = fpDir.name.match(/^(BLGL|JZBL|MZBL)-\d{2}-[A-Z]+-\d{3}/);
      if (!m) continue;
      const fpCode = m[0];
      if (index[fpCode]) continue; // 已登记（防跨线重名）

      const fpAbs = path.join(modAbs, fpDir.name);
      const entry = {
        name: fpDir.name.replace(/^(BLGL|JZBL|MZBL)-\d{2}-[A-Z]+-\d{3}_/, ''),
        module: fpCode.replace(/-\d{3}$/, ''),
        sys: sysDir.sys,
        hasSpec: false,
        includeCount: 0,
        excludeCount: 0,
        excludeCodes: [],
        ruleCount: 0,
        rules: [],
        acceptanceCount: 0,
        acceptance: [],
        keywords: []
      };

      // 研发 Spec
      const rdFile = path.join(fpAbs, fpDir.name + '-Spec.md');
      if (fs.existsSync(rdFile)) {
        scannedDocs++;
        const md = fs.readFileSync(rdFile, 'utf8');
        const { includeSec, excludeSec } = parseRdSpec(md);
        entry.hasSpec = true;
        entry.includeCount = (includeSec.match(/^\s*-\s+/gm) || []).length;
        const rdExclude = extractCodes(excludeSec);
        entry.excludeCodes.push(...rdExclude);
        entry.excludeCount = (excludeSec.match(/^\s*-\s+/gm) || []).length;
        entry.keywords.push(...extractPhrases(includeSec, 15));
      }

      // PM-Spec
      const pmFile = path.join(fpAbs, fpDir.name + '_PM-spec.md');
      if (fs.existsSync(pmFile)) {
        scannedDocs++;
        const md = fs.readFileSync(pmFile, 'utf8');
        const { excludeSec, acceptance } = parsePmSpec(md);
        entry.hasSpec = true;
        entry.excludeCodes.push(...extractCodes(excludeSec));
        entry.acceptance = acceptance.slice(0, 30);
        entry.acceptanceCount = acceptance.length;
        entry.keywords.push(...extractPhrases(excludeSec.split('\n').filter(l => !/^\|?\s*(EX-|\|)/.test(l)).join('\n'), 8));
      }

      // Analyst-Spec
      const anFile = path.join(fpAbs, fpDir.name + '_Analyst-spec.md');
      if (fs.existsSync(anFile)) {
        scannedDocs++;
        const md = fs.readFileSync(anFile, 'utf8');
        const { rules } = parseAnalystSpec(md);
        entry.rules = rules.slice(0, 30);
        entry.ruleCount = rules.length;
        entry.keywords.push(...extractPhrases(rules.join('，'), 8));
      }

      entry.excludeCodes = [...new Set(entry.excludeCodes)].filter(c => c !== fpCode);
      entry.keywords = [...new Set(entry.keywords)].slice(0, 25);
      index[fpCode] = entry;
    }
  }
}

const outPath = path.join(__dirname, '..', 'references', 'spec-evidence.json');
fs.writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf8');

const total = Object.keys(index).length;
const withSpec = Object.values(index).filter(e => e.hasSpec).length;
const withExclude = Object.values(index).filter(e => e.excludeCodes.length > 0).length;
console.log('✓ Spec 正文证据索引已生成: ' + outPath);
console.log('  扫描文档: ' + scannedDocs + ' 份');
console.log('  功能点: ' + total + ' 个（有 Spec 正文 ' + withSpec + ' / 无正文 ' + (total - withSpec) + '）');
console.log('  含排除范围编码引用: ' + withExclude + ' 个');
