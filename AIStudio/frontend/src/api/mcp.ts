import http from './http'


export interface McpServer {
  id: number
  name: string
  displayName?: string
  description?: string
  command: string
  args?: string
  workDir: string
  envVars?: string
  status: 'RUNNING' | 'STOPPED' | 'ERROR'
  toolCount: number
  createdAt: string
  updatedAt: string
}

export interface McpToolInfo {
  name: string
  description: string
  inputSchema?: Record<string, any>
}

export interface McpTestResult {
  serverId: number
  serverName: string
  success: boolean
  protocolVersion?: string
  mcpServerName?: string
  mcpServerVersion?: string
  toolCount?: number
  tools?: { name: string; description: string }[]
  elapsedMs?: number
  error?: string
}

export const mcpApi = {
  listServers() {
    return http.get<McpServer[]>('/mcp/servers').then(r => r.data)
  },

  getServer(id: number) {
    return http.get<McpServer>(`/mcp/servers/${id}`).then(r => r.data)
  },

  uploadServer(name: string, file: File, displayName?: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (displayName) formData.append('displayName', displayName)
    if (description) formData.append('description', description)
    return http.post<McpServer>('/mcp/servers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000
    }).then(r => r.data)
  },

  createServer(config: {
    name: string
    displayName?: string
    description?: string
    command: string
    args?: string
    workDir: string
    envVars?: string
  }) {
    return http.post<McpServer>('/mcp/servers/create', config).then(r => r.data)
  },

  updateServer(id: number, config: Partial<McpServer>) {
    return http.put<McpServer>(`/mcp/servers/${id}`, config).then(r => r.data)
  },

  startServer(id: number) {
    return http.post<McpServer>(`/mcp/servers/${id}/start`).then(r => r.data)
  },

  stopServer(id: number) {
    return http.post<McpServer>(`/mcp/servers/${id}/stop`).then(r => r.data)
  },

  deleteServer(id: number) {
    return http.delete(`/mcp/servers/${id}`)
  },

  getServerTools(id: number) {
    return http.get<McpToolInfo[]>(`/mcp/servers/${id}/tools`).then(r => r.data)
  },

  testConnection(id: number) {
    return http.post<McpTestResult>(`/mcp/servers/${id}/test`, {}, { timeout: 30000 }).then(r => r.data)
  },

  loadFromFile(filePath: string) {
    return http.post<any>('/mcp/servers/load-from-file', { filePath }).then(r => r.data)
  }
}
