/**
 * consolidate-requirements-v1
 *
 * 主脚本：从 TFS 查询获取需求清单，按 Spec 知识库功能点聚拢
 *
 * 依赖: Node.js (内置 http 模块)
 *
 * 使用方式:
 *   node consolidate.js <tfs-query-url> <pat-token> [output-path]
 *
 * 参数:
 *   tfs-query-url  - TFS 查询 URL（如 http://tfs:8080/tfs/Collection/Project/_queries?id=xxx&_a=query）
 *   pat-token      - TFS 个人访问令牌
 *   output-path    - 输出文件路径（可选，默认输出到终端）
 *
 * 知识库来源:
 *   http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient-2/_git/winning-record-konwledge?path=%2FSpec&version=GBmaster
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载分离的模块
const { tfsModuleMap, keywordRules } = require(path.join(__dirname, '..', 'references', 'knowledge-base.js'));
const { isBaselineRequirement } = require(path.join(__dirname, '..', 'references', 'external-rules.js'));

// Spec 正文证据索引（由 build-spec-index.js 生成，快照）：
// 健康度归集不仅用功能结构树骨架，还用 Spec 三件套正文（纳入范围/排除范围/业务规则/验收标准）做证据
let specEvidence = {};
try {
  specEvidence = require(path.join(__dirname, '..', 'references', 'spec-evidence.json'));
} catch (e) {
  console.error('⚠️ spec-evidence.json 不存在，正文证据匹配降级为骨架匹配。请先运行: node scripts/build-spec-index.js');
}

// 合并需求识别正则
// 覆盖两类命名习惯：
//   A. 合并动作型：合并+连续数字(合并260330) / 合并需求：80065 / 合并代码 / 克隆主数据 / 历史需求合并 等
//   B. 合并+单号/版本号型（一线常见自由格式）：合并260815 / 合并需求至现场版本 / 合并升级 / 合并单 / 合并到260715 等
const MERGE_REGEX = /合并\d{3,}|@1?\d{6,}|（合并|合并多|合并代码|合代码|合并需求\d|合并需求至|合并需求：|合并【\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|合并到\d{5,}|合并至\d{5,}|至\d{6}迭代|到\d{6}迭代|至\d{6}版本|至泰康\d/;
function isMergeItem(title) {
  return MERGE_REGEX.test(title);
}

// ============================================================
// 需求三分类：功能性的 / 接口 / 软件质量
// 依据 TFS 字段 Microsoft.VSTS.CMMI.RequirementType：
//   - 软件质量（软质）→ 软件质量
//   - 接口（Interface）→ 接口
//   - 功能性的（及空值/未知）→ 功能性的（默认）
// ============================================================
function classifyRequirementType(requirementType) {
  const rt = (requirementType || '').trim();
  if (rt === '软件质量' || rt === '软质') return '软件质量';
  if (rt === '接口' || rt === 'Interface' || rt.toLowerCase() === 'interface') return '接口';
  return '功能性的';
}

// ============================================================
// 解析命令行参数（支持默认值，无参时直接跑默认查询）
// ============================================================
const DEFAULT_QUERY_URL = 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient-2/_queries?id=2ea2e3d4-5f40-4d34-b4e9-c61c47567d33&_a=query-edit';
const DEFAULT_PAT_TOKEN = 'lhafsvivgj6xshepvceh6ijuajvccru53patinta4r6wrsmhue5q';
const DEFAULT_OUTPUT_DIR = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\';

function padNumber(n) { return String(n).padStart(2, '0'); }

function generateDefaultFilename() {
  const d = new Date();
  const dateStr = d.getFullYear() + padNumber(d.getMonth() + 1) + padNumber(d.getDate());
  return DEFAULT_OUTPUT_DIR + '病历新增需求归集-' + dateStr + '.md';
}

const args = process.argv.slice(2);
const tfsQueryUrl = args[0] || DEFAULT_QUERY_URL;
const patToken = args[1] || DEFAULT_PAT_TOKEN;
const outputPath = args[2] || generateDefaultFilename();

if (args.length === 0) {
  console.log('使用默认配置：');
  console.log('  TFS 查询: ' + DEFAULT_QUERY_URL);
  console.log('  输出路径: ' + outputPath);
  console.log('');
}

// 输出分离：progress只输出到终端，result同时输出到终端和文件
const _consoleLog = console.log;
const _consoleError = console.error;
const outputLines = [];

function logProgress(msg) {
  _consoleLog(msg || '');
}

function logResult(msg) {
  _consoleLog(msg || '');
  if (outputPath) outputLines.push((msg || '') + '\n');
}

// 替换 console.log 和 console.error 默认行为：进度信息只输出到终端
if (outputPath) {
  console.log = function(msg) {
    // 结果内容通过 logResult 写入，其他通过 console.log 只输出到终端
    _consoleLog(msg || '');
  };
  console.error = function(msg) { _consoleError(msg || ''); };
}

const auth = Buffer.from('PAT:' + patToken).toString('base64');

// ============================================================
// 解析 TFS URL
// ============================================================
function parseTfsUrl(url) {
  const u = new URL(url);
  const base = u.protocol + '//' + u.host;
  // 从路径中提取 collection 和 project
  // URL 格式: /tfs/{Collection}/{Project}/_queries?id=xxx
  const pathParts = u.pathname.split('/');
  // 找到 _queries 的位置
  const queriesIdx = pathParts.indexOf('_queries');
  if (queriesIdx < 3) throw new Error('无法解析 TFS URL: ' + url);
  // pathParts = ['', 'tfs', 'Collection', 'Project', '_queries', ...]
  const collection = pathParts[2];
  const project = pathParts[3];
  const queryId = u.searchParams.get('id');
  if (!queryId) throw new Error('URL 中未找到查询 ID (id=)');
  return { base, collection, project, queryId };
}

// ============================================================
// HTTP 请求工具
// ============================================================
function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: { 'Authorization': 'Basic ' + auth }
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        } else {
          try { resolve(JSON.parse(data)); }
          catch (e) { resolve(data); }
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================
// Spec 知识库：从 Git 仓库获取
// 来源: http://tfs2018-web.../winning-record-konwledge/Spec/
// ============================================================
const SPEC_REPO = 'winning-record-konwledge';
const SPEC_COLLECTION = 'WINNING-6.0';
const SPEC_PROJECT = 'WiNEX-Inpatient-2';
const SPEC_BASE = 'http://tfs2018-web.winning.com.cn:8080';

function gitItemUrl(repo, path) {
  return `${SPEC_BASE}/tfs/${SPEC_COLLECTION}/${SPEC_PROJECT}/_apis/git/repositories/${repo}/items?path=${encodeURIComponent(path)}&versionDescriptor.version=master&api-version=2.0&download=true`;
}

// 解析功能结构树 Markdown → 提取模块定义和功能点
function parseStructureTree(markdown, sys) {
  const modules = {};
  const fpMap = {};
  let currentModule = null;
  let currentDomain = '';

  const lines = markdown.split('\n');
  for (const line of lines) {
    // 匹配业务域标题行: "├── 📂 病历书写域"
    const domainMatch = line.match(/📂\s*(.+?域)/);
    if (domainMatch) {
      currentDomain = domainMatch[1];
      continue;
    }

    // 匹配模块标题行: "### 01 病历书写（BLGL-01-BLSX）— 12 个功能点"
    let m = line.match(/### (\d+) (.+?)（([A-Z]+-\d+-[A-Z]+)）.*?(\d+)\s*个功能点/);
    if (!m) {
      m = line.match(/### (\d+) (.+?)（([A-Z]+-\d+-[A-Z]+)）/);
    }
    if (m) {
      const modCode = m[3];
      const modName = m[1] + ' ' + m[2];
      const fpCount = parseInt(m[4]) || 0;
      const domain = currentDomain || '其他';
      modules[modCode] = { sys, domain, name: modName, fp: fpCount };
      currentModule = modCode;
      continue;
    }

    // 匹配功能点行: "| BLGL-01-BLSX-001 | 病历创建与模板管理 | L1 | 一句话描述"
    const fpMatch = line.match(/\| ([A-Z]+-\d+-[A-Z]+-\d{3}) \| (.+?) \| (L[12]) \| (.+?) \|/);
    if (fpMatch && currentModule) {
      const fpCode = fpMatch[1];
      const fpName = fpMatch[2];
      const desc = fpMatch[4];
      // 从描述中提取关键词（去除常用词，取关键业务词）
      const keywords = extractKeywords(fpName, desc);
      fpMap[fpCode] = { name: fpName, module: currentModule, keywords };
    }
  }
  return { modules, fpMap };
}

function extractKeywords(fpName, desc) {
  const stopWords = ['的', '了', '在', '是', '为', '和', '或', '与', '及', '并', '根据', '支持', '按', '通过', '进行', '完成', '实现', '自动', '信息', '查询', '列表', '记录', '报表', '统计', '管理', '配置', '设置', '维护'];
  const words = [];
  // 功能点名称作为关键词（最重要）
  words.push(fpName);
  // 从描述中提取关键短语（≥4字，非停用词）
  const descParts = desc.split(/[，。、；：,\.;:（）()\s\/]+/);
  for (const part of descParts) {
    const trimmed = part.trim();
    if (trimmed.length >= 4) {
      let isStop = false;
      for (const sw of stopWords) {
        if (trimmed.includes(sw)) { isStop = true; break; }
      }
      if (!isStop) words.push(trimmed);
    }
  }
  return [...new Set(words)];
}

async function fetchSpecKnowledgeBase() {
  logProgress('📚 正在从 Git 仓库获取 Spec 知识库...');
  const files = [
    { path: '/Spec/住院病历Spec/住院病历系统功能结构树.md', sys: '住院病历' },
    { path: '/Spec/急诊病历Spec/急诊病历系统功能结构树.md', sys: '急诊病历' },
    { path: '/Spec/门诊病历Spec/门诊病历系统功能结构树.md', sys: '门诊病历' }
  ];

  let allModules = {};
  let allFpMap = {};

  for (const file of files) {
    try {
      const url = gitItemUrl(SPEC_REPO, file.path);
      const content = await request('GET', url);
      logProgress('  ✓ ' + file.sys);
      const result = parseStructureTree(content, file.sys);
      Object.assign(allModules, result.modules);
      Object.assign(allFpMap, result.fpMap);
    } catch (e) {
      logProgress('  ⚠ ' + file.sys + ' 获取失败: ' + e.message);
    }
  }

  logProgress('  获取完成: ' + Object.keys(allModules).length + ' 个模块, ' + Object.keys(allFpMap).length + ' 个功能点');
  logProgress('');
  return { specModules: allModules, fpMap: allFpMap };
}

// ============================================================
// 工具函数
// ============================================================
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// ============================================================
// 功能点级匹配（语义匹配）：使用 LLM 语义映射表
// 由 AI 根据需求标题+描述语义匹配到最合适的 Spec 功能点
// ============================================================
let semanticFpMap = {};
try {
  semanticFpMap = require(path.join(__dirname, '..', 'references', 'semantic-fp-map.json'));
} catch (e) {
  // 语义映射文件不存在时使用空映射，降级到模块级匹配
  semanticFpMap = {};
}

function matchFunctionPoint(itemId, fpMap, title, description, tfsModule) {
  // 策略1: ID 精确匹配（已有语义映射表）
  const fpCode = semanticFpMap[String(itemId)];
  if (fpCode && fpMap && fpMap[fpCode]) {
    return { fpCode, module: fpMap[fpCode].module, score: 10 };
  }

  // 策略2: 语义匹配 — 根据标题+说明与 Spec 功能点定义进行语义匹配
  if (fpMap && (title || description)) {
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();
    if (text.length < 4) return null; // 文本太短无法匹配

    // 构建 FP 索引缓存（首次调用时初始化）
    if (!matchFunctionPoint._fpIndex) {
      // 加载精标关键词映射表（fp-map.js），优先使用其关键词
      let curatedFpMap = {};
      try {
        curatedFpMap = require(path.join(__dirname, '..', 'references', 'fp-map.js'));
      } catch (e) {
        // 显式告警：降级到 Git 派生关键词会导致匹配结果漂移
        console.error('⚠️ fp-map.js 加载失败，降级使用 Spec 树关键词匹配（结果可能漂移）: ' + e.message);
      }

      matchFunctionPoint._fpIndex = [];
      const fpList = Object.keys(curatedFpMap).length > 0 ? curatedFpMap : fpMap;
      for (const [code, info] of Object.entries(fpList)) {
        if (!info) continue;
        let keywords = info.keywords || [];
        if (info.name) keywords = [...keywords, info.name];
        const terms = new Set();
        for (const kw of keywords) {
          terms.add(kw.toLowerCase());
        }
        const module = info.module || (fpMap[code] ? fpMap[code].module : '');
        matchFunctionPoint._fpIndex.push({ code, module, name: info.name || '', terms });
      }
    }

    // 为模块级匹配构建 TFS 模块名 → Spec 模块编码的映射（用于加分）
    const moduleHintSet = new Set();
    if (tfsModule) {
      // 尝试从 tfsModuleMap 反查 Spec 编码
      for (const [tfsName, specCode] of Object.entries(tfsModuleMap)) {
        if (tfsName === tfsModule || tfsName.includes(tfsModule) || tfsModule.includes(tfsName)) {
          moduleHintSet.add(specCode);
        }
      }
    }

    // 对每个功能点打分
    let bestMatch = null;
    let bestScore = 0;

    for (const fp of matchFunctionPoint._fpIndex) {
      let score = 0;

      // 评分1: 关键词命中的个数（支持精确匹配和模糊匹配）
      for (const term of fp.terms) {
        if (text.includes(term)) {
          // 精确匹配：长关键词权重更高（更具特异性）
          score += term.length >= 4 ? 2 : 1;
        } else if (term.length >= 4) {
          // 模糊匹配：将关键词拆为 2 字片段，检查是否都出现在文本中
          // 例如 "首页提交" → "首页"+"提交"，在"病案首页在未提交之前"中都能找到
          const segments = [];
          for (let i = 0; i < term.length - 1; i += 2) {
            const seg = term.substring(i, Math.min(i + 2, term.length));
            if (seg.length >= 2) segments.push(seg);
          }
          if (segments.length >= 2 && segments.every(s => text.includes(s))) {
            score += 1; // 模糊匹配权重较低
          }
        }
      }

      // 评分2: 功能点名称出现在标题中（强信号）
      const fpName = fp.name.toLowerCase();
      if (title && title.toLowerCase().includes(fpName)) {
        score += 3;
      }

      // 评分3: TFS 模块名匹配加分
      if (moduleHintSet.has(fp.module)) {
        score += 2;
      }

      // 评分4: 功能点代码的模块前缀与标题中的模块名匹配
      const moduleHint = fp.module.replace(/^[A-Z]+-\d+-/, '').toLowerCase();
      if (title && title.toLowerCase().includes(moduleHint)) {
        score += 1;
      }

      // 评分5: Spec 正文证据（三件套正文与结构树骨架互补）
      //   a) 正文关键词命中（纳入范围/业务规则/验收标准提取的业务短语）→ 加分，权重高于结构树词
      //   b) 正文排除范围引用的其他功能点编码 → 记录到排除索引，供候选间互斥降权
      const evidence = specEvidence[fp.code];
      if (evidence) {
        let evidenceHits = 0;
        for (const kw of evidence.keywords || []) {
          if (text.includes(kw.toLowerCase())) evidenceHits++;
        }
        if (evidenceHits > 0) score += Math.min(4, evidenceHits); // 正文命中最多加 4 分
        if ((evidence.excludeCodes || []).length > 0) {
          matchFunctionPoint._excludeIndex = matchFunctionPoint._excludeIndex || {};
          matchFunctionPoint._excludeIndex[fp.code] = evidence.excludeCodes;
        }
      }

      if (String(itemId) === '1751751' && score > 0) { console.error('DEBUG_MATCH|' + fp.code + '|' + fp.name + '|score=' + score + '|module=' + fp.module + '|terms=' + fp.terms.size); }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = fp;
      }

      // 调试：打印 #1751751 的匹配详情
      if (itemId === '1751751' && score > 0) {
        console.error('  [DEBUG] ' + fp.code + ' (' + fp.name + ') score=' + score + ' module=' + fp.module);
      }

      // 调试：验证 fp-map 是否加载了精标关键词
      if (itemId === '1751751' && fp.code === 'BLGL-13-BASY-007') {
        console.error('  [DEBUG FP] BASY-007 terms count:', fp.terms.size);
        console.error('  [DEBUG FP] BASY-007 terms sample:', [...fp.terms].slice(0, 5));
        console.error('  [DEBUG FP] moduleHintSet:', [...moduleHintSet]);
      }
    }

    // 阈值判断：至少 2 分（即至少命中 2 个短关键词，或 1 个长关键词）
    if (bestMatch && bestScore >= 2) {
      // 正文排除范围互斥校验：若最优候选的排除范围引用了得分次高的候选编码，
      // 且文本与次高候选的关键词更吻合 → 判给次高候选并标注 evidenceRedirect
      const excludeIdx = matchFunctionPoint._excludeIndex || {};
      const blocked = excludeIdx[bestMatch.code] || [];
      if (blocked.length > 0) {
        // 在候选中找被 bestMatch 排除、但自身得分 ≥ 阈值一半 的最强者
        let alt = null;
        for (const fp of matchFunctionPoint._fpIndex) {
          if (!blocked.includes(fp.code)) continue;
          const evidence2 = specEvidence[fp.code];
          if (!evidence2) continue;
          let hits = 0;
          for (const kw of evidence2.keywords || []) {
            if (text.includes(kw.toLowerCase())) hits++;
          }
          if (hits > 0 && (!alt || hits > alt.hits)) alt = { code: fp.code, module: fp.module, hits };
        }
        if (alt) {
          return { fpCode: alt.code, module: alt.module, score: bestScore, evidenceRedirect: bestMatch.code };
        }
      }
      return { fpCode: bestMatch.code, module: bestMatch.module, score: bestScore };
    }
  }

  return null;
}

// ============================================================
// 模块级匹配（兜底）：当功能点匹配不到时，按模块名或关键词归类
// ============================================================
function classifyItem(title, description, tfsModuleName) {
  const text = (title + ' ' + description).toLowerCase();

  // 策略1: 有TFS模块名称 → 精确映射到Spec编码
  if (tfsModuleName && tfsModuleMap[tfsModuleName]) {
    const mappedCode = tfsModuleMap[tfsModuleName];
    if (mappedCode === 'JZBL-06-ALGL' || mappedCode === 'JZBL-05-ZLXXY') {
      if (text.includes('诊疗信息页') || text.includes('急诊视图')) {
        return { code: 'JZBL-05-ZLXXY', isSuggestion: false, confidence: 'high' };
      }
      if (mappedCode === 'JZBL-05-ZLXXY') {
        return { code: 'JZBL-05-ZLXXY', isSuggestion: false, confidence: 'high' };
      }
      return { code: 'JZBL-06-ALGL', isSuggestion: false, confidence: 'high' };
    }
    return { code: mappedCode, isSuggestion: false, confidence: 'high' };
  }

  // 策略2: 无TFS模块名称 → 关键词匹配
  let bestCode = 'unassigned';
  let bestScore = 0;
  for (const rule of keywordRules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += kw.length > 6 ? 3 : (kw.length > 3 ? 2 : 1);
      }
    }
    if (score > bestScore) { bestScore = score; bestCode = rule.code; }
  }

  if (bestScore >= 3) {
    return { code: bestCode, isSuggestion: false, confidence: 'high' };
  } else if (bestScore >= 2) {
    return { code: bestCode, isSuggestion: false, confidence: 'medium' };
  } else {
    return { code: bestCode, isSuggestion: true, confidence: 'low', suggestedCode: bestCode !== 'unassigned' ? bestCode : null };
  }
}

// ============================================================
// 功能点级匹配：在模块内进一步匹配到具体子功能点
// ============================================================

// ============================================================
// 主流程
// ============================================================
async function main() {
  const startTime = Date.now();
  logProgress('');
  logProgress('╔══════════════════════════════════════════════════════════════════════╗');
  logProgress('║   consolidate-requirements-v1                                      ║');
  logProgress('║   TFS 需求 → Spec 知识库功能点聚拢工具                             ║');
  logProgress('╚══════════════════════════════════════════════════════════════════════╝');
  logProgress('');

  // 步骤0: 从 Git 仓库获取 Spec 知识库
  let specModules = {};
  let fpMap = {};
  // 加载本地知识库作为兜底
  const localKb = require(path.join(__dirname, '..', 'references', 'knowledge-base.js'));
  try {
    const kb = await fetchSpecKnowledgeBase();
    // 合并动态加载的模块和本地模块（动态优先，本地作为兜底）
    specModules = { ...localKb.specModules, ...kb.specModules };
    fpMap = { ...kb.fpMap, ...localKb.fpMap };
  } catch (e) {
    logProgress('  ⚠ 知识库获取失败，使用本地缓存数据');
    specModules = localKb.specModules;
    fpMap = localKb.fpMap || require(path.join(__dirname, '..', 'references', 'fp-map.js'));
  }

  // 步骤1: 解析 TFS URL
  logProgress('📡 正在连接 TFS...');
  const tfs = parseTfsUrl(tfsQueryUrl);
  logProgress('  集合: ' + tfs.collection);
  logProgress('  项目: ' + tfs.project);
  logProgress('  查询ID: ' + tfs.queryId);
  logProgress('');

  // 步骤2: 执行 WIQL 查询获取工作项列表
  logProgress('🔍 正在执行查询...');
  const wiqlUrl = `${tfs.base}/tfs/${tfs.collection}/${tfs.project}/_apis/wit/wiql/${tfs.queryId}?api-version=2.0`;
  const queryResult = await request('GET', wiqlUrl);
  const workItems = queryResult.workItems || [];
  logProgress('  查询结果: ' + workItems.length + ' 项');
  logProgress('');

  // 步骤3: 批量获取工作项详情
  logProgress('📦 正在获取需求详情...');
  const ids = workItems.map(w => w.id);
  const fields = ['System.Id','System.Title','System.Description','Winning.Module.name','System.State','System.WorkItemType','Microsoft.VSTS.CMMI.RequirementType'].join(',');

  // TFS 2018 批量获取限制: 一次最多 200 个 ID
  const batchSize = 200;
  let allItems = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const itemsUrl = `${tfs.base}/tfs/${tfs.collection}/${tfs.project}/_apis/wit/workitems?ids=${batch.join(',')}&fields=${fields}&api-version=2.0`;
    const result = await request('GET', itemsUrl);
    allItems = allItems.concat(result.value || []);
  }
  logProgress('  获取完成: ' + allItems.length + ' 项');
  logProgress('');

  // 步骤4: 聚拢分类
  // 目标(1): 按 功能性的 / 接口 / 软件质量 三分类
  // 目标(2): 合并/独立区分仅针对功能性需求
  // 目标(3): 独立性功能需求按 Spec 功能点归类
  logProgress('🏷️  正在匹配 Spec 模块...');
  const groups = {};
  const unassigned = [];
  const suggestions = []; // 建议新增功能点的需求（仅功能性独立需求）
  const baselineItems = []; // 基线排除（仅功能性需求参与基线过滤）
  const interfaceUnassigned = []; // 未匹配到模块的接口需求

  for (const item of allItems) {
    const f = item.fields || {};
    const id = f['System.Id'] || '';
    const title = f['System.Title'] || '';
    const description = stripHtml(f['System.Description'] || '');
    const state = f['System.State'] || '';
    const tfsModule = f['Winning.Module.name'] || '';
    const workItemType = f['System.WorkItemType'] || '';
    const requirementType = f['Microsoft.VSTS.CMMI.RequirementType'] || '';

    // 目标(1): 三分类
    const category = classifyRequirementType(requirementType);
    // 目标(2): 合并识别仅针对功能性需求
    const isMerge = category === '功能性的' && isMergeItem(title);

    // 步骤1: 方法论基线过滤（仅功能性需求；接口/软质按分类单列，不做基线排除）
    const mappedCode = (tfsModule && tfsModuleMap[tfsModule]) ? tfsModuleMap[tfsModule] : '';
    if (category === '功能性的' && isBaselineRequirement(title, description, mappedCode)) {
      baselineItems.push({ id, title, description, state, tfsModule: tfsModule || '(空)', workItemType, requirementType, category, source: '基线排除', isMerge });
      continue;
    }

    // 步骤2: 应纳入功能点 → 语义匹配现有功能点（含 Spec 正文证据）
    const fpResult = matchFunctionPoint(id, fpMap, title, description, tfsModule);
    if (fpResult) {
      const code = fpResult.module;
      if (!groups[code]) {
        const mod = specModules[code] || { sys: '未匹配', domain: '', name: code, fp: 0 };
        groups[code] = { code, sys: mod.sys, domain: mod.domain, name: mod.name, fp: mod.fp, items: [] };
      }
      const specEv = specEvidence[fpResult.fpCode];
      groups[code].items.push({
        id, title, description, state, confidence: 'high', fpCode: fpResult.fpCode,
        workItemType, requirementType, category, isMerge,
        // 正文证据标注：Spec 覆盖状态 + 排除范围改判来源（供报告"正文证据"列与 V4 零覆盖核查）
        specCovered: !!(specEv && specEv.hasSpec),
        evidenceRedirect: fpResult.evidenceRedirect || null
      });
      continue;
    }

    // 步骤3: 无匹配 → 按模块级归类
    const result = classifyItem(title, description, tfsModule);
    const code = result.code;

    // 软质项：即使无功能点匹配，也归入模块级（用于软质详情统计），不标记为新增
    if (category === '软件质量') {
      if (code && code !== 'unassigned' && groups[code]) {
        groups[code].items.push({ id, title, description, state, confidence: result.confidence, fpCode: null, workItemType, requirementType, category, isMerge });
      } else if (code && code !== 'unassigned') {
        const mod = specModules[code] || { sys: '未匹配', domain: '', name: code, fp: 0 };
        groups[code] = { code, sys: mod.sys, domain: mod.domain, name: mod.name, fp: mod.fp, items: [] };
        groups[code].items.push({ id, title, description, state, confidence: result.confidence, fpCode: null, workItemType, requirementType, category, isMerge });
      } else {
        // 连模块都匹配不到的软质项，归入基线排除
        baselineItems.push({ id, title, description, state, tfsModule: tfsModule || '(空)', workItemType, requirementType, category, source: '基线排除（软质无归属）', isMerge });
      }
      continue;
    }

    // 接口项：归入模块级统计，不计入功能点健康度；无模块归属的单列
    if (category === '接口') {
      if (code && code !== 'unassigned') {
        if (!groups[code]) {
          const mod = specModules[code] || { sys: '未匹配', domain: '', name: code, fp: 0 };
          groups[code] = { code, sys: mod.sys, domain: mod.domain, name: mod.name, fp: mod.fp, items: [] };
        }
        groups[code].items.push({ id, title, description, state, confidence: result.confidence, fpCode: null, workItemType, requirementType, category, isMerge });
      } else {
        interfaceUnassigned.push({ id, title, state, tfsModule: tfsModule || '(空)', workItemType, requirementType, category, isMerge });
      }
      continue;
    }

    // 功能性、无匹配 → 建议新增功能点（合并需求不进建议清单，在合并详情单列）
    suggestions.push({
      id, title, state, tfsModule: tfsModule || '(空)',
      suggestedCode: result.suggestedCode || '需新建模块',
      confidence: result.confidence, isMerge, category
    });
  }

  // 计算每个模块的实际匹配功能点数
  const matchedFpCounts = {};
  const matchedFpDetails = {};
  for (const [code, group] of Object.entries(groups)) {
    const matchedFps = new Set();
    const fpDetailList = [];
    for (const item of group.items) {
      const fpResult = matchFunctionPoint(item.id, fpMap);
      if (fpResult && fpResult.fpCode) {
        matchedFps.add(fpResult.fpCode);
        fpDetailList.push({ id: item.id, fpCode: fpResult.fpCode, isSuggestion: false });
      } else if (item.fpCode) {
        matchedFps.add(item.fpCode);
        fpDetailList.push({ id: item.id, fpCode: item.fpCode, isSuggestion: false });
      } else {
        fpDetailList.push({ id: item.id, fpCode: null, isSuggestion: false });
      }
    }
    matchedFpCounts[code] = matchedFps.size;
    matchedFpDetails[code] = fpDetailList;
  }

  // 目标(4): 功能点健康度统计口径 = 独立需求（功能性非合并）+ 软件质量；接口不计入
  const fpStats = {};
  for (const [code, group] of Object.entries(groups)) {
    for (const item of group.items) {
      const fpCode = item.fpCode; // 使用存储的 fpCode，仅当该功能点属于当前模块
      if (!fpCode) continue;
      // 检查该功能点是否属于当前模块
      const fpInfo = fpMap[fpCode];
      if (!fpInfo || fpInfo.module !== code) continue;
      if (!fpStats[fpCode]) fpStats[fpCode] = { independent: 0, soft: 0, total: 0 };
      if (item.category === '软件质量') {
        fpStats[fpCode].soft++;
        fpStats[fpCode].total++;
      } else if (item.category === '功能性的' && !item.isMerge) {
        fpStats[fpCode].independent++;
        fpStats[fpCode].total++;
      }
      // 合并需求与接口需求不计入健康度
    }
  }

  // Spec 正文证据统计：归集结果中各功能点的 Spec 覆盖情况（供第七章与 V4 零覆盖核查）
  const specCoverage = { total: 0, covered: 0, redirectCount: 0 };
  for (const [code, group] of Object.entries(groups)) {
    for (const item of group.items) {
      if (!item.fpCode) continue;
      const fpInfo = fpMap[item.fpCode];
      if (!fpInfo || fpInfo.module !== code) continue;
      if (item.category !== '功能性的' && item.category !== '软件质量') continue;
      specCoverage.total++;
      if (item.specCovered) specCoverage.covered++;
      if (item.evidenceRedirect) specCoverage.redirectCount++;
    }
  }
  logProgress('📎 Spec 正文证据: 归集工单 ' + specCoverage.total + ' 条，已覆盖 Spec 正文 ' + specCoverage.covered +
    ' 条，排除范围改判 ' + specCoverage.redirectCount + ' 条');

  // 步骤5: 输出聚拢清单（三章拆分）
  const sysOrder = ['住院病历', '急诊病历', '门诊病历', '未匹配'];
  const domainOrder = ['病历书写域', '病历流转域', '病历检索与输出', '病历基础支撑', ''];
  const { generateReport } = require(path.join(__dirname, '..', 'references', 'generate-report.js'));
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const mergedReport = generateReport(logResult, logProgress, sysOrder, domainOrder, groups, specModules, fpMap,
    matchedFpCounts, fpStats, unassigned, suggestions, baselineItems, interfaceUnassigned, allItems, allItems, elapsed, outputPath, fs, specCoverage);
  logResult('');
  logResult('# 病历需求归集');
  logResult('');
  logResult('> **总查询工作项**: ' + allItems.length + ' 项  |  主题: 病历条线新增需求  |  数据源: TFS WINNING-6.0');
  logResult('');
  logResult(mergedReport);
  logResult('');
  logResult('---');
  logResult('');
  logResult('> 生成时间: ' + new Date().toLocaleString('zh-CN') + '  |  工具: consolidate-requirements-v1');
  logResult('');
  logProgress('');
  logProgress('📊 总报告已输出到终端');
  // 保存到文件（如果指定了输出路径）
  if (outputPath) {
    try {
      const dir = outputPath.substring(0, Math.max(outputPath.lastIndexOf('\\'), outputPath.lastIndexOf('/')) + 1);
      if (dir) fs.mkdirSync(dir, { recursive: true });
      // 总报告包含所有三章
      fs.writeFileSync(outputPath, outputLines.join(''), 'utf8');
      logProgress('📁 总报告已保存到: ' + outputPath);
    } catch (e) {
      console.error('⚠️ 无法写入输出文件: ' + e.message);
    }
  }
}

main().catch(err => {
  console.error('❌ 错误:', err.message || err.toString());
  if (err.stack) console.error(err.stack);
  process.exit(1);
});