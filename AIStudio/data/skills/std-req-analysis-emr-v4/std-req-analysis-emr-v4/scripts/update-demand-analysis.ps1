param(
    [Parameter(Mandatory = $true)]
    [int]$Id,

    [Parameter(Mandatory = $true)]
    [string]$MarkdownFilePath,

    [string]$CollectionHint = "60项目",

    [string]$ClientDir = "",

    [switch]$ConvertOnly,

    [string]$HtmlOutputPath = ""
)

$ErrorActionPreference = "Stop"

$resolvedMarkdown = (Resolve-Path -LiteralPath $MarkdownFilePath).Path
if (-not (Test-Path -LiteralPath $resolvedMarkdown -PathType Leaf)) {
    throw "Markdown file not found: $MarkdownFilePath"
}

if (-not $ConvertOnly -and [string]::IsNullOrWhiteSpace($ClientDir)) {
    $candidateDirs = New-Object System.Collections.Generic.List[string]
    $explicitClientDir = $null

    foreach ($envName in @("TFS_MCP_CLIENT_DIR", "TFS_CLIENT_DIR", "MCP_TFS_QUERY_DIR")) {
        $value = [Environment]::GetEnvironmentVariable($envName)
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            if (Test-Path -LiteralPath (Join-Path $value "tfs-client.mjs") -PathType Leaf) {
                $explicitClientDir = $value
                break
            }
            $candidateDirs.Add($value) | Out-Null
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($explicitClientDir)) {
        $ClientDir = $explicitClientDir
    } else {
        $homeDir = [Environment]::GetFolderPath("UserProfile")
        foreach ($path in @(
            (Join-Path $homeDir ".agents\skills\mcp-tfs-query"),
            (Join-Path $homeDir ".codex\skills\mcp-tfs-query"),
            (Join-Path $homeDir ".claude\skills\mcp-tfs-query"),
            (Join-Path $homeDir ".trae-cn\mcps\mcp-tfs-query"),
            (Join-Path $homeDir ".trae\skills\mcp-tfs-query"),
            (Join-Path $homeDir ".hermes\skills\agents\mcp-tfs-query")
        )) {
            if (-not [string]::IsNullOrWhiteSpace($path)) {
                $candidateDirs.Add($path) | Out-Null
            }
        }

        $orderedCandidates = @($candidateDirs | Select-Object -Unique)
        $candidateRows = for ($i = 0; $i -lt $orderedCandidates.Count; $i++) {
            $path = $orderedCandidates[$i]
            if (-not (Test-Path -LiteralPath (Join-Path $path "tfs-client.mjs") -PathType Leaf)) {
                continue
            }
            $file = Join-Path $path "tfs-client.mjs"
            $content = Get-Content -LiteralPath $file -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
            $score = 0
            if ($content -match "updateDemandAnalysis") { $score += 100 }
            if ($content -match "detectCollection") { $score += 50 }
            if ($content -match "searchAllCollections") { $score += 20 }
            if ($content -match "TFS_CONFIG_PATH|TFS_SERVER_URL|TFS_PAT") { $score += 5 }
            [pscustomobject]@{
                Path = $path
                Score = $score
                Priority = $i
            }
        }

        $ClientDir = $candidateRows |
            Sort-Object -Property @{ Expression = "Score"; Descending = $true }, @{ Expression = "Priority"; Descending = $false }, Path |
            Select-Object -ExpandProperty Path -First 1
    }
}

if (-not $ConvertOnly -and [string]::IsNullOrWhiteSpace($ClientDir)) {
    throw "TFS client directory not found. Set TFS_MCP_CLIENT_DIR to the active mcp-tfs-query directory."
}

if (-not $ConvertOnly) {
    $clientFile = Join-Path $ClientDir "tfs-client.mjs"
    if (-not (Test-Path -LiteralPath $clientFile -PathType Leaf)) {
        throw "TFS client not found: $clientFile"
    }

    Write-Host "[TFS] Using client: $clientFile"
} else {
    $clientFile = ""
}

