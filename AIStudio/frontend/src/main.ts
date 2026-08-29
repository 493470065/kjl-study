import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import PageContainer from './components/PageContainer.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 全局注册 Element Plus 图标：各页面以字符串形式引用图标（如 prefix-icon="User"）时才能解析
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局注册 page-container 组件，否则各页面里的 <page-container> 会被
// Vue 当作未知 HTML 元素直接渲染，导致 #actions slot（顶部按钮/操作区）不显示
app.component('PageContainer', PageContainer)

// 全局错误兜底：渲染层异常不再静默白屏，给出可见反馈
app.config.errorHandler = (err, _instance, info) => {
  console.error('[渲染错误]', err, info)
  import('element-plus').then(({ ElMessage }) => {
    ElMessage.error('页面出现异常，请刷新重试')
  })
}

app.mount('#app')
