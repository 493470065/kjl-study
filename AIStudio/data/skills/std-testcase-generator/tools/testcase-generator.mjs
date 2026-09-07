/**
 * 核心测试用例生成器
 * 根据需求信息自动生成测试用例
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 加载模板
 * @param {string} category - 模板类别
 */
function loadTemplate(category) {
  const templatePath = path.resolve(__dirname, '../templates', `${category}.json`);
  if (fs.existsSync(templatePath)) {
    return JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  }
  return null;
}

/**
 * 加载通用模板
 */
function loadCommonTemplate() {
  return loadTemplate('common');
}

/**
 * 模板生成器类
 */
export class TestCaseGenerator {
  constructor() {
    this.categoryTemplates = {
      feature: loadTemplate('feature'),
      bug: loadTemplate('bug-fix'),
      userstory: loadTemplate('user-story')
    };
    this.commonTemplate = loadCommonTemplate();
  }

  /**
   * 根据需求类型获取模板
   * @param {string} workItemType - TFS 工作项类型
   */
  getTemplateByType(workItemType) {
    const typeMap = {
      'Feature': 'feature',
      'User Story': 'userstory',
      'Bug': 'bug',
      'Task': 'feature'
    };
    const category = typeMap[workItemType] || 'feature';
    return this.categoryTemplates[category] || this.categoryTemplates.feature;
  }

  /**
   * 智能识别需求中的功能点
   * @param {object} requirement - 需求信息
   */
  identifyFeatures(requirement) {
    const features = [];
    const title = requirement.title || '';
    const description = requirement.description || '';

    // 合并标题和描述进行关键词分析
    const fullText = `${title} ${description}`.toLowerCase();

    // 识别功能关键词
    const featureKeywords = [
      { pattern: /新增|增加|添加|创建/i, type: '新增功能' },
      { pattern: /修改|变更|调整/i, type: '修改功能' },
      { pattern: /删除|移除/i, type: '删除功能' },
      { pattern: /查询|搜索|查找/i, type: '查询功能' },
      { pattern: /导出/i, type: '导出功能' },
      { pattern: /导入/i, type: '导入功能' },
      { pattern: /显示|展示|呈现/i, type: '显示功能' },
      { pattern: /校验|验证|检查/i, type: '校验功能' },
      { pattern: /分页/i, type: '分页功能' },
      { pattern: /排序/i, type: '排序功能' },
      { pattern: /导出/i, type: '导出功能' },
      { pattern: /统计|汇总/i, type: '统计功能' },
      { pattern: /审批|审核/i, type: '审批功能' }
    ];

    featureKeywords.forEach(({ pattern, type }) => {
      if (pattern.test(fullText)) {
        features.push({ type, matched: pattern.exec(fullText)?.[0] || '' });
      }
    });

    // 如果没有识别到特征功能，添加默认功能识别
    if (features.length === 0) {
      features.push({ type: '核心功能', matched: '需求核心功能' });
    }

    return features;
  }

  /**
   * 生成测试用例
   * @param {object} requirement - 需求信息
   * @param {object} options - 生成选项
   */
  generate(requirement, options = {}) {
    const template = this.getTemplateByType(requirement.workItemType);
    const features = this.identifyFeatures(requirement);
    const testCases = [];

    let caseId = 1;

    // 从模板生成用例
    if (template && template.categories) {
      template.categories.forEach(category => {
        const categoryCases = this.generateCategoryCases(
          category,
          requirement,
          features,
          caseId
        );
        testCases.push(...categoryCases);
        caseId += categoryCases.length;
      });
    }

    // 添加通用场景用例
    if (this.commonTemplate && this.commonTemplate.categories) {
      const commonCases = this.generateCategoryCases(
        this.commonTemplate.categories[0],
        requirement,
        features,
        caseId
      );
      testCases.push(...commonCases);
    }

    return testCases;
  }

  /**
   * 生成某类别的用例
   */
  generateCategoryCases(category, requirement, features, startId) {
    const cases = [];

    category.testCases.forEach(tc => {
      const testCase = {
        id: startId + cases.length,
        name: this.interpolateTemplate(tc.name, requirement, features),
        preCondition: this.interpolateTemplate(tc.preCondition, requirement, features),
        steps: this.interpolateTemplate(tc.steps, requirement, features),
        expected: this.interpolateTemplate(tc.expected, requirement, features),
        priority: tc.priority || 'P1'
      };
      cases.push(testCase);
    });

    return cases;
  }

  /**
   * 模板字符串插值
   */
  interpolateTemplate(templateStr, requirement, features) {
    if (!templateStr) return '';

    let result = templateStr;

    // 替换需求信息
    result = result.replace(/\{title\}/g, requirement.title || '');
    result = result.replace(/\{id\}/g, requirement.id || '');
    result = result.replace(/\{workItemType\}/g, requirement.workItemType || '');

    // 替换功能点
    if (features.length > 0) {
      const featureNames = features.map(f => f.type).join('、');
      result = result.replace(/\{feature\}/g, featureNames);
      result = result.replace(/\{featureType\}/g, features[0]?.type || '');
    }

    return result;
  }
}

export default TestCaseGenerator;
