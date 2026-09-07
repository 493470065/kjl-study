#!/usr/bin/env node
/**
 * TFS Bug Client
 * TFS Bug查询和获取客户端
 * 支持从查询列表URL或单个Bug ID获取Bug信息
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// TFSClient加载器 - 延迟加载
let _TFSClient = null;
let _loadError = null;

async function loadTFSClient() {
  if (_TFSClient) return _TFSClient;
  if (_loadError) throw _loadError;

  try {
    // 尝试多种可能的路径
    const possiblePaths = [
      path.join(__dirname, '../../tfs2018-integration/tools/tfs-client.mjs'),
      path.join(__dirname, '../../../tfs2018-integration/tools/tfs-client.mjs'),
      path.join(process.cwd(), 'skills/tfs2018-integration/tools/tfs-client.mjs')
    ];

    for (const tfsPath of possiblePaths) {
      if (fs.existsSync(tfsPath)) {
        const tfsUrl = `file://${tfsPath.replace(/\\/g, '/')}`;
        _TFSClient = (await import(tfsUrl)).default;
        return _TFSClient;
      }
    }

    throw new Error('找不到tfs-client.mjs');
  } catch (error) {
    _loadError = error;
    console.error('警告: 无法加载TFS客户端');
    console.error('请确保tfs2018-integration skill存在');
    throw error;
  }
}

/**
 * 解析TFS查询列表URL
 * URL格式: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/Public%20Query/_workitems?id={query-id}&_a=query
 * @param {string} url - TFS查询URL
 * @returns {object} { collectionName, queryId, project }
 */
function parseQueryUrl(url) {
  try {
    const urlObj = new URL(url);

    // 提取集合名称
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    let collectionName = null;
    let project = null;

    // 查找集合名称
    const collectionIndex = pathParts.findIndex(p => p.startsWith('WINNING') || p === 'WN_PH-Platform' || p === 'WN_TECH' || p === 'wn_his');
    if (collectionIndex >= 0) {
      collectionName = pathParts[collectionIndex];
    }

    // 查找项目名称（通常在集合之后，_workitems之前）
    const workitemsIndex = pathParts.findIndex(p => p === '_workitems');
    if (workitemsIndex > 0 && workitemsIndex > collectionIndex + 1) {
      project = pathParts[workitemsIndex - 1];
    }

    // 提取查询ID
    const queryId = urlObj.searchParams.get('id');

    return {
      collectionName: collectionName || 'WINNING-6.0',
      queryId,
      project,
      originalUrl: url
    };
  } catch (error) {
    throw new Error(`无效的TFS查询URL: ${error.message}`);
  }
}

/**
 * 从WIQL查询结果中提取Bug ID列表
 * @param {array} workItems - WIQL查询结果
 * @returns {array} Bug ID列表
 */
function extractBugIds(workItems) {
  return workItems
    .filter(wi => wi.fields && wi.fields['System.WorkItemType'] === 'Bug')
    .map(wi => wi.id);
}

/**
 * TFS Bug客户端类
 */
class TFSBugClient {
  constructor(collectionName = null) {
    this.collectionName = collectionName;
    this.tfsClient = null;
    this._initialized = false;
  }

  /**
   * 确保TFS客户端已初始化
   */
  async _ensureInitialized() {
    if (this._initialized) return;

    const TFSClient = await loadTFSClient();
    this.tfsClient = new TFSClient(this.collectionName);
    this._initialized = true;
  }

  /**
   * 切换集合
   */
  async switchCollection(collectionName) {
    await this._ensureInitialized();
    this.tfsClient.switchCollection(collectionName);
  }

  /**
   * 获取当前集合名称
   */
  async getCollectionName() {
    await this._ensureInitialized();
    return this.tfsClient.getCollectionName();
  }

  /**
   * 通过ID获取单个Bug
   * @param {number|string} bugId - Bug ID
   * @returns {Promise<object>} Bug详情
   */
  async getBugById(bugId) {
    await this._ensureInitialized();
    const workItem = await this.tfsClient.getWorkItem(bugId);

    if (!workItem) {
      throw new Error(`Bug ${bugId} 不存在`);
    }

    if (workItem.fields?.['System.WorkItemType'] !== 'Bug') {
      throw new Error(`工作项 ${bugId} 不是Bug类型`);
    }

    return this.formatBug(workItem);
  }

