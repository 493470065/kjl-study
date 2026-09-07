const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

/**
 * 解码 TFS URL 中的文件名（兼容 GBK 和 UTF-8 编码）
 */
function decodeTFSFileName(encoded) {
  if (!encoded) return '';
  // 先尝试 UTF-8 解码
  try {
    return decodeURIComponent(encoded);
  } catch (_) {}
  // UTF-8 失败，尝试 GBK 解码
  try {
    const iconv = require(path.join(__dirname, '..', '..', '..', 'mcp', 'mcp-tfs-query', 'node_modules', 'iconv-lite'));
    const bytes = [];
    const parts = encoded.split(/%([0-9A-Fa-f]{2})/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0 && parts[i]) {
        // 非 percent-encoded 部分（ASCII 字符）
        for (const ch of parts[i]) bytes.push(ch.charCodeAt(0));
      } else if (i % 2 === 1) {
        bytes.push(parseInt(parts[i], 16));
      }
    }
    return iconv.decode(Buffer.from(bytes), 'gbk');
  } catch (_) {}
  return encoded;
}

async function main() {
  // 环境变量校验
  const tfsClientDir = process.env.TFS_CLIENT_DIR;
  if (!tfsClientDir) {
    throw new Error('环境变量 TFS_CLIENT_DIR 未设置。请确保 tfs-client.mjs 已安装。');
  }
  const tfsClientPath = path.resolve(tfsClientDir);
  if (!fs.existsSync(path.join(tfsClientPath, 'tfs-client.mjs'))) {
    throw new Error(`TFS Client 未找到: ${tfsClientPath}/tfs-client.mjs 不存在。`);
  }

  if (!process.env.WORK_ITEM_ID || isNaN(parseInt(process.env.WORK_ITEM_ID))) {
    throw new Error('环境变量 WORK_ITEM_ID 未设置或不是有效数字。');
  }

  const { default: TFSClient } = await import(new URL('file://' + tfsClientPath + '/tfs-client.mjs'));
  const client = new TFSClient();
  const workItemId = parseInt(process.env.WORK_ITEM_ID);

  // 根据 serverUrl 协议自动选择 http/https
  function createTfsRequest(urlObj, options) {
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    return lib.request({
      ...options,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
    });
  }

  const workItem = await client.getWorkItem(workItemId);
  const relations = workItem.relations || [];

  const attachmentRelations = [];
  relations.forEach((r, index) => {
    if (r.rel === 'AttachedFile') {
      const urlMatch = r.url.match(/fileName=([^&]+)/);
      const fileName = urlMatch ? decodeTFSFileName(urlMatch[1]) : (r.attributes?.name || '');
      attachmentRelations.push({ index, fileName, url: r.url });
    }
  });

  const nameGroups = {};
  for (const att of attachmentRelations) {
    if (!nameGroups[att.fileName]) nameGroups[att.fileName] = [];
    nameGroups[att.fileName].push(att);
  }

  const toRemove = [];
  for (const [name, items] of Object.entries(nameGroups)) {
    if (items.length > 1) {
      const oldItems = items.slice(0, -1);
      for (const item of oldItems) {
        toRemove.push({ index: item.index, fileName: name });
      }
    }
  }

  if (toRemove.length === 0) {
    console.log('无需清理旧附件');
    process.exit(0);
  }

  // remove 操作必须从后往前（索引大的先移除），避免索引偏移
  toRemove.sort((a, b) => b.index - a.index);

  const patchOps = toRemove.map(item => ({
    op: 'remove',
    path: `/relations/${item.index}`
  }));

  console.log(`准备移除 ${toRemove.length} 个旧附件:`, toRemove.map(i => i.fileName).join(', '));

  const body = JSON.stringify(patchOps);
  const urlObj = new URL(`${client.serverUrl}/_apis/wit/workitems/${workItemId}?api-version=4.1`);
  const authToken = Buffer.from(':' + client.patToken).toString('base64');

  await new Promise((resolve, reject) => {
    const req = createTfsRequest(urlObj, {
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${authToken}`,
        'Content-Length': Buffer.byteLength(body, 'utf-8')
      }
    });
    req.on('response', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('旧附件清理完成');
          resolve();
        } else {
          reject(new Error(`清理失败: HTTP ${res.statusCode}\n${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body, 'utf-8');
    req.end();
  });
}
main().catch(err => {
  const safeMessage = err.message.replace(/Basic\s+[A-Za-z0-9+/=]+/g, 'Basic [REDACTED]');
  console.error(safeMessage);
  process.exit(1);
});
