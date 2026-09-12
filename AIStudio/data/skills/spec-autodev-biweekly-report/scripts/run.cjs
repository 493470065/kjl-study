#!/usr/bin/env node
/**
 * 双周报告生成编排入口（run.cjs）
 * 由 AIStudio SkillExecService 以子进程调用，约定：
 *   输入  环境变量 SKILL_ARGS_JSON（也可整体作为一个 JSON 字符串参数传入）:
 *     {
 *       from:       'YYYY-MM-DD'  统计起始日（默认 14 天前）
 *       to:         'YYYY-MM-DD'  统计截止日（默认今天）
 *       issue:      number        期数（缺省自动 = 当前报告 JSON 期数 + 1，首期为 2）
 *       owner:      string        填报人（默认 康景磊）
 *       dept:       string        填报部门（默认 病历）
 *       highlights: string[]      本期自定义亮点（可空）
 *       skipFetch:  boolean       跳过 TFS 采集，直接用 biweekly-data 现有数据生成（调试用）
 *     }
 *   执行  ① node fetch.mjs --from --to（TFS 实时采集，约 10~60s）
 *         ② python generate.py --from --to --issue ...（生成 MD + 工作汇报 JSON）
 *   输出  stdout = JSON 摘要 { ok, from, to, issue, mdPath, jsonPath, fetchTail, genTail, durationMs }
 *         进度/诊断 → stderr
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const SCRIPTS = path.join(SKILL_DIR, 'scripts');
const REPORT_JSON = 'F:/kjl-study/AIStudio/frontend/public/reports/biweekly-autodev-v1.json';
const PY_FALLBACK = 'C:\\Users\\Lenovo\\.workbuddy\\binaries\\python\\versions\\3.13.12\\python.exe';

function readArgs() {
  let raw = process.env.SKILL_ARGS_JSON || '';
  if (!raw.trim()) raw = process.argv[2] || '{}';   // 兼容：对象参数整体作为一个 argv 传入
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch (e) {
    fail('SKILL_ARGS_JSON 不是合法 JSON: ' + e.message);
  }
}

function fail(msg) {
  process.stderr.write('[run.cjs] ' + msg + '\n');
  process.stdout.write(JSON.stringify({ ok: false, error: msg }));
  process.exit(2);
}

function iso(d) { return d.toISOString().slice(0, 10); }

/** 期数自动推断：当前报告 JSON 的 issue + 1 */
function detectIssue() {
  try {
    const j = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf-8'));
    const m = /第\s*(\d+)\s*期/.exec(j.issue || '');
    if (m) return Number(m[1]) + 1;
  } catch { /* 首次生成 */ }
  return 1;
}

/** 运行子进程：stdout/stderr 尾部保留 4000 字符，进度实时转写 stderr */
function run(cmd, argv, cwd, label, timeoutMs) {
  return new Promise((resolve, reject) => {
    process.stderr.write(`[run.cjs] ${label}: ${path.basename(cmd)} ${argv.join(' ')}\n`);
    const p = spawn(cmd, argv, { cwd, windowsHide: true, env: process.env });
    let out = '', err = '';
    const t = setTimeout(() => { p.kill(); reject(new Error(`${label} 超时（${timeoutMs}ms）`)); }, timeoutMs);
    p.stdout.on('data', d => { out += d; if (out.length > 8000) out = out.slice(-4000); process.stderr.write(d); });
    p.stderr.on('data', d => { err += d; if (err.length > 8000) err = err.slice(-4000); });
    p.on('error', e => { clearTimeout(t); reject(e); });
    p.on('exit', code => {
      clearTimeout(t);
      if (code === 0) resolve({ out: out.slice(-4000), err: err.slice(-4000) });
      else reject(new Error(`${label} 退出码 ${code}\n${err.slice(-1500)}`));
    });
  });
}

function findPython() {
  // 优先 PATH；不可用再回落 WorkBuddy 托管运行时（与后端 racc.skills.exec.python 一致）
  const candidates = ['python', 'python3', PY_FALLBACK];
  const test = ['python', '-c', 'import sys'];
  return new Promise(resolve => {
    let i = 0;
    const next = () => {
      if (i >= candidates.length) return resolve(PY_FALLBACK);
      const py = candidates[i++];
      const p = spawn(py, ['-c', 'import sys'], { windowsHide: true });
      p.on('error', () => next());
      p.on('exit', code => resolve(code === 0 ? py : next()));
    };
    next();
  });
}

(async () => {
  const begin = Date.now();
  const a = readArgs();
  const today = iso(new Date());
  const d14 = new Date(); d14.setDate(d14.getDate() - 13);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(a.from || '') ? a.from : iso(d14);
  const to = /^\d{4}-\d{2}-\d{2}$/.test(a.to || '') ? a.to : today;
  const issue = Number.isInteger(a.issue) && a.issue > 0 ? a.issue : detectIssue();
  const owner = String(a.owner || '康景磊');
  const dept = String(a.dept || '病历');
  const highlights = Array.isArray(a.highlights) ? a.highlights.filter(x => String(x).trim()) : [];
  const jsonOut = typeof a.jsonOut === 'string' && a.jsonOut.trim() ? a.jsonOut.trim() : REPORT_JSON;
  process.stderr.write(`[run.cjs] 统计窗口 ${from} ~ ${to}，期数 ${issue}（owner=${owner}, dept=${dept}, 亮点 ${highlights.length} 条）\n`);

  // ① TFS 采集
  let fetchTail = '';
  if (!a.skipFetch) {
    try {
      const r = await run(process.execPath, ['scripts/fetch.mjs', '--from', from, '--to', to], SKILL_DIR, 'TFS 采集', 420000);
      fetchTail = (r.out + '\n' + r.err).trim();
    } catch (e) {
      fail('TFS 采集失败: ' + e.message);
    }
  } else {
    process.stderr.write('[run.cjs] skipFetch=true，跳过 TFS 采集\n');
  }

  // ② 生成报告
  const py = await findPython();
  const genArgs = ['scripts/generate.py', '--from', from, '--to', to, '--issue', String(issue),
    '--owner', owner, '--dept', dept, '--json-out', jsonOut];
  for (const h of highlights) genArgs.push('--highlight', h);
  if (typeof a.outDir === 'string' && a.outDir.trim()) genArgs.push('--out-dir', a.outDir.trim());
  let genTail = '';
  try {
    const r = await run(py, genArgs, SKILL_DIR, '生成报告', 120000);
    genTail = (r.out + '\n' + r.err).trim();
  } catch (e) {
    fail('报告生成失败: ' + e.message);
  }

  const mdPath = typeof a.outDir === 'string' && a.outDir.trim()
    ? path.join(a.outDir.trim(), `【${dept}】产品功能Spec编写&AIFlow双周进度报告（第${issue}期）.md`)
    : `F:/【${dept}】产品功能Spec编写&AIFlow双周进度报告（第${issue}期）.md`;
  const summary = {
    ok: true, from, to, issue, owner, dept,
    mdPath, jsonPath: jsonOut,
    fetchTail: fetchTail.slice(-1200), genTail: genTail.slice(-1200),
    durationMs: Date.now() - begin,
  };
  process.stdout.write(JSON.stringify(summary));
})().catch(e => fail(e.message));
