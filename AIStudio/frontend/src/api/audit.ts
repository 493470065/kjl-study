import http from './http'

export interface ToolInvocation {
  id: number
  conversationId?: string
  toolName: string
  toolInput?: string
  success: boolean
  latencyMs?: number
  username?: string
  createdAt: string
}

export interface LlmCall {
  id: number
  conversationId?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  latencyMs?: number
  success: boolean
  username?: string
  createdAt: string
}

export interface TaskExecution {
  id: number
  taskType: string
  status: string
  latencyMs?: number
  username?: string
  projectId?: string
  createdAt: string
}

export interface TokenSummary {
  today: { totalTokens: number; promptTokens: number; completionTokens: number; callCount: number; byUser: { username: string; totalTokens: number; promptTokens: number; completionTokens: number; callCount: number }[] }
  thisWeek: { totalTokens: number; promptTokens: number; completionTokens: number; callCount: number; byUser: { username: string; totalTokens: number; promptTokens: number; completionTokens: number; callCount: number }[] }
  thisMonth: { totalTokens: number; promptTokens: number; completionTokens: number; callCount: number; byUser: { username: string; totalTokens: number; promptTokens: number; completionTokens: number; callCount: number }[] }
  totalCalls: number
  totalToolCalls: number
}

export const auditApi = {
  listToolInvocations(params?: { username?: string; date?: string }) {
    return http.get<ToolInvocation[]>('/audit/tools', { params }).then(r => r.data)
  },

  listLlmCalls(params?: { username?: string; date?: string }) {
    return http.get<LlmCall[]>('/audit/llm-calls', { params }).then(r => r.data)
  },

  listTaskExecutions(params?: { username?: string; taskType?: string }) {
    return http.get<TaskExecution[]>('/audit/tasks', { params }).then(r => r.data)
  },

  getTokenSummary(username?: string) {
    return http.get<TokenSummary>('/audit/token-summary', { params: username ? { username } : {} }).then(r => r.data)
  },

  getTokenStats(period: string = 'day', username?: string) {
    return http.get('/audit/token-stats', { params: { period, username } }).then(r => r.data)
  }
}
