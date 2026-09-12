#!/usr/bin/env node
/**
 * 产品功能 Spec 编写 & AIFlow 双周进度报告 —— 数据采集（统计日期可输入）
 *
 * 用法:
 *   node fetch.mjs --from 2026-09-11 [--to 2026-09-24] [--workdir <tfs-query-winex目录>]
 *
 * 参数:
 *   --from     统计起始日 YYYY-MM-DD（必填，Spec 提交与 AIFlow 变化窗口起点）
 *   --to       统计截止日 YYYY-MM-DD（默认=今天，仅用于日志核对；明细窗口截断在 generate.py 完成）
 *   --workdir  TFS 客户端所在目录（默认 F:/kjl-study/AIStudio/data/mcp/tfs-query-winex，
 *              该目录下需有 config.json[serverUrl/pat/project] 与 tfs-client.mjs）
 *
 * 产出（写入 --workdir/biweekly-data/）:
 *   aiflow_items.json       AIFlow 需求池全量（TFS 存储查询 d8d4554b-8918-4a0e-a108-245d227633b4）
 *   spec_tree.json          /Spec 目录树快照（覆盖前自动把旧文件存为 spec_tree_prev.json，供本期结构 diff）
 *   spec_snapshot.zip       /Spec 目录全量 zip（master 分支）
 *   spec_commits.json       自 --from 以来的 /Spec 提交列表
 *   spec_commit_modules.json 提交按「功能模块」归组的摘要（生成器据此定位内容修订模块）
 *   denominator_query.json  AIFlow 占比分母（TFS 存储查询 c5276b73-fed9-4c4f-83c7-86fea07c3ee4，实时执行）
 *
 * 注意: TFS 存储过程查询实测 37~51 秒，属正常。
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath, pathToFileURL } from 'url';

// ---------- 参数解析 ----------
function parseArgs(argv) {
  const args = { from: null, to: null, workdir: 'F:/kjl-study/AIStudio/data/mcp/tfs-query-winex' };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--from') args.from = argv[++i];
    else if (k === '--to') args.to = argv[++i];
    else if (k === '--workdir') args.workdir = argv[++i];
    else if (k === '--help' || k === '-h') { console.log('见文件头注释'); process.exit(0); }
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!args.from) {
    const d = new Date(); d.setDate(d.getDate() - 13);
    args.from = d.toISOString().slice(0, 10);
    console.log(`[参数] 未指定 --from，默认取 14 天前: ${args.from}`);
  }
  if (!args.to) args.to = today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.from) || !/^\d{4}-\d{2}-\d{2}$/.test(args.to)) {
    console.error('日期格式必须为 YYYY-MM-DD'); process.exit(1);
  }
  return args;
}
const ARGS = parseArgs(process.argv);
const FROM = `${ARGS.from}T00:00:00`;
console.log(`[统计窗口] ${ARGS.from} ~ ${ARGS.to}`);

// ---------- TFS 客户端与 HTTP ----------
const WORKDIR = path.resolve(ARGS.workdir);
const OUT = path.join(WORKDIR, 'biweekly-data');
fs.mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(fs.readFileSync(path.join(WORKDIR, 'config.json'), 'utf-8'));
const BASE = cfg.serverUrl.replace(/\/+$/, '');
const PROJECT = encodeURIComponent(cfg.project);
const AUTH = 'Basic ' + Buffer.from(':' + cfg.pat).toString('base64');

function httpGet(url, { binary = false } = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Authorization: AUTH } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location.startsWith('http') ? res.headers.location : BASE + res.headers.location, { binary }).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${buf.toString('utf8').slice(0, 200)}`)); return; }
        resolve(binary ? buf : buf.toString('utf8'));
      });
    }).on('error', reject);
  });
}

// ---------- ① AIFlow 需求池全量 ----------
async function fetchAiflow() {
  const TFSClient = (await import(pathToFileURL(path.join(WORKDIR, 'tfs-client.mjs')))).default;
  const client = new TFSClient();
  const items = await client.runStoredQuery('d8d4554b-8918-4a0e-a108-245d227633b4');
  fs.writeFileSync(path.join(OUT, 'aiflow_items.json'), JSON.stringify(items, null, 2), 'utf8');
  console.log(`[AIFlow] 需求池共 ${items.length} 条`);
  const byState = {};
  for (const it of items) byState[it.state] = (byState[it.state] || 0) + 1;
  console.log('[AIFlow] 状态分布:', JSON.stringify(byState));
  // 按输入日期计算本期活跃（created/changed 落在 [from, to+1) 窗口）
  const d2 = new Date(ARGS.to + 'T00:00:00Z'); d2.setUTCDate(d2.getUTCDate() + 1);
  const TO_EX = d2.toISOString().slice(0, 19);
  const active = items.filter(i => {
    const c = (i.createdDate || ''), h = (i.changedDate || '');
    return (c >= FROM && c < TO_EX) || (h >= FROM && h < TO_EX);
  });
  console.log(`[AIFlow] 本期（${ARGS.from} ~ ${ARGS.to}）活跃: ${active.length} 条`);
}

// ---------- ② Spec 目录树 + zip 快照 ----------
async function resolveRepo() {
  const candidates = ['winning-record-konwledge', 'winning-record-knowledge'];
  for (const name of candidates) {
    try {
      const meta = JSON.parse(await httpGet(`${BASE}/${PROJECT}/_apis/git/repositories/${name}?api-version=4.1`));
      console.log(`[Spec] 仓库解析成功: ${meta.name} (id=${meta.id})`);
      return meta.name;
    } catch (e) { /* 尝试下一个 */ }
  }
  throw new Error('仓库无法解析（konwledge/knowledge 均不可用）');
}

