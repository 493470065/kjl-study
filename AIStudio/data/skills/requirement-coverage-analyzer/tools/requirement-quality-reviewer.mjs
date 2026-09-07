#!/usr/bin/env node
/**
 * 需求质量评审模块
 * 对 System.Description 和 Winning.Demand.Analysis 进行LLM质量评审
 *
 * 流程：
 * 1. 生成评审输入文件 /tmp/requirement-quality-review-input-{id}.json
 * 2. LLM执行评审，结果写入 /tmp/requirement-quality-review-result-{id}.json
 * 3. 工具读取评审结果
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 评审维度权重配置
const DIMENSION_WEIGHTS = {
  completeness: 0.40,  // 完整性
  clarity: 0.30,       // 清晰度
  consistency: 0.30    // 一致性
};

/**
 * 生成时间戳字符串 yyyyMMddHHmmss
 * @returns {string} 时间戳
 */
function getTimestamp() {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

/**
 * 生成需求质量评审输入文件
 * @param {string} requirementId - 需求ID
 * @param {string} description - System.Description 字段内容
 * @param {string} analysis - Winning.Demand.Analysis 字段内容
 * @returns {Promise<Object>} { inputPath, resultPath, timestamp }
 */
export async function generateQualityReviewInput(requirementId, description, analysis) {
  const timestamp = getTimestamp();
  const inputPath = `/tmp/requirement-quality-review-input-${requirementId}-${timestamp}.json`;
  const resultPath = `/tmp/requirement-quality-review-result-${requirementId}-${timestamp}.json`;

  const inputData = {
    requirementId: requirementId,
    reviewType: 'requirement_quality',
    input: {
      description: description || '',
      analysis: analysis || ''
    },
    instructions: `请对以下需求进行质量评审，采用**加分项模式**（基础分0分，每满足一项加分）：

1. **完整性** (权重40%，满分40分) - 检查以下项目，每满足一项加分：
   - ✓ 医院版本说明已填写 (+8分)
   - ✓ 模块名称/菜单名称已填写 (+8分)
   - ✓ 功能提出背景描述已填写 (+8分)
   - ✓ 功能相关流程描述已填写 (+8分)
   - ✓ 功能要求描述已填写 (+8分)

2. **清晰度** (权重30%，满分30分) - 评估描述质量：
   - ✓ 描述详细、无歧义 (+10分)
   - ✓ 无模糊词汇（待定、待确认、暂定等）(+10分)
   - ✓ 逻辑连贯、结构清晰 (+10分)

3. **一致性** (权重30%，满分30分) - 检查内容一致性：
   - ✓ 需求描述与需求分析内容对应 (+15分)
   - ✓ 关键信息完整、无遗漏 (+15分)

请以JSON格式返回评审结果，使用 highlights（亮点）字段列出得分项。`,
    expectedOutput: {
      requirementId: requirementId,
      overallScore: 0,
      dimensions: {
        completeness: { score: 0, maxScore: 40, highlights: [], missingItems: [] },
        clarity: { score: 0, maxScore: 30, highlights: [], suggestions: [] },
        consistency: { score: 0, maxScore: 30, highlights: [], gaps: [] }
      },
      summary: '评审摘要',
      totalHighlights: []
    },
    generatedAt: new Date().toISOString()
  };

  await fs.writeFile(inputPath, JSON.stringify(inputData, null, 2), 'utf-8');

  return { inputPath, resultPath, timestamp };
}

/**
 * 读取需求质量评审结果
 * @param {string} requirementId - 需求ID
 * @param {string} timestamp - 时间戳（可选，如果不提供则查找最新）
 * @returns {Promise<Object|null>} 评审结果或null
 */
export async function loadQualityReviewResult(requirementId, timestamp = null) {
  let resultPath;

  if (timestamp) {
    resultPath = `/tmp/requirement-quality-review-result-${requirementId}-${timestamp}.json`;
  } else {
    // 查找最新的结果文件
    const { readdir } = await import('fs/promises');
    try {
      const files = await readdir('/tmp');
      const resultFiles = files
        .filter(f => f.match(new RegExp(`^requirement-quality-review-result-${requirementId}-\\d{14}\\.json$`)))
        .sort()
        .reverse();

      if (resultFiles.length === 0) {
        return null;
      }
      resultPath = `/tmp/${resultFiles[0]}`;
    } catch (e) {
      return null;
    }
  }

  try {
    const content = await fs.readFile(resultPath, 'utf-8');
    const result = JSON.parse(content);

    // 验证结果格式
    if (result && result.overallScore !== undefined && result.dimensions) {
      // 添加权重信息
      for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
        if (result.dimensions[key]) {
          result.dimensions[key].weight = weight;
        }
      }
      return result;
    }
  } catch (e) {
    // 结果文件不存在或格式错误
  }

  return null;
}

/**
 * 获取默认的评审结果（等待LLM评审）
 * @returns {Object} 默认评审结果
 */
export function getPendingReviewResult() {
  return {
    overallScore: null,
    dimensions: {
      completeness: { score: null, weight: DIMENSION_WEIGHTS.completeness, issues: [] },
      clarity: { score: null, weight: DIMENSION_WEIGHTS.clarity, issues: [] },
      consistency: { score: null, weight: DIMENSION_WEIGHTS.consistency, issues: [] }
    },
    summary: '等待LLM评审',
    pending: true
  };
}

/**
 * 执行需求质量评审（生成输入 + 尝试读取结果）
 * @param {string} requirementId - 需求ID
 * @param {string} description - System.Description 字段内容
 * @param {string} analysis - Winning.Demand.Analysis 字段内容
 * @returns {Promise<Object>} 评审结果
 */
export async function reviewRequirementQuality(requirementId, description, analysis) {
  // 1. 生成评审输入文件
  const { inputPath, resultPath, timestamp } = await generateQualityReviewInput(requirementId, description, analysis);

  // 2. 尝试读取评审结果（使用同一时间戳）
  const result = await loadQualityReviewResult(requirementId, timestamp);

  if (result) {
    result.inputPath = inputPath;
    result.resultPath = resultPath;
    return result;
  }

  // 3. 如果没有结果，返回等待状态
  const pendingResult = getPendingReviewResult();
  pendingResult.inputPath = inputPath;
  pendingResult.resultPath = resultPath;
  pendingResult.timestamp = timestamp;
  return pendingResult;
}

/**
 * 获取维度权重配置
 * @returns {Object} 权重配置
 */
export function getDimensionWeights() {
  return { ...DIMENSION_WEIGHTS };
}

export default {
  generateQualityReviewInput,
  loadQualityReviewResult,
  reviewRequirementQuality,
  getPendingReviewResult,
  getDimensionWeights
};
