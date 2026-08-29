import http from './http'

/** 沙箱实例（旧契约字段 taskId/status 保留，新字段全部可选） */
export interface SandboxInfo {
  taskId?: string | null
  status: string
  id?: number
  name?: string
  mode?: string
  workdir?: string
  timeoutSeconds?: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

/** 沙箱启用状态与引擎能力（旧契约仅 enabled，新字段可选） */
export interface SandboxStatus {
  enabled: boolean
  /** 开关来源：system_configs（运行时配置）/ application.yml（静态配置） */
  enabledSource?: string
  engine?: string
  dockerEnabled?: boolean
  /** Docker 引擎开关来源：system_configs / application.yml */
  dockerEnabledSource?: string
  dockerAvailable?: boolean
  imagePresent?: boolean
  activeCount?: number
  defaults?: {
    dir?: string
    timeoutSeconds?: number
    maxOutputChars?: number
    docker?: { image?: string; memory?: string; cpus?: string }
  }
}

/** 沙箱执行记录 */
export interface SandboxExecution {
  id: number
  sandboxId: number
  seqNo: number
  command?: string
  commandPreview?: string
  status: string
  exitCode?: number | null
  output?: string
  durationMs?: number
  startedAt?: string
  finishedAt?: string
  createdBy?: string
}

export const sandboxApi = {
  getStatus() {
    return http.get<SandboxStatus>('/sandbox/status').then(r => r.data)
  },

  listActive() {
    return http.get<SandboxInfo[]>('/sandbox/active').then(r => r.data)
  },

  destroySandbox(key: string | number) {
    return http.delete(`/sandbox/${key}`)
  },

  list() {
    return http.get<SandboxInfo[]>('/sandbox').then(r => r.data)
  },

  create(data: { name: string; taskId?: string; mode?: string; timeoutSeconds?: number }) {
    return http.post<SandboxInfo>('/sandbox/create', data).then(r => r.data)
  },

  /** 更新运行时开关（写 system_configs，即时生效无需重启），返回最新完整状态 */
  updateConfig(data: { enabled?: boolean; dockerEnabled?: boolean }) {
    return http.post<SandboxStatus>('/sandbox/config', data).then(r => r.data)
  },

  exec(id: number, command: string, timeoutSeconds?: number) {
    return http.post<SandboxExecution>(`/sandbox/${id}/exec`, { command, timeoutSeconds }).then(r => r.data)
  },

  /** 执行历史（不含 output 大字段；轮询用，走静默错误出口） */
  listExecutions(sandboxId: number) {
    return http.get<SandboxExecution[]>(`/sandbox/${sandboxId}/executions`, { silent: true } as any).then(r => r.data)
  },

  getExecution(executionId: number) {
    return http.get<SandboxExecution>(`/sandbox/executions/${executionId}`).then(r => r.data)
  }
}
