import http from './http'


export interface AgentConfig {
  name: string
  description: string
  capabilities: string[]
  tools: string[]
  status: string
  enabled: boolean
  systemPrompt?: string
  skills?: Record<string, string>
  model?: string
  directory?: string
  preferredSkills?: string[]
  mcpServers?: string[]
}

export function listAgentConfigs(): Promise<AgentConfig[]> {
  return http.get<AgentConfig[]>('/agents/config').then(r => r.data)
}

export function getAgentConfig(name: string): Promise<AgentConfig> {
  return http.get<AgentConfig>(`/agents/config/${name}`).then(r => r.data)
}

export function createAgentConfig(data: Partial<AgentConfig>): Promise<AgentConfig> {
  return http.post<AgentConfig>('/agents/config', data).then(r => r.data)
}

export function updateAgentConfig(name: string, data: Partial<AgentConfig>): Promise<AgentConfig> {
  return http.put<AgentConfig>(`/agents/config/${name}`, data).then(r => r.data)
}

export function deleteAgentConfig(name: string): Promise<void> {
  return http.delete(`/agents/config/${name}`)
}

export function reloadAgentConfigs(): Promise<{ message: string; count: number }> {
  return http.post<{ message: string; count: number }>('/agents/config/reload').then(r => r.data)
}
