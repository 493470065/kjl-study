import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8090,
    host: true,
    // 允许同网段同事通过本机局域网 IP 访问（否则 Vite 会 403 拦截非 localhost 的 Host）
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8091',
        changeOrigin: true,
        configure: (proxy, _options) => {
          // 对 SSE/流式响应：保留关键头 + 禁用缓冲，确保浏览器实时收到 chunk
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            const ct = proxyRes.headers['content-type'] || ''
            if (ct.includes('text/event-stream') || ct.includes('octet-stream') || ct.includes('stream')) {
              // 显式复制 SSE 关键头（代理默认可能丢弃 Content-Type）
              res.setHeader('Content-Type', ct)
              res.setHeader('Cache-Control', 'no-cache')
              res.setHeader('X-Accel-Buffering', 'no')
              // 立即转发响应头，不等待 body 缓冲
              if (typeof (res as any).flushHeaders === 'function') {
                ;(res as any).flushHeaders()
              }
            }
          })
        }
      }
    }
  }
})
