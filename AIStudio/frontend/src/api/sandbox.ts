import http from './http'


export interface SandboxInfo {
  taskId: string
  status: string
}

export interface SandboxStatus {
  enabled: boolean
}

export const sandboxApi = {
  getStatus() {
    return http.get<SandboxStatus>('/sandbox/status').then(r => r.data)
  },

  listActive() {
    return http.get<SandboxInfo[]>('/sandbox/active').then(r => r.data)
  },

  destroySandbox(taskId: string) {
    return http.delete(`/sandbox/${taskId}`)
  }
}
