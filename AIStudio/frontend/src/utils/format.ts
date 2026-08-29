/**
 * 全站统一的格式化工具。
 * 之前 formatTime/formatDate/formatDuration/formatJson 在 5+ 个视图里重复定义，现收敛到此处。
 */

/** 2026-08-29 14:30:00 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 2026-08-29 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 125000(ms) → 2分5秒 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || isNaN(ms) || ms < 0) return '-'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}秒`
  const min = Math.floor(sec / 60)
  const remSec = sec % 60
  if (min < 60) return remSec > 0 ? `${min}分${remSec}秒` : `${min}分`
  const hour = Math.floor(min / 60)
  return `${hour}小时${min % 60}分`
}

/** 对象 → 缩进 JSON 字符串（失败时返回原值字符串） */
export function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
