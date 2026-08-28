<template>
  <div class="kv-search-results">
    <div class="kv-search-results__header">
      <span class="kv-search-results__label">
        搜索结果：共 <strong>{{ count }}</strong> 条匹配
      </span>
      <el-button type="primary" text @click="$emit('clear')">返回全部</el-button>
    </div>
    <div v-if="searchLoading" v-loading="true" class="kv-search-results__loading" />
    <div v-else-if="count === 0" class="kv-search-results__empty">
      <el-empty description="未找到匹配的知识" />
    </div>
    <div v-else class="kv-search-results__list">
      <!-- GraphRAG: merged context -->
      <div
        v-if="searchMode === 'graphrag' && mergedContext"
        class="kv-search-graphrag-context"
      >
        <div class="kv-search-graphrag-context__header">混合检索上下文</div>
        <div class="kv-search-graphrag-context__body markdown-body" v-html="renderMarkdown(mergedContext)" />
      </div>

      <!-- GraphRAG: knowledge graph relationships -->
      <div
        v-if="searchMode === 'graphrag' && graphContexts.length > 0"
        class="kv-search-graphrag-card"
      >
        <div class="kv-search-graphrag-card__header">知识图谱关系</div>
        <div
          v-for="(ctx, idx) in graphContexts"
          :key="idx"
          class="kv-search-graphrag-card__item"
        >
          <span class="kv-search-graphrag-card__node">{{ ctx.sourceName }}</span>
          <el-tag size="small" type="warning" class="kv-search-graphrag-card__rel">
            {{ ctx.relationshipType }}
          </el-tag>
          <span class="kv-search-graphrag-card__node">{{ ctx.targetName }}</span>
          <span v-if="ctx.relationDescription" class="kv-search-graphrag-card__desc">
            {{ ctx.relationDescription }}
          </span>
        </div>
      </div>

      <div
        v-for="(result, idx) in searchResults"
        :key="result.documentId + '-' + idx"
        class="kv-search-result"
        @click="$emit('open-detail', result.documentId)"
      >
        <div class="kv-search-result__header">
          <span class="kv-search-result__title">{{ result.title }}</span>
          <el-tag size="small" :color="getCategoryColor(result.category)" effect="dark">
            {{ result.category }}
          </el-tag>
        </div>
        <div class="kv-search-result__score">
          <el-progress
            :percentage="Math.round(result.score * 100)"
            :stroke-width="6"
            :color="getScoreColor(result.score)"
            style="width: 120px"
          />
          <span class="kv-search-result__score-text">
            匹配度 {{ Math.round(result.score * 100) }}%
          </span>
        </div>
        <div class="kv-search-result__snippet" v-html="highlightSnippet(result.content)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchResult, GraphContext } from '@/api/knowledge'
import { useMarkdown } from '@/composables/useMarkdown'

const { renderMarkdown } = useMarkdown()

defineProps<{
  searchResults: SearchResult[]
  searchLoading: boolean
  searchMode: string
  mergedContext: string
  graphContexts: GraphContext[]
  count: number
  getCategoryColor: (category: string) => string
  getScoreColor: (score: number) => string
  highlightSnippet: (content: string) => string
}>()

defineEmits<{
  clear: []
  'open-detail': [documentId: number]
}>()
</script>

<style scoped>
/* Search results */
.kv-search-results {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kv-search-results__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.kv-search-results__label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.kv-search-results__loading {
  height: 200px;
}

.kv-search-results__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kv-search-result {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.kv-search-result:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px var(--el-color-primary-light-9);
}

.kv-search-result__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.kv-search-result__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kv-search-result__score {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.kv-search-result__score-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kv-search-result__snippet {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  background: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: 4px;
}

.kv-search-result__snippet :deep(mark) {
  background: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
}

/* GraphRAG search context */
.kv-search-graphrag-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kv-search-graphrag-card__header {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kv-search-graphrag-card__item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}

.kv-search-graphrag-card__node {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kv-search-graphrag-card__rel {
  flex-shrink: 0;
}

.kv-search-graphrag-card__desc {
  color: var(--el-text-color-secondary);
}

.kv-search-graphrag-context {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
}

.kv-search-graphrag-context__header {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.kv-search-graphrag-context__body {
  line-height: 1.8;
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.kv-search-graphrag-context__body :deep(h1),
.kv-search-graphrag-context__body :deep(h2),
.kv-search-graphrag-context__body :deep(h3) {
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.kv-search-graphrag-context__body :deep(h2) { font-size: 18px; }
.kv-search-graphrag-context__body :deep(h3) { font-size: 16px; }

.kv-search-graphrag-context__body :deep(p) {
  margin: 8px 0;
}

.kv-search-graphrag-context__body :deep(ul),
.kv-search-graphrag-context__body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.kv-search-graphrag-context__body :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.kv-search-graphrag-context__body :deep(pre) {
  background: var(--el-fill-color-light);
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.kv-search-graphrag-context__body :deep(pre code) {
  background: transparent;
  padding: 0;
}
</style>