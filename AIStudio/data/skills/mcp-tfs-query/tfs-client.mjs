/**
 * TFS 2018 Client Wrapper
 * 卫宁健康 WINNING-6.0 团队
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import azureDevOps from 'azure-devops-node-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 服务器配置
const DEFAULT_SERVER_URL = 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0';

// 内置项目列表
const PROJECTS = {
  'OA4.0': '4150312b-3a53-4da7-a8a7-e2bfe7fd970f',
  'win-cloud': 'b46e3a4d-0b96-4d7b-aa4a-216121a1ef73',
  'WiNEX-Copilot': 'a3f67cbb-d375-4a58-a6c8-da448150c495',
  '售前演示': 'ddbd09b1-59ea-420d-843d-2f70ef9aa8e8',
  'WiNEX-DCP': 'f4e79b7d-13e6-4e47-9a17-570d72d4f6ef',
  'W.in-DEMO': 'fa4a1591-32d3-4e3f-82c2-761005d119a2',
  'WiNEX-PatientInterests': '6a84d2a9-b5ce-44e5-bce0-171ad6cd96e1',
  'W.in-MVP': '8c3c22dc-6d35-49b5-8589-3375adb60a84',
  'WiNEX-MDM': 'aa8c3418-9ec5-4c9e-8209-e229aeda3cfa',
  'HUMANITY': '595b77d4-6f9a-46cf-9aeb-ea2afdef59d6',
  'WiNEX-Cloud': 'd4361d76-6ff9-4fc3-851c-536d9305c40c',
  'WiNEX-MiddlePlatform': '8ef8a81d-59bd-455e-a86c-2687ba9b6e03',
  'WiNEX-Inpatient-2': 'fa2bf9fc-fdc9-4167-ae72-feef8525e1f5',
  'WiNEX-Outpatient': 'e17bb6a1-2677-4695-8202-c3c296bbd05c',
  'WiNEX-General': '250f7599-5c8c-4e93-892c-71157224ae73',
  'WiNEX-Integration': '7c4d1061-6885-4c24-8096-1e1fc9795432',
  'MiddlePlatform': '5c6e7482-f12f-418d-8994-bc5aeaea75a8',
  'WiNEX-CaseHistory': '739645d0-5770-4efc-98d3-33c98e749837',
  'Public Query': 'bad35cc1-f0d6-4f80-8ba0-6f166b3ef6be',
  'WiNEX_WXP': '89f17307-4986-4251-a04f-e534f9a1b99d',
  'UED': '58e8e9b0-5975-48d2-af2d-2719222c7ff0',
  'WiNEX-Inpatient': '9e4a971d-4027-4c9a-b55b-f0b74487afb5',
  'WiNEX-Triage': 'af9ab1c7-72ef-42cf-91a3-ef771be43f5a',
  'WiNEX-Emergency': '5f498025-58dd-4ba0-8137-3fc962e1acaf',
  'WiNEX-Management': 'e92e726a-8dbe-4385-998f-58182a4ddb1c',
  'WiNEX-Taikang': 'af798a82-646e-467a-8f90-8f3b2c9c39a4',
  'WiNEX-BasicInfoService': '7dfa9b49-818c-4765-8aae-aec1304af4e9',
  'WiNEX-Specialized': '8f70e3be-75e3-4969-a3fb-93481dc2c589',
  'WINEX-ConfigManage': '18eb3c40-2667-435f-80df-51ce43b24935',
  'WiNEX-HospitalAdministration': '6dcd7f28-99b5-4f43-8877-82230e999906',
  'WiNEX-MY': '6cdb1969-bbbc-4ea2-818a-ae29389df42e'
};

/**
 * 加载配置
 */
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      '配置文件不存在: ' + configPath + '\n' +
      '请先创建配置文件，格式如下:\n' +
      '{\n' +
      '  "serverUrl": "http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0",\n' +
      '  "pat": "your-personal-access-token"\n' +
      '}'
    );
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  return {
    serverUrl: config.serverUrl || DEFAULT_SERVER_URL,
    pat: config.pat
  };
}

/**
 * TFS 客户端类
 */
class TFSClient {
  constructor() {
    const config = loadConfig();
    this.serverUrl = config.serverUrl;
    this.patToken = config.pat;
    this.authHandler = azureDevOps.getPersonalAccessTokenHandler(config.pat);
    this.connection = new azureDevOps.WebApi(this.serverUrl, this.authHandler);
    this.witApi = null;
  }

  /**
   * 获取工作项跟踪 API
   */
  async getWorkItemApi() {
    if (!this.witApi) {
      this.witApi = await this.connection.getWorkItemTrackingApi();
    }
    return this.witApi;
  }

