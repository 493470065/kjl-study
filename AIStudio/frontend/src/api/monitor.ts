import http from '@/api/http'

export interface AgentStatus {
  id: string
  name: string
  status: string
  currentTaskId?: string
  runningTime?: string
  tokenUsed?: number
  errorCount?: number
}

export interface ProviderStatus {
  id: number
  providerType: string
  modelName: string
  baseUrl: string
  enabled: boolean
  isDefault: boolean
  reachable: boolean
}

export interface SystemMetrics {
  status: string
  jvmMemory: any
  cpuUsage: any
  uptime: any
}

export interface ErrorStats {
  totalLlmCalls: number
  failedLlmCalls: number
  llmErrorRate: number
  avgLlmLatency: number
  totalToolCalls: number
  failedToolCalls: number
  toolErrorRate: number
  avgToolLatency: number
}

export interface DashboardData {
  agents: AgentStatus[]
  providers: ProviderStatus[]
  system: SystemMetrics
  errors: ErrorStats
  timestamp: string
}

export function getDashboard() {
  return http.get('/monitor/dashboard')
}