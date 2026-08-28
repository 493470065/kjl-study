import http from './http'

export interface LlmProviderUser {
  username: string
  displayName: string
  modelName: string | null
  enabled: boolean
}

export interface LlmProvider {
  id: number
  name: string
  displayName: string
  providerType: string
  baseUrl: string
  modelName: string
  /** API Key 是否已配置（后端不返回明文，仅脱敏值） */
  hasApiKey: boolean
  /** 脱敏后的 API Key，如 sk-1********abcd */
  apiKeyMasked: string
  /** 仅用于新增/编辑提交，列表接口不返回 */
  apiKey?: string
  enabled: boolean
  isDefault: boolean
  createdAt: string
  users: LlmProviderUser[]
}

export const llmProviderApi = {
  listProviders() {
    return http.get<LlmProvider[]>('/llm/providers').then(r => r.data)
  },
  createProvider(data: Partial<LlmProvider>) {
    return http.post<LlmProvider>('/llm/providers', data).then(r => r.data)
  },
  updateProvider(id: number, data: Partial<LlmProvider>) {
    return http.put<LlmProvider>(`/llm/providers/${id}`, data).then(r => r.data)
  },
  deleteProvider(id: number) {
    return http.delete(`/llm/providers/${id}`)
  },
  activateProvider(id: number) {
    return http.post<LlmProvider>(`/llm/providers/${id}/activate`).then(r => r.data)
  }
}
