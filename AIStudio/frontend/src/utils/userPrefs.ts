/**
 * 用户配置后端持久化（通用 KV）。
 *
 * 读（loadPref）：同步返回 localStorage 值让界面零等待渲染；同一页面会话内每个 key
 * 只向后端校准一次，后端有值时覆盖本地并广播 userprefs-updated:{key} 事件。
 * 写（savePref）：立即写 localStorage 保证本机即时生效，同时异步 PUT 后端；后端
 * 失败仅 console.warn，不阻断 UI（退化为纯本地模式，与迁移前行为一致）。
 *
 * 登录令牌 auth 不走此模块。
 * 后端：GET/PUT /api/user/prefs/{key}（见 com.racc.userpref）。
 */
import http from '@/api/http'

const loadedKeys = new Set<string>()

function backendGet(key: string): Promise<string | null> {
  // as any: silent 为本项目自定义请求标记（http.ts 拦截器读取），未做 axios 类型扩充，项目惯例加 as any
  return http.get(`/user/prefs/${encodeURIComponent(key)}`, { silent: true } as any)
    .then(res => {
      const v = res.data?.value
      return typeof v === 'string' ? v : null   // null / 非字符串（异常情况）→ 无值
    })
    .catch(() => null)   // 后端不可达/未登录/超时：静默保持本地
}

function backendPut(key: string, value: string): void {
  http.put(`/user/prefs/${encodeURIComponent(key)}`, value, {
    silent: true,
    headers: { 'Content-Type': 'application/json' }
  } as any).catch(err => console.warn(`[userPrefs] 同步配置到后端失败: ${key}`, err))
}

/**
 * 读配置：返回 localStorage 当前值（无则 defaultValue）；同时触发一次后端校准。
 * 后端值与本地不同时：覆盖 localStorage 并派发 userprefs-updated:{key} 事件，
 * 视图应监听该事件用新值刷新状态。
 */
export function loadPref<T>(key: string, defaultValue: T): T {
  let local: T = defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) local = JSON.parse(raw) as T
  } catch { /* 本地损坏：用默认值 */ }

  if (!loadedKeys.has(key)) {
    loadedKeys.add(key)
    backendGet(key).then(remote => {
      if (remote === null) return            // 后端无值 → 保留本地
      let remoteParsed: unknown
      try { remoteParsed = JSON.parse(remote) } catch { return }
      let localRaw: string | null = null
      try { localRaw = localStorage.getItem(key) } catch { /* ignore */ }
      if (localRaw === remote) return        // 已一致，无需打扰视图
      try { localStorage.setItem(key, remote) } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent(`userprefs-updated:${key}`, { detail: remoteParsed }))
    })
  }
  return local
}

/**
 * 写配置：双写 localStorage + 后端（异步）。
 */
export function savePref(key: string, value: unknown): void {
  const json = JSON.stringify(value)
  try { localStorage.setItem(key, json) } catch { /* 容量满等：本地失败不影响后端 */ }
  backendPut(key, json)
}