async function fetchSpec() {
  const repo = await resolveRepo();
  // 2.1 目录树 JSON（覆盖前归档上期快照）
  const treeUrl = `${BASE}/${PROJECT}/_apis/git/repositories/${encodeURIComponent(repo)}/items` +
    `?scopePath=%2FSpec&recursionLevel=Full&versionType=branch&version=master&api-version=4.1`;
  const treeJson = JSON.parse(await httpGet(treeUrl));
  const treePath = path.join(OUT, 'spec_tree.json');
  if (fs.existsSync(treePath)) {
    fs.copyFileSync(treePath, path.join(OUT, 'spec_tree_prev.json'));
    console.log('[Spec] 上期目录树已归档 → spec_tree_prev.json');
  }
  fs.writeFileSync(treePath, JSON.stringify(treeJson, null, 2), 'utf8');
  const blobs = (treeJson.value || []).filter(o => o.gitObjectType === 'blob');
  const trees = (treeJson.value || []).filter(o => o.gitObjectType === 'tree');
  console.log(`[Spec] 目录树: ${trees.length} 个目录 / ${blobs.length} 个文件`);
  // 2.2 全量 zip
  const zipUrl = `${BASE}/${PROJECT}/_apis/git/repositories/${encodeURIComponent(repo)}/items` +
    `?scopePath=%2FSpec&recursionLevel=Full&versionType=branch&version=master&api-version=4.1&download=true`;
  const zip = await httpGet(zipUrl, { binary: true });
  fs.writeFileSync(path.join(OUT, 'spec_snapshot.zip'), zip);
  console.log(`[Spec] zip 下载完成: ${(zip.length / 1024 / 1024).toFixed(2)} MB`);
  return repo;
}

