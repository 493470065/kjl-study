/**
 * 需求归集 — 功能点健康度盘点数据（静态快照）
 *
 * 数据来源：三份功能点健康度盘点报告（2026-08-31 生成，数据快照 2026-08-25 导出，分析窗口 2026-02-28~08-31）：
 * 《WiNEX病历管理-功能点健康度盘点》（住院）、《WiNEX门诊病历管理-功能点健康度盘点》、《WiNEX急诊病历-功能点健康度盘点》。
 * 三条线（住院/门诊/急诊）均已完成全量盘点并接入归集。
 *
 * 口径提醒：FPI 仅在同一系统内横向比较，不能跨条线直接比大小。
 */

// ========== 产品线定义 ==========
export interface ProductLine {
  key: string
  label: string
  /** 盘点状态：done=已全量盘点 / partial=部分盘点 / pending=待盘点 */
  status: 'done' | 'partial' | 'pending'
  /** 月均工单（已盘点部分） */
  monthlyAvg: number | null
  /** 盘点工单总量 */
  total: number | null
  /** 医院提出占比 */
  hospitalRatio: string | null
  specNote: string
}

export const PRODUCT_LINES: ProductLine[] = [
  {
    key: 'inpatient',
    label: '住院病历',
    status: 'done',
    monthlyAvg: 482.6,
    total: 3156,
    hospitalRatio: '89.4%',
    specNote: 'Spec 16 模块 / 112 功能点，全量映射完成'
  },
  {
    key: 'outpatient',
    label: '门诊病历',
    status: 'partial',
    monthlyAvg: 156.9,
    total: null,
    hospitalRatio: '76.1%',
    specNote: '已知：医院提出占比 76.1%；new-fp 中会诊 36 条、门诊质控 22 条（与住院缺口同构）'
  },
  {
    key: 'emergency',
    label: '急诊病历',
    status: 'pending',
    monthlyAvg: null,
    total: null,
    hospitalRatio: null,
    specNote: '尚未纳入盘点范围，待按住院同口径（Spec 骨架 → 工单映射 → FPI）补齐'
  }
]

// ========== 住院条线：全局概览 ==========
export const INPATIENT_OVERVIEW = {
  total: 3156,
  req: 978,
  soft: 789,
  support: 1389,
  hospitalRatio: '89.4%',
  hospitalReqRatio: '67.5%',
  fpHitRatio: '80.8%',
  hospitalCount: 150,
  top5Hospitals: ['泰康仙林鼓楼医院 118', '攀枝花市中西医结合医院 86', '江西中医药大学附属医院 83', '广州中医药大学第三附属医院 79', '上海市第一人民医院酒泉医院 69'],
  /** 归集漏斗：导出 → 保留 */
  funnel: [
    { label: 'TFS 导出', value: 28462 },
    { label: '作废剔除', value: 484, reduce: true },
    { label: '非目标产品剔除', value: 17212, reduce: true },
    { label: '窗口外剔除', value: 7516, reduce: true },
    { label: '合并需求剔除', value: 94, reduce: true },
    { label: '保留归集', value: 3156, keep: true }
  ]
}

// ========== 住院条线：月度工作量趋势（整月口径，括号为去年同期） ==========
export interface MonthTrendRow {
  month: string
  req: number; reqPrevYear: number
  soft: number; softPrevYear: number
  support: number; supportPrevYear: number
  total: number; totalPrevYear: number
}

export const INPATIENT_MONTH_TREND: MonthTrendRow[] = [
  { month: '2026-02', req: 53, reqPrevYear: 233, soft: 60, softPrevYear: 49, support: 116, supportPrevYear: 84, total: 229, totalPrevYear: 366 },
  { month: '2026-03', req: 164, reqPrevYear: 181, soft: 130, softPrevYear: 112, support: 275, supportPrevYear: 167, total: 569, totalPrevYear: 460 },
  { month: '2026-04', req: 144, reqPrevYear: 213, soft: 166, softPrevYear: 124, support: 246, supportPrevYear: 148, total: 556, totalPrevYear: 485 },
  { month: '2026-05', req: 182, reqPrevYear: 147, soft: 136, softPrevYear: 165, support: 275, supportPrevYear: 152, total: 593, totalPrevYear: 464 },
  { month: '2026-06', req: 180, reqPrevYear: 162, soft: 125, softPrevYear: 139, support: 216, supportPrevYear: 150, total: 521, totalPrevYear: 451 },
  { month: '2026-07', req: 162, reqPrevYear: 166, soft: 123, softPrevYear: 233, support: 235, supportPrevYear: 234, total: 520, totalPrevYear: 633 },
  { month: '2026-08', req: 145, reqPrevYear: 235, soft: 107, softPrevYear: 221, support: 138, supportPrevYear: 242, total: 390, totalPrevYear: 698 }
]

// ========== 住院条线：模块总览（16 模块，全部有工单命中） ==========
export interface ModuleRow {
  code: string
  name: string
  req: number
  soft: number
  support: number
  total: number
}

export const INPATIENT_MODULES: ModuleRow[] = [
  { code: 'BLGL-01-BLSX', name: '01病历书写', req: 161, soft: 159, support: 309, total: 629 },
  { code: 'BLGL-13-BASY', name: '13病案首页', req: 113, soft: 118, support: 303, total: 534 },
  { code: 'BLGL-05-HZGL', name: '05会诊管理', req: 137, soft: 123, support: 173, total: 433 },
  { code: 'BLGL-06-DSXTX', name: '06待书写提醒', req: 58, soft: 58, support: 87, total: 203 },
  { code: 'BLGL-02-FZLR', name: '02辅助录入', req: 61, soft: 65, support: 68, total: 194 },
  { code: 'BLGL-15-QM', name: '15CA签名', req: 36, soft: 20, support: 41, total: 97 },
  { code: 'BLGL-10-BLCX', name: '10病历查询', req: 34, soft: 18, support: 28, total: 80 },
  { code: 'BLGL-04-QXGL', name: '04权限管理', req: 20, soft: 14, support: 32, total: 66 },
  { code: 'BLGL-09-GDJY', name: '09归档借阅', req: 14, soft: 15, support: 33, total: 62 },
  { code: 'BLGL-18-BLFC', name: '18病历封存', req: 29, soft: 11, support: 15, total: 55 },
  { code: 'BLGL-11-BLDY', name: '11病历打印', req: 13, soft: 13, support: 25, total: 51 },
  { code: 'BLGL-03-ZDYY', name: '03诊断引用', req: 10, soft: 12, support: 21, total: 43 },
  { code: 'BLGL-12-MBGL', name: '12模板管理', req: 14, soft: 10, support: 14, total: 38 },
  { code: 'BLGL-08-BLML', name: '08病历目录', req: 12, soft: 11, support: 11, total: 34 },
  { code: 'BLGL-07-DYGL', name: '07短语管理', req: 4, soft: 7, support: 10, total: 21 },
  { code: 'BLGL-17-BLJS', name: '17病历解锁', req: 3, soft: 4, support: 4, total: 11 }
]

// ========== 住院条线：功能点 FPI 全表（112 个，按 FPI 降序） ==========
export type FpiLevel = 'danger' | 'warn' | 'watch' | 'health'

export interface FpiRow {
  module: string       // 模块短名，如「01病历书写」
  fp: string           // 功能点编码
  name: string         // 功能点名称
  avgReq: number       // 月均需求
  req6m: number        // 半年内需求数
  softRatio: number    // 软质/需求
  trend: string        // 趋势（变化率或「↑↑ 封顶」）
  trendScore: number   // 趋势分（0~100）
  yoy: string          // 同比（变化率或「—」）
  yoyScore: number     // 同比分（0~100）
  fpi: number          // FPI 综合分
  level: FpiLevel      // 等级
}

export const FPI_LEVEL_META: Record<FpiLevel, { label: string; color: string }> = {
  danger: { label: '🔴 危险', color: '#f56c6c' },
  warn: { label: '🟠 预警', color: '#e6a23c' },
  watch: { label: '🟡 关注', color: '#d4b106' },
  health: { label: '🟢 健康', color: '#67c23a' }
}

