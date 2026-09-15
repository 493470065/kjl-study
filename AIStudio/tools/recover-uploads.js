#!/usr/bin/env node
/**
 * uploads 目录 → 知识库 恢复脚本
 *
 * 背景：数据库重建后 knowledge_documents 表被清空，但 data/uploads 下 734 个文档
 * 文件本体仍在（md/docx/pdf）。本脚本逐个走正式上传接口重新入库，
 * docx/pdf 由后端 ContentDocumentExtractor 正常抽取正文，FTS/元数据缓存自动重建。
 *
 * 已知数据损失（无法从磁盘恢复）：
 * - 保存到磁盘时文件名里的中文被替换为 _（safeName 规则），原始中文标题丢失
 * - 恢复后的 title = 文件名去时间戳前缀（下划线形态），sourceType=recovered
 *
 * 用法：node tools/recover-uploads.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = 'F:/kjl-study/AIStudio/data/uploads';
const API = 'http://localhost:8091';
const DRY_RUN = process.argv.includes('--dry-run');

async function login() {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const d = await r.json();
  if (!d.token) throw new Error('登录失败: ' + JSON.stringify(d));
  return d.token;
}

async function listExistingTitles(token) {
  // 分页拉全量，按 title 查重（避免重复导入）
  const titles = new Set();
  let page = 0;
  while (true) {
    const r = await fetch(`${API}/api/knowledge?page=${page}&size=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    (d.content || []).forEach((doc) => titles.add(doc.title));
    if (page >= (d.totalPages || 1) - 1) break;
    page++;
  }
  return titles;
}

async function upload(token, filePath, origName) {
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([bytes]), origName);
  form.append('sourceType', 'recovered');
  const r = await fetch(`${API}/api/knowledge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

(async () => {
  const token = await login();
  console.log('[recover] 登录成功');
  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => /\.(md|docx|pdf|txt)$/i.test(f));
  console.log(`[recover] 待处理文件: ${files.length}`);
  const existing = await listExistingTitles(token);
  console.log(`[recover] 知识库现有标题数: ${existing.size}`);

  let ok = 0, skip = 0, fail = 0;
  const errors = [];
  for (const f of files) {
    const orig = f.replace(/^\d+_/, ''); // 去时间戳前缀
    const title = orig.replace(/\.[^.]+$/, '');
    if (existing.has(title)) { skip++; continue; }
    if (DRY_RUN) { console.log(`[dry-run] 将导入: ${orig}`); ok++; continue; }
    try {
      await upload(token, path.join(UPLOAD_DIR, f), orig);
      existing.add(title);
      ok++;
      if (ok % 50 === 0) console.log(`[recover] 进度: ${ok} 已导入, ${skip} 跳过, ${fail} 失败`);
    } catch (e) {
      fail++;
      errors.push(`${orig}: ${e.message}`);
      if (fail <= 5) console.error(`[recover] 失败: ${orig}: ${e.message}`);
    }
  }
  console.log(`[recover] 完成: ${ok} 导入, ${skip} 跳过(已存在), ${fail} 失败`);
  if (errors.length) console.error('[recover] 失败清单(前10):\n' + errors.slice(0, 10).join('\n'));
})();
