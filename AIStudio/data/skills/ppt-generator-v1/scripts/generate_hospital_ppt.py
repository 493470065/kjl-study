#!/usr/bin/env python3
"""Generate hospital info construction PPT using Weining Health Warm Earth Tone template."""

import os
from pathlib import Path

template_dir = Path('E:/pptskill/.trae/skills/win-ppt/templates/layouts/卫宁健康-暖调大地色')
output_dir = Path('E:/pptskill/projects/hospital-info-construction_ppt169_20260511/svg_final')
output_dir.mkdir(parents=True, exist_ok=True)

def apply_template(template_path, content, output_path):
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    for key, value in content.items():
        template = template.replace(key, value)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(template)

cover_content = {
    '{{TITLE}}': '医院信息化建设的几点思考',
    '{{SUBTITLE}}': '探索数字化转型之路',
    '{{AUTHOR}}': '医疗健康信息化研究中心'
}

toc_content = {
    '{{PAGE_TITLE}}': '目录',
    '{{TOC_ITEM_1_TITLE}}': '信息化建设的重要性',
    '{{TOC_ITEM_1_DESC}}': '数字化转型的必然趋势',
    '{{TOC_ITEM_2_TITLE}}': '面临的挑战',
    '{{TOC_ITEM_2_DESC}}': '数据孤岛与技术难题',
    '{{TOC_ITEM_3_TITLE}}': '关键建设路径',
    '{{TOC_ITEM_3_DESC}}': '顶层设计与数据治理',
    '{{TOC_ITEM_4_TITLE}}': '智慧医院实践',
    '{{TOC_ITEM_4_DESC}}': '门诊、病房、管理智能化',
    '{{TOC_ITEM_5_TITLE}}': '未来展望',
    '{{TOC_ITEM_5_DESC}}': 'AI赋能与生态协同',
    '{{TOC_ITEM_6_TITLE}}': '总结建议',
    '{{TOC_ITEM_6_DESC}}': '行动路径与保障措施',
    '{{PAGE_NUM}}': '02',
    '{{TOTAL_PAGES}}': '10'
}

chapter_content = {
    '{{CHAPTER_NUM}}': '01',
    '{{CHAPTER_TITLE}}': '医院信息化建设的重要性',
    '{{DATE}}': '2026年5月'
}

content_page1 = {
    '{{PAGE_TITLE}}': '数字化转型是医院发展的必然选择',
    '{{PAGE_TITLE_LINE2}}': '政策推动 · 技术驱动 · 需求牵引',
    '{{CARD_1_TITLE}}': '政策支持',
    '{{CARD_1_SUBTITLE}}': '智慧医院建设加速',
    '{{CARD_1_LINE1}}': '国家卫健委推动智慧医院评审',
    '{{CARD_1_LINE2}}': '互联网+医疗健康政策落地',
    '{{CARD_1_NOTE1}}': '全国已建成2万+智慧医院',
    '{{CARD_1_NOTE2}}': '覆盖率超过60%',
    '{{CARD_1_TAG}}': '政策利好',
    '{{CARD_2_TITLE}}': '技术进步',
    '{{CARD_2_SUBTITLE}}': 'AI赋能医疗创新',
    '{{CARD_2_LINE1}}': 'AI辅助诊断准确率达95%+',
    '{{CARD_2_LINE2}}': '大数据分析支撑精准医疗',
    '{{CARD_2_NOTE1}}': 'AI应用覆盖30+专科',
    '{{CARD_2_NOTE2}}': '效率提升30%',
    '{{CARD_2_TAG}}': '技术支撑',
    '{{CARD_3_TITLE}}': '需求增长',
    '{{CARD_3_SUBTITLE}}': '患者期待数字化服务',
    '{{CARD_3_LINE1}}': '在线预约、电子病历、移动支付',
    '{{CARD_3_LINE2}}': '全流程数字化体验需求',
    '{{CARD_3_NOTE1}}': '患者满意度提升25%',
    '{{CARD_3_NOTE2}}': '服务效率提升40%',
    '{{CARD_3_TAG}}': '用户需求',
    '{{CONTENT_AREA}}': ''
}

