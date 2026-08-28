import http from './http'

// 获取所有角色权限配置
export function getRolePermissions() {
  return http.get('/role-permissions').then(r => r.data)
}

// 更新某角色的菜单权限
export function updateRolePermission(role: string, allowedMenus: string[]) {
  return http.put(`/role-permissions/${role}`, { allowedMenus }).then(r => r.data)
}
