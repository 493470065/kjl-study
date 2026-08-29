/**
 * 轻量路由切换进度条（顶部黛青细线），替代 NProgress：
 * 懒加载路由切换期间给用户"正在加载"的可见反馈，避免旧页消失新页未到的空白。
 */
let bar: HTMLDivElement | null = null
let timer: number | null = null
let progress = 0

function ensureBar(): HTMLDivElement {
  if (bar && document.body.contains(bar)) return bar
  bar = document.createElement('div')
  bar.id = 'route-progress-bar'
  bar.style.cssText =
    'position: fixed; top: 0; left: 0; height: 2px; width: 0%; opacity: 0;' +
    'background: var(--el-color-primary, #41556d); z-index: 9999;' +
    'transition: width 0.25s ease, opacity 0.4s ease;' +
    'box-shadow: 0 0 6px rgba(65, 85, 109, 0.5);'
  document.body.appendChild(bar)
  return bar
}

export function startProgress() {
  const el = ensureBar()
  progress = 0
  el.style.opacity = '1'
  el.style.width = '0%'
  if (timer != null) window.clearInterval(timer)
  timer = window.setInterval(() => {
    progress = Math.min(progress + (90 - progress) * 0.12, 90)
    el.style.width = progress + '%'
  }, 200)
}

export function doneProgress() {
  if (!bar) return
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
  bar.style.width = '100%'
  const b = bar
  window.setTimeout(() => {
    b.style.opacity = '0'
    window.setTimeout(() => { b.style.width = '0%' }, 400)
  }, 200)
}
