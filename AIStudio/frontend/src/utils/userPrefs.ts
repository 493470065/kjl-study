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
  'reqboard.config.v1', 'reqboard.ui.v1',
  'reqcollect.links.v1', 'reqcollect.skills.v1', 'reqcollect.analysis.v1', 'reqcollect.results.v1',
  'kv_column_visibility', 'kv_fixed_column_visibility', 'kv_scan_fixed_column_visibility',
  'skills.collapsed.v1', 'chat-conversation-id', 'workreport.executor.v1'
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

/** 单次同步上限（字符数）：超过则只留本地、跳过后端，避免超大快照拖垮请求与数据库 */
const MAX_SYNC_CHARS = 4_000_000

function backendPut(key: string, value: string): void {
  if (value.length > MAX_SYNC_CHARS) {
    console.warn(`[userPrefs] 配置过大，跳过后端同步: ${key} (${value.length} 字符)`)
    return
  }
  http.put(`/user/prefs/${encodeURIComponent(key)}`, value, {
    silent: true,
    headers: { 'Content-Type': 'application/json' }
  } as any).catch(err => console.warn(`[userPrefs] 同步配置到后端失败: ${key}`, err))
}

/**
 * 主动拉取后端值（不写本地、不派发事件）。
 * 用于页面初始化时确保内存态已含后端最新配置——否则「本地空白的浏览器」一保存
 * 就会用默认值覆盖掉其他设备已保存的配置。
 */
export function fetchPrefAsync(key: string): Promise<string | null> {
  return backendGet(key)
}

function isPlainObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

/**
 * 本地优先的深合并（并集）：两边独有的字段都保留，同名字段以本地为准。
 * 用于校准——后端快照可能比本地旧/不全（例如另一台设备只保存过部分配置），
 * 直接整体覆盖会把本地更全的配置删掉。
 */
function mergeKeepBoth(base: unknown, extra: unknown): unknown {
  if (isPlainObj(base) && isPlainObj(extra)) {
    const out: Record<string, unknown> = { ...extra }
    for (const [k, v] of Object.entries(base)) {
      out[k] = isPlainObj(v) && isPlainObj(out[k]) ? mergeKeepBoth(v, out[k]) : v
    }
    return out
  }
  return base !== undefined ? base : extra   // 标量/数组：本地优先
}

/**
 * 读配置：返回 localStorage 当前值（无则 defaultValue）；同时触发一次后端校准。
 * 后端值与本地不同时：两边都是 JSON 对象则做并集合并（本地优先）并把并集回写后端，
 * 否则以后端为准覆盖本地；本地被更新时派发 userprefs-updated:{key}，视图应监听刷新。
 */
export function loadPref<T>(key: string, defaultValue: T): T {
  let local: T = defaultValue
  let localSnapshot: string | null = null
  try {
    localSnapshot = localStorage.getItem(key)
    if (localSnapshot !== null) local = JSON.parse(localSnapshot) as T
  } catch { /* 本地损坏：用默认值 */ }

  if (!loadedKeys.has(key)) {
    loadedKeys.add(key)
    backendGet(key).then(remote => {
      if (remote === null) {
        // 后端无值但本地已有配置（后端接口上线前/换设备前的存量）：回填一次，
        // 让存量配置无感落库，无需等用户下次改动——否则换台电脑仍然会丢。
        if (localSnapshot !== null) backendPut(key, localSnapshot)
        return
      }
      if ((saveSeq.get(key) || 0) > 0) return // 会话内已 save 过：本地即最新意图，校准不得用旧快照覆盖
      let localRaw: string | null = null
      try { localRaw = localStorage.getItem(key) } catch { /* ignore */ }
      if (localRaw === remote) return        // 已一致，无需打扰视图

      // 两边都是 JSON 对象 → 并集合并（本地优先），避免后端较旧的快照删掉本地更全的配置
      let merged: string | null = null
      try {
        merged = JSON.stringify(mergeKeepBoth(JSON.parse(localRaw ?? 'null'), JSON.parse(remote)))
      } catch { merged = null }   // 任一侧解析失败：退回"以后端为准"的原逻辑

      if (merged !== null && localRaw !== null) {
        if (merged !== localRaw) {
          try { localStorage.setItem(key, merged) } catch { /* ignore */ }
          try {
            window.dispatchEvent(new CustomEvent(`userprefs-updated:${key}`, { detail: JSON.parse(merged) }))
          } catch { /* 合并结果异常：不打扰视图 */ }
        }
        if (merged !== remote) backendPut(key, merged)   // 并集回写，让另一台设备也能拿到完整配置
        return
      }

      try { localStorage.setItem(key, remote) } catch { /* ignore */ }
      let remoteParsed: unknown
      try { remoteParsed = JSON.parse(remote) } catch { return }
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