// ---------- ③ Spec 提交（自 --from 起） + 按模块归组 ----------
async function fetchSpecCommits(repo) {
  const url = `${BASE}/${PROJECT}/_apis/git/repositories/${encodeURIComponent(repo)}/commits` +
    `?searchCriteria.itemPath=%2FSpec&searchCriteria.fromDate=${encodeURIComponent(FROM)}` +
    `&searchCriteria.$top=200&api-version=4.1`;
  let commits = [];
  try {
    commits = (JSON.parse(await httpGet(url)).value) || [];
    console.log(`[Spec提交] ${ARGS.from} 以来共 ${commits.length} 个提交（涉及 /Spec）`);
  } catch (e) {
    console.log('[Spec提交] 获取失败:', e.message.slice(0, 200));
  }
  fs.writeFileSync(path.join(OUT, 'spec_commits.json'), JSON.stringify(commits, null, 2), 'utf8');
  // 逐提交取变更路径（上限 60 个，防止过慢），按 6 段路径的模块层归组
  const byModule = {};
  const detail = [];
  for (const c of commits.slice(0, 60)) {
    try {
      const full = JSON.parse(await httpGet(`${BASE}/${PROJECT}/_apis/git/repositories/${encodeURIComponent(repo)}/commits/${c.commitId}?api-version=4.1&changeCount=100`));
      const mods = new Set();
      for (const ch of (full.changes || [])) {
        const p = ch.item?.path || '';
        const parts = p.split('/');
        if (parts.length >= 6 && parts[1] === 'Spec') mods.add(`${parts[2]}|${parts[3]}|${parts[4]}`);
      }
      detail.push({ commitId: c.commitId, date: c.author?.date, author: c.author?.name, comment: (c.comment || '').split('\n')[0], modules: [...mods] });
      for (const m of mods) {
        byModule[m] = byModule[m] || { commits: 0, authors: new Set(), lastDate: '' };
        byModule[m].commits += 1;
        byModule[m].authors.add(c.author?.name || '');
        if ((c.author?.date || '') > byModule[m].lastDate) byModule[m].lastDate = c.author?.date || '';
      }
    } catch (e) {
      detail.push({ commitId: c.commitId, date: c.author?.date, author: c.author?.name, comment: (c.comment || '').slice(0, 70), modules: [], error: e.message.slice(0, 100) });
    }
  }
  const byModuleOut = {};
  for (const [k, v] of Object.entries(byModule)) {
    const [line, product, mod] = k.split('|');
    byModuleOut[k] = { line, product, mod, commits: v.commits, authors: [...v.authors].filter(Boolean), lastDate: v.lastDate };
  }
  fs.writeFileSync(path.join(OUT, 'spec_commit_modules.json'), JSON.stringify({ from: ARGS.from, to: ARGS.to, totalCommits: commits.length, detail, byModule: byModuleOut }, null, 2), 'utf8');
  console.log(`[Spec提交] 涉及模块 ${Object.keys(byModuleOut).length} 个 → spec_commit_modules.json`);
}

// ---------- ④ AIFlow 占比分母（存储查询，实时执行） ----------
async function fetchDenominator() {
  const QUERY_ID = 'c5276b73-fed9-4c4f-83c7-86fea07c3ee4'; // 【RACC】病历病案需求总库存关闭池
  const res = JSON.parse(await httpGet(`${BASE}/${PROJECT}/_apis/wit/wiql/${QUERY_ID}?api-version=4.1`));
  const ids = (res.workItems || []).map(w => w.id);
  console.log(`[分母] 存储查询命中 ${ids.length} 条（asOf ${res.asOf}）`);
  const TFSClient = (await import(pathToFileURL(path.join(WORKDIR, 'tfs-client.mjs')))).default;
  const client = new TFSClient();
  const witApi = await client.getWorkItemApi();
  const byProject = {}, byType = {};
  const BATCH = 150;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = await witApi.getWorkItems(ids.slice(i, i + BATCH), ['System.TeamProject', 'System.WorkItemType']);
    for (const w of batch) {
      byProject[w.fields['System.TeamProject']] = (byProject[w.fields['System.TeamProject']] || 0) + 1;
      byType[w.fields['System.WorkItemType']] = (byType[w.fields['System.WorkItemType']] || 0) + 1;
    }
  }
  console.log(`[分母] 按项目: ${JSON.stringify(byProject)}`);
  fs.writeFileSync(path.join(OUT, 'denominator_query.json'), JSON.stringify({
    queryId: QUERY_ID, asOf: res.asOf, total: ids.length, byProject, byType,
  }, null, 2), 'utf8');
  console.log('[分母] 已保存 denominator_query.json');
}

// ---------- 主流程 ----------
(async () => {
  let repo;
  try { repo = await fetchSpec(); } catch (e) { console.error('[Spec] 失败:', e.message); process.exitCode = 1; }
  try { await fetchAiflow(); } catch (e) { console.error('[AIFlow] 失败:', e.message); process.exitCode = 1; }
  if (repo) { try { await fetchSpecCommits(repo); } catch (e) { console.error('[Spec提交] 失败:', e.message); } }
  try { await fetchDenominator(); } catch (e) { console.error('[分母] 失败:', e.message); process.exitCode = 1; }
  console.log('\n采集完成。下一步: python generate.py --from', ARGS.from, '--to', ARGS.to, '--issue <N>');
})();
