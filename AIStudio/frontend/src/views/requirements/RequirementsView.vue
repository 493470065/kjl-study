<template>
  <div class="requirements">
    <div class="page-header">
      <h2>需求看板</h2>
    </div>

    <!-- 统计栏（随 Tab 切换，汇总当前 Tab 全量数据的状态分布） -->
    <div class="stats-bar">
      <div class="stats-total">
        <span class="stats-label">{{ activeTabDef.label }} · 总数</span>
        <span class="stats-value">{{ currentStats.total }}</span>
      </div>
      <div class="stats-distribution">
        <el-tag
          :effect="!stateFilter ? 'dark' : 'light'"
          size="small"
          style="cursor: pointer; margin-right: 8px"
          @click="stateFilter = ''"
        >
          全部: {{ currentStats.total }}
        </el-tag>
        <el-tag
          v-for="(count, state) in currentStats.byState"
          :key="state"
          :type="stateTagColor(state)"
          :effect="stateFilter === state ? 'dark' : 'light'"
          size="small"
          style="cursor: pointer; margin-right: 8px"
          @click="toggleStateFilter(state)"
        >
          {{ state }}: {{ count }}
        </el-tag>
        <span v-if="Object.keys(currentStats.byState).length === 0" class="stats-empty">暂无数据</span>
      </div>
    </div>

    <el-alert v-if="!tfsAvailable" :title="tfsMessage" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>
        请检查 <router-link to="/mcp">MCP 管理</router-link> 中 tfs-query-winex 是否已注册，
        以及 data/mcp/tfs-query-winex/config.json 的 serverUrl/pat 是否有效
      </template>
    </el-alert>

    <!-- 4 个 Tab：仅切换数据源，内容区统一渲染 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in TABS" :key="tab.key" :name="tab.key" :label="tab.label" />
    </el-tabs>

    <template v-if="activeQueryId">
      <!-- 工具栏 -->
      <div class="tab-toolbar">
        <el-button @click="loadTab(activeTab)" :loading="activeLoading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button @click="openConfigDialog">
          <el-icon><Setting /></el-icon> 配置查询链接
        </el-button>
        <el-select
          v-if="activeTab === 'inventory'"
          v-model="selectedProject"
          placeholder="选择项目"
          clearable
          style="width: 200px"
          @change="loadTab('inventory')"
        >
          <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.name" />
        </el-select>
        <span class="query-hint">查询 ID：{{ activeQueryId }}</span>
      </div>

      <!-- 列表（分页，默认每页 20 条） -->
      <el-table
        :data="pagedItems"
        v-loading="activeLoading"
        stripe
        style="cursor: pointer; margin-top: 12px"
        @row-click="showDetail"
      >
        <el-table-column prop="id" label="ID" width="100">
          <template #default="{ row }">
            <a :href="getWorkItemUrl(row.id)" target="_blank" class="id-link" @click.stop>{{ row.id }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagColor(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="stateTagColor(row.state)" size="small">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="指派人" width="120" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="tags" label="标签" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in parseTags(row.tags)" :key="tag" size="small" style="margin-right: 4px; margin-bottom: 2px">{{ tag }}</el-tag>
            <span v-if="!row.tags" style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdDate" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdDate) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!activeLoading && activeItems.length === 0" description="暂无数据，可尝试刷新或检查查询链接配置" />

      <div class="pagination-bar" v-if="filteredActiveItems.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredActiveItems.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </template>

    <!-- 当前 Tab 尚未配置查询链接 -->
    <el-empty v-else :description="`「${activeTabDef.label}」尚未配置查询链接`">
      <el-button type="primary" @click="openConfigDialog">
        <el-icon><Setting /></el-icon> 配置查询链接
      </el-button>
    </el-empty>

    <!-- 配置查询链接对话框 -->
    <el-dialog v-model="configDialogVisible" :title="`配置查询链接 - ${activeTabDef.label}`" width="580px">
      <el-form label-width="90px">
        <el-form-item label="查询链接">
          <el-input
            v-model="configInput"
            placeholder="粘贴 TFS 存储查询链接或 Query ID（GUID）"
            clearable
          />
        </el-form-item>
        <el-form-item v-if="activeTabDef.defaultQueryId" label="默认查询">
          <span class="config-default">{{ activeTabDef.defaultQueryId }}</span>
        </el-form-item>
      </el-form>
      <div class="config-tip">
        支持直接粘贴 TFS 查询 URL（如 .../queries?queryId=xxxx），系统将自动提取其中的查询 ID；
        保存后立即按该链接拉取数据展示。
      </div>
      <template #footer>
        <el-button v-if="activeTabDef.defaultQueryId" @click="resetTabConfig">恢复默认</el-button>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="configSaving" @click="saveTabConfig">保存并加载</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 - 所有 Tab 共用 -->
    <el-drawer v-model="showDrawer" :title="`#${selectedItem.id} ${selectedItem.title}`" size="50%">
      <div v-if="selectedItem" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="类型">
            <el-tag :type="typeTagColor(selectedItem.type)" size="small">{{ selectedItem.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="stateTagColor(selectedItem.state)" size="small">{{ selectedItem.state }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指派人">{{ selectedItem.assignedTo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ selectedItem.priority || '-' }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ selectedItem.severity || '-' }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ selectedItem.project || '-' }}</el-descriptions-item>
          <el-descriptions-item label="区域路径" :span="2">{{ selectedItem.areaPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="迭代路径" :span="2">{{ selectedItem.iterationPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">{{ selectedItem.tags || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedItem.createdDate) }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ formatDate(selectedItem.changedDate) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedItem.description" class="section">
          <h4>描述</h4>
          <div class="markdown-content" v-html="renderMarkdown(selectedItem.description)"></div>
        </div>

        <div v-if="selectedItem.reproSteps" class="section">
          <h4>复现步骤</h4>
          <div class="markdown-content" v-html="renderMarkdown(selectedItem.reproSteps)"></div>
        </div>

        <div v-if="selectedItem.acceptanceCriteria" class="section">
          <h4>验收标准</h4>
          <div class="markdown-content" v-html="renderMarkdown(selectedItem.acceptanceCriteria)"></div>
        </div>

        <div v-if="selectedItem.requirementAnalysis" class="section">
          <h4>需求分析</h4>
          <div class="markdown-content" v-html="renderMarkdown(selectedItem.requirementAnalysis)"></div>
        </div>

        <div class="section">
          <h4>附件</h4>
          <el-button size="small" @click="loadAttachments" :loading="loadingAttachments">加载附件列表</el-button>
          <el-table v-if="attachments.length > 0" :data="attachments" size="small" style="margin-top: 8px">
            <el-table-column prop="name" label="文件名" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="downloadAttachment(row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Setting } from '@element-plus/icons-vue'
import { tfsApi, type TfsWorkItem, type TfsProject, type TfsAttachment } from '@/api/tfs'
import { getConfigMap, listConfigs, saveConfig, deleteConfig, type SystemConfig } from '@/api/systemConfig'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

// ========== Tab 定义 ==========
interface TabDef {
  key: string
  label: string
  defaultQueryId: string
  configKey: string
}

const TABS: TabDef[] = [
  { key: 'followed', label: '关注需求', defaultQueryId: 'c2e20ee4-ddee-4a7b-bf7a-8f8a34a44785', configKey: 'reqboard.query.followed' },
  { key: 'translation', label: '多语翻译', defaultQueryId: '', configKey: 'reqboard.query.translation' },
  { key: 'special', label: '多语专项', defaultQueryId: '', configKey: 'reqboard.query.special' },
  { key: 'inventory', label: '病历库存', defaultQueryId: '920c888e-d178-48f9-b890-31e7a03244d6', configKey: 'reqboard.query.inventory' }
]

// ========== 通用状态 ==========
const tfsAvailable = ref(true)
const tfsMessage = ref('')
const activeTab = ref('followed')

const DEFAULT_TFS_URL = 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0'
const tfsServerUrl = ref(DEFAULT_TFS_URL)

function getWorkItemUrl(id: number) {
  return `${tfsServerUrl.value}/_workitems/edit/${id}`
}

async function loadTfsServerUrl() {
  try {
    const configMap = await getConfigMap()
    if (configMap['tfs.serverUrl']) {
      tfsServerUrl.value = configMap['tfs.serverUrl']
    }
  } catch {
    // use default
  }
}

// ========== 各 Tab 数据 ==========
const tabItems = reactive<Record<string, TfsWorkItem[]>>({ followed: [], translation: [], special: [], inventory: [] })
const tabLoading = reactive<Record<string, boolean>>({ followed: false, translation: false, special: false, inventory: false })
const tabLoaded = reactive<Record<string, boolean>>({ followed: false, translation: false, special: false, inventory: false })

// 每个 Tab 的查询 ID：优先取系统配置（可配置），否则用默认值
const configuredQueryIds = reactive<Record<string, string>>({})
const configEntryIds = reactive<Record<string, number>>({})

const activeTabDef = computed<TabDef>(() => TABS.find(t => t.key === activeTab.value) || TABS[0])
const activeQueryId = computed(() =>
  configuredQueryIds[activeTabDef.value.configKey] || activeTabDef.value.defaultQueryId
)
const activeItems = computed<TfsWorkItem[]>(() => tabItems[activeTab.value] || [])
const activeLoading = computed(() => !!tabLoading[activeTab.value])

async function loadTabConfigs() {
  try {
    const list = await listConfigs('reqboard')
    // 同一 configKey 可能因历史原因存在多条记录：保留最新一条，清理其余重复
    const byKey = new Map<string, SystemConfig[]>()
    for (const c of list) {
      if (c.configKey.startsWith('reqboard.query.') && c.configValue) {
        if (!byKey.has(c.configKey)) byKey.set(c.configKey, [])
        byKey.get(c.configKey)!.push(c)
      }
    }
    for (const [key, entries] of byKey) {
      entries.sort((a, b) => (a.id || 0) - (b.id || 0))
      const latest = entries[entries.length - 1]
      configuredQueryIds[key] = latest.configValue
      if (latest.id != null) configEntryIds[key] = latest.id
      for (const dup of entries.slice(0, -1)) {
        if (dup.id != null) deleteConfig(dup.id).catch(() => { /* 清理失败不影响主流程 */ })
      }
    }
  } catch {
    // 读取失败时使用默认查询
  }
}

const projects = ref<TfsProject[]>([])
const selectedProject = ref('')

async function loadTab(key: string) {
  const tab = TABS.find(t => t.key === key)
  if (!tab) return
  const qid = configuredQueryIds[tab.configKey] || tab.defaultQueryId
  if (!qid) {
    tabItems[key] = []
    tabLoaded[key] = true
    return
  }
  tabLoading[key] = true
  try {
    if (key === 'inventory' && projects.value.length === 0) {
      try { projects.value = await tfsApi.listProjects() } catch { /* 项目列表可选 */ }
    }
    const project = key === 'inventory' && selectedProject.value ? selectedProject.value : undefined
    tabItems[key] = await tfsApi.getWorkItemsByQuery(qid, project)
    tabLoaded[key] = true
  } catch (e: any) {
    const detail = e?.response?.data?.error
    ElMessage.error(detail ? `加载「${tab.label}」失败：${detail}` : `加载「${tab.label}」失败，请检查查询链接配置或 TFS 服务`)
  } finally {
    tabLoading[key] = false
  }
}

// ========== 配置查询链接对话框 ==========
const configDialogVisible = ref(false)
const configInput = ref('')
const configSaving = ref(false)

function openConfigDialog() {
  configInput.value = activeQueryId.value || ''
  configDialogVisible.value = true
}

// 从 URL 或裸 GUID 中提取查询 ID
function extractGuid(input: string): string | null {
  const m = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return m ? m[0] : null
}

async function saveTabConfig() {
  const guid = extractGuid(configInput.value)
  if (!guid) {
    ElMessage.error('未识别到有效的查询 ID（GUID），请粘贴 TFS 查询链接或 Query ID')
    return
  }
  const tab = activeTabDef.value
  configSaving.value = true
  try {
    const saved = await saveConfig({
      id: configEntryIds[tab.configKey],
      configKey: tab.configKey,
      configValue: guid,
      description: `需求看板「${tab.label}」查询 ID`,
      configGroup: 'reqboard'
    })
    // 记录返回的行 id，下次保存走 upsert，避免重复插入
    if (saved?.id != null) configEntryIds[tab.configKey] = saved.id
    configuredQueryIds[tab.configKey] = guid
    configDialogVisible.value = false
    ElMessage.success('已保存，正在刷新数据')
    tabLoaded[tab.key] = false
    await loadTab(tab.key)
  } catch {
    ElMessage.error('保存配置失败')
  } finally {
    configSaving.value = false
  }
}

async function resetTabConfig() {
  const tab = activeTabDef.value
  const entryId = configEntryIds[tab.configKey]
  if (entryId != null) {
    try { await deleteConfig(entryId) } catch { /* 忽略删除失败，仍回退本地状态 */ }
    delete configEntryIds[tab.configKey]
  }
  delete configuredQueryIds[tab.configKey]
  configInput.value = tab.defaultQueryId
  ElMessage.success(tab.defaultQueryId ? '已恢复默认查询' : '已清除配置')
  tabLoaded[tab.key] = false
  await loadTab(tab.key)
}

// ========== 工具函数 ==========
function typeTagColor(type: string) {
  const map: Record<string, string> = { '需求': 'primary', '任务': 'success', 'Bug': 'danger', '缺陷': 'danger' }
  return (map[type] || 'info') as any
}

function stateTagColor(state: string) {
  const map: Record<string, string> = { 'Active': 'warning', 'Resolved': 'success', 'Closed': 'info', 'New': 'primary' }
  return (map[state] || 'info') as any
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

function renderMarkdown(content: string) {
  if (!content) return ''
  return md.render(content)
}

function parseTags(tags?: string): string[] {
  if (!tags) return []
  return tags.split(';').filter(t => t.trim())
}

// ========== 统计栏 / 过滤（均针对当前 Tab） ==========
const stateFilter = ref('')

const currentStats = computed(() => {
  const items = activeItems.value
  const byState: Record<string, number> = {}
  for (const item of items) {
    const s = item.state || 'Unknown'
    byState[s] = (byState[s] || 0) + 1
  }
  return { total: items.length, byState }
})

function toggleStateFilter(state: string) {
  stateFilter.value = stateFilter.value === state ? '' : state
}

// 状态过滤后的当前 Tab 数据
const filteredActiveItems = computed(() => {
  let items = activeItems.value
  if (stateFilter.value) items = items.filter(item => item.state === stateFilter.value)
  return items
})

// ========== 分页（默认每页 20 条） ==========
const currentPage = ref(1)
const pageSize = ref(20)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredActiveItems.value.slice(start, start + pageSize.value)
})

watch([activeTab, stateFilter, pageSize], () => {
  currentPage.value = 1
})

// ========== 详情抽屉（共用） ==========
const showDrawer = ref(false)
const selectedItem = ref<TfsWorkItem>({} as TfsWorkItem)
const attachments = ref<TfsAttachment[]>([])
const loadingAttachments = ref(false)

async function checkStatus() {
  try {
    const status = await tfsApi.getStatus()
    tfsAvailable.value = status.available
    tfsMessage.value = status.message
  } catch {
    tfsAvailable.value = false
    tfsMessage.value = '无法连接到 TFS 服务'
  }
}

async function showDetail(row: TfsWorkItem) {
  try {
    const detail = await tfsApi.getWorkItem(row.id)
    selectedItem.value = detail
    attachments.value = []
    showDrawer.value = true
  } catch (e) {
    ElMessage.error('获取工作项详情失败')
  }
}

async function loadAttachments() {
  if (!selectedItem.value.id) return
  loadingAttachments.value = true
  try {
    attachments.value = await tfsApi.listAttachments(selectedItem.value.id)
  } catch {
    ElMessage.error('获取附件列表失败')
  } finally {
    loadingAttachments.value = false
  }
}

function downloadAttachment(attachment: TfsAttachment) {
  if (attachment.url) {
    window.open(attachment.url, '_blank')
  }
}

// ========== Tab 切换 ==========
function handleTabChange(name: string | number) {
  stateFilter.value = ''
  currentPage.value = 1
  const key = String(name)
  if (!tabLoaded[key] && tfsAvailable.value) {
    loadTab(key)
  }
}

// ========== 初始化 ==========
onMounted(async () => {
  await checkStatus()
  await loadTfsServerUrl()
  await loadTabConfigs()
  if (tfsAvailable.value) {
    loadTab('followed')
  }
})
</script>

<style scoped>
.requirements {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.stats-total {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-label {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.stats-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.stats-distribution {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.stats-empty {
  font-size: 13px;
  color: #c0c4cc;
}

.tab-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.query-hint {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.config-default {
  font-size: 12px;
  color: #909399;
  font-family: Consolas, Monaco, monospace;
}

.config-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px 12px;
}

.detail-content {
  padding: 0 8px;
}

.section {
  margin-top: 20px;
}

.section h4 {
  margin-bottom: 8px;
  color: #303133;
  font-size: 15px;
}

.markdown-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
  font-size: 14px;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 6px 12px;
  text-align: left;
}

.markdown-content :deep(code) {
  background: #e8e8e8;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}

.markdown-content :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.id-link {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}
.id-link:hover {
  text-decoration: underline;
}
</style>
