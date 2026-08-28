import http from './http'

export interface WorkloadData {
  stats: Record<string, number>
  total: number
}

export interface ExceptionData {
  [key: string]: number
}

export interface WeeklyPersonData {
  total: number
  任务: number
  功能性需求: number
  软件质量: number
  支持单: number
  公共Bug: number
  itemsDetails: any[]
}

export interface WeeklyData {
  total: number
  byPerson: Record<string, WeeklyPersonData>
}

export interface DailyData {
  stats: Record<string, number>
  total: number
}

export interface DetailData {
  items: any[]
  total: number
}

export interface FixResult {
  success: number
  failed: number
  skipped: number
  details: any[]
}

export function getWorkload() {
  return http.get<WorkloadData>('/tfs-stats/workload').then(r => r.data)
}

export function getExceptions() {
  return http.get<ExceptionData>('/tfs-stats/exceptions').then(r => r.data)
}

export function getWeeklyWorkload() {
  return http.get<WeeklyData>('/tfs-stats/weekly').then(r => r.data)
}

export function getDailyWorkload() {
  return http.get<DailyData>('/tfs-stats/daily').then(r => r.data)
}

export function getWorkloadDetails(type: string) {
  return http.get<DetailData>(`/tfs-stats/workload-details/${encodeURIComponent(type)}`).then(r => r.data)
}

export function getExceptionDetails(exceptionType: string) {
  return http.get<DetailData>(`/tfs-stats/exceptions/${exceptionType}`).then(r => r.data)
}

export function fixException(exceptionType: string, ids: number[]) {
  return http.post<FixResult>(`/tfs-stats/exceptions/${exceptionType}/fix`, { ids }).then(r => r.data)
}
