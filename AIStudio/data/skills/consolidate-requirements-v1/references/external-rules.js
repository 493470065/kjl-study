/**
 * external-rules.js
 * 外部规则：基于 WiNEX 功能点划分原则与方法论的基线过滤
 *
 * 来源: references/WiNEX功能点划分原则与方法论.md
 * 规则: 三层漏斗 - 第一层基线过滤
 */

// ============================================================
// 基线过滤规则
// 排除清单（一票否决）：不构成业务功能的基线能力
// ============================================================
const baselinePatterns = [
  // 单对象增删改查
  '新增\\w+信息','新增\\w+记录','新增\\w+单','删除\\w+记录','删除\\w+信息',
  '修改\\w+信息','修改\\w+记录','查询\\w+列表','（增|删|改|查）',
  // 列表/导出/打印
  '导出\\w+报表','打印\\w+报告','打印\\w+清单','打印\\w+单','\\w+打印',
  '\\w+列表查询','\\w+导出','\\w+报表导出','\\w+统计报表',
  // 字典/配置管理
  '维护\\w+字典','配置\\w+权限','设置\\w+信息','\\w+参数配置','\\w+字典',
  '\\w+配置管理','\\w+基础配置',
  // 纯技术接口
  'REST API','HL7','数据库同步','\\w+接口对接','对接\\w+接口',
  '数据同步','消息通道',
  // 视图/数据提供
  '快开视图','提供视图','数据库视图','数据视图',
  // 其它基线特征
  '\\w+校验','\\w+格式转换','\\w+按钮','操作入口',
];

// 业务交互特征词（有这些特征就不是基线）
const businessFeatures = ['校验','审核','审批','触发','联动','自动生成','计算','预警',
  '通知','推送','同步','关联','流转','决策','规则','配置','模板','签名',
  '授权','锁定','解锁','归档','召回','借阅','封存','会诊','诊断','评估',
  '质控','统计','分析','报表','导出','打印'];

// 纯接口词（BLGL-98-JK 模块专用）
const pureInterfaceWords = ['简单对接','接口','通道','同步','传输','调用','视图','快开','视图数据','数据视图','提供视图','数据库视图','快开视图'];

// ============================================================
// 基线过滤主函数
// 返回 true 表示是基线需求（应排除），false 表示是功能点需求（应纳入）
// ============================================================
function isBaselineRequirement(title, description, moduleCode) {
  const text = (title + ' ' + description).toLowerCase();

  // 特殊处理：接口模块
  if (moduleCode === 'BLGL-98-JK' || moduleCode === 'BLGL-99-QT') {
    let matchCount = 0;
    for (const w of pureInterfaceWords) {
      if (text.includes(w)) matchCount++;
    }
    if (matchCount >= 3 && !text.includes('业务') && !text.includes('流程') && !text.includes('校验') && !text.includes('审核')) {
      return true;
    }
    // 接口模块的纯接口词不足3个时，不直接返回false，继续检查基线模式
  }

  // 检查是否匹配基线模式
  for (const pattern of baselinePatterns) {
    try {
      const regex = new RegExp(pattern);
      if (regex.test(text)) return true;
    } catch (e) { /* 正则异常跳过 */ }
  }

  // 检查是否包含业务交互特征
  let hasBusiness = false;
  for (const f of businessFeatures) {
    if (text.includes(f)) { hasBusiness = true; break; }
  }

  // 没有任何业务特征，且标题很短 → 判断为基线
  if (!hasBusiness && title.length < 15) {
    return true;
  }

  return false;
}

module.exports = { isBaselineRequirement, businessFeatures, baselinePatterns };