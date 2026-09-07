/**
 * 需求覆盖率分析器 - SKILL统计特征增强模块
 *
 * 本模块为 requirement-coverage-analyzer 添加统计特征标记，
 * 使 SKILL使用追踪器能够检测到该SKILL的使用。
 *
 * 使用方法：
 * 在 report-generator.mjs 中导入并调用相关函数
 */

import fs from 'fs/promises';

/**
 * SKILL统计特征常量
 */
export const SKILL_TRACKING = {
  SKILL_ID: 'requirement-coverage-analyzer',
  SKILL_NAME: '需求覆盖率分析器',
  VERSION: '1.0.0',

  // 文件名标记 - 用于追踪器检测
  FILE_MARKER: 'requirement-coverage-analysis',

  // 提交信息模板
  COMMIT_TEMPLATES: {
    complete: 'docs(requirement-coverage): 需求{requirementId}覆盖率分析报告 评分:{score}/100',
    incomplete: 'docs(requirement-coverage): 需求{requirementId}覆盖率分析(待完成)'
  },

  // 报告元数据标记（HTML注释形式）
  METADATA_PREFIX: '<!-- SKILL-TRACKING-METADATA:',
  METADATA_SUFFIX: '-->'
};

/**
 * 生成带标记的报告文件名
 * @param {number} requirementId - 需求ID
 * @param {Date} timestamp - 时间戳
 * @param {Object} scoreData - 评分数据
 * @returns {string} 文件名
 */
export function generateMarkedReportFilename(requirementId, timestamp, scoreData = {}) {
  const now = timestamp || new Date();
  const timeStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // 添加SKILL标记和评分信息
  const score = scoreData.overall !== undefined ? scoreData.overall : 'pending';
  const scoreTag = score !== 'pending' ? `score${score}` : 'pending';

  return `${SKILL_TRACKING.FILE_MARKER}-${requirementId}-${scoreTag}-${timeStr}.md`;
}

/**
 * 生成SKILL追踪元数据（隐藏在报告开头）
 * @param {Object} data - 分析数据
 * @returns {string} 元数据注释块
 */
export function generateTrackingMetadata(data) {
  const metadata = {
    skill_id: SKILL_TRACKING.SKILL_ID,
    skill_name: SKILL_TRACKING.SKILL_NAME,
    version: SKILL_TRACKING.VERSION,
    requirement_id: data.requirementId,
    requirement_title: data.requirementTitle,
    score: data.score?.overall || null,
    analysis_time: new Date().toISOString(),
    source: 'requirement-coverage-analyzer'
  };

  // 使用HTML注释隐藏元数据
  return `
${SKILL_TRACKING.METADATA_PREFIX} ${JSON.stringify(metadata)} ${SKILL_TRACKING.METADATA_SUFFIX}

<!-- 本报告由需求覆盖率分析器自动生成 -->
<!-- SKILL使用追踪器可识别此文件 -->
`;
}

/**
 * 生成推荐的Git提交信息
 * @param {number} requirementId - 需求ID
 * @param {Object} scoreData - 评分数据
 * @returns {string} 提交信息
 */
export function generateRecommendedCommitMessage(requirementId, scoreData = {}) {
  if (scoreData.overall === null || scoreData.overall === undefined) {
    return SKILL_TRACKING.COMMIT_TEMPLATES.incomplete
      .replace('{requirementId}', requirementId);
  }

  return SKILL_TRACKING.COMMIT_TEMPLATES.complete
    .replace('{requirementId}', requirementId)
    .replace('{score}', scoreData.overall);
}

/**
 * 生成SKILL使用追踪报告块（添加到报告末尾）
 * @param {Object} data - 分析数据
 * @returns {string} 追踪信息块
 */
