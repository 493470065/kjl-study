<template>
  <div class="page-container">
    <!-- 页面标题 + 操作区 -->
    <div v-if="title || $slots.actions" class="page-header">
      <h2 class="page-title">{{ title }}</h2>
      <div class="page-actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 页面内容 -->
    <div class="page-body" :class="{ 'no-card': noCard }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  noCard?: boolean
}>()
</script>

<style scoped>
.page-container {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-body:not(.no-card) {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}

.page-body.no-card {
  padding: 0;
}
</style>