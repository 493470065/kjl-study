#!/usr/bin/env node
/**
 * 合理性分析执行入口（run.cjs）
 * 由 AIStudio SkillExecService 以子进程调用，约定：
 *   输入    环境变量 SKILL_ARGS_JSON = { fp, reqItems, softItems, ...自定义参数 }
 *   方法论  本技能目录下 SKILL.md（+ references/ 前 3 个 .md 作为参考材料）
 *   输出    stdout = Markdown 分析报告；进度/诊断信息 → stderr
 *   模型    环境变量 LLM_BASE_URL / LLM_API_KEY / LLM_MODEL（WinCode 网关，OpenAI 兼容）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const SKILL_DIR = path.resolve(__dirname, '..');
const MAX_METHOD_CHARS = 16000;   // SKILL.md 注入上限
const MAX_REF_CHARS = 5000;       // 每个参考材料注入上限
const MAX_REFS = 3;
const MAX_ITEMS = 100;            // 工单清单最多条数
const ITEM_DESC_CHARS = 160;      // 单条工单描述截断
const HTTP_TIMEOUT_MS = 280000;   // 留余量（前端 timeoutMs=300s，后端默认 120s 但请求带 300s）

function die(msg, code = 2) {
  process.stderr.write('[run.cjs] ' + msg + '\n');
  process.exit(code);
}

function readArgs() {
  const raw = process.env.SKILL_ARGS_JSON || '';
  if (!raw.trim()) return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch (e) {
    die('SKILL_ARGS_JSON 不是合法 JSON: ' + e.message);
  }
}

function clamp(s, n) {
  s = String(s == null ? '' : s);
  return s.length <= n ? s : s.slice(0, n) + '…';
}

function trimItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_ITEMS).map(it => ({
    id: it.id,
    type: it.reqType || it.type || '',
    title: clamp(it.title, 80),
    desc: clamp(it.description || it.desc || '', ITEM_DESC_CHARS),
    state: it.state || it.status || '',
    customer: it.customer || '',
    product: it.product || ''
  }));
}

function readMethodology() {
  const md = path.join(SKILL_DIR, 'SKILL.md');
  if (!fs.existsSync(md)) die('SKILL.md 不存在: ' + md);
  let text = fs.readFileSync(md, 'utf8');
  if (text.length > MAX_METHOD_CHARS) text = text.slice(0, MAX_METHOD_CHARS) + '\n…[方法论已截断]';
  const refs = [];
  const rdir = path.join(SKILL_DIR, 'references');
  if (fs.existsSync(rdir)) {
    const files = fs.readdirSync(rdir)
      .filter(f => f.toLowerCase().endsWith('.md'))
      .sort()
      .slice(0, MAX_REFS);
    for (const f of files) {
      let t = fs.readFileSync(path.join(rdir, f), 'utf8');
      if (t.length > MAX_REF_CHARS) t = t.slice(0, MAX_REF_CHARS) + '\n…[截断]';
      refs.push('#### 参考材料：' + f + '\n\n' + t);
    }
  }
  return { text, refs };
}

/** OpenAI 兼容 chat/completions；证书错误自动降级重试一次（内网网关自签证书兜底） */
function llmChat(urlStr, apiKey, model, messages) {
  const body = JSON.stringify({ model, messages, temperature: 0.3 });
  const attempt = (rejectUnauthorized) => new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      timeout: HTTP_TIMEOUT_MS,
      rejectUnauthorized: rejectUnauthorized,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      res.setEncoding('utf8');
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + clamp(data, 300)));
          return;
        }
        try {
          const root = JSON.parse(data);
          const content = root.choices && root.choices[0] && root.choices[0].message && root.choices[0].message.content;
          if (!content) {
            const errMsg = root.error && root.error.message ? root.error.message : clamp(data, 300);
            reject(new Error('响应缺少 content: ' + errMsg));
            return;
          }
          resolve(content);
        } catch (e) {
          // New API 型网关对未知路径返回 200 + SPA HTML
          if (data.trimStart().startsWith('<')) {
            reject(new Error('网关返回了 HTML 页面而非 JSON（端点路径可能不正确）'));
            return;
          }
          reject(new Error('响应解析失败: ' + e.message + ' | ' + clamp(data, 300)));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('请求超时（' + HTTP_TIMEOUT_MS + 'ms）')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  return attempt(true).catch(e => {
    const m = String(e.message || e);
    if (/CERT|SELF_SIGNED|DEPTH_ZERO/i.test(m)) {
      process.stderr.write('[run.cjs] 证书校验失败，降级为不校验重试: ' + m + '\n');
      return attempt(false);
    }
    throw e;
  });
}