export function generateTrackingReportBlock(data) {
  const score = data.score?.overall || '待完成';
  const scoreClass = score === '待完成' ? 'pending' :
    score >= 80 ? 'high' :
    score >= 60 ? 'medium' : 'low';

  return `
---

## 📊 SKILL使用追踪信息

本报告由 **需求覆盖率分析器** 自动生成。

| 字段 | 值 |
|------|-----|
| SKILL ID | ${SKILL_TRACKING.SKILL_ID} |
| SKILL 名称 | ${SKILL_TRACKING.SKILL_NAME} |
| 需求 ID | ${data.requirementId} |
| 需求标题 | ${data.requirementTitle} |
| 评分 | ${score} |
| 分析时间 | ${new Date().toLocaleString('zh-CN')} |

### 📝 建议的Git提交信息

\`\`\`
${generateRecommendedCommitMessage(data.requirementId, data.score)}
\`\`\`

### 🔍 如何被追踪

本报告会被 **SKILL使用追踪器** 自动识别，追踪方式：

1. **文件名检测**: 报告文件名包含 \`${SKILL_TRACKING.FILE_MARKER}\` 标记
2. **元数据检测**: 报告开头的隐藏元数据包含SKILL信息
3. **提交信息检测**: 使用上述提交信息格式将被识别

---

*SKILL使用追踪器 - 自动统计团队SKILL使用情况*
`;
}

/**
 * 在终端输出SKILL使用提示
 * @param {Object} data - 分析数据
 * @param {string} reportPath - 报告文件路径
 */
export function printSkillTrackingHint(data, reportPath) {
  console.log('\n' + '━'.repeat(60));
  console.log('  📊 SKILL使用追踪提示');
  console.log('━'.repeat(60));
  console.log();
  console.log('本报告已添加统计特征标记，可被SKILL使用追踪器自动识别。');
  console.log();
  console.log('报告文件:');
  console.log(`  ${reportPath}`);
  console.log();
  console.log('建议的提交信息:');
  const commitMsg = generateRecommendedCommitMessage(data.requirementId, data.score);
  console.log(`  ${commitMsg}`);
  console.log();
  console.log('提交命令:');
  console.log(`  git add "${reportPath}"`);
  console.log(`  git commit -m "${commitMsg}"`);
  console.log();
  console.log('━'.repeat(60));
}

/**
 * 打印SKILL使用统计提示（带TFS集成）
 * @param {Object} data - 分析数据
 * @param {string} reportPath - 报告文件路径
 */
export function printSkillTrackingHintWithTFS(data, reportPath) {
  console.log('\n' + '━'.repeat(60));
  console.log('  📊 SKILL使用追踪提示');
  console.log('━'.repeat(60));
  console.log();
  console.log('本报告已添加统计特征标记，可被SKILL使用追踪器自动识别。');
  console.log();
  console.log('报告文件:');
  console.log(`  ${reportPath}`);
  console.log();

  const score = data.score?.overall;
  const workItemId = data.requirementId;

  console.log('建议将报告关联到TFS工作项:');
  console.log(`  1. 在TFS中打开工作项 #${workItemId}`);
  console.log(`  2. 上传报告文件作为附件`);
  console.log();

  if (score !== null && score !== undefined) {
    console.log('建议的Git提交信息:');
    const commitMsg = `#${workItemId} ${generateRecommendedCommitMessage(workItemId, data.score)}`;
    console.log(`  ${commitMsg}`);
    console.log();
    console.log('提交命令:');
    console.log(`  git add "${reportPath}"`);
    console.log(`  git commit -m "${commitMsg}"`);
    console.log(`  git push`);
  } else {
    console.log('⚠️  评分尚未完成，请等待LLM语义分析完成后再提交。');
  }

  console.log();
  console.log('追踪器将通过以下方式识别本SKILL的使用:');
  console.log('  ✓ 报告文件名标记');
  console.log('  ✓ 提交信息关键词');
  console.log('  ✓ TFS工作项附件');
  console.log();
  console.log('━'.repeat(60));
}
