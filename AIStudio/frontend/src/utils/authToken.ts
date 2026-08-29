/**
 * 统一的登录态读取入口。
 * 「记住我」→ localStorage；否则 sessionStorage。两处都要查，
 * 之前 SSE fetch 只读 localStorage，导致不勾选"记住我"时聊天流必然 401。
 */
export function getStoredAuth(): { token?: string; user?: any } | null {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function getStoredToken(): string {
  return getStoredAuth()?.token || ''
}
