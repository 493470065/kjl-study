<template>
  <div class="dashboard">
    <!-- TFS 数据统计 -->
    <div class="tfs-stats-section">
      <div class="section-header">
        <h2>TFS 数据统计</h2>
        <el-button :icon="Refresh" @click="loadTfsData" :loading="tfsLoading">刷新数据</el-button>
      </div>

      <!-- 库存待办 -->
      <div class="section" v-loading="workloadLoading">
        <h3>库存待办</h3>
        <el-row :gutter="12">
          <el-col :span="6" v-for="item in stockItems" :key="item.key">
            <el-card shadow="hover" class="stat-card" :style="{ borderLeft: `4px solid ${item.color}` }">
              <div class="stat-value">{{ workload.stats[item.key] || 0 }}</div>
              <div class="stat-label">{{ item.label }}</div>
              <el-button link type="primary" size="small" @click="showDetail(item.key)">查看明细</el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 每日工作量 -->
      <div class="section" v-loading="dailyLoading">
        <h3>每日工作量</h3>
        <el-row :gutter="12">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card-total">
              <div class="stat-value">{{ daily.total }}</div>
              <div class="stat-label">今日完成总数</div>
            </el-card>
          </el-col>
          <el-col :span="6" v-for="item in dailyItems" :key="item.key">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ daily.stats[item.key] || 0 }}</div>
              <div class="stat-label">{{ item.label }}</div>
              <el-button link type="primary" size="small" @click="showDetail(item.key + '（本日）')">查看明细</el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 工作量统计 -->
      <div class="section" v-loading="workloadLoading">
        <h3>工作量统计</h3>
        <el-row :gutter="12">
          <el-col :span="6" v-for="item in dimensionItems" :key="item.key">
            <el-card shadow="hover" class="stat-card" :class="{ 'stat-card-danger': item.danger }">
              <div class="stat-value">{{ workload.stats[item.key] || 0 }}</div>
              <div class="stat-label">{{ item.label }}</div>
              <el-button link type="primary" size="small" @click="showDetail(item.key)">查看明细</el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 异常数据统计 -->
      <div class="section" v-loading="exceptionLoading">
        <h3>异常数据统计</h3>
        <el-row :gutter="12">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card-danger">
              <div class="stat-value">{{ exceptionTotal }}</div>
              <div class="stat-label">异常总数</div>
            </el-card>
          </el-col>
          <el-col :span="6" v-for="item in exceptionItems" :key="item.key">
            <el-card shadow="hover" class="stat-card stat-card-warning">
              <div class="stat-value">{{ exceptions[item.key] || 0 }}</div>
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-actions">
                <el-button link type="primary" size="small" @click="showExceptionDetail(item.type)">查看明细</el-button>
                <el-button link type="warning" size="small" v-if="item.fixable" @click="handleBatchFix(item.type)">一键处理</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 部门人员本周工作量明细 -->
      <div class="section" v-loading="weeklyLoading">
        <h3>部门人员本周工作量明细</h3>
        <el-table :data="weeklyTableData" stripe style="width: 70%" :default-sort="{ prop: '功能性需求', order: 'descending' }" :row-class-name="getWeeklyRowClass">
          <el-table-column prop="name" label="解决人" width="120" />
          <el-table-column prop="total" label="总计" width="80" sortable />
          <el-table-column prop="任务" label="任务" width="80" sortable />
          <el-table-column prop="功能性需求" label="功能性需求" width="110" sortable />
          <el-table-column prop="软件质量" label="软件质量" width="100" sortable />
          <el-table-column prop="支持单" label="支持单" width="90" sortable />
          <el-table-column prop="公共Bug" label="公共Bug" width="90" sortable />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showWeeklyPersonDetail(row)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 明细弹窗 -->
      <el-dialog v-model="detailVisible" :title="detailTitle" width="80%" :fullscreen="detailFullscreen">
        <template #header="{ close, titleId, titleClass }">
          <div class="dialog-header-with-actions">
            <span :id="titleId" :class="titleClass">{{ detailTitle }}</span>
            <div class="dialog-header-actions">
              <el-button link :aria-label="detailFullscreen ? '退出全屏' : '全屏'" @click="detailFullscreen = !detailFullscreen">
                <el-icon>
                  <component :is="detailFullscreen ? ScaleToOriginal : FullScreen" />
                </el-icon>
              </el-button>
              <el-button link aria-label="关闭" @click="close">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div v-if="detailTitle.includes('支持单')" style="margin-bottom: 12px;">
          <span style="color: var(--ink-text-regular); font-size: 14px;">按解决人统计：</span>
          <template v-if="supportResolvedByStats.length > 0">
            <el-tag
              v-for="stat in supportResolvedByStats"
              :key="stat.name"
              size="small"
              type="info"
              style="margin-right: 6px; margin-bottom: 4px"
            >
              {{ stat.name }} {{ stat.count }}
            </el-tag>
          </template>
          <span v-else style="color: var(--ink-text-secondary);">-</span>
        </div>
        <el-table :data="detailItems" stripe :max-height="detailFullscreen ? 'calc(100vh - 180px)' : 500" v-loading="detailLoading">
          <el-table-column prop="id" label="ID" width="80">
            <template #default="{ row }">
              <a :href="getWorkItemUrl(row.id)" target="_blank" style="color: var(--el-color-primary); text-decoration: none;">{{ row.id }}</a>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="250">
            <template #default="{ row }">
              {{ row.title }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="reqType" label="需求类型" width="100" />
          <el-table-column prop="state" label="状态" width="80" />
          <el-table-column prop="resolvedBy" label="解决人" width="100" />
          <el-table-column prop="assignedTo" label="指派给" width="100" />
          <el-table-column prop="tags" label="标签" min-width="180">
            <template #default="{ row }">
              <template v-if="row.tags">
                <el-tag v-for="tag in row.tags.split(';').filter(Boolean)" :key="tag" size="small"
                  :type="getTagType(tag.trim())" style="margin: 1px">
                  {{ tag.trim() }}
                </el-tag>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <el-button @click="exportDetailExcel">导出 Excel</el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 周工作量人员明细弹窗 -->
      <el-dialog v-model="weeklyDetailVisible" :title="weeklyDetailTitle" width="80%" :fullscreen="weeklyDetailFullscreen">
        <template #header="{ close, titleId, titleClass }">
          <div class="dialog-header-with-actions">
            <span :id="titleId" :class="titleClass">{{ weeklyDetailTitle }}</span>
            <div class="dialog-header-actions">
              <el-button link :aria-label="weeklyDetailFullscreen ? '退出全屏' : '全屏'" @click="weeklyDetailFullscreen = !weeklyDetailFullscreen">
                <el-icon>
                  <component :is="weeklyDetailFullscreen ? ScaleToOriginal : FullScreen" />
                </el-icon>
              </el-button>
              <el-button link aria-label="关闭" @click="close">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <el-table :data="weeklyDetailItems" stripe :max-height="weeklyDetailFullscreen ? 'calc(100vh - 180px)' : 500">
          <el-table-column prop="id" label="ID" width="80">
            <template #default="{ row }">
              <a :href="getWorkItemUrl(row.id)" target="_blank" style="color: var(--el-color-primary); text-decoration: none;">{{ row.id }}</a>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="300" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="reqType" label="需求类型" width="100" />
          <el-table-column prop="state" label="状态" width="80" />
        </el-table>
        <template #footer>
          <el-button @click="weeklyDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 异常明细弹窗 -->
      <el-dialog v-model="exceptionDetailVisible" :title="exceptionDetailTitle" width="80%" :fullscreen="exceptionDetailFullscreen">
        <template #header="{ close, titleId, titleClass }">
          <div class="dialog-header-with-actions">
            <span :id="titleId" :class="titleClass">{{ exceptionDetailTitle }}</span>
            <div class="dialog-header-actions">
              <el-button link :aria-label="exceptionDetailFullscreen ? '退出全屏' : '全屏'" @click="exceptionDetailFullscreen = !exceptionDetailFullscreen">
                <el-icon>
                  <component :is="exceptionDetailFullscreen ? ScaleToOriginal : FullScreen" />
                </el-icon>
              </el-button>
              <el-button link aria-label="关闭" @click="close">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="margin-bottom: 8px; color: var(--ink-text-secondary)">共 {{ exceptionDetailItems.length }} 条</div>
        <el-table :data="exceptionDetailItems" stripe :max-height="exceptionDetailFullscreen ? 'calc(100vh - 200px)' : 450" v-loading="exceptionDetailLoading" @selection-change="onExceptionSelectionChange">
          <el-table-column type="selection" width="45" v-if="currentExceptionFixable" />
          <el-table-column prop="id" label="ID" width="80">
            <template #default="{ row }">
              <a :href="getWorkItemUrl(row.id)" target="_blank" style="color: var(--el-color-primary); text-decoration: none;">{{ row.id }}</a>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="250" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="reqType" label="需求类型" width="100" />
          <el-table-column prop="state" label="状态" width="80" />
          <el-table-column prop="resolvedBy" label="解决人" width="100" />
          <el-table-column prop="tags" label="标签" min-width="180">
            <template #default="{ row }">
              <template v-if="row.tags">
                <el-tag v-for="tag in row.tags.split(';').filter(Boolean)" :key="tag" size="small"
                  :type="getTagType(tag.trim())" style="margin: 1px">
                  {{ tag.trim() }}
                </el-tag>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <el-button @click="exportExceptionExcel">导出 Excel</el-button>
          <el-button type="warning" v-if="currentExceptionFixable" @click="handleBatchFixSelected"
            :disabled="selectedExceptionIds.length === 0">
            批量处理选中项 ({{ selectedExceptionIds.length }})
          </el-button>
          <el-button @click="exceptionDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 工作站概览 · 健康检查 -->
    <div class="overview-section">
      <div class="section-header">
        <h2>工作站概览</h2>
      </div>
      <el-row :gutter="16" v-loading="healthLoading">
        <el-col :xs="24" :sm="12" :md="6" v-for="card in healthCards" :key="card.title">
          <el-card shadow="hover" :class="['health-card', card.ok ? 'health-ok' : 'health-warn']">
            <div class="health-card__top">
              <span class="health-card__title">{{ card.title }}</span>
              <el-tag size="small" :type="card.ok ? 'success' : 'warning'">
                {{ card.ok ? '就绪' : '待配置' }}
              </el-tag>
            </div>
            <div class="health-card__desc">{{ card.desc }}</div>
            <el-button size="small" :type="card.ok ? 'default' : 'primary'" @click="router.push(card.link)">
              {{ card.action }}
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="agent-list">
        <template #header>Agent 列表</template>
        <el-table :data="agents" style="width: 100%" v-loading="agentsLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <!-- 状态徽章统一走全站映射（useStatusTag） -->
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, FullScreen, ScaleToOriginal, Close } from '@element-plus/icons-vue'
import {
  getWorkload, getExceptions, getWeeklyWorkload, getDailyWorkload,
  getWorkloadDetails, getExceptionDetails, fixException,
  type WorkloadData, type ExceptionData, type WeeklyData, type DailyData
} from '@/api/tfsStats'
import { getConfigMap } from '@/api/systemConfig'
import { agentApi } from '@/api/agent'
import http from '@/api/http'
import { useRouter } from 'vue-router'
import { useStatusTag } from '@/composables/useStatusTag'