  /**
   * 批量获取Bug
   * @param {array} bugIds - Bug ID数组
   * @param {number} batchSize - 每批数量
   * @returns {Promise<array>} Bug详情数组
   */
  async getBugsByIds(bugIds, batchSize = 100) {
    await this._ensureInitialized();
    const bugs = [];
    const totalBugs = bugIds.length;

    console.log(`\n开始批量获取 ${totalBugs} 个Bug...`);
    console.log(`批次大小: ${batchSize}`);

    for (let i = 0; i < totalBugs; i += batchSize) {
      const batch = bugIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(totalBugs / batchSize);

      console.log(`\n[批次 ${batchNum}/${totalBatches}] 获取 ${batch.length} 个Bug...`);

      try {
        const workItems = await this.tfsClient.getWorkItems(batch);
        const formattedBugs = workItems
          .filter(wi => wi.fields?.['System.WorkItemType'] === 'Bug')
          .map(wi => this.formatBug(wi));

        bugs.push(...formattedBugs);
        console.log(`  ✓ 成功获取 ${formattedBugs.length} 个Bug`);
      } catch (error) {
        console.error(`  ✗ 批次获取失败: ${error.message}`);
      }
    }

    console.log(`\n批量获取完成，共获取 ${bugs.length} 个Bug`);

    return bugs;
  }

  /**
   * 从查询列表URL获取Bug列表
   * @param {string} queryUrl - TFS查询列表URL
   * @param {number} maxBugs - 最大Bug数量（null表示不限）
   * @returns {Promise<array>} Bug详情数组
   */
  async getBugsFromQueryUrl(queryUrl, maxBugs = null) {
    await this._ensureInitialized();
    console.log('\n从TFS查询URL获取Bug列表');
    console.log('='.repeat(50));

    // 解析URL
    const parsed = parseQueryUrl(queryUrl);
    console.log(`URL解析结果:`);
    console.log(`  集合: ${parsed.collectionName}`);
    console.log(`  查询ID: ${parsed.queryId}`);
    if (parsed.project) {
      console.log(`  项目: ${parsed.project}`);
    }

    // 切换到指定集合
    if (parsed.collectionName !== await this.getCollectionName()) {
      console.log(`\n切换到集合: ${parsed.collectionName}`);
      await this.switchCollection(parsed.collectionName);
    }

    console.log(`\n执行TFS保存查询...`);

    // 使用TFS保存查询API获取Bug列表
    const witApi = await this.tfsClient.getWorkItemApi();

    // 首先获取查询信息以确定项目
    let queryProject = parsed.project || 'Public Query';

    try {
      // 尝试使用 queryById API 执行保存的查询
      // 注意：TFS 2018 的 queryById 需要项目名称和查询ID
      const queryResult = await witApi.queryById(
        parsed.queryId,
        queryProject
      );

      if (!queryResult || !queryResult.workItems || queryResult.workItems.length === 0) {
        console.log('未找到Bug');
        return [];
      }

      const allBugIds = queryResult.workItems.map(wi => wi.id);
      const totalBugs = allBugIds.length;

      console.log(`找到 ${totalBugs} 个Bug`);

      // 限制数量
      const bugIdsToFetch = maxBugs ? allBugIds.slice(0, maxBugs) : allBugIds;
      if (maxBugs && totalBugs > maxBugs) {
        console.log(`限制获取前 ${maxBugs} 个Bug`);
      }

      // 批量获取Bug详情
      const bugs = await this.getBugsByIds(bugIdsToFetch);

      return bugs;
    } catch (error) {
      // 如果 queryById 失败（可能是因为查询跨项目或权限问题）
      // 回退到使用 getQuery 获取查询详情，然后执行 WIQL
      console.log(`\n注意: queryById 失败: ${error.message}`);
      console.log(`尝试使用备用方法获取查询结果...`);

      try {
        // 获取查询详情
        const queryInfo = await witApi.getQuery(queryProject, parsed.queryId);

        if (!queryInfo) {
          throw new Error(`查询不存在: ${parsed.queryId}`);
        }

        // 如果查询有 WIQL，直接执行
        if (queryInfo.queryType === 'list' && queryInfo.wiql) {
          console.log(`执行查询的 WIQL...`);

          // 执行 WIQL 查询
          const wiqlResult = await witApi.queryByWiql({
            query: queryInfo.wiql
          });

          if (!wiqlResult.workItems || wiqlResult.workItems.length === 0) {
            console.log('未找到Bug');
            return [];
          }

          // 过滤出 Bug 类型的工作项
          const bugWorkItems = wiqlResult.workItems.filter(wi => {
            // workItems 返回的可能只有 id，需要后续获取详情来判断类型
            // 这里假设查询已经过滤为 Bug 类型
            return true;
          });

          const allBugIds = bugWorkItems.map(wi => wi.id);
          const totalBugs = allBugIds.length;

          console.log(`找到 ${totalBugs} 个Bug`);

          // 限制数量
          const bugIdsToFetch = maxBugs ? allBugIds.slice(0, maxBugs) : allBugIds;
          if (maxBugs && totalBugs > maxBugs) {
            console.log(`限制获取前 ${maxBugs} 个Bug`);
          }

          // 批量获取Bug详情
          const bugs = await this.getBugsByIds(bugIdsToFetch);
          return bugs;
        } else if (queryInfo.queryType === 'tree') {
          // 树查询，需要递归获取
          console.log('检测到树查询，暂不支持');
          return [];
        } else {
          // 直接查询，使用 queryById 的另一个变体
          const queryResult = await witApi.queryById(parsed.queryId);
          if (!queryResult || !queryResult.workItems || queryResult.workItems.length === 0) {
            console.log('未找到Bug');
            return [];
          }

          const allBugIds = queryResult.workItems.map(wi => wi.id);
          const totalBugs = allBugIds.length;

          console.log(`找到 ${totalBugs} 个Bug`);

          // 限制数量
          const bugIdsToFetch = maxBugs ? allBugIds.slice(0, maxBugs) : allBugIds;
          if (maxBugs && totalBugs > maxBugs) {
            console.log(`限制获取前 ${maxBugs} 个Bug`);
          }

          // 批量获取Bug详情
          const bugs = await this.getBugsByIds(bugIdsToFetch);
          return bugs;
        }
      } catch (fallbackError) {
        console.error(`备用方法也失败: ${fallbackError.message}`);
        throw new Error(`无法执行TFS查询: ${fallbackError.message}`);
      }
    }
  }

