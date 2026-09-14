#!/usr/bin/env python3
"""Generate PPT from Weining Health AI Report Template."""

import os
from pathlib import Path

template_dir = Path(__file__).resolve().parent.parent / 'templates' / 'layouts' / '卫宁健康-AI汇报'
output_dir = Path('E:/pptskill/projects/digital-hospital-pptx_ppt169_20260511/svg_final')
output_dir.mkdir(parents=True, exist_ok=True)

cover_content = {
    '{{BRAND_LABEL}}': 'WEINING HEALTH',
    '{{TITLE}}': '数字化驱动医院',
    '{{SUBTITLE}}': '高质量发展模式探索',
    '{{COVER_QUOTE}}': '数据智能，引领医疗未来',
    '{{DATE}}': '2026年5月',
    '{{SOURCE}}': '医疗健康信息化研究中心'
}

toc_content = {
    '{{PAGE_TITLE}}': '目录',
    '{{TOC_ITEM_1_TITLE}}': '核心问题',
    '{{TOC_ITEM_1_DESC}}': '数字化时代医院发展的关键命题',
    '{{TOC_ITEM_2_TITLE}}': '核心框架',
    '{{TOC_ITEM_2_DESC}}': '数字化转型的四维模型',
    '{{TOC_ITEM_3_TITLE}}': '技术支撑',
    '{{TOC_ITEM_3_DESC}}': '六大关键技术赋能',
    '{{TOC_ITEM_4_TITLE}}': '实施路径',
    '{{TOC_ITEM_4_DESC}}': '五阶段推进策略',
    '{{TOC_ITEM_5_TITLE}}': '案例实践',
    '{{TOC_ITEM_5_DESC}}': '三甲医院转型实践',
    '{{TOC_ITEM_6_TITLE}}': '核心洞察',
    '{{TOC_ITEM_6_DESC}}': '转型成功的关键要素',
    '{{PAGE_NUM}}': '02',
    '{{TOTAL_PAGES}}': '10'
}

chapter_content = {
    '{{CHAPTER_NUM}}': '01',
    '{{CHAPTER_TITLE}}': '核心问题',
    '{{DATE}}': '2026年5月'
}

content_page1 = {
    '{{PAGE_TITLE}}': '数字化时代医院面临的三大挑战',
    '{{PAGE_TITLE_LINE2}}': '',
    '{{CARD_1_TITLE}}': '效率瓶颈',
    '{{CARD_1_SUBTITLE}}': '传统管理模式困境',
    '{{CARD_1_LINE1}}': '运营效率难以突破',
    '{{CARD_1_LINE2}}': '资源配置不够优化',
    '{{CARD_1_NOTE1}}': '平均住院日9.2天',
    '{{CARD_1_NOTE2}}': '床位使用率89%',
    '{{CARD_1_TAG}}': '关键问题',
    '{{CARD_2_TITLE}}': '服务触达局限',
    '{{CARD_2_SUBTITLE}}': '医疗资源分布不均',
    '{{CARD_2_LINE1}}': '优质资源集中大城市',
    '{{CARD_2_LINE2}}': '基层服务能力不足',
    '{{CARD_2_NOTE1}}': '信息化覆盖率67%',
    '{{CARD_2_NOTE2}}': '患者满意度72%',
    '{{CARD_2_TAG}}': '核心挑战',
    '{{CARD_3_TITLE}}': '数据孤岛',
    '{{CARD_3_SUBTITLE}}': '信息割裂严重',
    '{{CARD_3_LINE1}}': '各系统数据相互隔离',
    '{{CARD_3_LINE2}}': '难以实现数据价值最大化',
    '{{CARD_3_NOTE1}}': '数据标准化程度低',
    '{{CARD_3_NOTE2}}': '跨系统协作困难',
    '{{CARD_3_TAG}}': '深层障碍',
    '{{CONTENT_AREA}}': ''
}