const { statusType, statusLabel } = useStatusTag()

// TFS 数据
const tfsLoading = ref(false)
const workloadLoading = ref(false)
const dailyLoading = ref(false)
const exceptionLoading = ref(false)
const weeklyLoading = ref(false)

const workload = ref<WorkloadData>({ stats: {}, total: 0 })
const exceptions = ref<ExceptionData>({})
const weekly = ref<WeeklyData>({ total: 0, byPerson: {} })
const daily = ref<DailyData>({ stats: {}, total: 0 })

const stockItems = [
  { key: '统计库存需求', label: '统计库存需求', color: 'var(--el-color-primary)' },
  { key: '统计库存需求（全）', label: '统计库存需求（全）', color: 'var(--el-color-primary)' },
  { key: '库存软质', label: '库存软质', color: '#E6A23C' },
  { key: '库存软质（全）', label: '库存软质（全）', color: '#E6A23C' },
  { key: '库存软质（高）', label: '库存软质（高）', color: '#F56C6C' },
  { key: '库存Bug', label: '库存Bug', color: '#F56C6C' },
  { key: '库存软质（单需求）', label: '库存软质（单需求）', color: '#E6A23C' },
  { key: '未排期需求', label: '未排期需求', color: 'var(--ink-text-secondary)' }
]

