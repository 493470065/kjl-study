import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import PageContainer from './components/PageContainer.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 全局注册 page-container 组件，否则各页面里的 <page-container> 会被
// Vue 当作未知 HTML 元素直接渲染，导致 #actions slot（顶部按钮/操作区）不显示
app.component('PageContainer', PageContainer)

app.mount('#app')