content_page2 = {
    '{{PAGE_TITLE}}': '数字化转型的四个核心维度',
    '{{PAGE_TITLE_LINE2}}': '智慧医疗 · 数据资产 · 智慧服务 · 模式创新',
    '{{CARD_1_TITLE}}': '智慧医疗',
    '{{CARD_1_SUBTITLE}}': 'AI赋能诊疗',
    '{{CARD_1_LINE1}}': 'AI辅助诊断、智慧排班',
    '{{CARD_1_LINE2}}': '智能药房、临床决策支持',
    '{{CARD_1_NOTE1}}': 'AI辅诊覆盖30+专科',
    '{{CARD_1_NOTE2}}': '诊断符合率96%',
    '{{CARD_1_TAG}}': '核心能力',
    '{{CARD_2_TITLE}}': '数据资产',
    '{{CARD_2_SUBTITLE}}': '数据价值挖掘',
    '{{CARD_2_LINE1}}': '医疗数据治理与标准化',
    '{{CARD_2_LINE2}}': '支撑临床决策与运营优化',
    '{{CARD_2_NOTE1}}': '数据质量提升40%',
    '{{CARD_2_NOTE2}}': '运营成本降低15%',
    '{{CARD_2_TAG}}': '核心资产',
    '{{CARD_3_TITLE}}': '智慧服务',
    '{{CARD_3_SUBTITLE}}': '全流程优化',
    '{{CARD_3_LINE1}}': '线上线下一体化服务',
    '{{CARD_3_LINE2}}': '无纸化就诊、全流程优化体验',
    '{{CARD_3_NOTE1}}': '线上预约率89%',
    '{{CARD_3_NOTE2}}': '等候时间缩短82%',
    '{{CARD_3_TAG}}': '用户体验',
    '{{CONTENT_AREA}}': ''
}

content_page3 = {
    '{{PAGE_TITLE}}': '六大关键技术赋能医院数字化',
    '{{PAGE_TITLE_LINE2}}': 'AI · 大数据 · 云计算 · 物联网 · 区块链 · 5G',
    '{{CARD_1_TITLE}}': '人工智能',
    '{{CARD_1_SUBTITLE}}': '智能诊疗助手',
    '{{CARD_1_LINE1}}': 'AI辅助诊断、智能问诊',
    '{{CARD_1_LINE2}}': '临床决策支持系统',
    '{{CARD_1_NOTE1}}': '准确率达95%+',
    '{{CARD_1_NOTE2}}': '覆盖30+专科',
    '{{CARD_1_TAG}}': '核心技术',
    '{{CARD_2_TITLE}}': '大数据分析',
    '{{CARD_2_SUBTITLE}}': '数据价值挖掘',
    '{{CARD_2_LINE1}}': '医疗数据治理、预测分析',
    '{{CARD_2_LINE2}}': '运营优化决策支持',
    '{{CARD_2_NOTE1}}': '数据分析效率提升3x',
    '{{CARD_2_NOTE2}}': '成本降低15%',
    '{{CARD_2_TAG}}': '数据驱动',
    '{{CARD_3_TITLE}}': '云计算',
    '{{CARD_3_SUBTITLE}}': '弹性基础设施',
    '{{CARD_3_LINE1}}': '弹性算力、Saas化服务',
    '{{CARD_3_LINE2}}': '云边协同架构',
    '{{CARD_3_NOTE1}}': '资源利用率+60%',
    '{{CARD_3_NOTE2}}': '运维成本-40%',
    '{{CARD_3_TAG}}': '基础设施',
    '{{CONTENT_AREA}}': ''
}

content_page4 = {
    '{{PAGE_TITLE}}': '五阶段实施路径',
    '{{PAGE_TITLE_LINE2}}': '基础建设 → 平台搭建 → 智能应用 → 生态构建 → 持续创新',
    '{{CARD_1_TITLE}}': '基础建设',
    '{{CARD_1_SUBTITLE}}': 'Stage 01',
    '{{CARD_1_LINE1}}': '信息化升级、数据标准化',
    '{{CARD_1_LINE2}}': '建立数据治理体系',
    '{{CARD_1_NOTE1}}': '周期：6个月',
    '{{CARD_1_NOTE2}}': '投资：基础投入',
    '{{CARD_1_TAG}}': '启动阶段',
    '{{CARD_2_TITLE}}': '平台搭建',
    '{{CARD_2_SUBTITLE}}': 'Stage 02',
    '{{CARD_2_LINE1}}': '数据中台、业务中台建设',
    '{{CARD_2_LINE2}}': '统一数据标准',
    '{{CARD_2_NOTE1}}': '周期：6个月',
    '{{CARD_2_NOTE2}}': '投资：核心投入',
    '{{CARD_2_TAG}}': '核心阶段',
    '{{CARD_3_TITLE}}': '智能应用',
    '{{CARD_3_SUBTITLE}}': 'Stage 03',
    '{{CARD_3_LINE1}}': 'AI深度应用、流程再造',
    '{{CARD_3_LINE2}}': '智慧医院建设',
    '{{CARD_3_NOTE1}}': '周期：6个月',
    '{{CARD_3_NOTE2}}': '投资：应用投入',
    '{{CARD_3_TAG}}': '深化阶段',
    '{{CONTENT_AREA}}': ''
}

