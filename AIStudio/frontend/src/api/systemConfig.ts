import http from './http'


export interface SystemConfig {
  id?: number
  configKey: string
  configValue: string
  description?: string
  configGroup?: string
  createdAt?: string
  updatedAt?: string
}

export function listConfigs(group?: string) {
  return http.get<SystemConfig[]>('/system/config', { params: group ? { group } : {} }).then(r => r.data)
}

export function getConfigMap(group?: string) {
  return http.get<Record<string, string>>('/system/config/map', { params: group ? { group } : {} }).then(r => r.data)
}

export function saveConfig(config: SystemConfig) {
  return http.post<SystemConfig>('/system/config', config).then(r => r.data)
}

export function saveConfigs(configs: SystemConfig[]) {
  return http.post<SystemConfig[]>('/system/config/batch', configs).then(r => r.data)
}

export function deleteConfig(id: number) {
  return http.delete(`/system/config/${id}`).then(r => r.data)
}
