/**
 * 工作汇报类型注册表（单一数据源）。
 *
 * 扩展新的汇报类型只需两步：
 * 1. 生成端按统一 JSON Schema 输出到 frontend/public/reports/<key>.json：
 *    { key, name, issue, meta, statement, highlights, sections:[{ title, blocks:[{ type:'table'|'note', ... }] }], legend }
 *    - table block: { type:'table', title, note?, columns:[], rows:[[]], filterable?: boolean }
 *    - note  block: { type:'note', text }
 * 2. 在 REPORT_TYPES 中注册一项（enabled: true），并填写 executor（技能/Agent/工作流绑定）。
 *
 * executor 支持在界面「工作汇报 → 类型卡片右上角齿轮」里按用户覆盖修改，
 * 覆盖值持久化在后端偏好 workreport.executor.v1（utils/userPrefs.ts），注册表值是默认值。
 *
 * 侧栏与渲染器均按此清单动态渲染，无需改动页面代码。
 */

/** 汇报类型的生成链路绑定（技能 / Agent / 工作流，均可配置） */
export interface ReportExecutor {
  /** AIStudio 技能名（data/skills/<skill>，通过 POST /api/skills/{skill}/exec 手动触发） */
  skill: string
  /** 技能执行入口脚本（相对技能目录） */
  entry: string
  /** 关联 Agent 名称（可空；记录该报告由哪个 Agent 产出） */
  agent: string
  /** 关联工作流名称（可空；记录该报告由哪条工作流编排） */
  workflow: string
  /** 默认生成参数（生成对话框的初始值；from/to 留空 = 自动推断） */
  defaultArgs: {
    owner: string
    dept: string
    highlights: string[]
  }
}

export interface ReportTypeMeta {
  /** 唯一标识（对应 public/reports/<key>.json） */
  key: string
  /** 显示名 */
  name: string
  /** 一句话描述（类型列表副标题） */
  description: string
  /** 汇报归属条线/部门 */
  owner: string
  /** 数据文件地址（public 下静态资源） */
  dataUrl: string
  /** 是否已接入（false = 规划中占位） */
  enabled: boolean
  /** 生成链路绑定（技能/Agent/工作流/默认参数） */
  executor?: ReportExecutor
}

export const REPORT_TYPES: ReportTypeMeta[] = [
  {
    key: 'biweekly-autodev',
    name: '产品功能 Spec 编写 & AIFlow 双周进度报告',
    description: 'Spec 编写进度（环比）+ AIFlow 自动开发进度（本期活跃需求）',
    owner: '病历',
    dataUrl: '/reports/biweekly-autodev-v1.json',
    enabled: true,
    executor: {
      skill: 'spec-autodev-biweekly-report',
      entry: 'scripts/run.cjs',
      agent: 'RACC 病历片区助手',
      workflow: '双周报告采集生成',
      defaultArgs: { owner: '康景磊', dept: '病历', highlights: [] }
    }
  },
  {
    key: 'biweekly-i18n',
    name: '多语专项进度双周报告',
    description: '多语专项合并公版进度 + 翻译转译量统计（规划中）',
    owner: '多语专项',
    dataUrl: '/reports/biweekly-i18n-v1.json',
    enabled: false,
    executor: {
      skill: '',
      entry: '',
      agent: '',
      workflow: '',
      defaultArgs: { owner: '康景磊', dept: '多语专项', highlights: [] }
    }
  },
  {
    key: 'req-pool-weekly',
    name: '病历病案需求池周报',
    description: '需求池吞吐 / 积压 / 超期分析（规划中）',
    owner: '病历',
    dataUrl: '/reports/req-pool-weekly-v1.json',
    enabled: false,
    executor: {
      skill: '',
      entry: '',
      agent: '',
      workflow: '',
      defaultArgs: { owner: '康景磊', dept: '病历', highlights: [] }
    }
  }
]

/** 用户覆盖的偏好 key（与 utils/userPrefs.ts KNOWN_PREF_KEYS 保持一致） */
export const WORKREPORT_EXECUTOR_PREF_KEY = 'workreport.executor.v1'