const dailyItems = [
  { key: '功能性需求', label: '功能性需求' },
  { key: '软件质量', label: '软件质量' },
  { key: '支持单', label: '支持单' },
  { key: '公共BUG', label: '公共BUG' }
]

const dimensionItems = [
  { key: '功能性需求', label: '功能性需求' },
  { key: '软件质量', label: '软件质量' },
  { key: '支持单', label: '支持单' },
  { key: '公共BUG', label: '公共BUG' },
  { key: '需求Bug', label: '需求Bug', danger: true },
  { key: 'AI-CODING需求', label: 'AI-CODING需求' },
  { key: 'AI-PR-CHECK', label: 'AI-PR-CHECK' },
  { key: 'AI-BUG-FIX', label: 'AI-BUG-FIX' },
  { key: 'AI全流程', label: 'AI全流程' },
  { key: '录入知识库', label: '录入知识库' }
]

const exceptionItems = [
  { key: '支持单挂代码', label: '支持单挂代码', type: 'support-with-code', fixable: true },
  { key: '未打AI_CODING', label: '未打AI_CODING', type: 'noai-coding', fixable: true },
  { key: '软件质量不挂代码', label: '软件质量不挂代码', type: 'sw-no-code', fixable: true },
  { key: '未录入知识库', label: '未录入知识库', type: 'not-in-knowledge-base', fixable: false }
]