export const INPATIENT_FPI: FpiRow[] = [
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-001', name: '会诊申请', avgReq: 9.29, req6m: 65, softRatio: 0.8, trend: '↑↑ 封顶', trendScore: 78, yoy: '+364%', yoyScore: 99, fpi: 89.8, level: 'danger' },
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-006', name: '会诊计费', avgReq: 2.29, req6m: 16, softRatio: 0.8, trend: '↑↑ 封顶', trendScore: 95, yoy: '+1500%', yoyScore: 100, fpi: 85.8, level: 'danger' },
  { module: '06待书写提醒', fp: 'BLGL-06-DSXTX-004', name: '待书写任务处理与状态', avgReq: 1.57, req6m: 11, softRatio: 1.5, trend: '↑↑ 封顶', trendScore: 97, yoy: '—', yoyScore: 68, fpi: 84.0, level: 'danger' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-002', name: '病历编辑与保存', avgReq: 8.57, req6m: 60, softRatio: 0.9, trend: '↑↑ 封顶', trendScore: 80, yoy: '—', yoyScore: 10, fpi: 81.4, level: 'danger' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-009', name: '病历数据引用', avgReq: 4.71, req6m: 33, softRatio: 0.6, trend: '↑↑ 封顶', trendScore: 82, yoy: '—', yoyScore: 23, fpi: 80.2, level: 'danger' },
  { module: '06待书写提醒', fp: 'BLGL-06-DSXTX-002', name: '任务中心与提醒展示', avgReq: 4.14, req6m: 29, softRatio: 0.8, trend: '+43%', trendScore: 55, yoy: '—', yoyScore: 33, fpi: 79.8, level: 'danger' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-008', name: '病案系统对接与数据上报', avgReq: 2.29, req6m: 16, softRatio: 1.8, trend: '+33%', trendScore: 50, yoy: '—', yoyScore: 35, fpi: 79.4, level: 'danger' },
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-003', name: '会诊答复与记录', avgReq: 2.57, req6m: 18, softRatio: 1.2, trend: '↑↑ 封顶', trendScore: 79, yoy: '—', yoyScore: 9, fpi: 79.3, level: 'danger' },
  { module: '15CA签名', fp: 'BLGL-15-QM-002', name: '患者签名', avgReq: 2.57, req6m: 18, softRatio: 0.4, trend: '+12%', trendScore: 41, yoy: '+64%', yoyScore: 95, fpi: 78.4, level: 'danger' },
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-005', name: '会诊签到', avgReq: 1.71, req6m: 12, softRatio: 0.3, trend: '↑↑ 封顶', trendScore: 89, yoy: '+200%', yoyScore: 96, fpi: 77.7, level: 'danger' },
  { module: '10病历查询', fp: 'BLGL-10-BLCX-001', name: '科室病历查询', avgReq: 2.0, req6m: 14, softRatio: 0.7, trend: '↑↑ 封顶', trendScore: 90, yoy: '—', yoyScore: 45, fpi: 77.7, level: 'danger' },
  { module: '10病历查询', fp: 'BLGL-10-BLCX-002', name: '全院病历查询', avgReq: 1.86, req6m: 13, softRatio: 0.3, trend: '+86%', trendScore: 76, yoy: '+225%', yoyScore: 97, fpi: 76.8, level: 'danger' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-001', name: '病历创建与模板管理', avgReq: 2.71, req6m: 19, softRatio: 0.7, trend: '+48%', trendScore: 56, yoy: '—', yoyScore: 30, fpi: 76.7, level: 'warn' },
  { module: '10病历查询', fp: 'BLGL-10-BLCX-003', name: '病历结构化查询', avgReq: 1.0, req6m: 7, softRatio: 0.6, trend: '↑↑ 封顶', trendScore: 100, yoy: '+250%', yoyScore: 98, fpi: 76.6, level: 'warn' },
  { module: '18病历封存', fp: 'BLGL-18-BLFC-003', name: '无纸化三方对接', avgReq: 3.71, req6m: 26, softRatio: 0.4, trend: '↑↑ 封顶', trendScore: 77, yoy: '—', yoyScore: 7, fpi: 75.0, level: 'warn' },
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-004', name: '会诊接收与指派', avgReq: 2.71, req6m: 19, softRatio: 1.4, trend: '0%', trendScore: 0, yoy: '—', yoyScore: 6, fpi: 73.2, level: 'warn' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-013', name: '书写助手与临床数据提取', avgReq: 1.43, req6m: 10, softRatio: 1.0, trend: '↑↑ 封顶', trendScore: 84, yoy: '—', yoyScore: 25, fpi: 72.9, level: 'warn' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-011', name: '诊疗计划与评估表', avgReq: 0.71, req6m: 5, softRatio: 1.4, trend: '↑↑ 封顶', trendScore: 96, yoy: '—', yoyScore: 68, fpi: 72.6, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-007', name: '首页提交与校验', avgReq: 2.29, req6m: 16, softRatio: 1.6, trend: '0%', trendScore: 5, yoy: '—', yoyScore: 21, fpi: 72.4, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-004', name: '手术信息获取与管理', avgReq: 4.14, req6m: 29, softRatio: 0.8, trend: '0%', trendScore: 4, yoy: '—', yoyScore: 17, fpi: 72.3, level: 'warn' },
  { module: '05会诊管理', fp: 'BLGL-05-HZGL-002', name: '会诊审核', avgReq: 1.0, req6m: 7, softRatio: 0.7, trend: '+17%', trendScore: 47, yoy: '+40%', yoyScore: 95, fpi: 72.0, level: 'warn' },
  { module: '06待书写提醒', fp: 'BLGL-06-DSXTX-005', name: '时限规则配置与参数', avgReq: 1.43, req6m: 10, softRatio: 0.6, trend: '↑↑ 封顶', trendScore: 85, yoy: '—', yoyScore: 31, fpi: 71.2, level: 'warn' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-001', name: '病历审签权限管理', avgReq: 1.43, req6m: 10, softRatio: 1.1, trend: '+33%', trendScore: 54, yoy: '—', yoyScore: 16, fpi: 70.5, level: 'warn' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-010', name: '痕迹与修改历史', avgReq: 1.43, req6m: 10, softRatio: 0.3, trend: '↑↑ 封顶', trendScore: 88, yoy: '—', yoyScore: 41, fpi: 70.0, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-010', name: '首页参数与映射配置', avgReq: 2.71, req6m: 19, softRatio: 0.1, trend: '↑↑ 封顶', trendScore: 77, yoy: '—', yoyScore: 5, fpi: 69.6, level: 'warn' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-006', name: '手术记录', avgReq: 1.57, req6m: 11, softRatio: 2.3, trend: '0%', trendScore: 9, yoy: '-54%', yoyScore: 2, fpi: 69.4, level: 'warn' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-012', name: '病历删除与复制', avgReq: 0.71, req6m: 5, softRatio: 0.6, trend: '↑↑ 封顶', trendScore: 99, yoy: '—', yoyScore: 74, fpi: 69.0, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-003', name: '诊断信息同步与录入', avgReq: 1.0, req6m: 7, softRatio: 1.1, trend: '↑↑ 封顶', trendScore: 81, yoy: '—', yoyScore: 15, fpi: 68.4, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-002', name: '患者基本信息自动获取', avgReq: 1.0, req6m: 7, softRatio: 2.3, trend: '+78%', trendScore: 70, yoy: '—', yoyScore: 5, fpi: 67.8, level: 'warn' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-006', name: '重症监护与三方数据获取', avgReq: 1.0, req6m: 7, softRatio: 0.7, trend: '↑↑ 封顶', trendScore: 86, yoy: '—', yoyScore: 32, fpi: 67.6, level: 'warn' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-018', name: '远程会诊调阅', avgReq: 1.0, req6m: 7, softRatio: 1.1, trend: '0%', trendScore: 15, yoy: '—', yoyScore: 49, fpi: 67.5, level: 'warn' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-004', name: '医嘱信息引用', avgReq: 1.0, req6m: 7, softRatio: 0.3, trend: '↑↑ 封顶', trendScore: 91, yoy: '—', yoyScore: 46, fpi: 65.6, level: 'warn' },
  { module: '08病历目录', fp: 'BLGL-08-BLML-005', name: '文书分组与多语显示', avgReq: 1.14, req6m: 8, softRatio: 0.1, trend: '↑↑ 封顶', trendScore: 87, yoy: '—', yoyScore: 37, fpi: 65.4, level: 'warn' },
  { module: '11病历打印', fp: 'BLGL-11-BLDY-003', name: '打印模式与格式控制', avgReq: 0.57, req6m: 4, softRatio: 1.8, trend: '+33%', trendScore: 51, yoy: '—', yoyScore: 48, fpi: 63.6, level: 'warn' },
  { module: '06待书写提醒', fp: 'BLGL-06-DSXTX-003', name: '时限质控与超时计算', avgReq: 0.71, req6m: 5, softRatio: 2.0, trend: '0%', trendScore: 11, yoy: '—', yoyScore: 38, fpi: 61.4, level: 'watch' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-001', name: '病案首页创建与目录管理', avgReq: 1.43, req6m: 10, softRatio: 0.3, trend: '+33%', trendScore: 53, yoy: '—', yoyScore: 11, fpi: 61.2, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-002', name: '检查报告调阅与引用', avgReq: 0.57, req6m: 4, softRatio: 3.2, trend: '+33%', trendScore: 50, yoy: '—', yoyScore: 18, fpi: 60.3, level: 'watch' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-008', name: '归档查询与统计', avgReq: 0.71, req6m: 5, softRatio: 0.2, trend: '↑↑ 封顶', trendScore: 92, yoy: '—', yoyScore: 47, fpi: 59.6, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-010', name: '智能标签引入', avgReq: 0.71, req6m: 5, softRatio: 0.4, trend: '0%', trendScore: 28, yoy: '—', yoyScore: 73, fpi: 59.6, level: 'watch' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-005', name: '病历审签阅改', avgReq: 1.0, req6m: 7, softRatio: 0.9, trend: '0%', trendScore: 5, yoy: '—', yoyScore: 22, fpi: 59.3, level: 'watch' },
  { module: '15CA签名', fp: 'BLGL-15-QM-001', name: '医生CA签名', avgReq: 0.71, req6m: 5, softRatio: 0.4, trend: '↑↑ 封顶', trendScore: 86, yoy: '—', yoyScore: 32, fpi: 59.1, level: 'watch' },
  { module: '15CA签名', fp: 'BLGL-15-QM-007', name: 'CA校验与签名流程', avgReq: 0.43, req6m: 3, softRatio: 0.3, trend: '+83%', trendScore: 74, yoy: '—', yoyScore: 78, fpi: 57.2, level: 'watch' },
  { module: '15CA签名', fp: 'BLGL-15-QM-004', name: 'CA接口对接', avgReq: 0.71, req6m: 5, softRatio: 0.4, trend: '↑↑ 封顶', trendScore: 83, yoy: '—', yoyScore: 23, fpi: 57.1, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-020', name: '辅助区交互与配置', avgReq: 0.43, req6m: 3, softRatio: 1.7, trend: '0%', trendScore: 23, yoy: '—', yoyScore: 61, fpi: 56.8, level: 'watch' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-004', name: '病历提交与撤销提交', avgReq: 0.29, req6m: 2, softRatio: 5.5, trend: '+17%', trendScore: 44, yoy: '—', yoyScore: 72, fpi: 56.1, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-012', name: '输血血透信息调阅', avgReq: 0.86, req6m: 6, softRatio: 0.2, trend: '0%', trendScore: 19, yoy: '—', yoyScore: 52, fpi: 54.9, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-008', name: '护理文书与护理信息引入', avgReq: 0.57, req6m: 4, softRatio: 0.0, trend: '+33%', trendScore: 52, yoy: '—', yoyScore: 85, fpi: 54.6, level: 'watch' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-003', name: '病历签署', avgReq: 0.57, req6m: 4, softRatio: 3.0, trend: '0%', trendScore: 3, yoy: '—', yoyScore: 14, fpi: 54.1, level: 'watch' },
  { module: '12模板管理', fp: 'BLGL-12-MBGL-001', name: '知识文档管理', avgReq: 1.0, req6m: 7, softRatio: 0.4, trend: '0%', trendScore: 2, yoy: '—', yoyScore: 13, fpi: 53.5, level: 'watch' },
  { module: '15CA签名', fp: 'BLGL-15-QM-005', name: 'CA签名配置与方式', avgReq: 0.43, req6m: 3, softRatio: 0.7, trend: '+83%', trendScore: 73, yoy: '—', yoyScore: 53, fpi: 53.5, level: 'watch' },
  { module: '11病历打印', fp: 'BLGL-11-BLDY-001', name: '病历集中打印', avgReq: 0.43, req6m: 3, softRatio: 1.0, trend: '+57%', trendScore: 57, yoy: '-25%', yoyScore: 4, fpi: 53.1, level: 'watch' },
  { module: '07短语管理', fp: 'BLGL-07-DYGL-001', name: '短语收藏与创建', avgReq: 0.29, req6m: 2, softRatio: 1.0, trend: '↑↑ 封顶', trendScore: 95, yoy: '—', yoyScore: 63, fpi: 52.8, level: 'watch' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-007', name: '诊断插入与编辑', avgReq: 0.43, req6m: 3, softRatio: 1.3, trend: '+83%', trendScore: 71, yoy: '—', yoyScore: 12, fpi: 52.4, level: 'watch' },
  { module: '08病历目录', fp: 'BLGL-08-BLML-003', name: '文书目录展示', avgReq: 0.43, req6m: 3, softRatio: 1.0, trend: '0%', trendScore: 21, yoy: '—', yoyScore: 58, fpi: 52.2, level: 'watch' },
  { module: '12模板管理', fp: 'BLGL-12-MBGL-006', name: '成套模板管理', avgReq: 0.57, req6m: 4, softRatio: 0.2, trend: '+86%', trendScore: 75, yoy: '—', yoyScore: 29, fpi: 52.0, level: 'watch' },
  { module: '11病历打印', fp: 'BLGL-11-BLDY-004', name: '打印权限与归档控制', avgReq: 0.43, req6m: 3, softRatio: 0.3, trend: '0%', trendScore: 30, yoy: '—', yoyScore: 76, fpi: 51.8, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-016', name: '诊疗回顾调阅', avgReq: 0.57, req6m: 4, softRatio: 0.2, trend: '0%', trendScore: 20, yoy: '—', yoyScore: 57, fpi: 51.3, level: 'watch' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-005', name: '病历召回审核', avgReq: 0.29, req6m: 2, softRatio: 3.0, trend: '+29%', trendScore: 49, yoy: '—', yoyScore: 54, fpi: 49.9, level: 'watch' },
  { module: '07短语管理', fp: 'BLGL-07-DYGL-004', name: '短语维护', avgReq: 0.14, req6m: 1, softRatio: 3.0, trend: '+67%', trendScore: 66, yoy: '—', yoyScore: 79, fpi: 49.5, level: 'watch' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-008', name: '诊断管理', avgReq: 0.43, req6m: 3, softRatio: 0.3, trend: '0%', trendScore: 25, yoy: '—', yoyScore: 65, fpi: 49.0, level: 'watch' },
  { module: '06待书写提醒', fp: 'BLGL-06-DSXTX-001', name: '待书写任务生成', avgReq: 0.43, req6m: 3, softRatio: 0.7, trend: '+83%', trendScore: 72, yoy: '—', yoyScore: 20, fpi: 48.8, level: 'watch' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-001', name: '诊断数据接入与查询', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '+67%', trendScore: 68, yoy: '—', yoyScore: 83, fpi: 48.0, level: 'watch' },
  { module: '07短语管理', fp: 'BLGL-07-DYGL-003', name: '短语引用与快捷检索', avgReq: 0.14, req6m: 1, softRatio: 2.0, trend: '+67%', trendScore: 65, yoy: '—', yoyScore: 77, fpi: 47.7, level: 'watch' },
  { module: '11病历打印', fp: 'BLGL-11-BLDY-005', name: '打印实现与性能优化', avgReq: 0.29, req6m: 2, softRatio: 0.5, trend: '0%', trendScore: 32, yoy: '—', yoyScore: 80, fpi: 47.2, level: 'watch' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-002', name: '规培生教学权限管理', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '+67%', trendScore: 67, yoy: '—', yoyScore: 82, fpi: 47.1, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-011', name: '手麻文书调阅', avgReq: 0.29, req6m: 2, softRatio: 0.5, trend: '↑↑ 封顶', trendScore: 94, yoy: '—', yoyScore: 56, fpi: 47.0, level: 'watch' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-004', name: '病历操作权限管理', avgReq: 0.57, req6m: 4, softRatio: 0.2, trend: '0%', trendScore: 10, yoy: '—', yoyScore: 34, fpi: 46.8, level: 'watch' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-009', name: '归档校验与提醒', avgReq: 0.43, req6m: 3, softRatio: 0.3, trend: '0%', trendScore: 22, yoy: '—', yoyScore: 59, fpi: 46.8, level: 'watch' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-007', name: '生命体征与体温单引入', avgReq: 0.29, req6m: 2, softRatio: 1.5, trend: '+17%', trendScore: 42, yoy: '—', yoyScore: 36, fpi: 45.1, level: 'health' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-005', name: '角色职称权限管理', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '0%', trendScore: 35, yoy: '—', yoyScore: 89, fpi: 44.0, level: 'health' },
  { module: '18病历封存', fp: 'BLGL-18-BLFC-001', name: '病历封存与解封操作', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '↑↑ 封顶', trendScore: 98, yoy: '—', yoyScore: 70, fpi: 43.9, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-005', name: '诊断样式与显示配置', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '+17%', trendScore: 46, yoy: '—', yoyScore: 86, fpi: 43.7, level: 'health' },
  { module: '11病历打印', fp: 'BLGL-11-BLDY-002', name: '单份与单病程打印', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '0%', trendScore: 32, yoy: '—', yoyScore: 81, fpi: 42.9, level: 'health' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-009', name: '首页撤销提交与修改', avgReq: 0.14, req6m: 1, softRatio: 5.0, trend: '0%', trendScore: 24, yoy: '—', yoyScore: 64, fpi: 42.3, level: 'health' },
  { module: '17病历解锁', fp: 'BLGL-17-BLJS-001', name: '病历时限锁定与编辑锁定', avgReq: 0.43, req6m: 3, softRatio: 1.0, trend: '0%', trendScore: 1, yoy: '—', yoyScore: 8, fpi: 41.6, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-006', name: '诊断信息引用', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '+17%', trendScore: 45, yoy: '—', yoyScore: 75, fpi: 40.5, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-003', name: '诊断引用交互', avgReq: 0.14, req6m: 1, softRatio: 5.0, trend: '+67%', trendScore: 60, yoy: '—', yoyScore: 39, fpi: 40.0, level: 'health' },
  { module: '12模板管理', fp: 'BLGL-12-MBGL-004', name: '个人模板管理', avgReq: 0.14, req6m: 1, softRatio: 6.0, trend: '0%', trendScore: 18, yoy: '—', yoyScore: 51, fpi: 39.2, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-009', name: '过敏信息引入', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '0%', trendScore: 41, yoy: '—', yoyScore: 94, fpi: 38.5, level: 'health' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-006', name: '科室病区权限管理', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 69, yoy: '—', yoyScore: 86, fpi: 38.2, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-002', name: '病历手动归档', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '↑↑ 封顶', trendScore: 93, yoy: '—', yoyScore: 55, fpi: 37.8, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-005', name: '既往病历引用', avgReq: 0.14, req6m: 1, softRatio: 14.0, trend: '+67%', trendScore: 59, yoy: '—', yoyScore: 26, fpi: 37.7, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-006', name: '诊断类型引用', avgReq: 0.43, req6m: 3, softRatio: 0.0, trend: '0%', trendScore: 16, yoy: '—', yoyScore: 50, fpi: 37.0, level: 'health' },
  { module: '18病历封存', fp: 'BLGL-18-BLFC-002', name: '封存权限与操作控制', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 68, yoy: '—', yoyScore: 84, fpi: 37.0, level: 'health' },
  { module: '01病历书写', fp: 'BLGL-01-BLSX-007', name: '书写任务与时限提醒', avgReq: 0.29, req6m: 2, softRatio: 0.5, trend: '+29%', trendScore: 48, yoy: '—', yoyScore: 19, fpi: 36.4, level: 'health' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-003', name: '分级访问控制', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '+17%', trendScore: 43, yoy: '—', yoyScore: 66, fpi: 36.3, level: 'health' },
  { module: '12模板管理', fp: 'BLGL-12-MBGL-003', name: '知识文档发布', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '0%', trendScore: 26, yoy: '+0%', yoyScore: 67, fpi: 35.4, level: 'health' },
  { module: '15CA签名', fp: 'BLGL-15-QM-006', name: '签名图片与PDF处理', avgReq: 0.14, req6m: 1, softRatio: 5.0, trend: '+67%', trendScore: 58, yoy: '—', yoyScore: 14, fpi: 35.0, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-004', name: '病历召回申请', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '0%', trendScore: 29, yoy: '-50%', yoyScore: 3, fpi: 32.7, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-006', name: '病历借阅流程', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '0%', trendScore: 17, yoy: '—', yoyScore: 50, fpi: 32.5, level: 'health' },
  { module: '08病历目录', fp: 'BLGL-08-BLML-004', name: '病历新建与模板选择', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '+67%', trendScore: 59, yoy: '—', yoyScore: 27, fpi: 31.9, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-017', name: '检查互认调阅', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 64, yoy: '—', yoyScore: 69, fpi: 30.5, level: 'health' },
  { module: '15CA签名', fp: 'BLGL-15-QM-003', name: '多人代理人签名', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 63, yoy: '—', yoyScore: 60, fpi: 27.7, level: 'health' },
  { module: '13病案首页', fp: 'BLGL-13-BASY-005', name: '费用信息获取与更新', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '0%', trendScore: 7, yoy: '—', yoyScore: 28, fpi: 27.5, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-008', name: '诊断落库与对外对接', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 40, yoy: '—', yoyScore: 93, fpi: 26.8, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-003', name: '微生物报告调阅与引用', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 62, yoy: '—', yoyScore: 59, fpi: 26.7, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-014', name: '公式符号引用', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 39, yoy: '—', yoyScore: 92, fpi: 25.9, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-019', name: '患者360与跨院影像调阅', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 38, yoy: '—', yoyScore: 91, fpi: 25.0, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-007', name: '三方病案系统对接', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 37, yoy: '—', yoyScore: 90, fpi: 24.1, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-015', name: '费用信息查看', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+67%', trendScore: 61, yoy: '—', yoyScore: 43, fpi: 22.7, level: 'health' },
  { module: '04权限管理', fp: 'BLGL-04-QXGL-007', name: '病历业务授权', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 34, yoy: '—', yoyScore: 88, fpi: 22.0, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-010', name: '归档配置与豁免', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 33, yoy: '—', yoyScore: 87, fpi: 21.1, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-002', name: '诊断变更同步与提醒', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 31, yoy: '—', yoyScore: 77, fpi: 18.4, level: 'health' },
  { module: '07短语管理', fp: 'BLGL-07-DYGL-002', name: '短语审核', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 27, yoy: '—', yoyScore: 71, fpi: 16.5, level: 'health' },
  { module: '12模板管理', fp: 'BLGL-12-MBGL-002', name: '知识文档审核', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 36, yoy: '-100%', yoyScore: 1, fpi: 14.3, level: 'health' },
  { module: '02辅助录入', fp: 'BLGL-02-FZLR-001', name: '检验报告调阅与引用', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 23, yoy: '—', yoyScore: 62, fpi: 13.8, level: 'health' },
  { module: '08病历目录', fp: 'BLGL-08-BLML-001', name: '病历目录配置', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 14, yoy: '—', yoyScore: 44, fpi: 9.6, level: 'health' },
  { module: '08病历目录', fp: 'BLGL-08-BLML-002', name: '模板目录映射', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 14, yoy: '—', yoyScore: 42, fpi: 8.5, level: 'health' },
  { module: '03诊断引用', fp: 'BLGL-03-ZDYY-004', name: '诊断权限与签名', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 13, yoy: '—', yoyScore: 41, fpi: 7.6, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-003', name: '病历撤销归档', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 12, yoy: '—', yoyScore: 40, fpi: 6.6, level: 'health' },
  { module: '17病历解锁', fp: 'BLGL-17-BLJS-002', name: '病历解锁申请', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 6, yoy: '—', yoyScore: 24, fpi: 3.1, level: 'health' },
  { module: '09归档借阅', fp: 'BLGL-09-GDJY-001', name: '病历自动归档', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 8, yoy: '-100%', yoyScore: 0, fpi: 1.5, level: 'health' }
]

// ========== Spec 外新业务（new-fp）缺口主题：条线级对照 ==========
export interface NewFpTheme {
  theme: string
  inpatient: number | null   // 住院条线条数
  outpatient: number | null  // 门诊条线条数
  emergency: number | null   // 急诊条线条数
  suggestion: string
}

export const NEW_FP_THEMES: NewFpTheme[] = [
  { theme: '病历质控（终末质控/缺陷项/整改追踪/抽查评分）', inpatient: 87, outpatient: 22, emergency: null, suggestion: '建议各条线新增「病历质控」模块（条线级缺口同构）' },
  { theme: '会诊/MDT（排班/短信通知/授权/MDT 管理）', inpatient: 87, outpatient: 36, emergency: null, suggestion: '建议在会诊管理下增设「会诊排班与 MDT」功能点组' },
  { theme: '病历智能生成与 AI（智能生成/Copilot/CDSS）', inpatient: 13, outpatient: null, emergency: null, suggestion: '建议在辅助录入下增设「AI 辅助生成」功能点组' },
  { theme: '三方接口对接（EMR/协同平台/惠每 DRG/院感/DIP）', inpatient: 8, outpatient: null, emergency: null, suggestion: '接口平台化或归病案首页对接扩展，逐条评估' },
  { theme: '编辑器接口迭代（表格接口/编辑器扩展）', inpatient: 4, outpatient: null, emergency: null, suggestion: '归病历书写编辑器能力扩展' },
  { theme: '其他长尾（院感/DIP/VTE/脑卒中/惠每等）', inpatient: 61, outpatient: null, emergency: null, suggestion: '逐条评估：部分归现有模块扩展，部分为新业务对接' }
]

// ========== 治理通道总览（阶段 3 深挖产出，按条线） ==========
export interface GovRow { channel: string; count: string; softEvidence: string; modules: string }

export const GOVERNANCE_CHANNELS: Record<string, GovRow[]> = {
  inpatient: [
    { channel: '3.1 设计方案', count: '8 个', softEvidence: '约 367 条软证据', modules: '01书写 2 / 05会诊 2 / 13首页 3 / 06提醒 1' },
    { channel: '3.2 产品规划建议', count: '14 条', softEvidence: '另附注 3 条', modules: '01书写 4 / 05会诊 2 / 13首页 4 / 06提醒 4' },
    { channel: '3.3 缺陷批量治理', count: '11 组', softEvidence: '—', modules: '01书写 3 / 05会诊 2 / 13首页 3 / 06提醒 3' },
    { channel: '观察项', count: '4 个', softEvidence: '—', modules: '四模块各 1' }
  ],
  outpatient: [
    { channel: '3.1 设计方案', count: '5 个', softEvidence: '01 共 34 需改代码 / 08 23 需软 / 05 21 需软 / 02 13 需软', modules: '01书写 2（带入一致性/签署收敛）/ 08签名 1 / 05查询 1 / 02助手 1' },
    { channel: '3.2 产品规划建议', count: '17 条', softEvidence: '—', modules: '01书写 7 / 08签名 3 / 05查询 3 / 02助手 4' },
    { channel: '3.3 缺陷批量治理', count: '5 组', softEvidence: '另附零散软质 14 条', modules: '01书写 2（报错/模板）/ 08·05·02 各 1 组' },
    { channel: '观察项', count: '20 个（81 条）', softEvidence: '—', modules: '08签名 8 / 05查询 5 / 02助手 7' }
  ],
  emergency: [
    { channel: '3.1 设计方案', count: '2 个', softEvidence: '各约 10 条需软', modules: '01书写 2（统一签名服务与患签回写 / 同步规则状态机+门急诊参数对齐）' },
    { channel: '3.2 产品规划建议', count: '4 条', softEvidence: '—', modules: '01书写（门诊存量能力移植：续写/解锁/有效期分离/历史病历复制）' },
    { channel: '3.3 缺陷批量治理', count: '4 条', softEvidence: '—', modules: '01书写（升级回归基线强制冒烟）' },
    { channel: '观察项', count: '1 个', softEvidence: '—', modules: '01书写（打印版式，攒证据再立项）' }
  ]
}

// ========== 跨条线结构性结论 ==========
export const CROSS_LINE_INSIGHTS = [
  '三类「一致性」设计缺口跨条线同构：状态一致性（签名审签多端不同步 / 会诊流转无状态机 / 撤销签署后签名残留）、取值基准（手术时间三入口 / 诊疗信息带入多入口各算各的 / 医嘱诊断同步错位）、出口对账（首页上报、会诊答复统计）——建议条线级沉淀统一的「状态机+取值仲裁+出口对账」设计方法论。',
  'Spec 外新业务规模空前且三线同构：住院 260 条 new-fp 中质控 87 + 会诊/MDT 87 + AI 13 占 72%；门诊 96 条中会诊 36 + 质控 22 + AI 8 占 69%；急诊 12 条中会诊协同 11 条——会诊缺口三线同构（87/36/11）、质控住院门诊同构（87/22），均为条线级产品缺位而非单系统问题。',
  '支持单是三大条线共同的第二战场：住院 1389 条占 44%（同比 +28%）、门诊 399 条占 39%（同比 +38%）、急诊 96 条占 51%（CON 系列参数在急诊分支不生效/未合并门诊参数为共性根因）——配置校验、配置向导、排障工具改进建议单列运维工具规划。',
  '压力全部集中在书写主链路：住院「写、诊、报」三链路占 50.6%、门诊 01病历书写占 46.7%、急诊 01病历书写占 54%——三条线的 FPI 🔴 功能点绝大多数落在书写/签署/查询主干，「写得顺、签得稳、查得到」是三线共同命题。',
  'FPI 🔴 ≠ 设计不合理：住院 06待书写提醒双红的 71% 工单实为新会诊系统重构的载体效应，门诊唯一的 3.2 通道🔴是会诊场景 Spec 无覆盖，急诊打印锁定🔴不足立项门槛转观察项——解读红点前先做工单构成透视与根因分通道（此判断方法适用于所有条线）。'
]

// ============================================================
// 门诊病历条线（WiNEX 门诊病历管理，Spec 10 模块/54 功能点）
// ============================================================

export const OUTPATIENT_OVERVIEW = {
  total: 1031,
  req: 389,
  soft: 243,
  support: 399,
  hospitalRatio: '90.7%',
  hospitalReqRatio: '76.1%',
  fpHitRatio: '61.8%',
  funnel: [
    { label: 'TFS 导出', value: 28462 },
    { label: '作废剔除', value: 484, reduce: true },
    { label: '非目标产品剔除', value: 24618, reduce: true },
    { label: '合并需求剔除', value: 196, reduce: true },
    { label: '窗口外剔除', value: 2133, reduce: true },
    { label: '保留归集', value: 1031, keep: true }
  ]
}

export const OUTPATIENT_MONTH_TREND: MonthTrendRow[] = [
  { month: '2026-02', req: 22, reqPrevYear: 70, soft: 18, softPrevYear: 21, support: 28, supportPrevYear: 34, total: 68, totalPrevYear: 125 },
  { month: '2026-03', req: 42, reqPrevYear: 69, soft: 44, softPrevYear: 21, support: 65, supportPrevYear: 37, total: 151, totalPrevYear: 127 },
  { month: '2026-04', req: 74, reqPrevYear: 69, soft: 38, softPrevYear: 107, support: 65, supportPrevYear: 47, total: 177, totalPrevYear: 223 },
  { month: '2026-05', req: 80, reqPrevYear: 62, soft: 36, softPrevYear: 60, support: 86, supportPrevYear: 36, total: 202, totalPrevYear: 158 },
  { month: '2026-06', req: 62, reqPrevYear: 56, soft: 38, softPrevYear: 45, support: 58, supportPrevYear: 35, total: 158, totalPrevYear: 136 },
  { month: '2026-07', req: 71, reqPrevYear: 65, soft: 45, softPrevYear: 56, support: 69, supportPrevYear: 47, total: 185, totalPrevYear: 168 },
  { month: '2026-08', req: 60, reqPrevYear: 46, soft: 42, softPrevYear: 29, support: 55, supportPrevYear: 73, total: 157, totalPrevYear: 148 }
]

export const OUTPATIENT_MODULES: ModuleRow[] = [
  { code: 'MZBL-01-BLSX', name: '01病历书写', req: 166, soft: 127, support: 188, total: 481 },
  { code: 'MZBL-08-QM', name: '08CA签名', req: 47, soft: 38, support: 35, total: 120 },
  { code: 'MZBL-05-BLCX', name: '05病历查询', req: 39, soft: 21, support: 53, total: 113 },
  { code: 'MZBL-02-SXZS', name: '02书写助手', req: 35, soft: 23, support: 51, total: 109 },
  { code: 'MZBL-10-ZLXXY', name: '10诊疗信息页', req: 19, soft: 6, support: 19, total: 44 },
  { code: 'MZBL-09-YWZ', name: '09预问诊', req: 18, soft: 7, support: 4, total: 29 },
  { code: 'MZBL-03-BLJS', name: '03病历解锁', req: 12, soft: 6, support: 7, total: 25 },
  { code: 'MZBL-04-RJBL', name: '04日间病历', req: 0, soft: 0, support: 1, total: 1 }
]

export const OUTPATIENT_FPI: FpiRow[] = [
  { module: '01病历书写', fp: 'MZBL-01-BLSX-002', name: '病历签署', avgReq: 2.71, req6m: 19, softRatio: 0.7, trend: '+280%', trendScore: 79, yoy: '+280%', yoyScore: 95, fpi: 86.7, level: 'danger' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-001', name: '病历创建与编辑', avgReq: 2.43, req6m: 17, softRatio: 1.1, trend: '+90%', trendScore: 77, yoy: '—', yoyScore: 26, fpi: 83.1, level: 'danger' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-004', name: '诊疗信息自动带入', avgReq: 3.29, req6m: 23, softRatio: 0.7, trend: '+22%', trendScore: 62, yoy: '—', yoyScore: 5, fpi: 76.9, level: 'danger' },
  { module: '05病历查询', fp: 'MZBL-05-BLCX-001', name: '病历综合查询', avgReq: 2.0, req6m: 14, softRatio: 0.6, trend: '0%', trendScore: 18, yoy: '+75%', yoyScore: 92, fpi: 76.2, level: 'danger' },
  { module: '08CA签名', fp: 'MZBL-08-QM-002', name: '患者CA签名', avgReq: 1.86, req6m: 13, softRatio: 1.0, trend: '+14%', trendScore: 46, yoy: '—', yoyScore: 18, fpi: 71.5, level: 'warn' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-008', name: '书写控制与权限校验', avgReq: 1.86, req6m: 13, softRatio: 0.2, trend: '+344%', trendScore: 90, yoy: '—', yoyScore: 41, fpi: 71.0, level: 'warn' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-007', name: '外部数据同步', avgReq: 1.71, req6m: 12, softRatio: 0.5, trend: '+33%', trendScore: 69, yoy: '—', yoyScore: 44, fpi: 69.7, level: 'warn' },
  { module: '08CA签名', fp: 'MZBL-08-QM-004', name: '知情同意书签名', avgReq: 1.57, req6m: 11, softRatio: 0.6, trend: '+1000%', trendScore: 85, yoy: '—', yoyScore: 21, fpi: 69.0, level: 'warn' },
  { module: '08CA签名', fp: 'MZBL-08-QM-003', name: '医生签名', avgReq: 0.86, req6m: 6, softRatio: 1.0, trend: '+33%', trendScore: 67, yoy: '+500%', yoyScore: 97, fpi: 68.2, level: 'warn' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-003', name: '医嘱引用', avgReq: 0.86, req6m: 6, softRatio: 0.5, trend: '+500%', trendScore: 95, yoy: '+500%', yoyScore: 100, fpi: 67.7, level: 'warn' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-006', name: '待书写文书生成', avgReq: 1.0, req6m: 7, softRatio: 0.3, trend: '-47%', trendScore: 41, yoy: '—', yoyScore: 85, fpi: 65.4, level: 'warn' },
  { module: '08CA签名', fp: 'MZBL-08-QM-001', name: '病历CA签署与撤销', avgReq: 0.71, req6m: 5, softRatio: 1.2, trend: '+100%', trendScore: 92, yoy: '—', yoyScore: 49, fpi: 62.8, level: 'warn' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-005', name: '历史病历引用', avgReq: 0.71, req6m: 5, softRatio: 2.8, trend: '+433%', trendScore: 87, yoy: '—', yoyScore: 36, fpi: 62.1, level: 'watch' },
  { module: '10诊疗信息页', fp: 'MZBL-10-ZLXXY-002', name: '数据对接与同步', avgReq: 0.71, req6m: 5, softRatio: 0.2, trend: '+100%', trendScore: 100, yoy: '—', yoyScore: 77, fpi: 60.3, level: 'watch' },
  { module: '03病历解锁', fp: 'MZBL-03-BLJS-004', name: '解锁参数与流程配置', avgReq: 0.86, req6m: 6, softRatio: 0.0, trend: '-73%', trendScore: 38, yoy: '—', yoyScore: 82, fpi: 57.7, level: 'watch' },
  { module: '09预问诊', fp: 'MZBL-09-YWZ-004', name: '预问诊数据回写接口', avgReq: 0.86, req6m: 6, softRatio: 0.2, trend: '-33%', trendScore: 26, yoy: '—', yoyScore: 67, fpi: 55.4, level: 'watch' },
  { module: '05病历查询', fp: 'MZBL-05-BLCX-005', name: '病历痕迹查询与病历完成情况', avgReq: 1.29, req6m: 9, softRatio: 0.2, trend: '-62%', trendScore: 3, yoy: '—', yoyScore: 10, fpi: 55.1, level: 'watch' },
  { module: '10诊疗信息页', fp: 'MZBL-10-ZLXXY-004', name: '数据上报与网关', avgReq: 1.0, req6m: 7, softRatio: 0.1, trend: '-78%', trendScore: 13, yoy: '—', yoyScore: 38, fpi: 53.3, level: 'watch' },
  { module: '08CA签名', fp: 'MZBL-08-QM-006', name: 'CA签名日志与时间戳', avgReq: 0.43, req6m: 3, softRatio: 1.0, trend: '-100%', trendScore: 44, yoy: '—', yoyScore: 90, fpi: 53.3, level: 'watch' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-002', name: '医技报告引用', avgReq: 0.57, req6m: 4, softRatio: 1.0, trend: '↑↑ 封顶', trendScore: 82, yoy: '—', yoyScore: 15, fpi: 51.3, level: 'watch' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-004', name: '外院报告互认引用', avgReq: 0.71, req6m: 5, softRatio: 0.0, trend: '+433%', trendScore: 97, yoy: '—', yoyScore: 62, fpi: 51.3, level: 'watch' },
  { module: '10诊疗信息页', fp: 'MZBL-10-ZLXXY-001', name: '信息页生成与维护', avgReq: 0.71, req6m: 5, softRatio: 0.2, trend: '-67%', trendScore: 31, yoy: '—', yoyScore: 72, fpi: 50.8, level: 'watch' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-010', name: '书写助手报告插入格式配置', avgReq: 0.29, req6m: 2, softRatio: 1.0, trend: '+33%', trendScore: 56, yoy: '—', yoyScore: 79, fpi: 46.9, level: 'watch' },
  { module: '03病历解锁', fp: 'MZBL-03-BLJS-001', name: '病历解锁申请', avgReq: 0.57, req6m: 4, softRatio: 0.8, trend: '+33%', trendScore: 64, yoy: '—', yoyScore: 13, fpi: 46.7, level: 'watch' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-005', name: '常用语管理引用', avgReq: 0.29, req6m: 2, softRatio: 2.5, trend: '+33%', trendScore: 51, yoy: '—', yoyScore: 56, fpi: 44.6, level: 'health' },
  { module: '09预问诊', fp: 'MZBL-09-YWZ-002', name: '预问诊数据获取与展示', avgReq: 0.29, req6m: 2, softRatio: 2.5, trend: '+33%', trendScore: 49, yoy: '—', yoyScore: 23, fpi: 39.0, level: 'health' },
  { module: '05病历查询', fp: 'MZBL-05-BLCX-004', name: '患者综合查询-历史病历查询', avgReq: 0.57, req6m: 4, softRatio: 1.0, trend: '-100%', trendScore: 0, yoy: '—', yoyScore: 8, fpi: 38.7, level: 'health' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-008', name: '医学工具与符号插入', avgReq: 0.14, req6m: 1, softRatio: 4.0, trend: '↑↑ 封顶', trendScore: 74, yoy: '—', yoyScore: 51, fpi: 38.2, level: 'health' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-007', name: '医学公式计算', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '+33%', trendScore: 59, yoy: '—', yoyScore: 87, fpi: 37.7, level: 'health' },
  { module: '08CA签名', fp: 'MZBL-08-QM-007', name: 'CA签名参数与签名图片配置', avgReq: 0.29, req6m: 2, softRatio: 0.5, trend: '+33%', trendScore: 54, yoy: '—', yoyScore: 59, fpi: 36.9, level: 'health' },
  { module: '01病历书写', fp: 'MZBL-01-BLSX-003', name: '补充病历', avgReq: 0.14, req6m: 1, softRatio: 7.0, trend: '-67%', trendScore: 36, yoy: '-88%', yoyScore: 0, fpi: 35.9, level: 'health' },
  { module: '05病历查询', fp: 'MZBL-05-BLCX-003', name: '病历综合查询-病历查询权限控制', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '-100%', trendScore: 28, yoy: '—', yoyScore: 69, fpi: 33.3, level: 'health' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-009', name: '智能提醒校验', avgReq: 0.14, req6m: 1, softRatio: 2.0, trend: '↑↑ 封顶', trendScore: 72, yoy: '—', yoyScore: 31, fpi: 32.3, level: 'health' },
  { module: '09预问诊', fp: 'MZBL-09-YWZ-001', name: '预问诊参数与模式配置', avgReq: 0.43, req6m: 3, softRatio: 0.3, trend: '-33%', trendScore: 8, yoy: '—', yoyScore: 28, fpi: 32.3, level: 'health' },
  { module: '03病历解锁', fp: 'MZBL-03-BLJS-002', name: '解锁申请查询与流程查看', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '-100%', trendScore: 23, yoy: '—', yoyScore: 64, fpi: 30.3, level: 'health' },
  { module: '09预问诊', fp: 'MZBL-09-YWZ-003', name: '预问诊数据引用到病历', avgReq: 0.43, req6m: 3, softRatio: 0.0, trend: '-33%', trendScore: 10, yoy: '—', yoyScore: 33, fpi: 27.4, level: 'health' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-006', name: '预问诊引用', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '-100%', trendScore: 33, yoy: '—', yoyScore: 74, fpi: 23.6, level: 'health' },
  { module: '03病历解锁', fp: 'MZBL-03-BLJS-003', name: '病历解锁审批', avgReq: 0.14, req6m: 1, softRatio: 2.0, trend: '0%', trendScore: 5, yoy: '-67%', yoyScore: 3, fpi: 20.8, level: 'health' },
  { module: '10诊疗信息页', fp: 'MZBL-10-ZLXXY-003', name: '展示与编辑', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 21, yoy: '—', yoyScore: 54, fpi: 10.0, level: 'health' },
  { module: '02书写助手', fp: 'MZBL-02-SXZS-001', name: '历史病历引用', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '0%', trendScore: 15, yoy: '—', yoyScore: 46, fpi: 6.7, level: 'health' }
]

// ============================================================
// 急诊病历条线（WiNEX 急诊病历，Spec 6 模块/35 功能点）
// ============================================================

export const EMERGENCY_OVERVIEW = {
  total: 188,
  req: 65,
  soft: 27,
  support: 96,
  hospitalRatio: '97.9%',
  hospitalReqRatio: '93.8%',
  fpHitRatio: '85.1%',
  extraNote: '映射覆盖 85.1%（160/188 命中）；基线排除 19 条（纯接口对接/质控事件/菜单移植为主）；new-fp 12 条（急诊会诊协同 11 + 预检信息引用 1）；合并需求剔除 19 条（窗口口径）。支持单占 51% 为第一大构成——CON 系列参数在急诊分支不生效/未合并门诊参数是跨问题点共性根因。'
}

export const EMERGENCY_MONTH_TREND: MonthTrendRow[] = [
  { month: '2026-02', req: 7, reqPrevYear: 16, soft: 3, softPrevYear: 0, support: 12, supportPrevYear: 10, total: 22, totalPrevYear: 26 },
  { month: '2026-03', req: 6, reqPrevYear: 19, soft: 3, softPrevYear: 0, support: 14, supportPrevYear: 6, total: 23, totalPrevYear: 25 },
  { month: '2026-04', req: 11, reqPrevYear: 21, soft: 2, softPrevYear: 1, support: 13, supportPrevYear: 23, total: 26, totalPrevYear: 45 },
  { month: '2026-05', req: 13, reqPrevYear: 6, soft: 8, softPrevYear: 1, support: 14, supportPrevYear: 7, total: 35, totalPrevYear: 14 },
  { month: '2026-06', req: 7, reqPrevYear: 15, soft: 0, softPrevYear: 2, support: 14, supportPrevYear: 16, total: 21, totalPrevYear: 33 },
  { month: '2026-07', req: 14, reqPrevYear: 10, soft: 8, softPrevYear: 0, support: 18, supportPrevYear: 23, total: 40, totalPrevYear: 33 },
  { month: '2026-08', req: 14, reqPrevYear: 14, soft: 6, softPrevYear: 2, support: 22, supportPrevYear: 23, total: 42, totalPrevYear: 39 }
]

export const EMERGENCY_MODULES: ModuleRow[] = [
  { code: 'JZBL-01-BLSX', name: '01病历书写', req: 28, soft: 15, support: 59, total: 102 },
  { code: 'JZBL-04-JWBL', name: '04既往病历', req: 3, soft: 4, support: 20, total: 27 },
  { code: 'JZBL-03-MBGL', name: '03模板管理', req: 10, soft: 4, support: 6, total: 20 },
  { code: 'JZBL-06-BLCX', name: '06病历查询', req: 11, soft: 0, support: 6, total: 17 },
  { code: 'JZBL-02-SXZS', name: '02书写助手', req: 8, soft: 3, support: 4, total: 15 },
  { code: 'JZBL-05-ZLXXY', name: '05诊疗信息页', req: 3, soft: 1, support: 0, total: 4 }
]

export const EMERGENCY_FPI: FpiRow[] = [
  { module: '01病历书写', fp: 'JZBL-01-BLSX-003', name: '病历签署与撤销', avgReq: 1.14, req6m: 8, softRatio: 0.25, trend: '+1.00', trendScore: 95, yoy: '—', yoyScore: 0, fpi: 80.0, level: 'danger' },
  { module: '01病历书写', fp: 'JZBL-01-BLSX-002', name: '病历编辑与保存', avgReq: 1.29, req6m: 9, softRatio: 0.56, trend: '+0.00', trendScore: 0, yoy: '—', yoyScore: 17, fpi: 78.3, level: 'danger' },
  { module: '01病历书写', fp: 'JZBL-01-BLSX-004', name: '病历打印与打印锁定', avgReq: 0.57, req6m: 4, softRatio: 0.5, trend: '+0.33', trendScore: 52, yoy: '—', yoyScore: 34, fpi: 76.5, level: 'danger' },
  { module: '03模板管理', fp: 'JZBL-03-MBGL-007', name: '模板缺省值配置', avgReq: 0.86, req6m: 6, softRatio: 0.17, trend: '+0.33', trendScore: 56, yoy: '—', yoyScore: 13, fpi: 73.9, level: 'warn' },
  { module: '02书写助手', fp: 'JZBL-02-SXZS-004', name: '护理记录引用', avgReq: 0.43, req6m: 3, softRatio: 0.33, trend: '+0.00', trendScore: 21, yoy: '—', yoyScore: 69, fpi: 72.6, level: 'warn' },
  { module: '01病历书写', fp: 'JZBL-01-BLSX-001', name: '病历创建与模板选择', avgReq: 0.29, req6m: 2, softRatio: 2.0, trend: '+0.00', trendScore: 13, yoy: '—', yoyScore: 56, fpi: 69.6, level: 'warn' },
  { module: '01病历书写', fp: 'JZBL-01-BLSX-006', name: '诊疗包管理', avgReq: 0.14, req6m: 1, softRatio: 2.0, trend: '+0.00', trendScore: 39, yoy: '—', yoyScore: 95, fpi: 66.5, level: 'warn' },
  { module: '04既往病历', fp: 'JZBL-04-JWBL-001', name: '历史病历浏览', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.00', trendScore: 43, yoy: '—', yoyScore: 100, fpi: 62.2, level: 'warn' },
  { module: '05诊疗信息页', fp: 'JZBL-05-ZLXXY-001', name: '信息页加载与数据同步', avgReq: 0.43, req6m: 3, softRatio: 0.0, trend: '+0.83', trendScore: 91, yoy: '—', yoyScore: 30, fpi: 61.7, level: 'watch' },
  { module: '02书写助手', fp: 'JZBL-02-SXZS-002', name: '报告引用', avgReq: 0.29, req6m: 2, softRatio: 0.5, trend: '+0.29', trendScore: 47, yoy: '—', yoyScore: 4, fpi: 59.1, level: 'watch' },
  { module: '02书写助手', fp: 'JZBL-02-SXZS-005', name: '常用语管理', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 86, yoy: '—', yoyScore: 82, fpi: 57.0, level: 'watch' },
  { module: '02书写助手', fp: 'JZBL-02-SXZS-003', name: '医嘱引用', avgReq: 0.14, req6m: 1, softRatio: 1.0, trend: '+0.00', trendScore: 26, yoy: '—', yoyScore: 73, fpi: 53.5, level: 'watch' },
  { module: '03模板管理', fp: 'JZBL-03-MBGL-004', name: '默认模板设置', avgReq: 0.29, req6m: 2, softRatio: 0.0, trend: '+1.00', trendScore: 100, yoy: '—', yoyScore: 8, fpi: 52.6, level: 'watch' },
  { module: '04既往病历', fp: 'JZBL-04-JWBL-002', name: '多档案多机构病历查询', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 82, yoy: '—', yoyScore: 78, fpi: 52.6, level: 'watch' },
  { module: '03模板管理', fp: 'JZBL-03-MBGL-001', name: '个人模板维护', avgReq: 0.14, req6m: 1, softRatio: 3.0, trend: '+0.00', trendScore: 17, yoy: '—', yoyScore: 60, fpi: 48.7, level: 'watch' },
  { module: '03模板管理', fp: 'JZBL-03-MBGL-006', name: '特殊标记关联模板配置', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 78, yoy: '—', yoyScore: 65, fpi: 44.8, level: 'health' },
  { module: '04既往病历', fp: 'JZBL-04-JWBL-004', name: '会诊记录查看', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 73, yoy: '—', yoyScore: 52, fpi: 37.0, level: 'health' },
  { module: '01病历书写', fp: 'JZBL-01-BLSX-005', name: '历史病历查看', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 69, yoy: '—', yoyScore: 43, fpi: 31.3, level: 'health' },
  { module: '05诊疗信息页', fp: 'JZBL-05-ZLXXY-003', name: '信息页诊断信息同步', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '+0.00', trendScore: 34, yoy: '—', yoyScore: 91, fpi: 30.9, level: 'health' },
  { module: '06病历查询', fp: 'JZBL-06-BLCX-003', name: '患者综合查询', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '+0.00', trendScore: 30, yoy: '—', yoyScore: 86, fpi: 26.5, level: 'health' },
  { module: '06病历查询', fp: 'JZBL-06-BLCX-004', name: '结构化数据查询', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 65, yoy: '—', yoyScore: 26, fpi: 23.9, level: 'health' },
  { module: '06病历查询', fp: 'JZBL-06-BLCX-001', name: '急诊病历综合查询', avgReq: 0.14, req6m: 1, softRatio: 0.0, trend: '+0.67', trendScore: 60, yoy: '—', yoyScore: 21, fpi: 19.6, level: 'health' },
  { module: '04既往病历', fp: 'JZBL-04-JWBL-003', name: '当前病历过滤模式配置', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '+0.00', trendScore: 8, yoy: '—', yoyScore: 47, fpi: 13.5, level: 'health' },
  { module: '04既往病历', fp: 'JZBL-04-JWBL-006', name: '旧系统病历接入', avgReq: 0.0, req6m: 0, softRatio: 0.0, trend: '+0.00', trendScore: 4, yoy: '—', yoyScore: 39, fpi: 7.8, level: 'health' }
]

// ============================================================
// 三条线聚合：统一供视图按 Tab 渲染
// ============================================================

export interface LineDataSet {
  overview: {
    total: number
    req: number
    soft: number
    support: number
    supportRatio: string
    hospitalRatio: string
    fpHitRatio: string
    funnel?: { label: string; value: number; reduce?: boolean; keep?: boolean }[]
    extraNote?: string
  }
  modules: ModuleRow[]
  fpi: FpiRow[]
  trend: MonthTrendRow[]
  governance: GovRow[]
  fpiNote: string
  moduleConcl: string
  trendConcl: string
}

export const LINE_DATA: Record<string, LineDataSet> = {
  inpatient: {
    overview: { ...INPATIENT_OVERVIEW, supportRatio: '44%' },
    modules: INPATIENT_MODULES,
    fpi: INPATIENT_FPI,
    trend: INPATIENT_MONTH_TREND,
    governance: GOVERNANCE_CHANNELS.inpatient,
    fpiNote: '112 个功能点全部有工单命中；等级分布 🔴 12 / 🟠 22 / 🟡 34 / 🟢 44。',
    moduleConcl: '压力集中在「写、诊、报」三大主链路：01病历书写 + 13病案首页 + 05会诊管理 合计 1596 条占 50.6%；12 个🔴危险功能点中 7 个落在这三个模块。',
    trendConcl: '本期月均 482.6 条（同比 -5%、环比前置 -24%）高位回落；但支持单同比 +28% 逆势上升，运维负荷外溢是当前第一大构成。3~5 月高位后 6~8 月逐月下行，无恶化拐点。'
  },
  outpatient: {
    overview: { ...OUTPATIENT_OVERVIEW, supportRatio: '38.7%' },
    modules: OUTPATIENT_MODULES,
    fpi: OUTPATIENT_FPI,
    trend: OUTPATIENT_MONTH_TREND,
    governance: GOVERNANCE_CHANNELS.outpatient,
    fpiNote: '40/54 个功能点有工单命中（06病历借阅、07案例管理两模块窗口内零命中）；等级分布 🔴 4 / 🟠 8 / 🟡 12 / 🟢 16。new-fp 96 条中会诊/MDT 36 + 门诊质控 22 + AI 智能化 8 合计 66 条占 69%——门诊 Spec 缺「会诊」「质控」两个模块级能力域。',
    moduleConcl: '压力高度集中在书写主链路：01病历书写一个模块占全系统 46.7%（481/1031），4 个🔴危险功能点中 3 个在本模块（病历签署 86.7 / 创建编辑 83.1 / 诊疗信息带入 76.9）；08CA签名是第二风险带（4 个🟠全部与签名相关，涉及电子签名合规，撤销后签名残留为唯一🔴问题点）。',
    trendConcl: '本期月均 156.9 条，同比 +1%、环比 -7%，总量三个时间维度基本持平；需求环比 +11% 爬坡、软质同比 -23% 改善，但支持单同比 +38%（44.1→60.9/月）与需求并列双高；08CA签名（2.3→12.1/月）与 09预问诊为新近爆发建设点，10诊疗信息页回落。'
  },
  emergency: {
    overview: { total: 188, req: 65, soft: 27, support: 96, supportRatio: '51.1%', hospitalRatio: '97.9%', fpHitRatio: '85.1%', extraNote: EMERGENCY_OVERVIEW.extraNote },
    modules: EMERGENCY_MODULES,
    fpi: EMERGENCY_FPI,
    trend: EMERGENCY_MONTH_TREND,
    governance: GOVERNANCE_CHANNELS.emergency,
    fpiNote: '24/35 个功能点有工单命中；等级分布 🔴 3 / 🟠 5 / 🟡 7 / 🟢 9。注意：急诊全部功能点去年同期无基数，同比分差异来自分位排名噪声，解读应以需求密度 + 软质集中度为主。',
    moduleConcl: '01病历书写断层第一（102/188 = 54%），FPI 三个🔴（签署撤销 80.0 / 编辑保存 78.3 / 打印锁定 76.5）全部落在「书写-签署-打印」主干；04既往病历总量第二但支持单占 74%，且 11 条会诊协同工单落在其周边（Spec 无承接）。',
    trendConcl: '月均 29.9 条（同比 -3%、环比 +5%）总量平稳；最显著异常是软质暴增（0.9→4.3/月，同比 +399%、环比 +52%），叠加 7~8 月连续创窗口新高（40/42 条）；需求同比 -29% 收缩，增量全部落在书写侧（01病历书写 0.33→6.14/月集中建设期）。'
  }
}