  /**
   * 按 ID 获取单个工作项
   */
  /**
 * 根据工作项ID获取工作项详细信息
 * @param {string|number} id - 要获取的工作项ID
 * @param {string} [project=null] - 可选的项目名称，用于限定查询范围
 * @returns {Promise<Object>} 包含工作项详细信息的Promise对象
 */
async getWorkItem(id, project = null) {
    const witApi = await this.getWorkItemApi();
    return await witApi.getWorkItem(id, null, null, 'All', project);
  }

  /**
   * 批量获取工作项
   */
  async getWorkItems(ids, project = null) {
    const witApi = await this.getWorkItemApi();
    return await witApi.getWorkItems(ids, null, null, 'All', null, project);
  }

  /**
   * 格式化工作项为易读格式
   */
  formatWorkItem(workItem) {
    const fields = workItem.fields || {};

    return {
      id: workItem.id,
      title: fields['System.Title'] || '',
      type: fields['System.WorkItemType'] || '',
      state: fields['System.State'] || '',
      assignedTo: fields['System.AssignedTo']?.displayName || '未分配',
      project: fields['System.TeamProject'] || '',
      description: fields['System.Description'] || '',
      priority: fields['Microsoft.VSTS.Common.Priority'] || '',
      severity: fields['Microsoft.VSTS.Common.Severity'] || '',
      reason: fields['System.Reason'] || '',
      createdDate: fields['System.CreatedDate'] || '',
      changedDate: fields['System.ChangedDate'] || '',
      url: workItem.url || ''
    };
  }

  /**
   * 获取工作项的附件列表
   */
  getAttachments(workItem) {
    const relations = workItem.relations || [];
    return relations
      .filter(r => r.rel === 'AttachedFile')
      .map((r, index) => ({
        index,
        name: r.attributes?.name || `附件${index + 1}`,
        url: r.url
      }));
  }

