import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { getStoredAuth } from '@/utils/authToken'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const token = getStoredAuth()?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 统一错误出口：所有接口错误在这里给出用户可见反馈，页面层默认不再各自处理。
 * 页面如需静默（如轮询、可降级的请求），在请求配置里加 silent: true。
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const silent = (error.config as any)?.silent === true
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('auth')
      sessionStorage.removeItem('auth')
      // 软跳转：不整页刷新，保留"登录已过期"提示与回跳地址
      const current = router.currentRoute.value
      if (current.name !== 'login') {
        router.push({ name: 'login', query: { redirect: current.fullPath } })
        ElMessage.warning('登录已过期，请重新登录')
      }
      return Promise.reject(error)
    }

    if (!silent) {
      const detail = error.response?.data?.message || error.response?.data?.error
      let msg: string
      if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
        msg = '请求超时，请稍后重试'
      } else if (!error.response) {
        msg = '网络连接失败，请检查网络'
      } else {
        msg = detail || `请求失败${status ? `（${status}）` : ''}`
      }
      // grouping: 相同文案的并发错误合并提示，避免刷屏
      ElMessage.error({ message: msg, grouping: true })
    }

    return Promise.reject(error)
  }
)

export default http
