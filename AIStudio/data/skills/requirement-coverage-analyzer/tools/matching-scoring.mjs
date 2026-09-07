import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 加载评分权重配置
 */
async function loadScoringWeights() {
  const weightsPath = path.resolve(__dirname, '../references/scoring-weights.json');
  const content = await fs.readFile(weightsPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 计算综合匹配度评分
 */
export async function calculateOverallScore(requirementAnalysis, codeLogic, commits, codeChanges, scanResults, config) {
  const scoringWeights = await loadScoringWeights();
  const weights = scoringWeights.dimensions;

  const scores = {
    businessLogic: await calculateBusinessLogicMatch(requirementAnalysis, codeLogic, scoringWeights),
    functionalCoverage: calculateFunctionalCoverage(requirementAnalysis, codeLogic),
    codeQuality: calculateCodeQualityScore(scanResults),
    testCoverage: calculateTestCoverage(commits),
    codeScale: await calculateCodeScaleScore(codeChanges, config) // 改为 async 调用
  };

  const overallScore =
    (scores.businessLogic.score / 100) * weights.business_logic.weight +
    (scores.functionalCoverage / 100) * weights.functional_coverage.weight +
    (scores.codeQuality / 100) * weights.code_quality.weight +
    (scores.testCoverage / 100) * weights.test_coverage.weight +
    (scores.codeScale / 100) * weights.code_scale.weight;

  return {
    overall: Math.round(overallScore * 100) / 100,
    dimensions: scores,
    weights: weights
  };
}

/**
 * 计算业务逻辑匹配度 (核心维度 35%)
 */
export async function calculateBusinessLogicMatch(requirementAnalysis, codeLogic, scoringWeights) {
  const req = requirementAnalysis;
  const code = codeLogic;

  if (!req) return { score: 0, details: '需求分析为空' };

  const subWeights = scoringWeights.dimensions.business_logic.sub_weights;
  let totalScore = 0;
  const details = {};

  // 1. 业务规则匹配 (30%)
  const ruleScore = matchBusinessRules(req.businessRules || [], code.validationRules || []);
  details.businessRules = ruleScore;
  totalScore += ruleScore * subWeights.businessRules;

  // 2. 业务流程匹配 (25%)
  const flowScore = matchWorkflows(req.workflows || [], code.stateTransitions || []);
  details.workflows = flowScore;
  totalScore += flowScore * subWeights.workflows;

  // 3. 约束条件匹配 (20%)
  const constraintScore = matchConstraints(req.constraints || [], code.validationRules || []);
  details.constraints = constraintScore;
  totalScore += constraintScore * subWeights.constraints;

  // 4. 数据映射匹配 (15%)
  const mappingScore = matchDataMapping(req.dataMapping || [], code.dataOperations || []);
  details.dataMapping = mappingScore;
  totalScore += mappingScore * subWeights.dataMapping;

  // 5. 边界情况处理 (10%)
  const edgeCaseScore = matchEdgeCases(req.edgeCases || [], code.exceptionHandling || []);
  details.edgeCases = edgeCaseScore;
  totalScore += edgeCaseScore * subWeights.edgeCases;

  return {
    score: Math.round(totalScore * 100) / 100,
    details: details
  };
}

function matchBusinessRules(rules, validations) {
  if (rules.length === 0) return 100;
  let matchCount = 0;

  rules.forEach(rule => {
    const isImplemented = validations.some(v =>
      v.target === rule.field ||
      (v.context && v.context.includes(rule.description?.split(/[：:]/)[0]))
    );
    if (isImplemented) matchCount++;
  });

  return (matchCount / rules.length) * 100;
}

function matchWorkflows(workflows, stateTransitions) {
  if (workflows.length === 0) return 100;
  let matchCount = 0;

  workflows.forEach(flow => {
    const hasTransition = stateTransitions.some(t =>
      t.toState === flow.to
    );
    if (hasTransition) matchCount++;
  });

  return (matchCount / workflows.length) * 100;
}

function matchConstraints(constraints, validations) {
  if (constraints.length === 0) return 100;
  let matchCount = 0;

  constraints.forEach(constraint => {
    const isImplemented = validations.some(v =>
      v.context && v.context.includes(constraint.description?.substring(0, 10))
    );
    if (isImplemented) matchCount++;
  });

  return (matchCount / constraints.length) * 100;
}

function matchDataMapping(mapping, dataOps) {
  if (mapping.length === 0) return 100;
  let matchCount = 0;

  mapping.forEach(m => {
    const isImplemented = dataOps.some(op =>
      op.context && op.context.includes(m.source) && op.context.includes(m.target)
    );
    if (isImplemented) matchCount++;
  });

  return (matchCount / mapping.length) * 100;
}

function matchEdgeCases(edgeCases, exceptionHandling) {
  if (edgeCases.length === 0) return 100;
  let matchCount = 0;

  edgeCases.forEach(edgeCase => {
    const isHandled = exceptionHandling.some(ex =>
      ex.context && ex.context.includes(edgeCase.description?.substring(0, 10))
    );
    if (isHandled) matchCount++;
  });

  return (matchCount / edgeCases.length) * 100;
}

/**
 * 计算功能覆盖度 (20%)
 */
function calculateFunctionalCoverage(requirementAnalysis, codeLogic) {
  // 简化实现：基于关键词匹配
  return 75; // 占位分数
}

/**
 * 计算代码质量评分 (20%)
 * 支持新旧两种格式：
 * - 新格式: { summary: { by_severity: { critical, warning, info } } }
 * - 旧格式: { critical: [], warning: [], info: [] } 或数组
 */
function calculateCodeQualityScore(scanResults) {
  if (!scanResults) return 100;

  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  // 检查是否为新格式（win-code-scanner 输出）
  if (scanResults.summary && scanResults.summary.by_severity) {
    const bySeverity = scanResults.summary.by_severity;
    criticalCount = bySeverity.critical || 0;
    warningCount = bySeverity.warning || 0;
    infoCount = bySeverity.info || 0;
  }
  // 检查是否为数组格式
  else if (Array.isArray(scanResults)) {
    criticalCount = scanResults.filter(r => r.severity === '严重' || r.severity === 'critical').length;
    warningCount = scanResults.filter(r => r.severity === '警告' || r.severity === 'warning').length;
    infoCount = scanResults.filter(r => r.severity === '提示' || r.severity === 'info').length;
  }
  // 检查是否为旧对象格式
  else if (scanResults.critical || scanResults.warning || scanResults.info) {
    criticalCount = (scanResults.critical || []).length;
    warningCount = (scanResults.warning || []).length;
    infoCount = (scanResults.info || []).length;
  }

  let score = 100;
  score -= criticalCount * 15;
  score -= warningCount * 5;
  score -= infoCount * 1;

  // 有严重问题时，分数上限为 70
  if (criticalCount > 0) {
    score = Math.min(score, 70);
  }

  return Math.max(score, 0);
}

/**
 * 计算测试覆盖率 (15%)
 */
function calculateTestCoverage(commits) {
  if (!commits || commits.length === 0) return 0;

  const testFiles = commits.filter(c =>
    c.file && (c.file.includes('test') || c.file.includes('spec'))
  );

  const productionFiles = commits.filter(c =>
    c.file && !c.file.includes('test') &&
    (c.file.endsWith('.java') || c.file.endsWith('.vue'))
  );

  if (productionFiles.length === 0) return 0;

  let score = 0;

  if (testFiles.length > 0) score += 40;

  const ratio = testFiles.length / productionFiles.length;
  score += Math.min(ratio * 40, 40);

  const hasMatchingTests = productionFiles.some(prod => {
    const baseName = prod.file.replace(/\.(java|vue)$/, '');
    return testFiles.some(test => test.file.includes(baseName));
  });

  if (hasMatchingTests) score += 20;

  return score;
}

/**
 * 计算代码规模评分 (10%)
 * 修复：从 scoring-weights.json 加载期望值
 */
async function calculateCodeScaleScore(codeChanges, config) {
  if (!codeChanges || codeChanges.length === 0) return 0;

  // 加载评分权重配置
  const scoringWeights = await loadScoringWeights();
  const expected = scoringWeights.dimensions.code_scale.expectations.MEDIUM;

  const stats = {
    commitCount: new Set(codeChanges.map(c => c.commitId)).size, // 去重统计提交数
    filesChanged: codeChanges.length,
    linesAdded: codeChanges.reduce((sum, c) => sum + (c.added || 0), 0)
  };

  let score = 0;

  if (stats.commitCount >= expected.min_commits) score += 20;

  const fileRatio = stats.filesChanged / expected.expected_files;
  if (fileRatio >= 0.8 && fileRatio <= 1.5) score += 30;
  else if (fileRatio >= 0.5) score += 15;

  const lineRatio = stats.linesAdded / expected.expected_lines;
  if (lineRatio >= 0.8 && lineRatio <= 1.5) score += 50;
  else if (lineRatio >= 0.5) score += 25;

  return score;
}
