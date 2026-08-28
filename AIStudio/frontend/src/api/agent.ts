import http from './http'


export const agentApi = {
  listAgents() {
    return http.get('/agent-os/agents').then(r => r.data)
  },
  submitTask(goal: string, projectId: string) {
    return http.post('/agent-os/tasks', { goal, projectId }).then(r => r.data)
  },
  health() {
    return http.get('/agent-os/health').then(r => r.data)
  }
}
