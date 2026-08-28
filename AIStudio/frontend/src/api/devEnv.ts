import http from './http'

// 环境配置
export interface DevEnvConfig {
  id?: number
  envName: string
  productLine: string
  category?: string
  dbUrl?: string
  webUrl?: string
  dbUsername?: string
  dbPassword?: string
  dbDriver?: string
  consulHost?: string
  consulPort?: string
  serialId?: string
  dbDataBase?: string
  serialIds?: string      // JSON string: {"outpatient":185,"emergency":185,"inpatient":153,"integration":153}
  devopsBaseUrl?: string  // JSON string: URL or per-product-line URL object
}

export function listEnvConfigs() {
  return http.get<DevEnvConfig[]>('/dev-env/configs').then(r => r.data)
}

export function saveEnvConfig(config: DevEnvConfig) {
  return http.post('/dev-env/configs', config).then(r => r.data)
}

export function deleteEnvConfig(id: number) {
  return http.delete(`/dev-env/configs/${id}`).then(r => r.data)
}

// SQL 执行
export function executeSql(params: { envName: string; productLine: string; sql: string }) {
  return http.post('/dev-env/execute-sql', params).then(r => r.data)
}

// Consul
export function getConsulServices(host: string, port: string) {
  return http.get('/dev-env/consul/services', { params: { host, port } }).then(r => r.data)
}

export function getConsulInstances(host: string, port: string, service: string) {
  return http.get('/dev-env/consul/service-instances', { params: { host, port, service } }).then(r => r.data)
}

// 常用 SQL
export interface FrequentSql {
  id?: number
  title: string
  sqlContent: string
  dbType?: string
}

export function listFrequentSqls(search?: string, dbType?: string) {
  return http.get<FrequentSql[]>('/dev-env/frequent-sqls', { params: { search, dbType } }).then(r => r.data)
}

export function saveFrequentSql(sql: FrequentSql) {
  return http.post('/dev-env/frequent-sqls', sql).then(r => r.data)
}

export function deleteFrequentSql(id: number) {
  return http.delete(`/dev-env/frequent-sqls/${id}`).then(r => r.data)
}

// 种子数据
export function seedDevEnv() {
  return http.post('/dev-env/seed').then(r => r.data)
}

// 配置中心拉取
export function fetchConfigCenter(params: { envName: string; productLine?: string; serialId?: string; devopsBaseUrl?: string }) {
  return http.post('/dev-env/config-center', params).then(r => r.data)
}
