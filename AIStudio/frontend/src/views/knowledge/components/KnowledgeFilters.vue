<template>
  <div class="kv-advanced-filters">
    <div class="kv-advanced-filters__group">
      <span class="kv-advanced-filters__label">分类</span>
      <el-select
        :model-value="selectedCategory"
        placeholder="全部分类"
        clearable
        class="kv-advanced-filters__select"
        @update:model-value="handleSelectCategory"
      >
        <el-option label="全部" value="" />
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
    </div>
    <div class="kv-advanced-filters__group">
      <span class="kv-advanced-filters__label">产品线</span>
      <el-select
        :model-value="selectedProductLine"
        placeholder="全部产品线"
        clearable
        filterable
        class="kv-advanced-filters__select"
        @update:model-value="handleSelectProductLine"
      >
        <el-option label="全部" value="" />
        <el-option v-for="pl in productLines" :key="pl.name" :label="pl.displayName" :value="pl.name" />
      </el-select>
    </div>
    <div class="kv-advanced-filters__group">
      <span class="kv-advanced-filters__label">模块</span>
      <el-select
        :model-value="filterModule"
        placeholder="全部模块"
        clearable
        class="kv-advanced-filters__select"
        @update:model-value="handleFilterModuleChange"
      >
        <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
      </el-select>
    </div>
    <div class="kv-advanced-filters__group">
      <span class="kv-advanced-filters__label">功能点</span>
      <el-select
        :model-value="filterFunctionPoint"
        placeholder="全部功能点"
        clearable
        class="kv-advanced-filters__select"
        @update:model-value="handleFilterFunctionPointChange"
      >
        <el-option v-for="fp in functionPoints" :key="fp" :label="fp" :value="fp" />
      </el-select>
    </div>
    <div class="kv-advanced-filters__group" v-if="allTags.length">
      <span class="kv-advanced-filters__label">标签</span>
      <el-select
        :model-value="selectedTag"
        placeholder="全部标签"
        clearable
        class="kv-advanced-filters__select"
        @update:model-value="handleSelectedTagChange"
      >
        <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
      </el-select>
    </div>
    <div class="kv-advanced-filters__spacer" />
    <el-popover placement="bottom-end" :width="240" trigger="click" :model-value="columnSettingVisible" @update:model-value="$emit('update:columnSettingVisible', $event)">
      <template #reference>
        <el-button plain :icon="Setting" size="small">列设置</el-button>
      </template>
      <div class="kv-column-settings">
        <div class="kv-column-settings__title">显示列（勾选后展示，按实际字段/标签自动调整）</div>
        <el-checkbox
          v-for="opt in columnSettingOptions"
          :key="opt.key"
          :model-value="isColumnVisible(opt.key)"
          @change="toggleColumn(opt.key)"
          class="kv-column-settings__item"
        >{{ opt.label }}</el-checkbox>
        <el-empty v-if="columnSettingOptions.length === 0" description="暂无可选列" :image-size="40" />
      </div>
    </el-popover>
    <el-button
      v-if="hasActiveFilters"
      text
      type="primary"
      @click="$emit('clear-all-filters')"
    >清除筛选</el-button>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'

const props = defineProps<{
  selectedCategory: string
  selectedProductLine: string
  filterModule: string
  filterFunctionPoint: string
  selectedTag: string
  categories: string[]
  productLines: { name: string; displayName: string }[]
  modules: string[]
  functionPoints: string[]
  allTags: string[]
  columnSettingOptions: { key: string; label: string }[]
  columnSettingVisible: boolean
  hasActiveFilters: boolean
  isColumnVisible: (key: string) => boolean
  toggleColumn: (key: string) => void
}>()

const emit = defineEmits<{
  'update:selectedCategory': [val: string]
  'update:selectedProductLine': [val: string]
  'update:filterModule': [val: string]
  'update:filterFunctionPoint': [val: string]
  'update:selectedTag': [val: string]
  'update:columnSettingVisible': [val: boolean]
  'clear-all-filters': []
  'select-category': [val: string]
  'select-product-line': [val: string]
  'context-filter-change': []
}>()

function handleSelectCategory(val: string) {
  emit('update:selectedCategory', val)
  emit('select-category', val)
}
function handleSelectProductLine(val: string) {
  emit('update:selectedProductLine', val)
  emit('select-product-line', val)
}
function handleFilterModuleChange(val: string) {
  emit('update:filterModule', val)
  emit('context-filter-change')
}
function handleFilterFunctionPointChange(val: string) {
  emit('update:filterFunctionPoint', val)
  emit('context-filter-change')
}
function handleSelectedTagChange(val: string) {
  emit('update:selectedTag', val)
  emit('context-filter-change')
}
</script>

<style scoped>
/* ===== P0 高级筛选行：分类/产品线/模块/功能点/标签 + 列设置 ===== */
.kv-advanced-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
  padding: 10px 14px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.kv-advanced-filters__group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kv-advanced-filters__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.kv-advanced-filters__select {
  min-width: 150px;
  width: auto;
}
.kv-advanced-filters__spacer {
  flex: 1 1 auto;
}

/* 列设置弹层 */
.kv-column-settings {
  max-height: 320px;
  overflow-y: auto;
}
.kv-column-settings__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}
.kv-column-settings__item {
  display: block;
  margin: 4px 0;
}
</style>