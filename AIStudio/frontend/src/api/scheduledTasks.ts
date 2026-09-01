import http from './http'

export interface ScheduledTask {
  id: number
  taskKey: string
  name: string
  description?: string
  cronExpression: string
  /** 执行参数 JSON：taskKey 为 automate:<code> 时作为自动化任务表单参数 */
  paramsJson?: string
  enabled: boolean
  lastRunTime?: string
  lastStatus?: string
  lastMessage?: string
  createdAt: string
  updatedAt: string
}

export interface TaskLog {
  id: number
  taskId: number
  taskKey: string
  taskName: string
  startTime: string
  endTime: string
  status: string
  message?: string
  durationMs: number
}

export interface CacheStatus {
  [key: string]: {
    updatedAt: string | null
    hasData: boolean
  }
}

export function listTasks() {
  return http.get<ScheduledTask[]>('/scheduled-tasks').then(r => r.data)
}

export function createTask(data: Partial<ScheduledTask>) {
  return http.post<ScheduledTask>('/scheduled-tasks', data).then(r => r.data)
}

export function updateTask(id: number, data: Partial<ScheduledTask>) {
  return http.put<ScheduledTask>(`/scheduled-tasks/${id}`, data).then(r => r.data)
}

export function triggerTask(id: number) {
  return http.post<TaskLog>(`/scheduled-tasks/${id}/trigger`).then(r => r.data)
}

export function deleteTask(id: number) {
  return http.delete(`/scheduled-tasks/${id}`).then(r => r.data)
}

export function listLogs(taskKey?: string) {
  return http.get<TaskLog[]>('/scheduled-tasks/logs', { params: { taskKey } }).then(r => r.data)
}

export function getCacheStatus() {
  return http.get<CacheStatus>('/scheduled-tasks/cache-status').then(r => r.data)
}

/** Cron 预览：校验表达式并返回接下来 3 次执行时间（"MM-dd HH:mm"） */
export function previewCron(cron: string) {
  return http.post<{ next: string[] }>('/scheduled-tasks/cron-preview', { cron }).then(r => r.data)
}
