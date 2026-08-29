<template>
  <div class="page-container">
    <!-- 页面标题 + 操作区 -->
    <div v-if="title || $slots.actions" class="page-header">
      <h2 class="page-title">{{ title }}</h2>
      <div class="page-actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 筛选/工具条区（搜索框、下拉筛选等） -->
    <div v-if="$slots.toolbar" class="page-toolbar">
      <slot name="toolbar" />
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
  /** 不包卡片壳，内容直接铺在页面上（列表/三栏布局常用） */
  noCard?: boolean
}>()
</script>

<style scoped>
/* 全宽自适应：页面横向铺满 el-main，与原各页面行为一致 */
.page-container {
  width: 100%;
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
  color: var(--ink-text, var(--ink));
  margin: 0;
  letter-spacing: 0.5px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.page-body:not(.no-card) {
  background: var(--paper-card, #fff);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(44, 42, 38, 0.06);
  border: 1px solid var(--paper-border, var(--paper-light));
}

.page-body.no-card {
  padding: 0;
}
</style>