  /**
   * 确保目录存在
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  /**
   * 下载附件到指定目录（自动处理 gzip 解压）
   */
  async downloadAttachment(attachmentUrl, targetPath) {
    return new Promise((resolve, reject) => {
      // 准备请求选项
      const urlObj = new URL(attachmentUrl);
      const isHttps = urlObj.protocol === 'https:';
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {}
      };

      // 添加 PAT 认证
      if (this.patToken) {
        requestOptions.headers.Authorization = `Basic ${Buffer.from(':' + this.patToken).toString('base64')}`;
      }

      // 根据协议选择 http 或 https
      const requestModule = isHttps ? https : http;

      const req = requestModule.request(requestOptions, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${res.statusCode}`));
          return;
        }

        // 创建可写流
        const fileStream = fs.createWriteStream(targetPath);

        // 判断是否为 gzip 压缩（通过检查响应头或实际内容）
        const isGzip = res.headers['content-encoding'] === 'gzip';

        if (isGzip) {
          // 使用 gzip 解压后写入文件
          const gunzip = zlib.createGunzip();
          res.pipe(gunzip)
            .on('error', (err) => {
              fs.unlink(targetPath, () => {});
              reject(err);
            })
            .pipe(fileStream);
        } else {
          // 直接写入文件
          res.pipe(fileStream);
        }

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(targetPath);
        });

        fileStream.on('error', (err) => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      });

      req.on('error', (err) => {
        fs.unlink(targetPath, () => {}); // 删除不完整的文件
        reject(err);
      });

      req.end();
    });
  }

  /**
   * 下载工作项的所有附件到指定目录
   */
  async downloadWorkItemAttachments(workItemId, targetDir = null) {
    const workItem = await this.getWorkItem(workItemId);
    const attachments = this.getAttachments(workItem);

    if (attachments.length === 0) {
      return {
        success: true,
        message: '工作项没有附件',
        downloaded: []
      };
    }

    // 默认下载到当前项目的 PRD 目录
    const downloadDir = targetDir || path.join(process.cwd(), 'PRD', String(workItemId));
    this.ensureDir(downloadDir);

    const downloaded = [];

    for (const attachment of attachments) {
      try {
        // 从 URL 中提取文件名或使用索引
        const urlMatch = attachment.url.match(/filename=([^&]+)/);
        let fileName = urlMatch ? decodeURIComponent(urlMatch[1]) : attachment.name;

        const targetPath = path.join(downloadDir, fileName);
        await this.downloadAttachment(attachment.url, targetPath);
        downloaded.push(fileName);
      } catch (error) {
        downloaded.push(`${attachment.name} (下载失败: ${error.message})`);
      }
    }

    return {
      success: true,
      message: `下载完成，共 ${attachments.length} 个附件`,
      downloadDir,
      downloaded
    };
  }

  /**
   * 上传附件到工作项
   * @param {string|number} workItemId - 工作项ID
   * @param {string} filePath - 要上传的文件路径
   * @param {string} [fileName] - 可选的文件名，默认使用原文件名
   * @param {string} [comment] - 可选的附件注释
   */
  async uploadAttachment(workItemId, filePath, fileName = null, comment = null) {
    // 确保文件存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const actualFileName = fileName || path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;

    // 构建上传附件的 URL
    // 格式: {serverUrl}/_apis/wit/attachments?fileName={name}&api-version=4.1
    const uploadUrl = new URL(
      `${this.serverUrl}/_apis/wit/attachments`
    );
    uploadUrl.searchParams.append('fileName', actualFileName);
    uploadUrl.searchParams.append('api-version', '4.1');

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath);

    // 发送上传请求
    const uploadResponse = await this.makeHttpRequest(
      uploadUrl.href,
      'POST',
      fileContent,
      {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(fileSize),
      }
    );

    if (uploadResponse.statusCode !== 201) {
      throw new Error(`上传附件失败: HTTP ${uploadResponse.statusCode}`);
    }

    const attachmentData = JSON.parse(uploadResponse.body);
    const attachmentUrl = attachmentData.url;

    // 准备更新工作项，添加附件关联
    const document = [
      {
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'AttachedFile',
          url: attachmentUrl,
          attributes: {
            comment: comment || `上传文件: ${actualFileName}`,
          },
        },
      },
    ];

    // 发送更新请求
    const updateUrl = `${this.serverUrl}/_apis/wit/workitems/${workItemId}?api-version=4.1`;
    const updateResponse = await this.makeHttpRequest(
      updateUrl,
      'PATCH',
      JSON.stringify(document),
      {
        'Content-Type': 'application/json-patch+json',
      }
    );

    if (updateResponse.statusCode !== 200) {
      throw new Error(`关联附件到工作项失败: HTTP ${updateResponse.statusCode}`);
    }

    return {
      success: true,
      workItemId,
      fileName: actualFileName,
      attachmentUrl,
      message: `成功上传附件 "${actualFileName}" 到工作项 ${workItemId}`,
    };
  }

  /**
   * 批量上传多个附件到工作项
   * @param {string|number} workItemId - 工作项ID
   * @param {string[]} filePaths - 要上传的文件路径数组
   * @param {string} [comment] - 可选的附件注释
   */
  async uploadAttachments(workItemId, filePaths, comment = null) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        const fileName = path.basename(filePath);
        const result = await this.uploadAttachment(
          workItemId,
          filePath,
          fileName,
          comment
        );
        results.push({
          success: true,
          fileName,
          message: result.message,
        });
      } catch (error) {
        results.push({
          success: false,
          fileName: path.basename(filePath),
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return {
      workItemId,
      total: results.length,
      successCount,
      failCount,
      results,
      message: `上传完成: 成功 ${successCount} 个, 失败 ${failCount} 个`,
    };
  }

  /**
   * 更新工作项
   * @param {string|number} workItemId - 工作项ID
   * @param {Object} updates - 更新操作对象，格式为 { fieldPath: value }
   *                          例如: { 'System.Tags': '标签1;标签2', 'System.State': 'Active' }
   * @param {string} [comment] - 可选的变更注释
   */
  async updateWorkItem(workItemId, updates, comment = null) {
    // 将 updates 对象转换为 JSON Patch 文档
    const document = [];

    for (const [fieldPath, value] of Object.entries(updates)) {
      // 判断是添加还是替换
      const op = 'add';  // TFS 使用 add，如果字段已存在则会替换

      document.push({
        op,
        path: `/fields/${fieldPath}`,
        value,
      });
    }

    // 如果有注释，添加到历史记录
    if (comment) {
      document.push({
        op: 'add',
        path: '/fields/System.History',
        value: comment,
      });
    }

    // 发送更新请求
    const updateUrl = `${this.serverUrl}/_apis/wit/workitems/${workItemId}?api-version=4.1`;
    const updateResponse = await this.makeHttpRequest(
      updateUrl,
      'PATCH',
      JSON.stringify(document),
      {
        'Content-Type': 'application/json-patch+json',
      }
    );

    if (updateResponse.statusCode !== 200) {
      throw new Error(
        `更新工作项失败: HTTP ${updateResponse.statusCode}\n` +
        `响应: ${updateResponse.body}`
      );
    }

    const updatedWorkItem = JSON.parse(updateResponse.body);

    return {
      success: true,
      workItemId,
      updatedFields: Object.keys(updates),
      revision: updatedWorkItem.rev,
      message: `成功更新工作项 ${workItemId}`,
      workItem: this.formatWorkItem(updatedWorkItem),
    };
  }

  /**
   * 发送 HTTP 请求的辅助方法
   */
  makeHttpRequest(url, method, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          ...headers,
          Authorization: `Basic ${Buffer.from(':' + this.patToken).toString('base64')}`,
          Accept: 'application/json',
        },
      };

      const requestModule = isHttps ? https : http;

      const req = requestModule.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData,
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * 获取所有项目列表
   */
  getProjects() {
    return Object.keys(PROJECTS).map(name => ({
      name,
      id: PROJECTS[name]
    }));
  }
}

export default TFSClient;
