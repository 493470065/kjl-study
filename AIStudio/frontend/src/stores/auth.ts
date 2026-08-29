import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'

interface UserInfo {
  username: string
  displayName: string
  role: string
  allowedMenus?: string[] | string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<UserInfo | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function hasMenuAccess(path: string): boolean {
    if (!user.value) return false
    if (user.value.role === 'ADMIN') return true
    const menus = user.value.allowedMenus
    if (!menus) return false
    if (menus === '*' || (Array.isArray(menus) && menus.includes('*'))) return true
    if (Array.isArray(menus)) return menus.includes(path)
    return false
  }

  /** 登录落地页：按菜单优先级取第一个可访问页面，避免无 /chat 权限的用户死循环 */
  const MENU_ORDER = [
    '/chat', '/requirements', '/knowledge', '/skills', '/agents',
    '/workflows', '/automate', '/mcp', '/providers', '/monitor', '/settings'
  ]
  function firstAccessibleMenu(): string {
    for (const p of MENU_ORDER) {
      if (hasMenuAccess(p)) return p
    }
    return '/chat'
  }

  function loadFromStorage() {
    const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        token.value = data.token || null
        user.value = data.user || null
      } catch {}
    }
  }

  function saveToStorage(remember = true) {
    const storage = remember ? localStorage : sessionStorage
    const data = JSON.stringify({ token: token.value, user: user.value, remember })
    storage.setItem('auth', data)
    // 清除另一个存储中的旧数据
    if (remember) {
      sessionStorage.removeItem('auth')
    } else {
      localStorage.removeItem('auth')
    }
  }

  async function login(username: string, password: string, remember = true) {
    // 走统一封装（带 30s 超时）；silent: 登录失败由登录页自己展示错误文案
    const res = await http.post('/auth/login', { username, password }, { silent: true } as any)
    token.value = res.data.token
    user.value = res.data.user
    saveToStorage(remember)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth')
    sessionStorage.removeItem('auth')
  }

  loadFromStorage()

  return { token, user, isAuthenticated, isAdmin, hasMenuAccess, firstAccessibleMenu, login, logout, loadFromStorage, saveToStorage }
})
