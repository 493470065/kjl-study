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

/** 本会话内每个 key 已发生 save 的次数：>0 表示本地值比在途校准快照新，校准不得覆盖 */
const saveSeq = new Map<string, number>()

/** 已知偏好 key 清单：登出时按此清理本地缓存，防止换账号看到前一用户的配置 */
export const KNOWN_PREF_KEYS = [
  'reqboard.config.v1', 'reqboard.ui.v1', 'reqcollect.links.v1',
  'kv_column_visibility', 'kv_fixed_column_visibility', 'kv_scan_fixed_column_visibility',
  'skills.collapsed.v1', 'chat-conversation-id'
] as const

/** 登出/切换账号时调用：清空会话内"已校准"与"已保存"标记，让下次 loadPref 重新走后端校准 */
export function resetUserPrefsCache(): void {
  loadedKeys.clear()
  saveSeq.clear()
}

/** 登出时清理本地偏好值（与 resetUserPrefsCache 搭配使用） */
export function clearLocalPrefs(): void {
  for (const k of KNOWN_PREF_KEYS) {
    try { localStorage.removeItem(k) } catch { /* ignore */ }
  }
}

function backendGet(key: string): Promise<string | null> {
  // as any: silent 为本项目自定义请求标记（http.ts 拦截器读取），未做 axios 类型扩充，项目惯例加 as any
  return http.get(`/user/prefs/${encodeURIComponent(key)}`, { silent: true } as any)
    .then(res => {
      const v = res.data?.value
      return typeof v === 'string' ? v : null   // null / 非字符串（异常情况）→ 无值
    })
    .catch(() => null)   // 后端不可达/超时/解析失败：静默保持本地；401 由 http 拦截器统一跳登录
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
      if ((saveSeq.get(key) || 0) > 0) return // 会话内已 save 过：本地即最新意图，校准不得用旧快照覆盖
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
  if (json === undefined) return   // 调用方传 undefined 等异常输入：不做任何写入
  saveSeq.set(key, (saveSeq.get(key) || 0) + 1)
  try { localStorage.setItem(key, json) } catch { /* 容量满等：本地失败不影响后端 */ }
  backendPut(key, json)
}
