# 需求覆盖率分析报告

生成时间: {{timestamp}}
分析范围: {{scope}}

---

## 执行摘要

**需求编号**: {{requirement_id}}
**需求标题**: {{requirement_title}}
**实现状态**: {{implementation_status}}
**综合评分**: {{overall_score}}/100

### 关键指标

| 维度 | 得分 | 权重 | 说明 |
|------|------|------|------|
| 业务逻辑匹配 | {{business_logic_score}} | 35% | 核心业务规则、流程、约束的实现程度 |
| 功能覆盖度 | {{functional_coverage_score}} | 20% | 需求功能点的完成情况 |
| 代码质量 | {{code_quality_score}} | 20% | 基于代码扫描结果的质量评估 |
| 测试覆盖度 | {{test_coverage_score}} | 15% | 测试代码的完备性 |
| 代码规模 | {{code_scale_score}} | 10% | 代码量与需求复杂度的匹配度 |

---

## 详细分析

### 1. 业务逻辑匹配度 ({{business_logic_score}}/100)

{{#if business_logic_details}}
#### 业务规则匹配
- 匹配度: {{business_logic_details.businessRules}}%
- {{business_logic_rules_summary}}

#### 工作流匹配
- 匹配度: {{business_logic_details.workflows}}%
- {{workflows_summary}}

#### 约束条件匹配
- 匹配度: {{business_logic_details.constraints}}%
- {{constraints_summary}}

#### 数据映射匹配
- 匹配度: {{business_logic_details.dataMapping}}%
- {{data_mapping_summary}}

#### 边界情况处理
- 匹配度: {{business_logic_details.edgeCases}}%
- {{edge_cases_summary}}
{{else}}
无业务逻辑分析数据
{{/if}}

### 2. 代码质量分析 ({{code_quality_score}}/100)

{{#if scan_results}}
代码扫描结果:
- 严重问题: {{critical_issues}} 个
- 警告问题: {{warning_issues}} 个
- 提示问题: {{info_issues}} 个

{{scan_summary}}
{{else}}
无代码扫描数据
{{/if}}

### 3. 测试覆盖度 ({{test_coverage_score}}/100)

{{test_coverage_summary}}

### 4. 提交统计

- 总提交数: {{total_commits}}
- 涉及文件: {{files_changed}} 个
- 新增代码: {{lines_added}} 行
- 删除代码: {{lines_deleted}} 行

---

## 建议改进

{{#if suggestions}}
{{suggestions}}
{{else}}
基于当前分析结果，暂无明确改进建议。
{{/if}}

---

## 附录

### 分析配置
- 配置文件: {{config_path}}
- 分析时间: {{analysis_duration}}

### 数据来源
- 需求分析: {{requirement_source}}
- 代码仓库: {{repo_path}}
- 代码扫描: {{scan_source}}
