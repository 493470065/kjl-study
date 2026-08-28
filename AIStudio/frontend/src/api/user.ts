import http from './http'

export interface UserInfo {
  id: number
  username: string
  displayName: string
  empNo: string
  role: string
  enabled: boolean
  allowedMenus?: string[] | string
  createdAt: string
  updatedAt: string
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await http.put('/auth/password', { oldPassword, newPassword })
}

export function getMyToken() {
  return http.get<{ token: string; username: string }>('/auth/token').then(r => r.data)
}

export function regenerateToken() {
  return http.post<{ token: string; username: string }>('/auth/token/regenerate').then(r => r.data)
}

export const userApi = {
  listUsers() {
    return http.get<UserInfo[]>('/users').then(r => r.data)
  },

  createUser(data: { username: string; password: string; role?: string; displayName?: string; empNo?: string; allowedMenus?: string[] | string }) {
    return http.post<UserInfo>('/users', data).then(r => r.data)
  },

  updateUser(id: number, data: { displayName?: string; role?: string; enabled?: boolean; password?: string; empNo?: string; allowedMenus?: string[] | string }) {
    return http.put<UserInfo>(`/users/${id}`, data).then(r => r.data)
  },

  deleteUser(id: number) {
    return http.delete(`/users/${id}`)
  },

  resetPassword(id: number, password: string) {
    return http.post(`/users/${id}/reset-password`, { password }).then(r => r.data)
  }
}
