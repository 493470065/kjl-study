<template>
  <div class="kv-wiki">
    <!-- Top section: document selector and generate button -->
    <div class="kv-wiki__topbar">
      <el-select
        :model-value="wikiSelectedDocId"
        placeholder="选择源文档筛选 Wiki 页面"
        clearable
        filterable
        style="width: 320px"
        @update:model-value="$emit('update:wikiSelectedDocId', $event); $emit('fetch-wiki-pages')"
      >
        <el-option
          v-for="doc in documents"
          :key="doc.id"
          :label="doc.title"
          :value="doc.id"
        />
      </el-select>
      <el-button
        type="primary"
        :icon="Document"
        :loading="wikiGenerateLoading"
        :disabled="!wikiSelectedDocId"
        @click="$emit('generate-wiki')"
      >
        生成 Wiki
      </el-button>
    </div>

    <!-- Wiki page list -->
    <div v-loading="wikiListLoading" class="kv-wiki__list">
      <div v-if="wikiPages.length === 0 && !wikiListLoading" class="kv-wiki__empty">
        <el-empty description="暂无 Wiki 页面，请先上传文档" />
      </div>
      <div v-else class="kv-wiki__cards">
        <div
          v-for="page in wikiPages"
          :key="page.id"
          class="kv-wiki-card"
          role="button"
          tabindex="0"
          :aria-label="'查看 Wiki：' + page.title"
          @click="$emit('open-wiki-detail', page)"
          @keydown.enter.prevent="$emit('open-wiki-detail', page)"
        >
          <div class="kv-wiki-card__header">
            <span class="kv-wiki-card__title">{{ page.title }}</span>
            <el-tag
              :type="getWikiStatusType(page.status)"
              size="small"
              effect="dark"
            >
              {{ getWikiStatusLabel(page.status) }}
            </el-tag>
          </div>
          <div class="kv-wiki-card__summary">
            {{ truncate(page.summary, 150) }}
          </div>
          <div class="kv-wiki-card__concepts">
            <el-tag
              v-for="concept in parseWikiConcepts(page.keyConcepts)"
              :key="concept"
              size="small"
              type="info"
              class="kv-tag"
            >
              {{ concept }}
            </el-tag>
          </div>
          <div class="kv-wiki-card__actions">
            <el-button
              type="primary"
              text
              size="small"
              :loading="wikiRegenerateLoading === page.id"
              @click.stop="$emit('regenerate-wiki', page.id)"
            >
              重新生成
            </el-button>
            <el-button type="danger" link size="small" @click.stop="$emit('delete-wiki', page.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import type { WikiPage } from '@/api/wiki'
import type { KnowledgeDocument } from '@/api/knowledge'
import { useStatusTag } from '@/composables/useStatusTag'

defineProps<{
  wikiPages: WikiPage[]
  wikiListLoading: boolean
  wikiSelectedDocId: number | undefined
  wikiGenerateLoading: boolean
  documents: KnowledgeDocument[]
  wikiRegenerateLoading: number | null
}>()

defineEmits<{
  'update:wikiSelectedDocId': [id: number | undefined]
  'fetch-wiki-pages': []
  'generate-wiki': []
  'regenerate-wiki': [id: number]
  'delete-wiki': [id: number]
  'open-wiki-detail': [page: WikiPage]
}>()

function parseWikiConcepts(concepts: string): string[] {
  if (!concepts) return []
  return concepts.split(/[,，]/).map(c => c.trim()).filter(Boolean)
}

// 状态徽章统一走全站映射（useStatusTag），不再与 KnowledgeView 重复定义
const { statusType: getWikiStatusType, statusLabel: getWikiStatusLabel } = useStatusTag()

function truncate(text: string | undefined, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}
</script>

<style scoped>
.kv-wiki {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.kv-wiki__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.kv-wiki__list {
  flex: 1;
  overflow: auto;
}

.kv-wiki__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.kv-wiki__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.kv-wiki-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kv-wiki-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 12px var(--el-color-primary-light-8);
  transform: translateY(-2px);
}

.kv-wiki-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kv-wiki-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kv-wiki-card__summary {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kv-wiki-card__concepts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.kv-wiki-card__actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.kv-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}
</style>