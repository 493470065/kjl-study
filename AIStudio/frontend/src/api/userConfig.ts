import http from './http'

export interface UserLlmConfig {
  id?: number
  userId?: number
  providerId?: number
  modelName?: string
  apiKey?: string
  enabled?: boolean
}

export interface UserTfsConfig {
  id?: number
  userId?: number
  tfsServerUrl?: string
  personalAccessToken?: string
  gitUsername?: string
  gitPassword?: string
  wxpUsercode?: string
  wxpPassword?: string
  enabled?: boolean
}

export const userConfigApi = {
  async getLlmConfig(): Promise<UserLlmConfig | null> {
    const res = await http.get('/user/config/llm')
    return res.data
  },
  async saveLlmConfig(config: UserLlmConfig): Promise<void> {
    await http.post('/user/config/llm', config)
  },
  async getTfsConfig(): Promise<UserTfsConfig | null> {
    const res = await http.get('/user/config/tfs')
    return res.data
  },
  async saveTfsConfig(config: UserTfsConfig): Promise<void> {
    await http.post('/user/config/tfs', config)
  }
}
