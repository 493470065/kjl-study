import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

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
    const res = await axios.post('/api/auth/login', { username, password })
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

  return { token, user, isAuthenticated, isAdmin, hasMenuAccess, login, logout, loadFromStorage, saveToStorage }
})