content_page2 = {
    '{{PAGE_TITLE}}': '当前医院信息化建设面临的三大挑战',
    '{{PAGE_TITLE_LINE2}}': '数据孤岛 · 技术架构 · 人才队伍',
    '{{CARD_1_TITLE}}': '数据孤岛',
    '{{CARD_1_SUBTITLE}}': '信息割裂严重',
    '{{CARD_1_LINE1}}': '各系统数据相互隔离',
    '{{CARD_1_LINE2}}': '难以实现数据价值最大化',
    '{{CARD_1_NOTE1}}': '数据标准化程度低',
    '{{CARD_1_NOTE2}}': '跨系统协作困难',
    '{{CARD_1_TAG}}': '核心障碍',
    '{{CARD_2_TITLE}}': '技术架构',
    '{{CARD_2_SUBTITLE}}': 'legacy系统改造',
    '{{CARD_2_LINE1}}': '老旧系统兼容性问题',
    '{{CARD_2_LINE2}}': '技术更新换代压力',
    '{{CARD_2_NOTE1}}': '安全与效率需平衡',
    '{{CARD_2_NOTE2}}': '投资成本较高',
    '{{CARD_2_TAG}}': '技术难题',
    '{{CARD_3_TITLE}}': '人才短缺',
    '{{CARD_3_SUBTITLE}}': '复合型人才匮乏',
    '{{CARD_3_LINE1}}': '医疗+IT复合型人才短缺',
    '{{CARD_3_LINE2}}': '持续培训需求迫切',
    '{{CARD_3_NOTE1}}': '人才流失率高',
    '{{CARD_3_NOTE2}}': '培养周期长',
    '{{CARD_3_TAG}}': '人才瓶颈',
    '{{CONTENT_AREA}}': ''
}

content_page3 = {
    '{{PAGE_TITLE}}': '医院信息化建设的关键路径',
    '{{PAGE_TITLE_LINE2}}': '顶层设计 · 数据治理 · 技术架构',
    '{{CARD_1_TITLE}}': '顶层设计',
    '{{CARD_1_SUBTITLE}}': '战略规划先行',
    '{{CARD_1_LINE1}}': '制定信息化战略规划',
    '{{CARD_1_LINE2}}': '明确建设目标与路径',
    '{{CARD_1_NOTE1}}': '建立组织保障机制',
    '{{CARD_1_NOTE2}}': '一把手工程',
    '{{CARD_1_TAG}}': '战略引领',
    '{{CARD_2_TITLE}}': '数据治理',
    '{{CARD_2_SUBTITLE}}': '统一标准规范',
    '{{CARD_2_LINE1}}': '建立数据质量管理机制',
    '{{CARD_2_LINE2}}': '完善数据安全保障体系',
    '{{CARD_1_NOTE1}}': '统一数据标准',
    '{{CARD_1_NOTE2}}': '数据资产化管理',
    '{{CARD_2_TAG}}': '数据驱动',
    '{{CARD_3_TITLE}}': '技术架构',
    '{{CARD_3_SUBTITLE}}': '平台能力建设',
    '{{CARD_3_LINE1}}': '云平台+数据中台架构',
    '{{CARD_3_LINE2}}': '微服务化改造升级',
    '{{CARD_3_NOTE1}}': '弹性可扩展',
    '{{CARD_3_NOTE2}}': '高可用架构',
    '{{CARD_3_TAG}}': '技术支撑',
    '{{CONTENT_AREA}}': ''
}

content_page4 = {
    '{{PAGE_TITLE}}': '智慧医院建设实践',
    '{{PAGE_TITLE_LINE2}}': '智慧门诊 · 智慧病房 · 智慧管理',
    '{{CARD_1_TITLE}}': '智慧门诊',
    '{{CARD_1_SUBTITLE}}': '全流程优化',
    '{{CARD_1_LINE1}}': '线上预约、智能导诊、电子病历',
    '{{CARD_1_LINE2}}': '排队时间缩短60%',
    '{{CARD_1_NOTE1}}': '自助服务覆盖率80%',
    '{{CARD_1_NOTE2}}': '患者满意度+20%',
    '{{CARD_1_TAG}}': '服务创新',
    '{{CARD_2_TITLE}}': '智慧病房',
    '{{CARD_2_SUBTITLE}}': '物联网赋能',
    '{{CARD_2_LINE1}}': '远程监护、移动护理、设备互联',
    '{{CARD_2_LINE2}}': '护理效率提升35%',
    '{{CARD_2_NOTE1}}': 'IoT设备覆盖率60%',
    '{{CARD_2_NOTE2}}': '不良事件减少25%',
    '{{CARD_2_TAG}}': '护理升级',
    '{{CARD_3_TITLE}}': '智慧管理',
    '{{CARD_3_SUBTITLE}}': '数据驱动决策',
    '{{CARD_3_LINE1}}': '运营分析、资源配置、决策支持',
    '{{CARD_3_LINE2}}': '管理效率提升40%',
    '{{CARD_3_NOTE1}}': 'BI分析覆盖率100%',
    '{{CARD_3_NOTE2}}': '成本降低15%',
    '{{CARD_3_TAG}}': '管理优化',
    '{{CONTENT_AREA}}': ''
}