const exceptionTotal = computed(() => Object.values(exceptions.value).reduce((s, v) => s + (v || 0), 0))

const weeklyTableData = computed(() =>
  Object.entries(weekly.value.byPerson).map(([name, data]) => ({ name, ...data }))
)

const getWeeklyRowClass = ({ row }: { row: any }) => {
  return row['功能性需求'] < 3 ? 'low-functional-demand' : ''
}

const supportResolvedByStats = computed(() => {
  const counts = new Map<string, number>()
  detailItems.value.forEach(item => {
    const name = item.resolvedBy
    if (name) {
      counts.set(name, (counts.get(name) || 0) + 1)
    }
  })
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const detailVisible = ref(false)
const detailFullscreen = ref(false)
const detailTitle = ref('')
const detailItems = ref<any[]>([])
const detailLoading = ref(false)

const weeklyDetailVisible = ref(false)
const weeklyDetailFullscreen = ref(false)
const weeklyDetailTitle = ref('')
const weeklyDetailItems = ref<any[]>([])

const exceptionDetailVisible = ref(false)
const exceptionDetailFullscreen = ref(false)
const exceptionDetailTitle = ref('')
const exceptionDetailItems = ref<any[]>([])
const currentExceptionType = ref('')
const currentExceptionFixable = ref(false)
const selectedExceptionIds = ref<number[]>([])
const exceptionDetailLoading = ref(false)

const DEFAULT_TFS_URL = 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0'
const tfsServerUrl = ref(DEFAULT_TFS_URL)

function getWorkItemUrl(workItemId: number | string) {
  return `${tfsServerUrl.value}/_workitems/edit/${workItemId}`
}

async function loadTfsServerUrl() {
  try {
    const configMap = await getConfigMap()
    if (configMap['tfs.serverUrl']) {
      tfsServerUrl.value = configMap['tfs.serverUrl']
    }
  } catch {
    // fallback to default
  }
}

async function loadTfsData() {
  tfsLoading.value = true
  await Promise.all([loadWorkload(), loadExceptions(), loadWeekly(), loadDaily()])
  tfsLoading.value = false
}

async function loadWorkload() {
  workloadLoading.value = true
  try { workload.value = await getWorkload() }
  catch (e: any) { ElMessage.error('加载工作量失败') }
  finally { workloadLoading.value = false }
}

async function loadExceptions() {
  exceptionLoading.value = true
  try { exceptions.value = await getExceptions() }
  catch { ElMessage.error('加载异常统计失败') }
  finally { exceptionLoading.value = false }
}

async function loadWeekly() {
  weeklyLoading.value = true
  try { weekly.value = await getWeeklyWorkload() }
  catch { ElMessage.error('加载周工作量失败') }
  finally { weeklyLoading.value = false }
}

async function loadDaily() {
  dailyLoading.value = true
  try { daily.value = await getDailyWorkload() }
  catch { ElMessage.error('加载每日工作量失败') }
  finally { dailyLoading.value = false }
}

async function showDetail(type: string) {
  detailTitle.value = type + ' 明细'
  detailVisible.value = true
  detailLoading.value = true
  detailItems.value = []
  try {
    const data = await getWorkloadDetails(type)
    detailItems.value = data.items
  } catch { ElMessage.error('加载明细失败') }
  finally { detailLoading.value = false }
}

async function showExceptionDetail(type: string) {
  const item = exceptionItems.find(i => i.type === type)
  exceptionDetailTitle.value = (item?.label || type) + ' 明细'
  currentExceptionType.value = type
  currentExceptionFixable.value = item?.fixable || false
  exceptionDetailItems.value = []
  selectedExceptionIds.value = []
  exceptionDetailVisible.value = true
  exceptionDetailLoading.value = true
  try {
    const data = await getExceptionDetails(type)
    exceptionDetailItems.value = data.items
  } catch { ElMessage.error('加载异常明细失败') }
  finally { exceptionDetailLoading.value = false }
}

function onExceptionSelectionChange(rows: any[]) {
  selectedExceptionIds.value = rows.map(r => r.id).filter(Boolean)
}

async function handleBatchFix(type: string) {
  const item = exceptionItems.find(i => i.type === type)
  try {
    await ElMessageBox.confirm(
      `确定批量处理所有 "${item?.label}" 异常？共 ${exceptions.value[item?.key || ''] || 0} 条`,
      '确认批量处理', { type: 'warning' }
    )
    const data = await getExceptionDetails(type)
    const ids = data.items.map((i: any) => i.id).filter(Boolean)
    if (ids.length === 0) { ElMessage.info('没有可处理的项目'); return }
    const result = await fixException(type, ids)
    ElMessage.success(`处理完成: 成功 ${result.success}, 失败 ${result.failed}, 跳过 ${result.skipped}`)
    await loadExceptions()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('批量处理失败')
  }
}

async function handleBatchFixSelected() {
  if (selectedExceptionIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定批量处理选中的 ${selectedExceptionIds.value.length} 条记录？`,
      '确认批量处理', { type: 'warning' }
    )
    const result = await fixException(currentExceptionType.value, selectedExceptionIds.value)
    ElMessage.success(`处理完成: 成功 ${result.success}, 失败 ${result.failed}, 跳过 ${result.skipped}`)
    await loadExceptions()
    exceptionDetailVisible.value = false
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('批量处理失败')
  }
}

function showWeeklyPersonDetail(row: any) {
  weeklyDetailTitle.value = `${row.name} 本周工作明细 (共 ${row.total} 项)`
  weeklyDetailItems.value = row.itemsDetails || []
  weeklyDetailVisible.value = true
}

function getTagType(tag: string): string {
  if (!tag) return 'info'
  if (tag.startsWith('AI-')) return ''
  if (tag === 'SR-RC') return ''
  if (tag === 'SR-NEXT') return 'success'
  if (tag === '加急') return 'danger'
  if (tag === '公版') return ''
  if (tag.endsWith('专版')) return 'warning'
  return 'info'
}

function exportDetailExcel() { exportToExcel(detailItems.value, detailTitle.value) }
function exportExceptionExcel() { exportToExcel(exceptionDetailItems.value, exceptionDetailTitle.value) }

function exportToExcel(data: any[], filename: string) {
  const cols = [
    { key: 'id', title: 'ID' }, { key: 'title', title: '标题' },
    { key: 'type', title: '类型' }, { key: 'reqType', title: '需求类型' },
    { key: 'state', title: '状态' }, { key: 'resolvedBy', title: '解决人' },
    { key: 'assignedTo', title: '指派给' }, { key: 'tags', title: '标签' }
  ]
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>'
  html += '<tr>' + cols.map(c => `<th>${c.title}</th>`).join('') + '</tr>'
  for (const row of data) {
    html += '<tr>' + cols.map(c => {
      const v = String(row[c.key] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<td>${v}</td>`
    }).join('') + '</tr>'
  }
  html += '</table></body></html>'
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}.xls`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ===== 健康检查（真实数据，替代原先恒为 0 的假卡片）=====
const router = useRouter()
const agents = ref<any[]>([])
const agentsLoading = ref(false)
const healthLoading = ref(true)
const providerTotal = ref(0)
const providerReady = ref(false)
const mcpTotal = ref(0)
const mcpRunning = ref(0)

const healthCards = computed(() => [
  {
    title: 'LLM 服务',
    ok: providerReady.value,
    desc: providerReady.value
      ? `已配置 ${providerTotal.value} 个 Provider，对话可用`
      : '尚未配置可用的 LLM，AI 对话将不可用',
    action: '去配置',
    link: '/providers'
  },
  {
    title: 'MCP 服务',
    ok: mcpRunning.value > 0,
    desc: mcpTotal.value === 0
      ? '尚未接入 MCP 服务，Agent 将缺少外部工具能力'
      : `${mcpRunning.value}/${mcpTotal.value} 个服务运行中`,
    action: mcpTotal.value === 0 ? '去接入' : '管理',
    link: '/mcp'
  },
  {
    title: 'Agent',
    ok: agents.value.length > 0,
    desc: agents.value.length > 0
      ? `已配置 ${agents.value.length} 个 Agent，可在对话中选用`
      : '尚未创建 Agent，可从零搭建专属助手',
    action: agents.value.length > 0 ? '管理' : '去创建',
    link: '/agents'
  },
  {
    title: 'AI 对话',
    ok: providerReady.value,
    desc: '基于已配置的模型与能力开始提问',
    action: '开始对话',
    link: '/chat'
  }
])

async function loadHealth() {
  healthLoading.value = true
  // silent: 健康检查失败只降级展示，不打扰用户
  const [providersRes, mcpRes] = await Promise.allSettled([
    http.get('/llm/providers', { silent: true } as any),
    http.get('/mcp/servers', { silent: true } as any)
  ])
  if (providersRes.status === 'fulfilled') {
    const list = providersRes.value.data || []
    providerTotal.value = list.length
    providerReady.value = list.some((p: any) => p.hasApiKey && p.enabled !== false)
  }
  if (mcpRes.status === 'fulfilled') {
    const list = mcpRes.value.data || []
    mcpTotal.value = list.length
    mcpRunning.value = list.filter((s: any) => s.status === 'RUNNING').length
  }
  healthLoading.value = false
}

onMounted(async () => {
  loadTfsData()
  loadTfsServerUrl()
  loadHealth()
  agentsLoading.value = true
  try {
    const res = await agentApi.listAgents()
    agents.value = res
  } catch {
    agents.value = []
  } finally {
    agentsLoading.value = false
  }
})
</script>

<style scoped>
/* 页边距统一交给 el-main（24px） */
.dashboard {
}

/* 健康检查卡 */
.health-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.health-card.health-warn {
  border-left: 3px solid var(--el-color-warning, #e6a23c);
}

.health-card.health-ok {
  border-left: 3px solid var(--el-color-success, #67c23a);
}

.health-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.health-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-text);
}

.health-card__desc {
  font-size: 13px;
  color: var(--ink-text-secondary);
  margin: 8px 0 12px;
  min-height: 38px;
  line-height: 1.5;
}

.tfs-stats-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-text);
}

.overview-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-text);
  margin-bottom: 16px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-text);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.stat-card {
  text-align: center;
  cursor: default;
  margin-bottom: 12px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-text);
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 13px;
  color: var(--ink-text-secondary);
  margin-bottom: 6px;
}

.stat-card .stat-actions {
  margin-top: 4px;
}

.stat-card-total .stat-value {
  color: var(--el-color-primary);
}

.stat-card-danger .stat-value {
  color: #F56C6C;
}

.stat-card-warning .stat-value {
  color: #E6A23C;
}

.truncate-text {
  display: inline-block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  color: var(--el-color-primary);
}

.agent-list {
  margin-top: 20px;
}

.dialog-header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.low-functional-demand {
  background-color: #fde2e2 !important;
}
.low-functional-demand:hover > td {
  background-color: #f9d0d0 !important;
}
</style>
