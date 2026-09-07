#!/usr/bin/env node
/**
 * Image Analyzer
 * 图片分析器 - 分析 Bug 截图和附件图片
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'https';
import { execSync } from 'child_process';
import zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 图片分析器类
 */
class ImageAnalyzer {
  constructor(options = {}) {
    this.downloadDir = options.downloadDir || './temp/images';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.timeout = options.timeout || 30000;
    this.aiClient = options.aiClient || null;
    this.tfsConfig = options.tfsConfig || null;
    this.tfsClient = options.tfsClient || null;

    // 确保下载目录存在
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * 获取TFS认证头
   * @returns {object} 认证头对象
   */
  _getAuthHeaders() {
    if (!this.tfsConfig || !this.tfsConfig.pat) {
      return {};
    }
    // TFS使用Basic认证，用户名为空，密码为PAT
    const auth = Buffer.from(`:${this.tfsConfig.pat}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`
    };
  }

  /**
   * 使用TFS客户端下载附件
   * @param {string} attachmentId - 附件ID
   * @param {string} filename - 保存的文件名
   * @returns {Promise<string>} 本地文件路径
   */
  async _downloadTFSAttachment(attachmentId, filename) {
    if (!this.tfsClient) {
      throw new Error('TFS客户端未初始化');
    }

    const filepath = path.join(this.downloadDir, filename);

    // 检查文件是否已存在
    if (fs.existsSync(filepath)) {
      return filepath;
    }

    try {
      // 获取WorkItemTracking API
      const witApi = await this.tfsClient.getWorkItemApi();

      // 使用TFS API下载附件内容（返回流）
      const stream = await witApi.getAttachmentContent(attachmentId);

      // 收集流数据并处理可能的gzip压缩
      return new Promise((resolve, reject) => {
        const chunks = [];

        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        stream.on('end', async () => {
          try {
            let buffer = Buffer.concat(chunks);

            // 检查是否为gzip压缩数据（magic bytes: 1f 8b）
            if (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
              // 解压gzip数据
              buffer = await gunzip(buffer);
            }

            // 写入文件
            fs.writeFileSync(filepath, buffer);
            resolve(filepath);
          } catch (err) {
            fs.unlink(filepath, () => {});
            reject(new Error(`处理附件数据失败: ${err.message}`));
          }
        });

        stream.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      });
    } catch (error) {
      throw new Error(`TFS附件下载失败: ${error.message}`);
    }
  }

  /**
   * 从 Bug 描述中提取图片 URL
   * @param {string} description - Bug 描述（HTML格式）
   * @returns {array} 图片 URL 列表
   */
  extractImageUrls(description) {
    const urls = [];

    if (!description) return urls;

    // 首先解码HTML实体（&amp; → &）
    const decodedDescription = description.replace(/&amp;/gi, '&');

    // TFS 附件 URL 格式（支持FileNameGuid参数）
    const tfsAttachmentPattern = /https?:\/\/[^\s"'>]+?\.(?:png|jpg|jpeg|gif|bmp|webp)/gi;
    const tfsMatches = decodedDescription.match(tfsAttachmentPattern);
    if (tfsMatches) {
      urls.push(...tfsMatches);
    }

    // HTML img 标签（支持单引号、双引号、无引号）
    const imgTagPattern = /<img[^>]+src=(["']?)([^"'\s>]+)\1/gi;
    let match;
    while ((match = imgTagPattern.exec(decodedDescription)) !== null) {
      urls.push(match[2]);
    }

    // CSS 背景图片
    const bgImagePattern = /background-image:\s*url\(["']?([^"')]+?)["']?\)/gi;
    while ((match = bgImagePattern.exec(decodedDescription)) !== null) {
      urls.push(match[1]);
    }

    // 去重
    return [...new Set(urls)];
  }

  /**
   * 下载图片
   * @param {string} url - 图片 URL
   * @param {string} filename - 保存的文件名
   * @returns {Promise<string>} 本地文件路径
   */
  async downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
      const filepath = path.join(this.downloadDir, filename);

      // 检查文件是否已存在
      if (fs.existsSync(filepath)) {
        resolve(filepath);
        return;
      }

      const file = fs.createWriteStream(filepath);

      const authHeaders = this._getAuthHeaders();

      // 处理TFS附件URL - 转换为下载URL
      let downloadUrl = url;
      if (url.includes('/_apis/wit/attachments/')) {
        // TFS附件URL需要添加download参数来获取实际内容
        downloadUrl = url.includes('download=true') ? url : url + '&download=true';
      }

      const urlObj = new URL(downloadUrl);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: this.timeout,
        rejectUnauthorized: false, // 允许自签名证书（内部TFS服务器）
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/octet-stream',
          ...authHeaders
        }
      };

      const req = http.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败: ${res.statusCode}`));
          return;
        }

        const fileSize = parseInt(res.headers['content-length'], 10);
        if (fileSize > this.maxFileSize) {
          reject(new Error(`文件过大: ${fileSize} bytes`));
          return;
        }

        res.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });

        file.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      });

      req.on('error', (err) => {
        file.close();
        fs.unlink(filepath, () => {});
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error('下载超时'));
      });

      req.setTimeout(this.timeout);
      req.end();
    });
  }

  /**
   * 分析图片内容
   * @param {string} imagePath - 图片路径
   * @returns {Promise<object>} 分析结果
   */
  async analyzeImage(imagePath) {
    const result = {
      path: imagePath,
      filename: path.basename(imagePath),
      size: fs.statSync(imagePath).size,
      format: path.extname(imagePath).substring(1),
      analysis: {}
    };

    try {
      // 1. 检查是否为图片文件
      const imageInfo = this._getImageInfo(imagePath);
      result.imageInfo = imageInfo;

      // 2. 使用 AI 分析图片内容（如果可用）
      if (this.aiClient) {
        result.analysis.ai = await this._analyzeWithAI(imagePath);
      } else {
        // 3. 基础分析（不使用 AI）
        result.analysis.basic = await this._basicAnalysis(imagePath);
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * 获取图片信息
   */
  _getImageInfo(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();

    // 使用 file 命令获取图片信息（如果可用）
    try {
      const output = execSync(`file "${imagePath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const info = {
        format: ext.substring(1),
        dimensions: null,
        colorspace: null
      };

      // 解析 file 命令输出
      const match = output.match(/(\d+)x(\d+)/);
      if (match) {
        info.dimensions = { width: match[1], height: match[2] };
      }

      return info;
    } catch (error) {
      return { format: ext.substring(1) };
    }
  }

  /**
   * 使用 AI 分析图片
   */
  async _analyzeWithAI(imagePath) {
    // 将图片转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this._getMimeType(imagePath);

    // 构建分析提示词
    const prompt = `请分析这张Bug截图，提取以下信息：

1. **错误信息**：是否有错误提示、异常信息、警告信息
2. **UI问题**：是否有显示异常、布局问题、样式问题
3. **操作界面**：这是什么类型的界面（列表、表单、详情页、弹窗等）
4. **数据状态**：页面是否有数据、是否为空、是否显示异常数据
5. **关键元素**：截图中的关键UI元素（按钮、输入框、表格、文本等）
6. **问题推断**：根据截图内容，可能是什么问题

请以JSON格式返回分析结果。`;

    try {
      // 这里应该调用实际的 AI API
      // 暂时返回模拟结果
      return {
        method: 'ai',
        note: '需要集成 AI 图片分析 API',
        prompt
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * 基础图片分析（不使用 AI）
   */
  async _basicAnalysis(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();
    const stats = fs.statSync(imagePath);

    return {
      format: ext.substring(1),
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      aspectRatio: this._calculateAspectRatio(imagePath)
    };
  }

  /**
   * 计算图片宽高比
   */
  _calculateAspectRatio(imagePath) {
    try {
      const output = execSync(`file "${imagePath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const match = output.match(/(\d+)x(\d+)/);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        return (width / height).toFixed(2);
      }
    } catch (error) {
      // 忽略
    }
    return null;
  }

  /**
   * 获取 MIME 类型
   */
  _getMimeType(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/png';
  }

  /**
   * 批量分析 Bug 中的图片
   * @param {object} bug - Bug 对象
   * @returns {Promise<object>} 分析结果
   */
  async analyzeBugImages(bug) {
    const result = {
      bugId: bug.id,
      images: [],
      summary: {
        total: 0,
        success: 0,
        failed: 0
      }
    };

    // 提取图片 URL（从 description 和 reproSteps 两个字段）
    const urls = new Set();

    // 从 description 提取
    const descUrls = this.extractImageUrls(bug.description || '');
    descUrls.forEach(url => urls.add(url));

    // 从 reproSteps 提取
    const reproUrls = this.extractImageUrls(bug.reproSteps || '');
    reproUrls.forEach(url => urls.add(url));

    const uniqueUrls = Array.from(urls);
    result.summary.total = uniqueUrls.length;

    if (uniqueUrls.length === 0) {
      result.summary.note = '未找到图片';
      return result;
    }

    // 下载并分析每张图片
    for (let i = 0; i < uniqueUrls.length; i++) {
      const url = uniqueUrls[i];
      const filename = `bug-${bug.id}-${i}${path.extname(new URL(url).pathname) || '.png'}`;

      try {
        console.log(`  [图片分析 ${i + 1}/${uniqueUrls.length}] 下载图片...`);

        let imagePath;

        // 检查是否为TFS附件URL
        if (url.includes('/_apis/wit/attachments') && this.tfsClient) {
          // 提取附件ID（支持两种格式）
          // 格式1: /_apis/wit/attachments/{id}
          // 格式2: /_apis/wit/attachments?FileNameGuid={id}
          let attachmentId = null;

          // 尝试格式1
          const idMatch = url.match(/\/_apis\/wit\/attachments\/([a-f0-9-]+)/i);
          if (idMatch) {
            attachmentId = idMatch[1];
          } else {
            // 尝试格式2: FileNameGuid 参数
            const guidMatch = url.match(/FileNameGuid=([a-f0-9-]+)/i);
            if (guidMatch) {
              attachmentId = guidMatch[1];
            }
          }

          if (attachmentId) {
            imagePath = await this._downloadTFSAttachment(attachmentId, filename);
          } else {
            throw new Error('无法从URL提取附件ID');
          }
        } else {
          // 普通图片URL下载
          imagePath = await this.downloadImage(url, filename);
        }

        // 分析图片
        console.log(`  [图片分析 ${i + 1}/${uniqueUrls.length}] 分析图片内容...`);
        const analysis = await this.analyzeImage(imagePath);

        result.images.push({
          url,
          filename,
          localPath: imagePath,
          analysis
        });

        result.summary.success++;

      } catch (error) {
        console.log(`  [图片分析 ${i + 1}/${uniqueUrls.length}] ✗ 失败: ${error.message}`);

        result.images.push({
          url,
          filename,
          error: error.message
        });

        result.summary.failed++;
      }
    }

    return result;
  }

  /**
   * 清理临时文件
   */
  cleanup() {
    try {
      if (fs.existsSync(this.downloadDir)) {
        fs.rmSync(this.downloadDir, { recursive: true, force: true });
      }
    } catch (error) {
      // 忽略
    }
  }

  /**
   * 生成图片分析报告文本
   */
  generateImageReport(imageAnalysis) {
    if (!imageAnalysis || !imageAnalysis.success) {
      return '';
    }

    let report = `**图片**: ${imageAnalysis.filename}\n`;
    report += `- 格式: ${imageAnalysis.imageInfo?.format || '-'}\n`;

    if (imageAnalysis.imageInfo?.dimensions) {
      report += `- 尺寸: ${imageAnalysis.imageInfo.dimensions.width}x${imageAnalysis.imageInfo.dimensions.height}\n`;
    }

    if (imageAnalysis.analysis.ai) {
      report += `- AI分析: ${JSON.stringify(imageAnalysis.analysis.ai, null, 2)}\n`;
    }

    return report;
  }
}

/**
 * 创建图片分析器实例
 */
function createImageAnalyzer(options) {
  return new ImageAnalyzer(options);
}

export {
  ImageAnalyzer,
  createImageAnalyzer
};

export default ImageAnalyzer;
