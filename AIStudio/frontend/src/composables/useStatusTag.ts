/**
 * 全站唯一的状态 → 标签颜色/文案映射。
 * 之前 Automate/Webhook/ScheduledTask/Workflows/Mcp 各写一套，且 RUNNING 三色冲突，现收敛于此。
 *
 * 状态色规范：
 * - 运行中/执行中/等待 → warning（橙）
 * - 成功/已启用/完成   → success（绿）
 * - 失败/错误          → danger（红，仅留给失败）
 * - 已停止/草稿/中性   → info（灰）
 */
export type TagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'

const STATUS_MAP: Record<string, { type: TagType; label: string }> = {
  RUNNING: { type: 'warning', label: '运行中' },
  EXECUTING: { type: 'warning', label: '执行中' },
  PENDING: { type: 'warning', label: '等待中' },
  WAITING: { type: 'warning', label: '等待中' },
  QUEUED: { type: 'warning', label: '排队中' },
  RETRYING: { type: 'warning', label: '重试中' },
  SUCCESS: { type: 'success', label: '成功' },
  SUCCEEDED: { type: 'success', label: '成功' },
  COMPLETED: { type: 'success', label: '已完成' },
  DONE: { type: 'success', label: '已完成' },
  ENABLED: { type: 'success', label: '已启用' },
  ACTIVE: { type: 'success', label: '活跃' },
  FAILED: { type: 'danger', label: '失败' },
  ERROR: { type: 'danger', label: '错误' },
  TIMEOUT: { type: 'danger', label: '超时' },
  STOPPED: { type: 'info', label: '已停止' },
  DISABLED: { type: 'info', label: '已停用' },
  IDLE: { type: 'info', label: '空闲' },
  DRAFT: { type: 'info', label: '草稿' },
  SKIPPED: { type: 'info', label: '已跳过' },
  CANCELLED: { type: 'info', label: '已取消' },
  // 自动化/Pipeline 特有状态
  WAITING_CONFIRM: { type: 'warning', label: '待确认' },
  PAUSED_ON_FAILURE: { type: 'warning', label: '失败暂停' },
  // Consul 健康状态
  PASSING: { type: 'success', label: '正常' },
  WARNING: { type: 'warning', label: '告警' },
  CRITICAL: { type: 'danger', label: '异常' },
  UNKNOWN: { type: 'info', label: '未知' },
  // 算力/沙箱节点
  ONLINE: { type: 'success', label: '在线' },
  OFFLINE: { type: 'info', label: '离线' },
  BUSY: { type: 'warning', label: '忙碌' },
  CREATING: { type: 'warning', label: '创建中' },
  DESTROYED: { type: 'info', label: '已销毁' },
  // 知识库 Wiki
  GENERATED: { type: 'success', label: '已生成' },
  GENERATING: { type: 'warning', label: '生成中' },
  GRAPH_READY: { type: 'success', label: '图谱就绪' }
}

export function useStatusTag() {
  function statusType(status: string | null | undefined): TagType {
    if (!status) return 'info'
    return STATUS_MAP[status.toUpperCase()]?.type || 'info'
  }

  /** 有中文映射用映射；未知状态原样展示 */
  function statusLabel(status: string | null | undefined): string {
    if (!status) return '-'
    return STATUS_MAP[status.toUpperCase()]?.label || status
  }

  return { statusType, statusLabel }
}
