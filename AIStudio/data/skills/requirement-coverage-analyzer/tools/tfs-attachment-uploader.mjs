#!/usr/bin/env node
/**
 * TFS附件上传模块
 * 将需求覆盖率分析报告自动上传到TFS工作项作为附件
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import azureDevOps from 'azure-devops-node-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * TFS附件上传器
 */
class TFSAttachmentUploader {
  constructor(serverUrl, pat, collection) {
    this.serverUrl = serverUrl;
    this.pat = pat;
    this.collection = collection;
    this.connection = null;
  }

  /**
   * 初始化TFS连接
   */
  async connect() {
    try {
      const authHandler = azureDevOps.getPersonalAccessTokenHandler(this.pat);
      // WebApi 是一个类，需要使用 new 关键字调用
      this.connection = new azureDevOps.WebApi(
        this.serverUrl,
        authHandler
      );
      console.log('  ✓ TFS连接成功');
      return true;
    } catch (error) {
      console.error(`  ✗ TFS连接失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 上传文件到TFS工作项作为附件
   * @param {number} workItemId - 工作项ID
   * @param {string} filePath - 要上传的文件路径
   * @param {string} comment - 附件注释
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAttachment(workItemId, filePath, comment = null) {
    try {
      if (!this.connection) {
        await this.connect();
      }

      // 读取文件内容
      const content = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      // 获取工作项API
      const witApi = await this.connection.getWorkItemTrackingApi();

      // 步骤1：上传附件内容到TFS
      // azure-devops-node-api 需要 Stream 格式的数据
      console.log(`  正在上传附件内容: ${fileName}`);

      // 将 Buffer 转换为 Readable Stream
      const stream = Readable.from(content);
      stream.path = filePath; // 设置文件名属性

      const attachment = await witApi.createAttachment(null, stream, fileName);

      console.log(`  ✓ 附件内容已上传: ID=${attachment.id}`);

      // 步骤2：将附件关联到工作项
      console.log(`  正在关联附件到工作项 ${workItemId}...`);
      const attachmentComment = comment || `需求覆盖率分析报告 - 自动上传于 ${new Date().toLocaleString('zh-CN')}`;

      const document = [
        {
          op: "add",
          path: "/relations/-",
          value: {
            rel: "AttachedFile",
            url: attachment.url,
            attributes: {
              comment: attachmentComment
            }
          }
        }
      ];

      await witApi.updateWorkItem(null, document, workItemId);

      console.log(`  ✓ 附件已关联到工作项`);
      return {
        success: true,
        attachmentId: attachment.id,
        url: attachment.url
      };
    } catch (error) {
      console.error(`  ✗ 附件上传失败: ${error.message}`);
      if (error.stack) {
        console.error(`  堆栈: ${error.stack}`);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量上传多个文件
   * @param {number} workItemId - 工作项ID
   * @param {Array<string>} filePaths - 文件路径数组
   * @returns {Promise<Object>} 上传结果汇总
   */
  async uploadAttachments(workItemId, filePaths) {
    const results = {
      workItemId,
      total: filePaths.length,
      successful: 0,
      failed: 0,
      attachments: []
    };

    for (const filePath of filePaths) {
      try {
        // 检查文件是否存在
        await fs.access(filePath);
        const result = await this.uploadAttachment(workItemId, filePath);
        if (result.success) {
          results.successful++;
          results.attachments.push({
            file: path.basename(filePath),
            attachmentId: result.attachmentId
          });
        } else {
          results.failed++;
        }
      } catch (error) {
        console.log(`  ⚠ 文件不存在: ${filePath}`);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * 从工作项的描述字段中提取Markdown报告
   * @param {number} workItemId - 工作项ID
   * @returns {Promise<Object>} 提取的报告路径列表
   */
  async extractReportsFromDescription(workItemId) {
    // 这个功能可以扫描工作项描述中嵌入的markdown代码块
    // 解析出报告内容并保存为文件
    // 然后上传为附件
    return [];
  }

  /**
   * 为工作项添加标记（Tag）
   * 标记以"AI-"开头，简洁易懂
   * @param {number} workItemId - 工作项ID
   * @param {string} tag - 要添加的标记（不含AI-前缀）
   * @returns {Promise<Object>} 操作结果
   */
  async addTag(workItemId, tag) {
    try {
      if (!this.connection) {
        await this.connect();
      }

      // 确保标记以"AI-"开头
      const formattedTag = tag.startsWith('AI-') ? tag : `AI-${tag}`;

      // 获取工作项API
      const witApi = await this.connection.getWorkItemTrackingApi();

      // 步骤1：获取当前工作项的标记
      console.log(`  正在获取工作项 ${workItemId} 的当前标记...`);
      const currentWorkItem = await witApi.getWorkItem(workItemId, ['System.Tags']);
      const currentTags = currentWorkItem.fields?.['System.Tags'] || '';

      // 步骤2：解析现有标记
      const tagArray = currentTags
        ? currentTags.split(';').map(t => t.trim()).filter(t => t)
        : [];

      // 检查标记是否已存在
      if (tagArray.includes(formattedTag)) {
        console.log(`  ℹ️  标记 "${formattedTag}" 已存在，跳过添加`);
        return {
          success: true,
          skipped: true,
          message: `标记 "${formattedTag}" 已存在`
        };
      }

      // 步骤3：添加新标记
      tagArray.push(formattedTag);
      const newTags = tagArray.join('; ');

      // 步骤4：更新工作项
      console.log(`  正在添加标记: ${formattedTag}`);
      const document = [
        {
          op: "replace",
          path: "/fields/System.Tags",
          value: newTags
        }
      ];

      await witApi.updateWorkItem(null, document, workItemId);

      console.log(`  ✓ 标记已添加: ${formattedTag}`);
      return {
        success: true,
        skipped: false,
        tag: formattedTag,
        message: `标记 "${formattedTag}" 已添加`
      };
    } catch (error) {
      console.error(`  ✗ 添加标记失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成固定的AI分析标记
   * @returns {string} 标记内容（不含AI-前缀）
   */
  static generateFixedTag() {
    return 'Coverage';
  }
}

/**
 * 从配置文件加载TFS连接信息
 */
async function loadTFSConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('无法加载TFS配置文件:', error.message);
    return null;
  }
}

/**
 * 主函数 - 命令行接口
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'upload':
      await handleUpload(args.slice(1));
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * 处理上传命令
 */
async function handleUpload(args) {
  if (args.length < 2) {
    console.error('用法: node tfs-attachment-uploader.mjs upload <工作项ID> <文件路径>');
    console.error('示例: node tfs-attachment-uploader.mjs upload 123456 /path/to/report.md');
    return;
  }

  const workItemId = parseInt(args[0]);
  const filePath = args[1];
  const comment = args[2] || null;

  // 加载TFS配置
  const configPath = path.join(__dirname, '../../tfs2018-integration/config/tfs-config.json');
  const config = await loadTFSConfig(configPath);

  if (!config || !config.pat) {
    console.error('错误: 未找到TFS配置或PAT Token');
    console.log('请先配置 TFS 认证信息');
    return;
  }

  const serverUrl = config.serverUrl || `http://tfs2018-web.winning.com.cn:8080/tfs/${config.collection || 'WINNING-6.0'}`;

  console.log(`\nTFS附件上传`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`工作项ID: ${workItemId}`);
  console.log(`文件路径: ${filePath}`);
  console.log(`TFS服务器: ${serverUrl}`);
  console.log();

  const uploader = new TFSAttachmentUploader(
    serverUrl,
    config.pat,
    config.collection || 'WINNING-6.0'
  );

  const result = await uploader.uploadAttachment(workItemId, filePath, comment);

  console.log();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (result.success) {
    console.log('✓ 上传成功');
    console.log(`  附件ID: ${result.attachmentId}`);
    console.log(`  URL: ${result.url}`);
  } else {
    console.log('✗ 上传失败');
    console.log(`  错误: ${result.error}`);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
TFS附件上传工具

用法:
  node tfs-attachment-uploader.mjs <command> [options]

命令:
  upload <工作项ID> <文件路径> [注释]  上传文件到TFS工作项
  help                                   显示帮助信息

示例:
  # 上传单个文件
  node tfs-attachment-uploader.mjs upload 123456 /path/to/report.md

  # 上传带注释
  node tfs-attachment-uploader.mjs upload 123456 /path/to/report.md "需求覆盖率分析报告"

配置:
  配置文件位于: ../../tfs2018-integration/config/tfs.json
  需要包含PAT Token用于认证
`);
}

// 导出类和函数
export { TFSAttachmentUploader };
export default TFSAttachmentUploader;

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
