import http from './http'

export interface RoleDef {
  role: string
  label: string
  description?: string
  builtin: boolean
  sortOrder: number
  allowedMenus: string[] | '*'
}

// 获取所有角色定义（含术语、内置标记、菜单配置）
export function getRolePermissions(): Promise<RoleDef[]> {
  return http.get('/role-permissions').then(r => r.data)
}

// 新增自定义角色
export function createRole(data: { role: string; label?: string; description?: string; sortOrder?: number; allowedMenus?: string[] }) {
  return http.post('/role-permissions', data).then(r => r.data)
}

// 更新角色：术语 / 说明 / 排序 / 菜单
export function updateRole(role: string, data: { label?: string; description?: string; sortOrder?: number; allowedMenus?: string[] }) {
  return http.put(`/role-permissions/${encodeURIComponent(role)}`, data).then(r => r.data)
}

// 删除自定义角色（内置角色、被用户引用的角色后端会拒绝）
export function deleteRole(role: string) {
  return http.delete(`/role-permissions/${encodeURIComponent(role)}`).then(r => r.data)
}
