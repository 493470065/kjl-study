<template>
  <div ref="chartContainer" class="graph-visualization" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import type { GraphData, GraphEntity } from '@/api/graph'

const props = defineProps<{
  graphData: GraphData
}>()

const emit = defineEmits<{
  (e: 'node-click', entity: GraphEntity): void
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// Type color mapping
const typeColorMap: Record<string, string> = {
  CONCEPT: 'var(--el-color-primary)',
  RULE: '#67C23A',
  MODULE: '#E6A23C',
  INTERFACE: 'var(--ink-text-secondary)',
  CLASS: '#F56C6C',
  METHOD: 'var(--viz-purple)',
  FIELD: 'var(--viz-teal)',
  DOCUMENT: 'var(--viz-slate)',
  WIKI_PAGE: 'var(--viz-green)'
}

function getNodeColor(type: string): string {
  return typeColorMap[type] || 'var(--ink-text-secondary)'
}

const chartOption = computed(() => {
  const nodes = (props.graphData?.nodes || []).map(node => ({
    id: String(node.id),
    name: node.name,
    symbolSize: 40,
    category: node.type,
    itemStyle: {
      color: getNodeColor(node.type)
    },
    label: {
      show: true,
      fontSize: 11,
      color: 'var(--ink-text)'
    },
    // Store original entity data for click events
    value: node
  }))

  const edges = (props.graphData?.edges || []).map(edge => ({
    source: String(edge.startNodeId),
    target: String(edge.endNodeId),
    label: {
      show: true,
      formatter: edge.relType || edge.type,
      fontSize: 10,
      color: 'var(--ink-text-secondary)'
    },
    lineStyle: {
      color: '#b8b1a0',
      curveness: 0.2
    }
  }))

  // Build categories from unique node types
  const types = [...new Set((props.graphData?.nodes || []).map(n => n.type))]
  const categories = types.map(t => ({
    name: t,
    itemStyle: { color: getNodeColor(t) }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter(params: any) {
        if (params.dataType === 'node') {
          const entity = params.data.value as GraphEntity
          return `
            <div style="padding: 4px 0">
              <div style="font-weight: 600; margin-bottom: 4px">${entity.name}</div>
              <div style="color: var(--ink-text-secondary); font-size: 12px; margin-bottom: 4px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${getNodeColor(entity.type)};margin-right:4px"></span>
                ${entity.type}
              </div>
              <div style="max-width: 280px; font-size: 13px; color: var(--ink-text-regular); line-height: 1.5">${entity.description || '暂无描述'}</div>
            </div>
          `
        }
        if (params.dataType === 'edge') {
          return `<div style="padding: 4px 0; font-size: 13px">${params.data.label?.formatter || '关联'}</div>`
        }
        return ''
      }
    },
    legend: {
      data: categories.map(c => c.name),
      orient: 'vertical',
      right: 10,
      top: 10,
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: edges,
        categories: categories,
        roam: true,
        draggable: true,
        force: {
          repulsion: 300,
          edgeLength: [100, 200],
          gravity: 0.1
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 }
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        label: {
          position: 'right',
          show: true
        },
        edgeLabel: {
          fontSize: 10
        }
      }
    ]
  }
})

function initChart() {
  if (!chartContainer.value) return
  chartInstance = echarts.init(chartContainer.value)
  chartInstance.setOption(chartOption.value)

  // Handle node click
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node' && params.data.value) {
      emit('node-click', params.data.value as GraphEntity)
    }
  })
}

function updateChart() {
  if (chartInstance) {
    chartInstance.setOption(chartOption.value, { notMerge: true })
  }
}

function handleResize() {
  chartInstance?.resize()
}

watch(() => props.graphData, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.graph-visualization {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
