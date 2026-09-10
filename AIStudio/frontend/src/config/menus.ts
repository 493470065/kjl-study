/**
 * 全站菜单单一数据源。
 *
 * - App.vue 侧栏按 groups（visible !== false）渲染，权限过滤走 auth.hasMenuAccess；
 * - 账户管理 → 角色管理按此清单配置各角色可见菜单；
 * - 新增菜单时只改这里：加 item（含分组），侧栏与权限配置自动同步。
 */
import type { Component } from 'vue'
import {
  ChatDotRound, CircleCheck, DataBoard, DataAnalysis, Collection, Connection,
  SetUp, Operation, User, Cpu, Files, Key, Box, Clock, Promotion, EditPen,
  Monitor, Document, UserFilled, Files as FolderIcon, DataLine, TrendCharts,
  Tools, Link, Coin, MagicStick
} from '@element-plus/icons-vue'

export interface MenuItem {
  /** 路由路径（同时作为权限标识） */
  path: string
  /** 显示名 */
  label: string
  /** 图标组件 */
  icon: Component
  /** false = 未开放：可授权但不出现在侧栏 */
  visible?: boolean
}

export interface MenuGroup {
  key: string
  label: string
  items: MenuItem[]
}

/** 侧栏分组（顺序即显示顺序）；hidden 组的项不在侧栏渲染 */
export const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'workbench',
    label: '工作台',
    items: [
      { path: '/chat', label: 'AI 对话', icon: ChatDotRound },
      { path: '/todos', label: '待办事项', icon: CircleCheck },
      { path: '/requirements', label: '需求看板', icon: DataBoard },
      { path: '/req-collect', label: '需求归集', icon: DataAnalysis },
      { path: '/i18n-special', label: '多语专项', icon: Promotion }
    ]
  },
  {
    key: 'assistant',
    label: 'AI助手',
    items: [
      { path: '/knowledge', label: '知识库', icon: Collection },
      { path: '/skills', label: 'Skill 管理', icon: Files },
      { path: '/agents', label: 'Agent 管理', icon: User },
      { path: '/workflows', label: '工作流编排', icon: SetUp },
      { path: '/automate', label: '自动化流程', icon: Operation },
      { path: '/scheduled-tasks', label: '定时任务', icon: Clock }
    ]
  },
  {
    key: 'config',
    label: 'AI 配置',
    items: [
      { path: '/providers', label: 'LLM 管理', icon: Cpu },
      { path: '/mcp', label: 'MCP 管理', icon: Connection },
      { path: '/sandbox', label: '沙箱管理', icon: Box }
    ]
  },
  {
    key: 'product',
    label: 'AI产品',
    items: [
      { path: '/i18n-translate', label: '多语转译', icon: EditPen }
    ]
  },
  {
    key: 'system',
    label: '系统',
    items: [
      { path: '/users', label: '账户管理', icon: User }
    ]
  },
  {
    // 未开放页面：路由可直达，可授权给角色但不在侧栏显示
    key: 'hidden',
    label: '扩展能力（未开放）',
    items: [
      { path: '/dashboard', label: '首页', icon: DataLine, visible: false },
      { path: '/monitor', label: '运行时监控', icon: Monitor, visible: false },
      { path: '/tfs-dashboard', label: 'TFS 看板', icon: TrendCharts, visible: false },
      { path: '/audit', label: '审计日志', icon: Document, visible: false },
      { path: '/team', label: '团队协作', icon: UserFilled, visible: false },
      { path: '/repository', label: '仓库管理', icon: FolderIcon, visible: false },
      { path: '/product-lines', label: '产品线管理', icon: Coin, visible: false },
      { path: '/webhook', label: 'Webhook', icon: Link, visible: false },
      { path: '/evaluation', label: '效果评估', icon: MagicStick, visible: false },
      { path: '/structured', label: '结构化输出', icon: Key, visible: false },
      { path: '/dev-env', label: '开发环境', icon: Tools, visible: false },
      { path: '/compute', label: '本地算力', icon: Cpu, visible: false }
    ]
  }
]

/** 扁平菜单项（供权限配置 / 校验使用） */
export const ALL_MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap(g => g.items)

/** 侧栏实际渲染的项（排除 visible === false） */
export const SIDEBAR_GROUPS: MenuGroup[] = MENU_GROUPS
  .map(g => ({ ...g, items: g.items.filter(i => i.visible !== false) }))
  .filter(g => g.items.length > 0)

export function menuLabel(path: string): string {
  return ALL_MENU_ITEMS.find(i => i.path === path)?.label || path
}
