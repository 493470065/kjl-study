<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">{{ code }}</div>
      <div class="error-title">{{ code === 403 ? '无权访问' : '页面不存在' }}</div>
      <p class="error-desc">{{ code === 403
        ? '当前账号没有该功能的访问权限，如需开通请联系管理员。'
        : '您访问的页面不存在或已被移除。' }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">回到对话</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ code: number }>()

const router = useRouter()

function goHome() {
  router.push('/chat')
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/chat')
  }
}
</script>

<style scoped>
.error-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card {
  text-align: center;
  padding: 48px;
}

/* 大写意的数字，如浓墨一笔 */
.error-code {
  font-size: 96px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-primary);
  letter-spacing: 8px;
}

.error-title {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-text, #3d3a34);
}

.error-desc {
  margin-top: 8px;
  font-size: 14px;
  color: var(--ink-text-secondary, #6f6a5e);
}

.error-actions {
  margin-top: 28px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
