import http from '@/api/http'

export interface LocalComputeNode {
  id: number
  nodeId: string
  name: string
  userId: number
  username: string
  status: string
  ipAddress: string
  osInfo: string
  capabilities: string
  version: string
  lastHeartbeat: string
  createdAt: string
  updatedAt: string
}

export interface LocalComputeTask {
  id: number
  taskId: string
  nodeId: string
  taskType: string
  params: string
  status: string
  result: string
  errorMessage: string
  startedAt: string
  completedAt: string
  createdBy: number
  createdAt: string
}

export interface ComputeStats {
  totalNodes: number
  onlineNodes: number
  totalTasks: number
  successRate: number
}

export function getNodes() {
  return http.get('/compute/nodes')
}

export function getOnlineNodes() {
  return http.get('/compute/nodes/online')
}

export function getNode(nodeId: string) {
  return http.get(`/compute/nodes/${nodeId}`)
}

export function deleteNode(nodeId: string) {
  return http.delete(`/compute/nodes/${nodeId}`)
}

export function dispatchTask(nodeId: string, taskType: string, params: string) {
  return http.post(`/compute/nodes/${nodeId}/dispatch`, { taskType, params })
}

export function getTasks(page = 0, size = 20) {
  return http.get(`/compute/tasks?page=${page}&size=${size}`)
}

export function getTask(taskId: string) {
  return http.get(`/compute/tasks/${taskId}`)
}

export function getNodeTasks(nodeId: string) {
  return http.get(`/compute/nodes/${nodeId}/tasks`)
}

export function getStats() {
  return http.get('/compute/stats')
}