content_page5 = {
    '{{PAGE_TITLE}}': '未来发展展望',
    '{{PAGE_TITLE_LINE2}}': 'AI赋能 · 数据价值 · 生态协同',
    '{{CARD_1_TITLE}}': 'AI赋能医疗',
    '{{CARD_1_SUBTITLE}}': '智能诊疗升级',
    '{{CARD_1_LINE1}}': 'AI辅助诊断、智能影像分析',
    '{{CARD_1_LINE2}}': '药物研发加速',
    '{{CARD_1_NOTE1}}': '诊断准确率98%+',
    '{{CARD_1_NOTE2}}': '研发周期缩短50%',
    '{{CARD_1_TAG}}': '智能未来',
    '{{CARD_2_TITLE}}': '数据价值挖掘',
    '{{CARD_2_SUBTITLE}}': '精准医疗服务',
    '{{CARD_2_LINE1}}': '临床科研支持、精准医疗',
    '{{CARD_2_LINE2}}': '健康管理创新',
    '{{CARD_2_NOTE1}}': '个性化诊疗',
    '{{CARD_2_NOTE2}}': '预防医学发展',
    '{{CARD_2_TAG}}': '数据价值',
    '{{CARD_3_TITLE}}': '生态协同发展',
    '{{CARD_3_SUBTITLE}}': '开放共赢',
    '{{CARD_3_LINE1}}': '医联体信息化、区域医疗协同',
    '{{CARD_3_LINE2}}': '互联网+医疗健康',
    '{{CARD_3_NOTE1}}': '资源共享',
    '{{CARD_3_NOTE2}}': '服务延伸',
    '{{CARD_3_TAG}}': '生态建设',
    '{{CONTENT_AREA}}': ''
}

content_page6 = {
    '{{PAGE_TITLE}}': '总结与建议',
    '{{PAGE_TITLE_LINE2}}': '战略引领 · 数据驱动 · 以人为本',
    '{{CARD_1_TITLE}}': '核心要点',
    '{{CARD_1_SUBTITLE}}': '建设原则',
    '{{CARD_1_LINE1}}': '战略引领，规划先行',
    '{{CARD_1_LINE2}}': '数据驱动，技术支撑',
    '{{CARD_1_NOTE1}}': '以人为本',
    '{{CARD_1_NOTE2}}': '持续创新',
    '{{CARD_1_TAG}}': '核心理念',
    '{{CARD_2_TITLE}}': '行动建议',
    '{{CARD_2_SUBTITLE}}': '实施路径',
    '{{CARD_2_LINE1}}': '加强组织领导，注重人才培养',
    '{{CARD_2_LINE2}}': '强化安全保障，坚持循序渐进',
    '{{CARD_2_NOTE1}}': '分步实施',
    '{{CARD_2_NOTE2}}': '持续优化',
    '{{CARD_2_TAG}}': '行动指南',
    '{{CARD_3_TITLE}}': '预期成效',
    '{{CARD_3_SUBTITLE}}': '价值目标',
    '{{CARD_3_LINE1}}': '服务效率提升40%',
    '{{CARD_3_LINE2}}': '患者满意度提升30%',
    '{{CARD_3_NOTE1}}': '运营成本降低20%',
    '{{CARD_3_NOTE2}}': '医疗质量持续改进',
    '{{CARD_3_TAG}}': '价值实现',
    '{{CONTENT_AREA}}': ''
}

ending_content = {
    '{{THANK_YOU}}': '感谢聆听',
    '{{SUBTITLE}}': '医院信息化建设的几点思考',
    '{{CONTACT_INFO}}': '医疗健康信息化研究中心 | 联系人：XXX | 邮箱：xxx@xxx.com',
    '{{DATE}}': '2026年5月'
}

apply_template(template_dir / '01_cover.svg', cover_content, output_dir / '01_cover.svg')
apply_template(template_dir / '02_toc.svg', toc_content, output_dir / '02_toc.svg')
apply_template(template_dir / '02_chapter.svg', chapter_content, output_dir / '03_chapter.svg')
apply_template(template_dir / '03_content.svg', content_page1, output_dir / '04_content1.svg')
apply_template(template_dir / '03_content.svg', content_page2, output_dir / '05_content2.svg')
apply_template(template_dir / '03_content.svg', content_page3, output_dir / '06_content3.svg')
apply_template(template_dir / '03_content.svg', content_page4, output_dir / '07_content4.svg')
apply_template(template_dir / '03_content.svg', content_page5, output_dir / '08_content5.svg')
apply_template(template_dir / '03_content.svg', content_page6, output_dir / '09_content6.svg')
apply_template(template_dir / '99_ending.svg', ending_content, output_dir / '10_ending.svg')

print(f"PPT generated successfully! Output directory: {output_dir}")