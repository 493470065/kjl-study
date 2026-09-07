const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');

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

  const { marked } = require(tfsClientPath + '/node_modules/marked');
  const { default: TFSClient } = await import(new URL('file://' + tfsClientPath + '/tfs-client.mjs'));
  const client = new TFSClient();

  const workItemId = parseInt(process.env.WORK_ITEM_ID);
  const configPath = process.env.PATHS_CONFIG
    || path.join(os.homedir(), '.claude/skills/std-code-paths/config/paths.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`配置文件不存在: ${configPath}。请确保 std-code-paths 技能已安装。`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const planBaseDir = path.join(config.codeBasePath, config.planBasePath);
  const mdContent = fs.readFileSync(path.join(planBaseDir, String(workItemId), '需求分析.md'), 'utf-8');
  const htmlContent = marked.parse(mdContent);
  console.log('HTML content length:', htmlContent.length);

  const patchDoc = [
    { op: 'add', path: '/fields/Winning.Demand.Analysis', value: htmlContent },
    { op: 'add', path: '/fields/System.History', value: 'AI 需求分析助手自动上传需求分析文档' }
  ];
  const body = JSON.stringify(patchDoc);

  // 直接构造 HTTP 请求（绕过 client.updateWorkItem 的 Content-Length bug）
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
          console.log('上传成功, rev:', JSON.parse(data).rev);
          resolve(data);
        } else {
          reject(new Error(`上传失败: HTTP ${res.statusCode}\n${data}`));
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
