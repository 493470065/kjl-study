/**
 * fp-map.js — 功能点关键词映射表（203 个功能点，新编码 EmrIp/EmrOp/EmrEmg）
 * 自动生成于 2026-09-16，来源：TFS winning-record-konwledge 功能结构树（master）
 */

module.exports = {
  "EmrIp-Write-001-EmrCreate": {
    "name": "病历创建与模板管理",
    "module": "EmrIp-Write",
    "keywords": [
      "病历创建与模板管理",
      "成套模板创建病历",
      "创建校验",
      "批量创建"
    ]
  },
  "EmrIp-Write-002-EmrEdit": {
    "name": "病历编辑与保存",
    "module": "EmrIp-Write",
    "keywords": [
      "病历编辑与保存",
      "智能输入",
      "多人共同编辑",
      "跨科协同"
    ]
  },
  "EmrIp-Write-003-EmrSign": {
    "name": "病历签署",
    "module": "EmrIp-Write",
    "keywords": [
      "病历签署",
      "医师对病历签名",
      "批量签名",
      "患者CA签名"
    ]
  },
  "EmrIp-Write-004-EmrSubmit": {
    "name": "病历提交与撤销提交",
    "module": "EmrIp-Write",
    "keywords": [
      "病历提交与撤销提交",
      "医师提交病历由上级审核",
      "不能重复提交",
      "批量撤销"
    ]
  },
  "EmrIp-Write-005-EmrReview": {
    "name": "病历审签阅改",
    "module": "EmrIp-Write",
    "keywords": [
      "病历审签阅改",
      "同级阅改",
      "加签授权",
      "多级审签"
    ]
  },
  "EmrIp-Write-006-SurgeryRecord": {
    "name": "手术记录",
    "module": "EmrIp-Write",
    "keywords": [
      "手术记录",
      "依赖手麻系统",
      "含安全核查表",
      "风险评估表"
    ]
  },
  "EmrIp-Write-007-TaskRemind": {
    "name": "书写任务与时限提醒",
    "module": "EmrIp-Write",
    "keywords": [
      "书写任务与时限提醒",
      "书写提醒"
    ]
  },
  "EmrIp-Write-008-DiagManage": {
    "name": "诊断管理",
    "module": "EmrIp-Write",
    "keywords": [
      "诊断管理",
      "诊断类型过滤",
      "变更诊断",
      "子诊断展示",
      "诊断提醒"
    ]
  },
  "EmrIp-Write-009-DataRef": {
    "name": "病历数据引用",
    "module": "EmrIp-Write",
    "keywords": [
      "病历数据引用",
      "既往病历等数据引用插入病历"
    ]
  },
  "EmrIp-Write-010-TraceHistory": {
    "name": "痕迹与修改历史",
    "module": "EmrIp-Write",
    "keywords": [
      "痕迹与修改历史",
      "痕迹模式查看",
      "痕迹比对",
      "红色删除线内容复制"
    ]
  },
  "EmrIp-Write-011-TreatPlan": {
    "name": "诊疗计划与评估表",
    "module": "EmrIp-Write",
    "keywords": [
      "诊疗计划与评估表",
      "评估表创建触发待书写提醒"
    ]
  },
  "EmrIp-Write-012-EmrDelCopy": {
    "name": "病历删除与复制",
    "module": "EmrIp-Write",
    "keywords": [
      "病历删除与复制",
      "病历删除",
      "病历克隆",
      "拖拽复制粘贴"
    ]
  },
  "EmrIp-AuxInput-001-LisReportQuery": {
    "name": "检验报告调阅与引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "检验报告调阅与引用",
      "辅助区调阅检验报告",
      "异常tab筛选",
      "危急值红色"
    ]
  },
  "EmrIp-AuxInput-002-RisReportQuery": {
    "name": "检查报告调阅与引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "检查报告调阅与引用",
      "辅助区调阅检查报告"
    ]
  },
  "EmrIp-AuxInput-003-MicReportQuery": {
    "name": "微生物报告调阅与引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "微生物报告调阅与引用",
      "辅助区调阅微生物报告",
      "标本字段显示"
    ]
  },
  "EmrIp-AuxInput-004-OrderRef": {
    "name": "医嘱信息引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "医嘱信息引用",
      "插入病历显示药品名称",
      "医嘱过滤"
    ]
  },
  "EmrIp-AuxInput-005-PastEmrRef": {
    "name": "既往病历引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "既往病历引用",
      "查看历次住院",
      "门诊病历",
      "标题勾选引用"
    ]
  },
  "EmrIp-AuxInput-006-DiagInfoRef": {
    "name": "诊断信息引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "诊断信息引用",
      "鉴别诊断接口引用"
    ]
  },
  "EmrIp-AuxInput-007-VitalSignImport": {
    "name": "生命体征与体温单引入",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "生命体征与体温单引入",
      "引入生命体征",
      "体温单数据",
      "体表面积"
    ]
  },
  "EmrIp-AuxInput-008-NursImport": {
    "name": "护理文书与护理信息引入",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "护理文书与护理信息引入",
      "引入护理文书",
      "屏幕自适应宽度"
    ]
  },
  "EmrIp-AuxInput-009-AllergyImport": {
    "name": "过敏信息引入",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "过敏信息引入",
      "交互体验优化"
    ]
  },
  "EmrIp-AuxInput-010-SmartTagImport": {
    "name": "智能标签引入",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "智能标签引入",
      "智能标签界面",
      "VTE量表值生成医嘱"
    ]
  },
  "EmrIp-AuxInput-011-AnesDocView": {
    "name": "手麻文书调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "手麻文书调阅",
      "辅助录入菜单新增手麻文书"
    ]
  },
  "EmrIp-AuxInput-012-TransfusionView": {
    "name": "输血血透信息调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "输血血透信息调阅",
      "血液透析"
    ]
  },
  "EmrIp-AuxInput-013-GptAidWrite": {
    "name": "书写助手与临床数据提取",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "书写助手与临床数据提取",
      "书写助手",
      "临床数据提取",
      "AI辅助"
    ]
  },
  "EmrIp-AuxInput-014-SymbolRef": {
    "name": "公式符号引用",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "公式符号引用",
      "医学公式",
      "特殊符号",
      "医学图片引用"
    ]
  },
  "EmrIp-AuxInput-015-FeeInfoView": {
    "name": "费用信息查看",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "费用信息查看",
      "最终账单查看"
    ]
  },
  "EmrIp-AuxInput-016-ClinReviewView": {
    "name": "诊疗回顾调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "诊疗回顾调阅",
      "诊疗回顾",
      "康复评定",
      "区域影像",
      "三方功能"
    ]
  },
  "EmrIp-AuxInput-017-MutualRecogView": {
    "name": "检查互认调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "检查互认调阅",
      "检查检验互认"
    ]
  },
  "EmrIp-AuxInput-018-RemoteConsultView": {
    "name": "远程会诊调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "远程会诊调阅",
      "远程会诊",
      "移动会诊"
    ]
  },
  "EmrIp-AuxInput-019-PanoramaView": {
    "name": "患者360与跨院影像调阅",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "患者360与跨院影像调阅",
      "患者360视图",
      "跨院影像调阅"
    ]
  },
  "EmrIp-AuxInput-020-AsstAreaConfig": {
    "name": "辅助区交互与配置",
    "module": "EmrIp-AuxInput",
    "keywords": [
      "辅助区交互与配置",
      "辅助区展开",
      "收起快捷键"
    ]
  },
  "EmrIp-DiagRef-001-DiagDataQuery": {
    "name": "诊断数据接入与查询",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断数据接入与查询",
      "ICD-11"
    ]
  },
  "EmrIp-DiagRef-002-DiagSyncAlert": {
    "name": "诊断变更同步与提醒",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断变更同步与提醒",
      "弹框提醒"
    ]
  },
  "EmrIp-DiagRef-003-DiagCiteUI": {
    "name": "诊断引用交互",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断引用交互",
      "诊断弹窗",
      "控件打开"
    ]
  },
  "EmrIp-DiagRef-004-DiagPermSign": {
    "name": "诊断权限与签名",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断权限与签名",
      "录入诊断权限",
      "诊断类型权限",
      "无权限提示"
    ]
  },
  "EmrIp-DiagRef-005-DiagStyleConfig": {
    "name": "诊断样式与显示配置",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断样式与显示配置",
      "中西医分类"
    ]
  },
  "EmrIp-DiagRef-006-DiagTypeRef": {
    "name": "诊断类型引用",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断类型引用",
      "跨类别引用控制",
      "诊断去重",
      "状态过滤",
      "新增诊断类型"
    ]
  },
  "EmrIp-DiagRef-007-DiagInsertEdit": {
    "name": "诊断插入与编辑",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断插入与编辑",
      "诊断插入位置",
      "补充诊断自定义插入",
      "序号重算",
      "前后缀空格裁剪"
    ]
  },
  "EmrIp-DiagRef-008-DiagPersist": {
    "name": "诊断落库与对外对接",
    "module": "EmrIp-DiagRef",
    "keywords": [
      "诊断落库与对外对接",
      "诊断结构化落库",
      "病案首页",
      "病案系统传值",
      "ICD-11",
      "编码回传",
      "诊断日期取值"
    ]
  },
  "EmrIp-PermMgr-001-ReviewPermMgr": {
    "name": "病历审签权限管理",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "病历审签权限管理",
      "上级审签",
      "跨科审签",
      "逐级签名",
      "住院总审批权限",
      "阅改签名CA校验"
    ]
  },
  "EmrIp-PermMgr-002-TeachPermMgr": {
    "name": "规培生教学权限管理",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "规培生教学权限管理",
      "规培生书写",
      "签署病历",
      "实习医生无资质限制",
      "规培权限判断",
      "教学组功能"
    ]
  },
  "EmrIp-PermMgr-003-PrivacyAccess": {
    "name": "分级访问控制",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "分级访问控制",
      "电子病历五级",
      "六级分级访问控制",
      "分块安全控制"
    ]
  },
  "EmrIp-PermMgr-004-OperPermMgr": {
    "name": "病历操作权限管理",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "病历操作权限管理",
      "撤回权限",
      "整改医师修改权限",
      "上级修改下级病历权限"
    ]
  },
  "EmrIp-PermMgr-005-RoleTitlePerm": {
    "name": "角色职称权限管理",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "角色职称权限管理",
      "医生职称映射",
      "住院总职称审批",
      "中医师职称书写",
      "责任医生判断"
    ]
  },
  "EmrIp-PermMgr-006-DeptWardPerm": {
    "name": "科室病区权限管理",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "科室病区权限管理",
      "转科权限",
      "值班病区权限",
      "跨科审签",
      "审签科室规则"
    ]
  },
  "EmrIp-PermMgr-007-EmrBizAuth": {
    "name": "病历业务授权",
    "module": "EmrIp-PermMgr",
    "keywords": [
      "病历业务授权",
      "病历授权接口对接",
      "分段授权编辑",
      "下级加签授权",
      "授权编辑病历"
    ]
  },
  "EmrIp-Consult-001-ConsultApply": {
    "name": "会诊申请",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊申请",
      "申请医生发起会诊申请",
      "进展跟踪",
      "邀请参会人",
      "病历数据同步",
      "诊断同步",
      "医嘱生成"
    ]
  },
  "EmrIp-Consult-002-ConsultAudit": {
    "name": "会诊审核",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊审核",
      "审核节点调度",
      "CA签名"
    ]
  },
  "EmrIp-Consult-003-ConsultReply": {
    "name": "会诊指派",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊指派"
    ]
  },
  "EmrIp-Consult-004-ConsultAssign": {
    "name": "会诊接收与答复",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊接收与答复",
      "受邀医生接收会诊任务",
      "提交答复",
      "修改答复"
    ]
  },
  "EmrIp-Consult-005-ConsultSignIn": {
    "name": "会诊签到",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊签到",
      "工号密码",
      "扫码多种签到方式"
    ]
  },
  "EmrIp-Consult-006-ConsultBilling": {
    "name": "会诊计费",
    "module": "EmrIp-Consult",
    "keywords": [
      "会诊计费",
      "多种计费模式",
      "计费操作"
    ]
  },
  "EmrIp-TaskRemind-001-TaskGen": {
    "name": "待书写任务生成",
    "module": "EmrIp-TaskRemind",
    "keywords": [
      "待书写任务生成",
      "手术事件触发时生成待书写文书任务"
    ]
  },
  "EmrIp-TaskRemind-002-TaskCenter": {
    "name": "任务中心与提醒展示",
    "module": "EmrIp-TaskRemind",
    "keywords": [
      "任务中心与提醒展示",
      "任务中心展示待书写文书",
      "消息中心"
    ]
  },
  "EmrIp-TaskRemind-003-TimeQcCalc": {
    "name": "时限质控与超时计算",
    "module": "EmrIp-TaskRemind",
    "keywords": [
      "时限质控与超时计算",
      "手术结束",
      "入区时间计算时限质控超时"
    ]
  },
  "EmrIp-TaskRemind-004-TaskProcess": {
    "name": "待书写任务处理与状态",
    "module": "EmrIp-TaskRemind",
    "keywords": [
      "待书写任务处理与状态",
      "已处理任务查看"
    ]
  },
  "EmrIp-TaskRemind-005-TimeRuleConfig": {
    "name": "时限规则配置与参数",
    "module": "EmrIp-TaskRemind",
    "keywords": [
      "时限规则配置与参数",
      "触发条件"
    ]
  },
  "EmrIp-Phrase-001-PhraseCreate": {
    "name": "短语收藏与创建",
    "module": "EmrIp-Phrase",
    "keywords": [
      "短语收藏与创建",
      "医生选中内容收藏",
      "全院短语",
      "全院需审核后生效"
    ]
  },
  "EmrIp-Phrase-002-PhraseAudit": {
    "name": "短语审核",
    "module": "EmrIp-Phrase",
    "keywords": [
      "短语审核",
      "科主任对科室"
    ]
  },
  "EmrIp-Phrase-003-PhraseSearch": {
    "name": "短语引用与快捷检索",
    "module": "EmrIp-Phrase",
    "keywords": [
      "短语引用与快捷检索",
      "辅助区引用短语",
      "快捷检索插入",
      "保留原格式"
    ]
  },
  "EmrIp-Phrase-004-PhraseMaintain": {
    "name": "短语维护",
    "module": "EmrIp-Phrase",
    "keywords": [
      "短语维护",
      "角色权限控制"
    ]
  },
  "EmrIp-Phrase-005-PhraseConfig": {
    "name": "短语审核与权限参数配置",
    "module": "EmrIp-Phrase",
    "keywords": [
      "短语审核与权限参数配置"
    ]
  },
  "EmrIp-DocIndex-001-DocIndexConfig": {
    "name": "病历目录配置",
    "module": "EmrIp-DocIndex",
    "keywords": [
      "病历目录配置",
      "目录启停用",
      "目录挂URL"
    ]
  },
  "EmrIp-DocIndex-002-MrtClassMap": {
    "name": "模板目录映射",
    "module": "EmrIp-DocIndex",
    "keywords": [
      "模板目录映射",
      "模板目录拖拽调换顺序",
      "模板目录收缩"
    ]
  },
  "EmrIp-DocIndex-003-DocIndexView": {
    "name": "文书目录展示",
    "module": "EmrIp-DocIndex",
    "keywords": [
      "文书目录展示",
      "病历簿目录展示",
      "文书数量显示",
      "患者签名标志",
      "目录展开收起快捷键"
    ]
  },
  "EmrIp-DocIndex-004-NewDocSelect": {
    "name": "病历新建与模板选择",
    "module": "EmrIp-DocIndex",
    "keywords": [
      "病历新建与模板选择",
      "双击模板直接创建病历",
      "成套模板",
      "病历名称前缀编辑"
    ]
  },
  "EmrIp-Archive-001-AutoArchive": {
    "name": "病历自动归档",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历自动归档",
      "考虑节假日顺延",
      "死亡患者再次归档",
      "研究型病房豁免"
    ]
  },
  "EmrIp-Archive-002-ManualArchive": {
    "name": "病历手动归档",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历手动归档",
      "病案室手动归档",
      "校验已提交",
      "CA签名",
      "批量归档"
    ]
  },
  "EmrIp-Archive-003-ArchiveRevoke": {
    "name": "病历撤销归档",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历撤销归档",
      "封存后不允许召回"
    ]
  },
  "EmrIp-Archive-004-RecallApply": {
    "name": "病历召回申请",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历召回申请",
      "医生对已归档病历发起召回申请",
      "选择召回原因",
      "召回后病历可修改"
    ]
  },
  "EmrIp-Archive-005-RecallAudit": {
    "name": "病历召回审核",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历召回审核",
      "召回申请多级审批",
      "审核节点可修改召回原因",
      "批量审核"
    ]
  },
  "EmrIp-Archive-006-BorrowFlow": {
    "name": "病历借阅流程",
    "module": "EmrIp-Archive",
    "keywords": [
      "病历借阅流程",
      "病案借阅申请",
      "副高审批",
      "脱敏显示",
      "三方浏览链接跳转"
    ]
  },
  "EmrIp-Archive-007-ThirdPartyDock": {
    "name": "三方病案系统对接",
    "module": "EmrIp-Archive",
    "keywords": [
      "三方病案系统对接",
      "病案系统归档",
      "撤销归档",
      "召回状态同步",
      "快速召回通知三方",
      "可信无纸化对接"
    ]
  },
  "EmrIp-Archive-008-ArchiveQuery": {
    "name": "归档查询与统计",
    "module": "EmrIp-Archive",
    "keywords": [
      "归档查询与统计"
    ]
  },
  "EmrIp-Archive-009-ArchiveCheck": {
    "name": "归档校验与提醒",
    "module": "EmrIp-Archive",
    "keywords": [
      "归档校验与提醒",
      "归档前校验完整性",
      "CA签名",
      "归档提醒"
    ]
  },
  "EmrIp-Archive-010-ArchiveConfig": {
    "name": "归档配置与豁免",
    "module": "EmrIp-Archive",
    "keywords": [
      "归档配置与豁免"
    ]
  },
  "EmrIp-Query-001-DeptEmrQuery": {
    "name": "科室病历查询",
    "module": "EmrIp-Query",
    "keywords": [
      "科室病历查询",
      "医疗组检索病历"
    ]
  },
  "EmrIp-Query-002-HospEmrQuery": {
    "name": "全院病历查询",
    "module": "EmrIp-Query",
    "keywords": [
      "全院病历查询",
      "质控跨科室检索全院患者病历",
      "病区联动筛选"
    ]
  },
  "EmrIp-Query-003-StructEmrQuery": {
    "name": "病历结构化查询",
    "module": "EmrIp-Query",
    "keywords": [
      "病历结构化查询",
      "段落检索结构化数据"
    ]
  },
  "EmrIp-Print-001-BatchPrint": {
    "name": "病历集中打印",
    "module": "EmrIp-Print",
    "keywords": [
      "病历集中打印",
      "未提交病历打印需提醒"
    ]
  },
  "EmrIp-Print-002-SinglePrint": {
    "name": "单份与单病程打印",
    "module": "EmrIp-Print",
    "keywords": [
      "单份与单病程打印",
      "单病程打印",
      "指定页打印"
    ]
  },
  "EmrIp-Print-003-PrintFmtCtrl": {
    "name": "打印模式与格式控制",
    "module": "EmrIp-Print",
    "keywords": [
      "打印模式与格式控制",
      "奇偶页打印模式",
      "格式生成"
    ]
  },
  "EmrIp-Print-004-PrintPermCtrl": {
    "name": "打印权限与归档控制",
    "module": "EmrIp-Print",
    "keywords": [
      "打印权限与归档控制",
      "封存病历打印控制",
      "患者手签后打印"
    ]
  },
  "EmrIp-Print-005-PrintEngine": {
    "name": "打印实现与性能优化",
    "module": "EmrIp-Print",
    "keywords": [
      "打印实现与性能优化",
      "编辑器对接打印",
      "托盘代理打印",
      "信创打印",
      "全量打印优化"
    ]
  },
  "EmrIp-TplMgr-001-KnowledgeDoc": {
    "name": "知识文档管理",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "知识文档管理",
      "导入导出"
    ]
  },
  "EmrIp-TplMgr-002-KnowledgeAudit": {
    "name": "知识文档审核",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "知识文档审核",
      "医院模板多级审核"
    ]
  },
  "EmrIp-TplMgr-003-KnowledgePublish": {
    "name": "知识文档发布",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "知识文档发布",
      "模板发布到科室",
      "取消发布",
      "批量发布"
    ]
  },
  "EmrIp-TplMgr-004-PersonalTemplate": {
    "name": "个人模板管理",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "个人模板管理",
      "医生个人模板增删改"
    ]
  },
  "EmrIp-TplMgr-005-PersonalTplAudit": {
    "name": "个人模板审核",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "个人模板审核",
      "审核角色"
    ]
  },
  "EmrIp-TplMgr-006-TplSetManage": {
    "name": "成套模板管理",
    "module": "EmrIp-TplMgr",
    "keywords": [
      "成套模板管理"
    ]
  },
  "EmrIp-MedRecHome-001-MahpCreate": {
    "name": "病案首页创建与目录管理",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "病案首页创建与目录管理",
      "选择模板创建"
    ]
  },
  "EmrIp-MedRecHome-002-MahpBaseInfo": {
    "name": "患者基本信息自动获取",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "患者基本信息自动获取",
      "创建首页时从患者端"
    ]
  },
  "EmrIp-MedRecHome-003-MahpDiagSync": {
    "name": "诊断信息同步与录入",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "诊断信息同步与录入"
    ]
  },
  "EmrIp-MedRecHome-004-MahpSurgSync": {
    "name": "手术信息获取与管理",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "手术信息获取与管理",
      "治疗医嘱获取"
    ]
  },
  "EmrIp-MedRecHome-005-MahpFeeSync": {
    "name": "费用信息获取与更新",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "费用信息获取与更新",
      "出院结算",
      "归档时触发更新"
    ]
  },
  "EmrIp-MedRecHome-006-MahpIcuThird": {
    "name": "重症监护与三方数据获取",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "重症监护与三方数据获取",
      "重症监护",
      "病理诊断",
      "呼吸机时间"
    ]
  },
  "EmrIp-MedRecHome-007-MahpSubmitQc": {
    "name": "首页提交与校验",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "首页提交与校验",
      "首页提交时执行必填项校验",
      "级联规则",
      "手术规则校验"
    ]
  },
  "EmrIp-MedRecHome-008-MahpReport": {
    "name": "病案系统对接与数据上报",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "病案系统对接与数据上报",
      "WiNEX病案",
      "三方系统",
      "质控回传"
    ]
  },
  "EmrIp-MedRecHome-009-MahpRevoke": {
    "name": "首页撤销提交与修改",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "首页撤销提交与修改",
      "已提交首页经审批",
      "病案系统撤销后恢复修改"
    ]
  },
  "EmrIp-MedRecHome-010-MahpParamConfig": {
    "name": "首页参数与映射配置",
    "module": "EmrIp-MedRecHome",
    "keywords": [
      "首页参数与映射配置",
      "基本参数",
      "医疗付费方式对照"
    ]
  },
  "EmrIp-CaSign-001-DoctorCaSign": {
    "name": "医生CA签名",
    "module": "EmrIp-CaSign",
    "keywords": [
      "医生CA签名",
      "病历提交",
      "审签时调CA验签插入签名图片",
      "签名丢失修复",
      "CA失败降级文字签名"
    ]
  },
  "EmrIp-CaSign-002-PatientSign": {
    "name": "患者签名",
    "module": "EmrIp-CaSign",
    "keywords": [
      "患者签名",
      "移动MY签名",
      "签名图片+指纹分开",
      "签名后锁定文书编辑"
    ]
  },
  "EmrIp-CaSign-003-ProxySign": {
    "name": "多人代理人签名",
    "module": "EmrIp-CaSign",
    "keywords": [
      "多人代理人签名",
      "家属签名",
      "多人电签",
      "家属签名顺序"
    ]
  },
  "EmrIp-CaSign-004-CaInterface": {
    "name": "CA接口对接",
    "module": "EmrIp-CaSign",
    "keywords": [
      "CA接口对接",
      "对接信手书",
      "北京CA标准接口",
      "账密验签",
      "扫码签名"
    ]
  },
  "EmrIp-CaSign-005-CaSignConfig": {
    "name": "CA签名配置与方式",
    "module": "EmrIp-CaSign",
    "keywords": [
      "CA签名配置与方式",
      "签名方式",
      "区分场景CA签名"
    ]
  },
  "EmrIp-CaSign-006-SignImagePdf": {
    "name": "签名图片与PDF处理",
    "module": "EmrIp-CaSign",
    "keywords": [
      "签名图片与PDF处理",
      "签名图片获取",
      "患者签名PDF回传",
      "指纹图片",
      "签名后PDF重生成"
    ]
  },
  "EmrIp-CaSign-007-CaVerifyFlow": {
    "name": "CA校验与签名流程",
    "module": "EmrIp-CaSign",
    "keywords": [
      "CA校验与签名流程",
      "CA校验",
      "扫码加签",
      "验签日志",
      "病案首页CA签名推送"
    ]
  },
  "EmrIp-Unlock-001-TimeLock": {
    "name": "病历时限锁定与编辑锁定",
    "module": "EmrIp-Unlock",
    "keywords": [
      "病历时限锁定与编辑锁定",
      "患者出区48h"
    ]
  },
  "EmrIp-Unlock-002-UnlockApply": {
    "name": "病历解锁申请",
    "module": "EmrIp-Unlock",
    "keywords": [
      "病历解锁申请",
      "医生对已锁定病历提交解锁申请",
      "患者解锁时增加风险提示"
    ]
  },
  "EmrIp-Unlock-003-UnlockAudit": {
    "name": "病历解锁审核",
    "module": "EmrIp-Unlock",
    "keywords": [
      "病历解锁审核"
    ]
  },
  "EmrIp-Unlock-004-UnlockConfig": {
    "name": "解锁参数与流程配置",
    "module": "EmrIp-Unlock",
    "keywords": [
      "解锁参数与流程配置",
      "审核流程节点",
      "锁定条件",
      "风险提示"
    ]
  },
  "EmrIp-Seal-001-SealOperate": {
    "name": "病历封存与解封操作",
    "module": "EmrIp-Seal",
    "keywords": [
      "病历封存与解封操作",
      "封存版本独立存储"
    ]
  },
  "EmrIp-Seal-002-SealPermCtrl": {
    "name": "封存权限与操作控制",
    "module": "EmrIp-Seal",
    "keywords": [
      "封存权限与操作控制",
      "解封权限控制"
    ]
  },
  "EmrIp-Seal-003-PaperlessDock": {
    "name": "无纸化三方对接",
    "module": "EmrIp-Seal",
    "keywords": [
      "无纸化三方对接",
      "对接可信",
      "兰软无纸化病案系统",
      "接收三方封存状态回传"
    ]
  },
  "EmrIp-TeachGrp-001-TeachGroupMgr": {
    "name": "教学组管理",
    "module": "EmrIp-TeachGrp",
    "keywords": [
      "教学组管理",
      "进修生教学组"
    ]
  },
  "EmrIp-TeachGrp-002-TraineePerm": {
    "name": "规培生病历书写权限",
    "module": "EmrIp-TeachGrp",
    "keywords": [
      "规培生病历书写权限",
      "进修生书写病历权限",
      "带教老师审核",
      "教学组模式下编辑范围控制"
    ]
  },
  "EmrIp-TeachGrp-003-TraineeIdentity": {
    "name": "规培生身份标识配置",
    "module": "EmrIp-TeachGrp",
    "keywords": [
      "规培生身份标识配置"
    ]
  },
  "EmrIp-TeachGrp-004-MentoringCheck": {
    "name": "病历带教字段与归档校验",
    "module": "EmrIp-TeachGrp",
    "keywords": [
      "病历带教字段与归档校验",
      "病历主表增加带教老师",
      "住培医生字段",
      "规培医生归档校验"
    ]
  },
  "EmrEmg-Write-001-EmrCreate": {
    "name": "病历创建与模板选择",
    "module": "EmrEmg-Write",
    "keywords": [
      "病历创建与模板选择",
      "急诊医生接诊后选择模板",
      "默认模板",
      "推荐模板创建急诊病历",
      "特殊场景联动带出模板",
      "批量创建",
      "创建校验"
    ]
  },
  "EmrEmg-Write-002-EmrEdit": {
    "name": "病历编辑与保存",
    "module": "EmrEmg-Write",
    "keywords": [
      "病历编辑与保存",
      "数据引用"
    ]
  },
  "EmrEmg-Write-003-EmrSign": {
    "name": "病历签署与撤销",
    "module": "EmrEmg-Write",
    "keywords": [
      "病历签署与撤销",
      "急诊医生签署病历"
    ]
  },
  "EmrEmg-Write-004-EmrPrint": {
    "name": "病历打印与打印锁定",
    "module": "EmrEmg-Write",
    "keywords": [
      "病历打印与打印锁定",
      "签署后打印",
      "打印预览",
      "打印后不允许撤回签署需走解锁流程"
    ]
  },
  "EmrEmg-Write-005-EmrHistoryView": {
    "name": "历史病历查看",
    "module": "EmrEmg-Write",
    "keywords": [
      "历史病历查看",
      "急诊医生查看急诊"
    ]
  },
  "EmrEmg-AuxAssist-001-HistoryRef": {
    "name": "历史病历引用",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "历史病历引用"
    ]
  },
  "EmrEmg-AuxAssist-002-MedtechRef": {
    "name": "报告引用",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "报告引用",
      "互认报告",
      "异常标红危急值标黄"
    ]
  },
  "EmrEmg-AuxAssist-003-OrderRef": {
    "name": "医嘱引用",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "医嘱引用"
    ]
  },
  "EmrEmg-AuxAssist-004-NursingRef": {
    "name": "护理记录引用",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "护理记录引用",
      "液体平衡"
    ]
  },
  "EmrEmg-AuxAssist-005-PhraseManage": {
    "name": "常用语管理",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "常用语管理",
      "选择常用语插入光标位置"
    ]
  },
  "EmrEmg-AuxAssist-006-SymbolInsert": {
    "name": "医学公式与符号插入",
    "module": "EmrEmg-AuxAssist",
    "keywords": [
      "医学公式与符号插入",
      "特殊符号",
      "医学工具辅助录入"
    ]
  },
  "EmrEmg-TplMgr-001-PersonalTemplate": {
    "name": "个人模板维护",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "个人模板维护",
      "段落节点勾选保存"
    ]
  },
  "EmrEmg-TplMgr-002-TemplateSharing": {
    "name": "门诊/急诊个人模板互通",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "门诊/急诊个人模板互通"
    ]
  },
  "EmrEmg-TplMgr-003-TemplateUpgrade": {
    "name": "模板升级与母模板联动",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "模板升级与母模板联动",
      "母模板版本升级"
    ]
  },
  "EmrEmg-TplMgr-004-DefaultTemplate": {
    "name": "默认模板设置",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "默认模板设置",
      "科室默认模板",
      "复诊各一份",
      "个人默认模板"
    ]
  },
  "EmrEmg-TplMgr-005-DiagTplBind": {
    "name": "诊断绑定模板配置",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "诊断绑定模板配置"
    ]
  },
  "EmrEmg-TplMgr-006-EventMrtMap": {
    "name": "特殊标记关联模板配置",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "特殊标记关联模板配置",
      "患者绿通类型",
      "场景关联模板",
      "接诊时提示",
      "强制书写"
    ]
  },
  "EmrEmg-TplMgr-007-TemplateDefault": {
    "name": "模板缺省值配置",
    "module": "EmrEmg-TplMgr",
    "keywords": [
      "模板缺省值配置",
      "外部数据"
    ]
  },
  "EmrEmg-PastEmr-001-HistoryBrowse": {
    "name": "历史病历浏览",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "历史病历浏览",
      "打开急诊",
      "住院历史病历页签",
      "选中展示全文",
      "段落引用插入"
    ]
  },
  "EmrEmg-PastEmr-002-MultiArchQuery": {
    "name": "多档案多机构病历查询",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "多档案多机构病历查询",
      "EMPI",
      "personid",
      "多院区切换"
    ]
  },
  "EmrEmg-PastEmr-003-FilterConfig": {
    "name": "当前病历过滤模式配置",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "当前病历过滤模式配置"
    ]
  },
  "EmrEmg-PastEmr-004-ConsultView": {
    "name": "会诊记录查看",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "会诊记录查看",
      "选中展示全文"
    ]
  },
  "EmrEmg-PastEmr-005-EmrCompreQuery": {
    "name": "病历综合查询",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "病历综合查询",
      "结构化段落多条件组合检索病历簿"
    ]
  },
  "EmrEmg-PastEmr-006-LegacyAccess": {
    "name": "旧系统病历接入",
    "module": "EmrEmg-PastEmr",
    "keywords": [
      "旧系统病历接入",
      "开启参数后增加【急诊旧系统病历】页签",
      "历史病历"
    ]
  },
  "EmrEmg-InfoPage-001-PageLoadSync": {
    "name": "信息页加载与数据同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "信息页加载与数据同步",
      "诊断变更",
      "医嘱更新"
    ]
  },
  "EmrEmg-InfoPage-002-BaseDataSync": {
    "name": "信息页基础数据同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "信息页基础数据同步",
      "从就诊接口同步就诊字段"
    ]
  },
  "EmrEmg-InfoPage-003-DiagDataSync": {
    "name": "信息页诊断信息同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "信息页诊断信息同步",
      "填充渲染到对应诊断表格元素"
    ]
  },
  "EmrEmg-InfoPage-004-SurgDataSync": {
    "name": "信息页手术信息同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "信息页手术信息同步"
    ]
  },
  "EmrEmg-InfoPage-005-FeeDataSync": {
    "name": "信息页费用信息同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "信息页费用信息同步",
      "同步当前就诊门"
    ]
  },
  "EmrEmg-InfoPage-006-TcmPageSync": {
    "name": "中医诊疗信息页数据同步",
    "module": "EmrEmg-InfoPage",
    "keywords": [
      "中医诊疗信息页数据同步",
      "中医治疗性操作",
      "草药表格同步展示"
    ]
  },
  "EmrOp-Write-001-EmrOperate": {
    "name": "病历创建与编辑",
    "module": "EmrOp-Write",
    "keywords": [
      "病历创建与编辑",
      "门诊医生用自研编辑器创建",
      "编辑门诊病历",
      "必填项校验",
      "右键菜单"
    ]
  },
  "EmrOp-Write-002-EmrSign": {
    "name": "病历签署",
    "module": "EmrOp-Write",
    "keywords": [
      "病历签署",
      "签署校验",
      "字符数校验",
      "规培带教审签",
      "CA签名联动"
    ]
  },
  "EmrOp-Write-003-EmrSupplement": {
    "name": "补充病历",
    "module": "EmrOp-Write",
    "keywords": [
      "补充病历",
      "病历已签署后点击\"补充病历\"",
      "弹框选择同步原病历段落"
    ]
  },
  "EmrOp-Write-004-EmrDataFill": {
    "name": "诊疗信息自动带入",
    "module": "EmrOp-Write",
    "keywords": [
      "诊疗信息自动带入",
      "检查检验报告"
    ]
  },
  "EmrOp-Write-005-HistoryRef": {
    "name": "历史病历引用",
    "module": "EmrOp-Write",
    "keywords": [
      "历史病历引用",
      "引用时清除历史操作痕迹"
    ]
  },
  "EmrOp-Write-006-PendingDocGen": {
    "name": "待书写文书生成",
    "module": "EmrOp-Write",
    "keywords": [
      "待书写文书生成"
    ]
  },
  "EmrOp-Write-007-OuterDataSync": {
    "name": "外部数据同步",
    "module": "EmrOp-Write",
    "keywords": [
      "外部数据同步"
    ]
  },
  "EmrOp-Write-008-EmrPermission": {
    "name": "书写控制与权限校验",
    "module": "EmrOp-Write",
    "keywords": [
      "书写控制与权限校验",
      "教学门诊双存审核",
      "跨科协作",
      "病历有效期校验"
    ]
  },
  "EmrOp-AuxAssist-001-HistoryRef": {
    "name": "历史病历引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "历史病历引用",
      "科室查看住院",
      "会诊既往病历",
      "勾选节点导入引用"
    ]
  },
  "EmrOp-AuxAssist-002-MedtechRef": {
    "name": "医技报告引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "医技报告引用",
      "微生物报告",
      "识别异常值",
      "危急值标识"
    ]
  },
  "EmrOp-AuxAssist-003-OrderRef": {
    "name": "医嘱引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "医嘱引用",
      "既往医嘱"
    ]
  },
  "EmrOp-AuxAssist-004-OuterReportRef": {
    "name": "外院报告互认引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "外院报告互认引用",
      "查看互认标志"
    ]
  },
  "EmrOp-AuxAssist-005-PhraseManage": {
    "name": "常用语管理引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "常用语管理引用",
      "右键打开常用语双击引用",
      "非本人创建不可编辑"
    ]
  },
  "EmrOp-AuxAssist-006-PreconsultRef": {
    "name": "预问诊引用",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "预问诊引用",
      "引用至病历"
    ]
  },
  "EmrOp-AuxAssist-007-FormulaCalc": {
    "name": "医学公式计算",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "医学公式计算"
    ]
  },
  "EmrOp-AuxAssist-008-SymbolInsert": {
    "name": "医学工具与符号插入",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "医学工具与符号插入",
      "选择牙位图",
      "人体图等工具",
      "引用医学图片",
      "单击符号插入至光标处"
    ]
  },
  "EmrOp-AuxAssist-009-SmartCheck": {
    "name": "智能提醒校验",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "智能提醒校验"
    ]
  },
  "EmrOp-AuxAssist-010-ReportFmtConfig": {
    "name": "书写助手报告插入格式配置",
    "module": "EmrOp-AuxAssist",
    "keywords": [
      "书写助手报告插入格式配置"
    ]
  },
  "EmrOp-Unlock-001-UnlockApply": {
    "name": "病历解锁申请",
    "module": "EmrOp-Unlock",
    "keywords": [
      "病历解锁申请",
      "对已锁定病历提交解锁申请",
      "解锁新增",
      "填写解锁原因",
      "校验重复申请"
    ]
  },
  "EmrOp-Unlock-002-UnlockQuery": {
    "name": "解锁申请查询与流程查看",
    "module": "EmrOp-Unlock",
    "keywords": [
      "解锁申请查询与流程查看"
    ]
  },
  "EmrOp-Unlock-003-UnlockApprove": {
    "name": "病历解锁审批",
    "module": "EmrOp-Unlock",
    "keywords": [
      "病历解锁审批",
      "审批角色审核解锁申请",
      "驳回时填写拒绝原因"
    ]
  },
  "EmrOp-Unlock-004-UnlockConfig": {
    "name": "解锁参数与流程配置",
    "module": "EmrOp-Unlock",
    "keywords": [
      "解锁参数与流程配置",
      "各级审批人角色",
      "解锁有效期",
      "消息通知开关"
    ]
  },
  "EmrOp-DayEmr-001-DayPatientQuery": {
    "name": "日间患者列表查询",
    "module": "EmrOp-DayEmr",
    "keywords": [
      "日间患者列表查询"
    ]
  },
  "EmrOp-DayEmr-002-DayEmrWrite": {
    "name": "日间病历书写",
    "module": "EmrOp-DayEmr",
    "keywords": [
      "日间病历书写",
      "日间手术病历书写",
      "不签署只有保存",
      "已打印文书可继续编辑删除"
    ]
  },
  "EmrOp-DayEmr-003-DayDataSync": {
    "name": "病历数据同步与诊断引用",
    "module": "EmrOp-DayEmr",
    "keywords": [
      "病历数据同步与诊断引用",
      "门诊病历元素",
      "院前评估单数据同步带入日间病历"
    ]
  },
  "EmrOp-DayEmr-004-DayHistoryView": {
    "name": "历史病历查看与隔离",
    "module": "EmrOp-DayEmr",
    "keywords": [
      "历史病历查看与隔离",
      "查看患者历史病历"
    ]
  },
  "EmrOp-Query-001-EmrCompreQuery": {
    "name": "病历综合查询",
    "module": "EmrOp-Query",
    "keywords": [
      "病历综合查询",
      "多条件组合",
      "挂号日期"
    ]
  },
  "EmrOp-Query-002-EmrAdvSearch": {
    "name": "高级检索",
    "module": "EmrOp-Query",
    "keywords": [
      "高级检索",
      "组合条件",
      "节点高亮显示",
      "编辑器兼容"
    ]
  },
  "EmrOp-Query-003-QueryPermission": {
    "name": "病历查询权限控制",
    "module": "EmrOp-Query",
    "keywords": [
      "病历查询权限控制",
      "质控科科长",
      "医疗科质控员"
    ]
  },
  "EmrOp-Query-004-PatientQuery": {
    "name": "历史病历查询",
    "module": "EmrOp-Query",
    "keywords": [
      "历史病历查询",
      "查看患者历史病历",
      "多院区选择框优化"
    ]
  },
  "EmrOp-Query-005-EmrTraceQuery": {
    "name": "病历痕迹查询与完成情况统计",
    "module": "EmrOp-Query",
    "keywords": [
      "病历痕迹查询与完成情况统计",
      "修改时间",
      "对比最后两份"
    ]
  },
  "EmrOp-Borrow-001-BorrowGrant": {
    "name": "病历借阅授权",
    "module": "EmrOp-Borrow",
    "keywords": [
      "病历借阅授权",
      "选择病历发起借阅授权",
      "授权IP",
      "时间范围"
    ]
  },
  "EmrOp-Borrow-002-BorrowView": {
    "name": "借阅病历查看",
    "module": "EmrOp-Borrow",
    "keywords": [
      "借阅病历查看",
      "超授权时间不展示"
    ]
  },
  "EmrOp-Borrow-003-BorrowRevoke": {
    "name": "授权记录与授权回收",
    "module": "EmrOp-Borrow",
    "keywords": [
      "授权记录与授权回收",
      "选中\"授权回收\"收回病历授权"
    ]
  },
  "EmrOp-Borrow-004-BorrowConfig": {
    "name": "借阅菜单与加密配置",
    "module": "EmrOp-Borrow",
    "keywords": [
      "借阅菜单与加密配置"
    ]
  },
  "EmrOp-CaseMgr-001-CaseSubmit": {
    "name": "案例收藏与提交",
    "module": "EmrOp-CaseMgr",
    "keywords": [
      "案例收藏与提交",
      "右键\"案例收藏\"",
      "勾选病历",
      "录入名称"
    ]
  },
  "EmrOp-CaseMgr-002-CaseQuery": {
    "name": "案例查询",
    "module": "EmrOp-CaseMgr",
    "keywords": [
      "案例查询",
      "驳回详情"
    ]
  },
  "EmrOp-CaseMgr-003-CaseAudit": {
    "name": "案例审核",
    "module": "EmrOp-CaseMgr",
    "keywords": [
      "案例审核",
      "填驳回意见",
      "Excel"
    ]
  },
  "EmrOp-CaseMgr-004-CaseDetail": {
    "name": "案例详情查看",
    "module": "EmrOp-CaseMgr",
    "keywords": [
      "案例详情查看",
      "已签署有效处方",
      "草药名称+剂量"
    ]
  },
  "EmrOp-CaSign-001-CaSign": {
    "name": "病历CA签署与撤销",
    "module": "EmrOp-CaSign",
    "keywords": [
      "病历CA签署与撤销",
      "撤销病历",
      "RE011",
      "参数校验",
      "签署时生产"
    ]
  },
  "EmrOp-CaSign-002-PatientCaSign": {
    "name": "患者CA签名",
    "module": "EmrOp-CaSign",
    "keywords": [
      "患者CA签名",
      "患者手写板",
      "无线签字板签名"
    ]
  },
  "EmrOp-CaSign-003-DoctorSign": {
    "name": "医生签名",
    "module": "EmrOp-CaSign",
    "keywords": [
      "医生签名"
    ]
  },
  "EmrOp-CaSign-004-ConsentSign": {
    "name": "知情同意书签名",
    "module": "EmrOp-CaSign",
    "keywords": [
      "知情同意书签名",
      "申请单开立联动创建同意书"
    ]
  },
  "EmrOp-CaSign-005-CaVerifyQuery": {
    "name": "CA接入验签查询",
    "module": "EmrOp-CaSign",
    "keywords": [
      "CA接入验签查询",
      "病历开启",
      "调用业务中台签名组件验签"
    ]
  },
  "EmrOp-CaSign-006-CaSignLog": {
    "name": "CA签名日志与时间戳",
    "module": "EmrOp-CaSign",
    "keywords": [
      "CA签名日志与时间戳",
      "交互日志",
      "电子签名增加时间戳"
    ]
  },
  "EmrOp-CaSign-007-CaSignConfig": {
    "name": "CA签名参数与签名图片配置",
    "module": "EmrOp-CaSign",
    "keywords": [
      "CA签名参数与签名图片配置"
    ]
  },
  "EmrOp-PreConsult-001-PreconsultConfig": {
    "name": "预问诊参数与模式配置",
    "module": "EmrOp-PreConsult",
    "keywords": [
      "预问诊参数与模式配置",
      "控制书写助手预问诊tab显隐"
    ]
  },
  "EmrOp-PreConsult-002-PreconsultView": {
    "name": "预问诊数据获取与展示",
    "module": "EmrOp-PreConsult",
    "keywords": [
      "预问诊数据获取与展示",
      "多题库排序",
      "重复数据仅显示最新"
    ]
  },
  "EmrOp-PreConsult-003-PreconsultCite": {
    "name": "预问诊数据引用到病历",
    "module": "EmrOp-PreConsult",
    "keywords": [
      "预问诊数据引用到病历",
      "将预问诊问答引用到病历"
    ]
  },
  "EmrOp-PreConsult-004-PreconsultWrite": {
    "name": "预问诊数据回写接口",
    "module": "EmrOp-PreConsult",
    "keywords": [
      "预问诊数据回写接口",
      "提供网关回写接口供三方系统回写预问诊问答数据"
    ]
  },
  "EmrOp-InfoPage-001-TrtipManage": {
    "name": "信息页生成与维护",
    "module": "EmrOp-InfoPage",
    "keywords": [
      "信息页生成与维护"
    ]
  },
  "EmrOp-InfoPage-002-TrtipDataSync": {
    "name": "数据对接与同步",
    "module": "EmrOp-InfoPage",
    "keywords": [
      "数据对接与同步",
      "对接患者",
      "费用等数据"
    ]
  },
  "EmrOp-InfoPage-003-TrtipEdit": {
    "name": "展示与编辑",
    "module": "EmrOp-InfoPage",
    "keywords": [
      "展示与编辑",
      "手术表格自增长拓展"
    ]
  },
  "EmrOp-InfoPage-004-TrtipGateway": {
    "name": "数据上报与网关",
    "module": "EmrOp-InfoPage",
    "keywords": [
      "数据上报与网关"
    ]
  }
};