  /**
   * 格式化Bug对象
   * @param {object} workItem - TFS工作项对象
   * @returns {object} 格式化的Bug对象
   */
  formatBug(workItem) {
    const fields = workItem.fields || {};

    // 提取重现步骤 - TFS中可能存储在不同字段中
    let reproSteps = '';
    if (fields['Microsoft.VSTS.TCM.ReproSteps']) {
      reproSteps = fields['Microsoft.VSTS.TCM.ReproSteps'];
    } else if (fields['Microsoft.VSTS.Common.StepsToReproduce']) {
      reproSteps = fields['Microsoft.VSTS.Common.StepsToReproduce'];
    } else if (fields['Custom.ReproSteps']) {
      reproSteps = fields['Custom.ReproSteps'];
    }

    // 尝试从描述中提取操作步骤（HTML格式）
    const description = fields['System.Description'] || '';
    const stepsFromDesc = this._extractStepsFromDescription(description);

    return {
      id: workItem.id,
      url: workItem.url,
      title: fields['System.Title'] || '',
      description: description,
      reproSteps: reproSteps || stepsFromDesc,
      state: fields['System.State'] || '',
      assignedTo: fields['System.AssignedTo']?.displayName || fields['System.AssignedTo'] || '',
      createdBy: fields['System.CreatedBy']?.displayName || fields['System.CreatedBy'] || '',
      createdDate: fields['System.CreatedDate'] || '',
      changedDate: fields['System.ChangedDate'] || '',
      priority: fields['Microsoft.VSTS.Common.Priority'] || '',
      severity: fields['Microsoft.VSTS.Common.Severity'] || '',
      reason: fields['System.Reason'] || '',
      stackTrace: fields['Microsoft.VSTS.Common.StackTrace'] || '',
      project: fields['System.TeamProject'] || '',
      areaPath: fields['System.AreaPath'] || '',
      iterationPath: fields['System.IterationPath'] || '',
      // 额外信息
      foundInBuild: fields['Microsoft.VSTS.Build.FoundIn'] || '',
      integratedInBuild: fields['Microsoft.VSTS.Build.IntegrationBuild'] || '',
      // 原始对象（用于调试）
      raw: workItem
    };
  }

  /**
   * 从描述中提取操作步骤
   * @param {string} description - HTML格式的描述
   * @returns {string} 提取的步骤
   */
  _extractStepsFromDescription(description) {
    if (!description) return '';

    // 移除HTML标签，提取纯文本
    const text = description
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '') // 移除其他HTML标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    // 查找包含"步骤"、"操作"等关键词的段落
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const stepsLines = [];
    let inSteps = false;

