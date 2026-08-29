<template>
  <div class="login-page">
    <div class="login-card">
      <h2>景磊的AI工作站</h2>
      <p class="subtitle">AI 驱动的工作台</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large"
                    autocomplete="username" aria-label="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" prefix-icon="Lock"
                    type="password" show-password size="large" autocomplete="current-password"
                    aria-label="密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" native-type="submit" style="width: 100%"
                     @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
        <div v-if="error" class="error-msg" role="alert">{{ error }}</div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  remember: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username, form.password, form.remember)
    // 回跳原页面；无指定时落到该用户第一个可访问菜单
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    router.push(redirect || auth.firstAccessibleMenu())
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 登录页：江南烟雨 —— 宣纸天光，远山如黛，层峦隐于薄雾 */
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 55% 20% at 16% 82%, rgba(65, 85, 109, 0.34), transparent 70%),
    radial-gradient(ellipse 65% 24% at 84% 90%, rgba(58, 72, 88, 0.30), transparent 70%),
    radial-gradient(ellipse 95% 30% at 50% 104%, rgba(90, 100, 112, 0.24), transparent 74%),
    radial-gradient(ellipse 40% 14% at 68% 62%, rgba(65, 85, 109, 0.10), transparent 70%),
    linear-gradient(180deg, #f7f4ec 0%, #eae5d6 58%, #dcd6c4 100%);
}

.login-card {
  position: relative;
  background: rgba(251, 249, 244, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 40px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(44, 42, 38, 0.18);
  text-align: center;
}

/* 标题上方一枚朱砂小印 */
.login-card::before {
  content: '景';
  position: absolute;
  top: 18px;
  right: 20px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--seal);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.login-card h2 {
  font-size: 24px;
  color: var(--ink-text);
  margin-bottom: 4px;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--ink-text-secondary);
  font-size: 14px;
  margin-bottom: 30px;
  letter-spacing: 4px;
}

.login-form {
  text-align: left;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
}
</style>
