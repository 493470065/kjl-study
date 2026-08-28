import http from './http'

export interface Workspace {
  id: number
  name: string
  description: string
  createdBy: string
  createdAt: string
  memberCount: number
  projectCount: number
}

export interface TeamMember {
  id: number
  userId: number
  username: string
  displayName: string
  role: string
  joinedAt: string
}

export interface Project {
  id: number
  name: string
  description: string
  workspaceId: number
  createdAt: string
}

export const teamApi = {
  listWorkspaces() {
    return http.get<Workspace[]>('/workspaces').then(r => r.data)
  },
  createWorkspace(data: { name: string; description?: string }) {
    return http.post<Workspace>('/workspaces', data).then(r => r.data)
  },
  updateWorkspace(id: number, data: { name?: string; description?: string }) {
    return http.put<Workspace>(`/workspaces/${id}`, data).then(r => r.data)
  },
  deleteWorkspace(id: number) {
    return http.delete(`/workspaces/${id}`)
  },
  listMembers(workspaceId: number) {
    return http.get<TeamMember[]>(`/workspaces/${workspaceId}/members`).then(r => r.data)
  },
  addMember(workspaceId: number, data: { username: string; role?: string }) {
    return http.post(`/workspaces/${workspaceId}/members`, data).then(r => r.data)
  },
  updateMember(workspaceId: number, memberId: number, data: { role: string }) {
    return http.put(`/workspaces/${workspaceId}/members/${memberId}`, data).then(r => r.data)
  },
  removeMember(workspaceId: number, memberId: number) {
    return http.delete(`/workspaces/${workspaceId}/members/${memberId}`)
  },
  listProjects(workspaceId?: number) {
    return http.get<Project[]>('/projects', { params: workspaceId ? { workspaceId } : {} }).then(r => r.data)
  },
  createProject(data: { name: string; description?: string; workspaceId: number }) {
    return http.post<Project>('/projects', data).then(r => r.data)
  },
  updateProject(id: number, data: { name?: string; description?: string }) {
    return http.put<Project>(`/projects/${id}`, data).then(r => r.data)
  },
  deleteProject(id: number) {
    return http.delete(`/projects/${id}`)
  }
}