$node = "node"

$clientFileJson = if ([string]::IsNullOrWhiteSpace($clientFile)) { "null" } else { ConvertTo-Json -Compress $clientFile }
$markdownJson = ConvertTo-Json -Compress $resolvedMarkdown
$collectionHintJson = if ([string]::IsNullOrWhiteSpace($CollectionHint)) { "null" } else { ConvertTo-Json -Compress $CollectionHint }

$runner = @'
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return text;
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => inlineMarkdown(cell.trim()));
}

function isSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const closeParagraph = (paragraph) => {
    if (paragraph.length) {
      out.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph.length = 0;
    }
  };

  const paragraph = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeParagraph(paragraph);
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeParagraph(paragraph);
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      closeParagraph(paragraph);
      const headers = splitTableRow(trimmed);
      out.push('<table>');
      out.push(`<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`);
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = splitTableRow(lines[i]);
        out.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
        i++;
      }
      out.push('</table>');
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      closeParagraph(paragraph);
      out.push('<ul>');
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        out.push(`<li>${inlineMarkdown(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      closeParagraph(paragraph);
      out.push('<ol>');
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        out.push(`<li>${inlineMarkdown(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push('</ol>');
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }
  closeParagraph(paragraph);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
body{font-family:"Microsoft YaHei",Arial,sans-serif;line-height:1.55;color:#333;font-size:13px;padding:8px;}
h1{font-size:18px;color:#2c3e50;border-bottom:1px solid #409EFF;padding-bottom:4px;}
h2{font-size:16px;color:#34495e;border-bottom:1px solid #E4E7ED;padding-bottom:3px;margin-top:14px;}
h3{font-size:14px;color:#409EFF;margin-top:10px;}
p{margin:6px 0;}
ul,ol{margin:6px 0 8px 22px;padding:0;}
li{margin:3px 0;}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:12px;}
th,td{border:1px solid #DCDFE6;padding:5px 7px;text-align:left;vertical-align:top;}
th{background:#F5F7FA;color:#303133;font-weight:bold;}
code{background:#F5F7FA;color:#E6A23C;padding:1px 3px;border-radius:3px;font-family:Consolas,monospace;}
</style>
</head>
<body>
${out.join('\n')}
</body>
</html>`;
}

function tfsRequest(url, method, token, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestBody = body === null || body === undefined
      ? null
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(String(body), 'utf8');
    const requestHeaders = {
      ...headers,
      Authorization: `Basic ${Buffer.from(`:${token}`).toString('base64')}`,
      Accept: 'application/json'
    };
    if (requestBody && !requestHeaders['Content-Length']) {
      requestHeaders['Content-Length'] = requestBody.length;
    }
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: requestHeaders
    };
    const requestModule = urlObj.protocol === 'https:' ? https : http;
    const req = requestModule.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    req.on('error', reject);
    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
}

async function patchDemandAnalysis(client, workItemId, html) {
  if (!client.serverUrl || !client.patToken) {
    throw new Error('The selected TFS client does not expose serverUrl/patToken for skill-local REST update.');
  }
  const projectPath = client.currentProject ? `${encodeURIComponent(client.currentProject)}/` : '';
  const updateUrl = `${client.serverUrl}/${projectPath}_apis/wit/workitems/${workItemId}?api-version=4.1`;
  const document = [{
    op: 'add',
    path: '/fields/Winning.Demand.Analysis',
    value: html
  }];
  const response = await tfsRequest(updateUrl, 'PATCH', client.patToken, JSON.stringify(document), {
    'Content-Type': 'application/json-patch+json; charset=utf-8'
  });
  if (response.statusCode !== 200) {
    throw new Error(`TFS demand analysis update failed: HTTP ${response.statusCode}\nURL: ${updateUrl}\n${response.body}`);
  }
  return JSON.parse(response.body);
}

async function getDemandAnalysis(client, workItemId) {
  if (!client.serverUrl || !client.patToken) {
    return '';
  }
  const projectPath = client.currentProject ? `${encodeURIComponent(client.currentProject)}/` : '';
  const getUrl = `${client.serverUrl}/${projectPath}_apis/wit/workitems/${workItemId}?$expand=all&api-version=4.1`;
  const response = await tfsRequest(getUrl, 'GET', client.patToken);
  if (response.statusCode !== 200) {
    throw new Error(`TFS demand analysis verification failed: HTTP ${response.statusCode}\nURL: ${getUrl}\n${response.body}`);
  }
  const workItem = JSON.parse(response.body);
  return workItem?.fields?.['Winning.Demand.Analysis'] ?? '';
}

async function getWorkItemRaw(client, workItemId) {
  if (!client.serverUrl || !client.patToken) {
    throw new Error('The selected TFS client does not expose serverUrl/patToken for skill-local REST read.');
  }
  const projectPath = client.currentProject ? `${encodeURIComponent(client.currentProject)}/` : '';
  const getUrl = `${client.serverUrl}/${projectPath}_apis/wit/workitems/${workItemId}?$expand=all&api-version=4.1`;
  const response = await tfsRequest(getUrl, 'GET', client.patToken);
  if (response.statusCode !== 200) {
    throw new Error(`TFS work item read failed: HTTP ${response.statusCode}\nURL: ${getUrl}\n${response.body}`);
  }
  return JSON.parse(response.body);
}

async function removeExistingAttachment(client, workItemId, fileName) {
  const workItem = await getWorkItemRaw(client, workItemId);
  const relations = workItem?.relations ?? [];
  const existingIndex = relations.findIndex(relation => {
    if (relation.rel !== 'AttachedFile') {
      return false;
    }
    const relationName = relation.attributes?.name;
    if (relationName === fileName) {
      return true;
    }
    try {
      const url = new URL(relation.url);
      return url.searchParams.get('fileName') === fileName || url.searchParams.get('FileName') === fileName;
    } catch {
      return false;
    }
  });
  if (existingIndex < 0) {
    return false;
  }
  const projectPath = client.currentProject ? `${encodeURIComponent(client.currentProject)}/` : '';
  const updateUrl = `${client.serverUrl}/${projectPath}_apis/wit/workitems/${workItemId}?api-version=4.1`;
  const response = await tfsRequest(updateUrl, 'PATCH', client.patToken, JSON.stringify([{
    op: 'remove',
    path: `/relations/${existingIndex}`
  }]), {
    'Content-Type': 'application/json-patch+json; charset=utf-8'
  });
  if (response.statusCode !== 200) {
    throw new Error(`TFS attachment relation remove failed: HTTP ${response.statusCode}\nURL: ${updateUrl}\n${response.body}`);
  }
  return true;
}

async function uploadMarkdownAttachment(client, workItemId, markdownPath) {
  if (!client.serverUrl || !client.patToken) {
    throw new Error('The selected TFS client does not expose serverUrl/patToken for skill-local attachment upload.');
  }
  const fileName = path.basename(markdownPath);
  await removeExistingAttachment(client, workItemId, fileName);

  const uploadUrl = new URL(`${client.serverUrl}/_apis/wit/attachments`);
  uploadUrl.searchParams.set('fileName', fileName);
  uploadUrl.searchParams.set('api-version', '4.1');
  const fileContent = fs.readFileSync(markdownPath);
  const uploadResponse = await tfsRequest(uploadUrl.href, 'POST', client.patToken, fileContent, {
    'Content-Type': 'application/octet-stream'
  });
  if (uploadResponse.statusCode !== 200 && uploadResponse.statusCode !== 201) {
    throw new Error(`TFS markdown attachment upload failed: HTTP ${uploadResponse.statusCode}\nURL: ${uploadUrl.href}\n${uploadResponse.body}`);
  }
  const attachmentUrl = JSON.parse(uploadResponse.body).url;

  const projectPath = client.currentProject ? `${encodeURIComponent(client.currentProject)}/` : '';
  const updateUrl = `${client.serverUrl}/${projectPath}_apis/wit/workitems/${workItemId}?api-version=4.1`;
  const response = await tfsRequest(updateUrl, 'PATCH', client.patToken, JSON.stringify([{
    op: 'add',
    path: '/relations/-',
    value: {
      rel: 'AttachedFile',
      url: attachmentUrl,
      attributes: {
        comment: 'AI demand analysis markdown source'
      }
    }
  }]), {
    'Content-Type': 'application/json-patch+json; charset=utf-8'
  });
  if (response.statusCode !== 200) {
    throw new Error(`TFS markdown attachment relation add failed: HTTP ${response.statusCode}\nURL: ${updateUrl}\n${response.body}`);
  }
  const updatedWorkItem = JSON.parse(response.body);
  return {
    fileName,
    attachmentUrl,
    rev: updatedWorkItem.rev
  };
}

const markdown = fs.readFileSync(__MARKDOWN_JSON__, 'utf8');
const html = markdownToHtml(markdown);
if (__CONVERT_ONLY__) {
  const outputPath = __HTML_OUTPUT_PATH_JSON__;
  if (outputPath) {
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(JSON.stringify({
      converted: true,
      outputPath,
      contentLength: html.length
    }, null, 2));
  } else {
    console.log(html);
  }
} else {
const { default: TFSClient } = await import(pathToFileURL(__CLIENT_FILE_JSON__).href);
let client;
try {
  client = new TFSClient(__COLLECTION_HINT_JSON__);
} catch {
  client = new TFSClient();
}

if (typeof client.getWorkItem === 'function') {
  try {
    await client.getWorkItem(__WORK_ITEM_ID__, null, true, __COLLECTION_HINT_JSON__);
  } catch {
    await client.getWorkItem(__WORK_ITEM_ID__);
  }
}

let result;
let writtenLength = html.length;
result = await patchDemandAnalysis(client, __WORK_ITEM_ID__, html);

let verified = false;
let savedLength = 0;
const saved = await getDemandAnalysis(client, __WORK_ITEM_ID__);
savedLength = String(saved).length;
verified = savedLength > 1000 && !String(saved).includes('\uFFFD');
const markdownAttachment = await uploadMarkdownAttachment(client, __WORK_ITEM_ID__, __MARKDOWN_JSON__);

console.log(JSON.stringify({
  id: result.id ?? result.workItemId ?? __WORK_ITEM_ID__,
  rev: markdownAttachment.rev ?? result.rev ?? result.revision,
  url: result.url,
  contentLength: writtenLength,
  savedLength,
  verified,
  markdownAttachment,
  updated: true
}, null, 2));
}
'@

$htmlOutputPathJson = if ([string]::IsNullOrWhiteSpace($HtmlOutputPath)) {
    "null"
} else {
    $resolvedHtmlOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($HtmlOutputPath)
    ConvertTo-Json -Compress $resolvedHtmlOutput
}

$runner = $runner.Replace("__CLIENT_FILE_JSON__", $clientFileJson).
    Replace("__MARKDOWN_JSON__", $markdownJson).
    Replace("__COLLECTION_HINT_JSON__", $collectionHintJson).
    Replace("__WORK_ITEM_ID__", [string]$Id).
    Replace("__CONVERT_ONLY__", $(if ($ConvertOnly) { "true" } else { "false" })).
    Replace("__HTML_OUTPUT_PATH_JSON__", $htmlOutputPathJson)

$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ("update-demand-analysis-" + [guid]::NewGuid().ToString("N") + ".mjs")
try {
    Set-Content -LiteralPath $tempFile -Value $runner -Encoding UTF8
    if (-not $ConvertOnly) {
        Push-Location $ClientDir
    }
    try {
        & $node $tempFile
        if ($LASTEXITCODE -ne 0) {
            throw "updateDemandAnalysis failed with exit code $LASTEXITCODE"
        }
    } finally {
        if (-not $ConvertOnly) {
            Pop-Location
        }
    }
} finally {
    if (Test-Path -LiteralPath $tempFile) {
        Remove-Item -LiteralPath $tempFile -Force
    }
}