content_page5 = {
    '{{PAGE_TITLE}}': '三甲医院数字化转型案例',
    '{{PAGE_TITLE_LINE2}}': '某大型综合性三甲医院实践',
    '{{CARD_1_TITLE}}': '项目背景',
    '{{CARD_1_SUBTITLE}}': '服务压力挑战',
    '{{CARD_1_LINE1}}': '年门诊量300万人次',
    '{{CARD_1_LINE2}}': '服务效率与质量提升压力',
    '{{CARD_1_NOTE1}}': '传统模式难以支撑',
    '{{CARD_1_NOTE2}}': '患者满意度待提升',
    '{{CARD_1_TAG}}': '背景分析',
    '{{CARD_2_TITLE}}': '转型重点',
    '{{CARD_2_SUBTITLE}}': '四大核心方向',
    '{{CARD_2_LINE1}}': '智慧门诊、电子病历升级',
    '{{CARD_2_LINE2}}': 'AI辅诊、全流程线上服务',
    '{{CARD_2_NOTE1}}': '覆盖全流程服务',
    '{{CARD_2_NOTE2}}': '技术与流程融合',
    '{{CARD_2_TAG}}': '实施策略',
    '{{CARD_3_TITLE}}': '转型成效',
    '{{CARD_3_SUBTITLE}}': '显著提升',
    '{{CARD_3_LINE1}}': '等候时间45→8分钟',
    '{{CARD_3_LINE2}}': '患者满意度+18%',
    '{{CARD_3_NOTE1}}': '运营成本-15%',
    '{{CARD_3_NOTE2}}': '服务质量大幅提升',
    '{{CARD_3_TAG}}': '成果展示',
    '{{CONTENT_AREA}}': ''
}

content_page6 = {
    '{{PAGE_TITLE}}': '六大核心洞察',
    '{{PAGE_TITLE_LINE2}}': '数字化转型成功的关键要素',
    '{{CARD_1_TITLE}}': '战略定位',
    '{{CARD_1_SUBTITLE}}': '一把手工程',
    '{{CARD_1_LINE1}}': '需要顶层设计与长期投入',
    '{{CARD_1_LINE2}}': '明确转型目标与路径',
    '{{CARD_1_NOTE1}}': '高层领导重视',
    '{{CARD_1_NOTE2}}': '持续战略投入',
    '{{CARD_1_TAG}}': '关键成功',
    '{{CARD_2_TITLE}}': '平台思维',
    '{{CARD_2_SUBTITLE}}': '数据中台建设',
    '{{CARD_2_LINE1}}': '统一数据标准，打通孤岛',
    '{{CARD_2_LINE2}}': '实现数据贯通与共享',
    '{{CARD_2_NOTE1}}': 'API优先架构',
    '{{CARD_2_NOTE2}}': '服务化设计',
    '{{CARD_2_TAG}}': '技术架构',
    '{{CARD_3_TITLE}}': '以人为本',
    '{{CARD_3_SUBTITLE}}': '用户体验优先',
    '{{CARD_3_LINE1}}': '聚焦患者体验与员工效率',
    '{{CARD_2_LINE2}}': '技术服务于人',
    '{{CARD_3_NOTE1}}': '患者满意度提升',
    '{{CARD_3_NOTE2}}': '员工工作效率提升',
    '{{CARD_3_TAG}}': '核心理念',
    '{{CONTENT_AREA}}': ''
}

ending_content = {
    '{{THANK_YOU}}': '感谢聆听',
    '{{SUBTITLE}}': '数字化驱动医院高质量发展模式探索',
    '{{CONTACT_INFO}}': '医疗健康信息化研究中心 | 联系人：XXX | 邮箱：xxx@xxx.com',
    '{{DATE}}': '2026年5月'
}

def apply_template(template_path, content, output_path):
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    for key, value in content.items():
        template = template.replace(key, value)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(template)

# Cover page
apply_template(template_dir / '01_cover.svg', cover_content, output_dir / '01_cover.svg')

# TOC page
apply_template(template_dir / '02_toc.svg', toc_content, output_dir / '02_toc.svg')

# Chapter page
apply_template(template_dir / '02_chapter.svg', chapter_content, output_dir / '03_chapter.svg')

# Content pages
apply_template(template_dir / '03_content.svg', content_page1, output_dir / '04_content1.svg')
apply_template(template_dir / '03_content.svg', content_page2, output_dir / '05_content2.svg')
apply_template(template_dir / '03_content.svg', content_page3, output_dir / '06_content3.svg')
apply_template(template_dir / '03_content.svg', content_page4, output_dir / '07_content4.svg')
apply_template(template_dir / '03_content.svg', content_page5, output_dir / '08_content5.svg')
apply_template(template_dir / '03_content.svg', content_page6, output_dir / '09_content6.svg')

# Ending page
apply_template(template_dir / '99_ending.svg', ending_content, output_dir / '10_ending.svg')

print(f"PPT generated successfully! Output directory: {output_dir}")