    for (const line of lines) {
      // 检测是否开始步骤部分
      if (line.match(/^(操作步骤|重现步骤|步骤|复现|操作|测试步骤|Steps?)[：:：]/i) ||
          line.match(/^\d+[、.．]/)) {
        inSteps = true;
      }

      if (inSteps) {
        stepsLines.push(line);

        // 如果遇到空行或其他段落，可能结束步骤部分
        if (line.length === 0 && stepsLines.length > 1) {
          break;
        }
      }

      // 限制步骤行数，避免过长
      if (stepsLines.length >= 20) {
        break;
      }
    }

    return stepsLines.length > 0 ? stepsLines.join('\n') : '';
  }

  /**
   * 解析Bug获取相关信息
   * @param {object} bug - Bug对象
   * @returns {object} { repository, branch, files } 关联的代码信息
   */
  async getBugCodeInfo(bug) {
    const codeInfo = {
      repository: null,
      branch: null,
      files: [],
      commits: []
    };

    // 从Bug的描述中提取仓库信息
    const desc = bug.description || '';
    const repoMatch = desc.match(/仓库[：:]\s*([^\n]+)/i);
    const branchMatch = desc.match(/分支[：:]\s*([^\n]+)/i);
    const fileMatches = desc.match(/文件[：:]\s*([^\n]+)/gi);

    if (repoMatch) {
      codeInfo.repository = repoMatch[1].trim();
    }
    if (branchMatch) {
      codeInfo.branch = branchMatch[1].trim();
    }
    if (fileMatches) {
      codeInfo.files = fileMatches.map(m => m.replace(/文件[：:]\s*/i, '').trim());
    }

    // 尝试从关联的提交中获取更多信息
    if (bug.raw?.relations) {
      const gitLinks = bug.raw.relations.filter(r =>
        r.rel === 'ArtifactLink' && r.url?.includes('Git/Commit')
      );

      for (const link of gitLinks) {
        try {
          const parsed = this.tfsClient.parseArtifactLinkUrl?.(link.url);
          if (parsed) {
            const commit = await this.tfsClient.getCommit(parsed.repoId, parsed.commitId);
            if (commit) {
              codeInfo.commits.push({
                commitId: commit.commitId,
                comment: commit.comment,
                author: commit.author?.name || '',
                date: commit.author?.date || ''
              });
            }
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }

    return codeInfo;
  }

  /**
   * 保存Bug列表到JSON文件
   * @param {array} bugs - Bug数组
   * @param {string} filepath - 文件路径
   */
  saveBugsToFile(bugs, filepath) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(bugs, null, 2), 'utf-8');
    console.log(`\nBug列表已保存到: ${filepath}`);
  }

  /**
   * 从JSON文件加载Bug列表
   * @param {string} filepath - 文件路径
   * @returns {array} Bug数组
   */
  loadBugsFromFile(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`文件不存在: ${filepath}`);
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * 为Bug工作项添加标记
   * @param {number} bugId - Bug ID
   * @param {string} tag - 要添加的标记
   * @returns {Promise<object>} 操作结果
   */
  async addTag(bugId, tag) {
    await this._ensureInitialized();

    try {
      // 确保标记以"AI-"开头
      const formattedTag = tag.startsWith('AI-') ? tag : `AI-${tag}`;

      // 获取工作项API
      const witApi = await this.tfsClient.getWorkItemApi();

      // 获取当前Bug的标记
      console.log(`  正在获取Bug ${bugId} 的当前标记...`);
      const currentWorkItem = await witApi.getWorkItem(bugId, ['System.Tags']);
      const currentTags = currentWorkItem.fields?.['System.Tags'] || '';

      // 解析现有标记
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

      // 添加新标记
      tagArray.push(formattedTag);
      const newTags = tagArray.join('; ');

      // 更新工作项
      console.log(`  正在添加标记: ${formattedTag}`);
      const document = [
        {
          op: "replace",
          path: "/fields/System.Tags",
          value: newTags
        }
      ];

      await witApi.updateWorkItem(null, document, bugId);

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
   * 生成固定的AI Bug修复标记
   * @returns {string} 标记内容（不含AI-前缀）
   */
  static generateFixedTag() {
    return 'BUG-FIX';
  }
}

export { TFSBugClient, parseQueryUrl, extractBugIds };
export default TFSBugClient;