(async () => {
  const t0 = Date.now();
  const args = readArgs();
  const apiKey = process.env.LLM_API_KEY;
  const base = (process.env.LLM_BASE_URL || '').trim().replace(/\/+$/, '');
  const model = (process.env.LLM_MODEL || 'glm-5').trim();
  if (!apiKey) die('缺少环境变量 LLM_API_KEY（应由后端启动时经 env.sh 注入）');
  if (!base) die('缺少环境变量 LLM_BASE_URL（应由后端启动时经 env.sh 注入）');

  const { text: method, refs } = readMethodology();
  const fp = args.fp && typeof args.fp === 'object' ? args.fp : {};
  const reqItems = trimItems(args.reqItems);
  const softItems = trimItems(args.softItems);
  const extra = {};
  for (const [k, v] of Object.entries(args)) {
    if (!['fp', 'reqItems', 'softItems'].includes(k) && v != null && v !== '') extra[k] = v;
  }

  const system = [
    '你是卫宁健康 WiNEX 病历管理产品线的资深产品设计专家，正在通过 AIStudio 平台的技能执行通道生成分析报告。',
    '请严格遵循下方技能方法论，对给定的单个功能点执行分析，输出一份结构完整、可直接归档的 Markdown 分析报告。',
    '',
    '【技能方法论（SKILL.md）】',
    method,
    refs.length ? '\n【参考材料】\n\n' + refs.join('\n\n') : ''
  ].join('\n');

  const user = [
    '【待分析功能点数据】',
    '```json',
    JSON.stringify({ fp, reqItems, softItems, extra }, null, 2),
    '```',
    reqItems.length >= MAX_ITEMS || softItems.length >= MAX_ITEMS ? '（注：工单清单超出 ' + MAX_ITEMS + ' 条已截断，按已给样本分析）' : '',
    '',
    '【输出要求】',
    '- 直接输出 Markdown 报告正文，不要任何寒暄、前言或"以下是报告"之类的解释',
    '- 报告结构与章节命名遵循技能方法论的约定',
    '- 每项判定都要给出理由，并尽量引用上方工单的编号/标题作为证据',
    '- 工单数量为 0 时如实说明数据不足，基于功能点定义本身给出分析'
  ].filter(Boolean).join('\n');

  process.stderr.write('[run.cjs] 调用 LLM: model=' + model + ', 系统提示 ' + system.length + ' 字符, 数据 ' + user.length + ' 字符\n');
  // 端点拼接：…/ai → …/ai/v1/chat/completions；…/v1 → …/v1/chat/completions；已含 /chat/completions 则原样
  let url = base;
  if (!url.endsWith('/chat/completions')) {
    url = url.endsWith('/v1') ? url + '/chat/completions' : url + '/v1/chat/completions';
  }
  let content;
  try {
    content = await llmChat(url, apiKey, model, [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);
  } catch (e) {
    die('LLM 调用失败: ' + (e.message || e));
  }
  content = String(content).trim();
  if (!content) die('模型返回空内容');
  process.stderr.write('[run.cjs] 完成，耗时 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's，输出 ' + content.length + ' 字符\n');
  process.stdout.write(content + '\n');
})().catch(e => die('未捕获异常: ' + (e && e.stack || e)));
