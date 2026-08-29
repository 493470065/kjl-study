<template>
  <div class="kv-graph">
    <!-- Top bar with search and controls -->
    <div class="kv-graph__topbar">
      <el-input
        :model-value="graphSearchQuery"
        placeholder="搜索实体名称"
        clearable
        style="width: 240px"
        @update:model-value="$emit('update:graphSearchQuery', $event)"
      />
      <el-select :model-value="graphSearchMode" style="width: 140px" @update:model-value="$emit('update:graphSearchMode', $event)">
        <el-option label="关联查询" value="关联" />
        <el-option label="影响分析" value="影响" />
        <el-option label="路径查找" value="路径" />
      </el-select>
      <el-input
        v-if="graphSearchMode === '路径'"
        :model-value="graphTargetEntity"
        placeholder="目标实体"
        clearable
        style="width: 200px"
        @update:model-value="$emit('update:graphTargetEntity', $event)"
      />
      <el-button type="primary" :loading="graphSearchLoading" @click="$emit('search')">
        搜索
      </el-button>
    </div>

    <!-- Stats section -->
    <div class="kv-graph__stats">
      <el-statistic title="实体数量" :value="graphStats.entityCount" />
      <el-statistic title="关系数量" :value="graphStats.relationshipCount" />
    </div>

    <!-- Main content: Graph + Entity list -->
    <div class="kv-graph__content">
      <div class="kv-graph__visualization">
        <GraphVisualization
          v-if="graphData"
          :graph-data="graphData"
          @node-click="(e: any) => $emit('node-click', e)"
        />
        <div v-else v-loading="graphDataLoading" class="kv-graph__loading" />
      </div>
      <div class="kv-graph__sidebar">
        <div class="kv-graph__entity-filter">
          <el-select
            :model-value="graphEntityTypeFilter"
            placeholder="按类型筛选"
            clearable
            style="width: 100%"
            @update:model-value="$emit('update:graphEntityTypeFilter', $event); $emit('filter-entities')"
          >
            <el-option
              v-for="type in graphEntityTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </div>
        <div class="kv-graph__entity-list">
          <div
            v-for="entity in filteredGraphEntities"
            :key="entity.id"
            class="kv-graph-entity"
            role="button"
            tabindex="0"
            :aria-label="'查看实体：' + entity.name"
            @click="$emit('open-entity-detail', entity)"
            @keydown.enter.prevent="$emit('open-entity-detail', entity)"
          >
            <div class="kv-graph-entity__name">{{ entity.name }}</div>
            <div class="kv-graph-entity__type">
              <el-tag size="small" type="info">{{ entity.type }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GraphData, GraphStats, GraphEntity } from '@/api/graph'
import GraphVisualization from '@/components/GraphVisualization.vue'

defineProps<{
  graphData: GraphData | null
  graphDataLoading: boolean
  graphStats: GraphStats
  graphSearchQuery: string
  graphSearchMode: string
  graphTargetEntity: string
  graphSearchLoading: boolean
  graphEntityTypeFilter: string
  graphEntityTypes: string[]
  filteredGraphEntities: GraphEntity[]
}>()

defineEmits<{
  'update:graphSearchQuery': [val: string]
  'update:graphSearchMode': [val: string]
  'update:graphTargetEntity': [val: string]
  'update:graphEntityTypeFilter': [val: string]
  'search': []
  'filter-entities': []
  'open-entity-detail': [entity: GraphEntity]
  'node-click': [entity: GraphEntity]
}>()
</script>

<style scoped>
.kv-graph {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.kv-graph__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.kv-graph__stats {
  display: flex;
  gap: 32px;
  padding: 12px 0;
  flex-shrink: 0;
}

.kv-graph__content {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 500px;
}

.kv-graph__visualization {
  flex: 1;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.kv-graph__loading {
  height: 100%;
  min-height: 400px;
}

.kv-graph__sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.kv-graph__entity-filter {
  flex-shrink: 0;
}

.kv-graph__entity-list {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px;
}

.kv-graph-entity {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kv-graph-entity:hover {
  background: var(--el-fill-color-light);
}

.kv-graph-entity__name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kv-graph-entity__type {
  flex-shrink: 0;
}
</style>