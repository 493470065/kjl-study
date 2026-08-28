import http from './http'

// 工作流列表
export function getWorkflows() {
  return http.get('/workflows')
}

// 工作流详情
export function getWorkflow(id: number) {
  return http.get(`/workflows/${id}`)
}

// 创建工作流
export function createWorkflow(data: { name: string; description: string; definitionJson: string }) {
  return http.post('/workflows', data)
}

// 更新工作流
export function updateWorkflow(id: number, data: { name: string; description: string; definitionJson: string; enabled: boolean }) {
  return http.put(`/workflows/${id}`, data)
}

// 删除工作流
export function deleteWorkflow(id: number) {
  return http.delete(`/workflows/${id}`)
}

// 执行工作流
export function executeWorkflow(id: number, context: Record<string, any>) {
  return http.post(`/workflows/${id}/execute`, { context })
}

// 执行记录列表
export function getExecutions() {
  return http.get('/workflows/executions')
}

// 执行记录详情
export function getExecution(id: number) {
  return http.get(`/workflows/executions/${id}`)
}

// 取消执行
export function cancelExecution(id: number) {
  return http.post(`/workflows/executions/${id}/cancel`)
}

// 执行节点记录
export function getExecutionNodes(executionId: number) {
  return http.get(`/workflows/executions/${executionId}/nodes`)
}
