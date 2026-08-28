import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
  if (raw) {
    try {
      const auth = JSON.parse(raw)
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    } catch {}
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth')
      sessionStorage.removeItem('auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
