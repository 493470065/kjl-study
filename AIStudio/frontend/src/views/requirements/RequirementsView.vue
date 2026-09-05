<template>
  <page-container title="需求看板" no-card>

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

    <el-alert v-if="!tfsAvailable && activeSource !== 'mcp'" :title="tfsMessage" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>
        请检查 <router-link to="/mcp">MCP 管理</router-link> 中 tfs-query-winex 是否已注册，
        以及 data/mcp/tfs-query-winex/config.json 的 serverUrl/pat 是否有效
      </template>
    </el-alert>

    <!-- 6 个 Tab：仅切换数据源，内容区统一渲染 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in TABS" :key="tab.key" :name="tab.key" :label="tab.label" />
    </el-tabs>

    <template v-if="hasDataSource">
      <!-- 工具栏 -->
      <div class="tab-toolbar">
        <el-button @click="loadTab(activeTab)" :loading="activeLoading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button @click="openConfigDialog">
          <el-icon><Setting /></el-icon> 配置数据源
        </el-button>
        <el-select
          v-if="activeTab === 'inventory' && activeSource === 'tfs'"
          v-model="selectedProject"
          placeholder="选择项目"
          clearable
          style="width: 200px"
          @change="loadTab('inventory')"
        >
          <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.name" />
        </el-select>
        <span v-if="activeSource === 'mcp'" class="query-hint">
          MCP 数据源：{{ mcpServerName(activeMcpCfg?.serverId) }} · {{ activeMcpCfg?.toolName }}
        </span>
        <span v-else-if="isFollowingTab" class="query-hint">实时同步当前账号在 TFS 关注的工作项（{{ tabItems['followed'].length }} 条）</span>
        <span v-else-if="activeQueryId" class="query-hint">查询 ID：{{ activeQueryId }}</span>
      </div>

      <!-- 查询条件：仅在当前 Tab 已加载的数据内过滤，不重新请求数据源 -->
      <div class="filter-bar">
        <el-input
          v-model="idFilter"
          placeholder="需求 ID（多个用逗号或空格分隔）"
          clearable
          style="width: 240px"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="stateFilter" placeholder="状态" clearable style="width: 160px">
          <el-option v-for="s in stateOptions" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select
          v-model="productFilter"
          placeholder="产品名称"
          clearable
          filterable
          style="width: 220px"
        >
          <el-option v-for="p in productOptions" :key="p" :label="p" :value="p" />
        </el-select>
        <el-select
          v-model="customerFilter"
          placeholder="客户名称"
          clearable
          filterable
          style="width: 260px"
        >
          <el-option v-for="c in customerOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button :disabled="!hasFilter" @click="resetFilters">
          <el-icon><RefreshLeft /></el-icon> 重置
        </el-button>
        <span v-if="hasFilter" class="filter-count">
          筛选出 {{ filteredActiveItems.length }} / {{ activeItems.length }} 条
        </span>
      </div>

      <!-- 列表（分页，默认每页 20 条） -->
      <el-table
        :data="pagedItems"
        v-loading="activeLoading"
        stripe
        style="cursor: pointer; margin-top: 12px"
        @row-click="showDetail"
      >
        <!-- 列顺序：ID、标题、类型、产品名称、优先级、状态、指派人、客户名称、创建时间、操作 -->
        <el-table-column prop="id" label="ID" width="100">
          <template #default="{ row }">
            <a :href="getWorkItemUrl(row.id)" target="_blank" class="id-link" @click.stop>{{ row.id }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagColor(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.productName">{{ row.productName }}</span>
            <span v-else style="color: #b8b1a0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="stateTagColor(row.state)" size="small">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="指派人" width="120" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.customerName">{{ row.customerName }}</span>
            <span v-else style="color: #b8b1a0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdDate" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdDate) }}
          </template>
        </el-table-column>
        <!-- 深链：需求 → 一键启动自动化（预填需求号） -->
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="startAutomate(row)">启动自动化</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!activeLoading && activeItems.length === 0" description="暂无数据，可尝试刷新或检查查询链接配置" />
      <el-empty
        v-else-if="!activeLoading && filteredActiveItems.length === 0"
        description="没有符合查询条件的数据，可调整条件或点击「重置」"
      />

      <div class="pagination-bar" v-if="filteredActiveItems.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredActiveItems.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </template>

    <!-- 当前 Tab 尚未配置数据源 -->
    <el-empty v-else :description="`「${activeTabDef.label}」尚未配置数据源`">
      <el-button type="primary" @click="openConfigDialog">
        <el-icon><Setting /></el-icon> 配置数据源
      </el-button>
    </el-empty>

    <!-- 配置数据源对话框：TFS 查询链接 / MCP 工具 二选一 -->
    <el-dialog v-model="configDialogVisible" :title="`配置数据源 - ${activeTabDef.label}`" width="680px">
      <el-form label-width="110px">
        <el-form-item label="数据源类型">
          <el-radio-group v-model="formSource">
            <el-radio value="tfs">TFS 查询链接</el-radio>
            <el-radio value="mcp">MCP 工具</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 数据源 = TFS 查询链接（原有能力，完整保留） -->
        <template v-if="formSource === 'tfs'">
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
          <div class="config-tip">
            支持直接粘贴 TFS 查询 URL（如 .../queries?queryId=xxxx），系统将自动提取其中的查询 ID。
            注：「关注需求」默认走 TFS 关注列表端点，无需配置查询链接。
          </div>
        </template>

        <!-- 数据源 = MCP 工具（新增能力） -->
        <template v-else>
          <el-form-item label="MCP 服务">
            <el-select
              v-model="formMcp.serverId"
              placeholder="选择 MCP 服务"
              style="width: 100%"
              @change="onMcpServerChange"
            >
              <el-option
                v-for="s in mcpServers"
                :key="s.id"
                :label="`${s.displayName || s.name}（${s.name}）`"
                :value="s.id"
              />
            </el-select>
            <div v-if="mcpServers.length === 0" class="config-default" style="margin-top: 4px">
              暂无已注册的 MCP 服务，请先到「MCP 管理」注册后再配置
            </div>
          </el-form-item>
          <el-form-item label="工具">
            <el-select
              v-model="formMcp.toolName"
              placeholder="选择工具"
              filterable
              style="width: 100%"
              :loading="mcpToolsLoading"
              @change="onMcpToolChange"
            >
              <el-option v-for="t in mcpTools" :key="t.name" :label="t.name" :value="t.name">
                <span>{{ t.name }}</span>
                <span style="float: right; color: #909399; font-size: 12px; margin-left: 12px">
                  {{ (t.description || '').slice(0, 40) }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="参数 (JSON)">
            <el-input
              v-model="formMcp.argumentsText"
              type="textarea"
              :rows="5"
              placeholder='例如：{ "queryId": "920c888e-d178-48f9-b890-31e7a03244d6" }（无参数可留空或填 {}）'
            />
          </el-form-item>
          <el-form-item label="结果路径">
            <el-input
              v-model="formMcp.resultPath"
              placeholder="可选，如 data.items；留空则取结果本身（自动识别 items/data/value 等包裹）"
              clearable
            />
          </el-form-item>
          <el-form-item label="">
            <el-button size="small" :loading="mcpTestLoading" @click="testMcpCall">测试调用</el-button>
            <span v-if="mcpTestInfo" class="config-default" style="margin-left: 10px">{{ mcpTestInfo }}</span>
          </el-form-item>
          <div class="config-tip">
            任意 MCP 服务的工具均可作为该 Tab 的数据源。工具返回结果需为工作项数组（或含数组的对象）；
            字段名会自动做常见别名归一（如 System.Title → 标题），未识别字段原样保留。
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="resetTabConfig">恢复默认</el-button>
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
          <el-descriptions-item label="产品名称">{{ selectedItem.productName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ selectedItem.customerName || '-' }}</el-descriptions-item>
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
  </page-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, RefreshLeft, Search, Setting } from '@element-plus/icons-vue'
import { tfsApi, type TfsWorkItem, type TfsProject, type TfsAttachment } from '@/api/tfs'
import { mcpApi, type McpServer, type McpToolInfo } from '@/api/mcp'
import MarkdownIt from 'markdown-it'
import { formatDateTime } from '@/utils/format'

const router = useRouter()

/** 需求 → 自动化深链：带上需求号跳转，自动化页自动预填并打开启动弹窗 */
function startAutomate(row: TfsWorkItem) {
  router.push({ path: '/automate', query: { workItemId: String(row.id) } })
}

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

// ========== Tab 定义 ==========
interface TabDef {
  key: string
  label: string
  defaultQueryId: string
  configKey: string
}

const TABS: TabDef[] = [
  { key: 'followed', label: '关注需求', defaultQueryId: '', configKey: 'reqboard.query.followed' },
  { key: 'translation', label: '多语翻译', defaultQueryId: '', configKey: 'reqboard.query.translation' },
  { key: 'special', label: '多语专项', defaultQueryId: '', configKey: 'reqboard.query.special' },
  { key: 'inventory', label: '病历库存', defaultQueryId: '920c888e-d178-48f9-b890-31e7a03244d6', configKey: 'reqboard.query.inventory' },
  { key: 'spec', label: 'spec需求', defaultQueryId: '', configKey: 'reqboard.query.spec' },
  { key: 'aiflow', label: 'Aiflow需求', defaultQueryId: '', configKey: 'reqboard.query.aiflow' }
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

// tfsServerUrl 使用 DEFAULT_TFS_URL 常量，原 system_configs 读取已移除


// ========== 各 Tab 数据 ==========
const tabItems = reactive<Record<string, TfsWorkItem[]>>({ followed: [], translation: [], special: [], inventory: [], spec: [], aiflow: [] })
const tabLoading = reactive<Record<string, boolean>>({ followed: false, translation: false, special: false, inventory: false, spec: false, aiflow: false })
const tabLoaded = reactive<Record<string, boolean>>({ followed: false, translation: false, special: false, inventory: false, spec: false, aiflow: false })

// ========== 数据源配置（每个 Tab 二选一，均持久化到系统配置 group=reqboard）==========
//   reqboard.query.{tab}  → TFS 存储查询 ID（原有能力，完整保留）
//   reqboard.source.{tab} → 'tfs' | 'mcp'
//   reqboard.mcp.{tab}    → { serverId, toolName, arguments, resultPath }
type TabSource = 'tfs' | 'mcp'

interface McpTabConfig {
  serverId: number
  toolName: string
  argumentsText: string   // JSON 文本，便于直接编辑
  resultPath: string      // 可选：从结果对象中取数组的路径，如 data.items
}

const sourceKeyOf = (tabKey: string) => `reqboard.source.${tabKey}`
const mcpKeyOf = (tabKey: string) => `reqboard.mcp.${tabKey}`

// ========== 配置持久化（本地存储，取代已删除的系统配置后端） ==========
const LS_KEY = 'reqboard.config.v1'

/** 默认配置：固化自删除前的系统配置；系统配置功能下掉后，配置改存浏览器本地 */
interface ReqboardConfig {
  queryIds: Record<string, string>
  sources: Record<string, TabSource>
  mcp: Record<string, McpTabConfig>
}

const DEFAULT_CONFIG: ReqboardConfig = {
  queryIds: { translation: '27630627-cbd7-42e8-bbbb-7fef58055d85' },
  sources: { followed: 'mcp' },
  mcp: {
    followed: { serverId: 1, toolName: 'following', argumentsText: '{}', resultPath: '' }
  }
}

function cloneDefaultConfig(): ReqboardConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}

function loadLocalConfig(): ReqboardConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return cloneDefaultConfig()
    const parsed = JSON.parse(raw)
    return {
      queryIds: { ...DEFAULT_CONFIG.queryIds, ...(parsed.queryIds || {}) },
      sources: { ...DEFAULT_CONFIG.sources, ...(parsed.sources || {}) },
      mcp: { ...DEFAULT_CONFIG.mcp, ...(parsed.mcp || {}) }
    }
  } catch {
    return cloneDefaultConfig()
  }
}

function saveLocalConfig(cfg: ReqboardConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
}

// 每个 Tab 的查询 ID：优先取本地配置，否则用默认值
const configuredQueryIds = reactive<Record<string, string>>({})
const configuredSources = reactive<Record<string, TabSource>>({})
const configuredMcp = reactive<Record<string, McpTabConfig>>({})

const activeTabDef = computed<TabDef>(() => TABS.find(t => t.key === activeTab.value) || TABS[0])
const activeQueryId = computed(() =>
  configuredQueryIds[activeTabDef.value.configKey] || activeTabDef.value.defaultQueryId
)
const activeItems = computed<TfsWorkItem[]>(() => tabItems[activeTab.value] || [])
const activeLoading = computed(() => !!tabLoading[activeTab.value])
// 关注需求走专用 following 端点（当前 PAT 账号在 TFS 关注的工作项），不依赖 stored queryId
const isFollowingTab = computed(() => activeTab.value === 'followed')

// 当前 Tab 的数据源类型与 MCP 配置
const activeSource = computed<TabSource>(() => (configuredSources[activeTab.value] === 'mcp' ? 'mcp' : 'tfs'))
const activeMcpCfg = computed<McpTabConfig | undefined>(() => configuredMcp[activeTab.value])

// 当前 Tab 是否具备可用数据源（决定展示列表还是「去配置」空态）
const hasDataSource = computed(() => {
  if (activeSource.value === 'mcp') {
    return !!(activeMcpCfg.value?.serverId && activeMcpCfg.value?.toolName)
  }
  if (isFollowingTab.value) return true   // 关注需求零配置
  return !!activeQueryId.value
})

/** 解析持久化的 MCP 配置 JSON（兼容旧的 argumentsText 写法） */
function parseMcpConfig(raw: string): McpTabConfig | null {
  try {
    const o = JSON.parse(raw)
    if (!o || typeof o !== 'object') return null
    return {
      serverId: Number(o.serverId) || 0,
      toolName: String(o.toolName || ''),
      argumentsText: o.arguments != null
        ? JSON.stringify(o.arguments, null, 2)
        : (typeof o.argumentsText === 'string' ? o.argumentsText : ''),
      resultPath: String(o.resultPath || '')
    }
  } catch {
    return null
  }
}

async function loadTabConfigs() {
  try {
    const cfg = loadLocalConfig()
    // queryIds 兼容两种历史键：configKey（reqboard.query.{tab}）与 tab.key
    for (const t of TABS) {
      const q = cfg.queryIds[t.configKey] ?? cfg.queryIds[t.key]
      if (q) configuredQueryIds[t.configKey] = q
    }
    for (const [k, v] of Object.entries(cfg.sources)) {
      configuredSources[k] = v === 'mcp' ? 'mcp' : 'tfs'
    }
    for (const [k, v] of Object.entries(cfg.mcp)) {
      if (v) configuredMcp[k] = v
    }
  } catch {
    // 读取失败时使用默认查询
  }
}

// ========== UI 状态持久化：记住激活 Tab 与每个 Tab 的查询条件（刷新/切菜单不丢） ==========
const LS_UI_KEY = 'reqboard.ui.v1'
interface TabUiState { state?: string; id?: string; product?: string; customer?: string; pageSize?: number }
interface ReqboardUi { activeTab?: string; perTab: Record<string, TabUiState> }

function loadReqboardUi(): ReqboardUi {
  try {
    const raw = localStorage.getItem(LS_UI_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o === 'object') return { activeTab: String(o.activeTab || ''), perTab: o.perTab || {} }
    }
  } catch { /* 忽略损坏的缓存 */ }
  return { perTab: {} }
}
const reqUi = loadReqboardUi()

function persistTabUi() {
  try {
    reqUi.activeTab = activeTab.value
    reqUi.perTab[activeTab.value] = {
      state: stateFilter.value, id: idFilter.value, product: productFilter.value,
      customer: customerFilter.value, pageSize: pageSize.value
    }
    localStorage.setItem(LS_UI_KEY, JSON.stringify(reqUi))
  } catch { /* 忽略容量错误 */ }
}

function applyTabUi(key: string) {
  const s = reqUi.perTab[key] || {}
  stateFilter.value = s.state || ''
  idFilter.value = s.id || ''
  productFilter.value = s.product || ''
  customerFilter.value = s.customer || ''
  if (s.pageSize && [10, 20, 50, 100].includes(s.pageSize)) pageSize.value = s.pageSize
}

const projects = ref<TfsProject[]>([])
const selectedProject = ref('')

// ========== MCP 数据源：结果解析 + 字段归一 ==========

/** 从 MCP 工具返回值中取出记录数组：优先按 resultPath，其次识别常见包裹字段 */
function extractArray(raw: any, resultPath?: string): any[] {
  let node: any = raw
  if (resultPath && resultPath.trim()) {
    for (const seg of resultPath.split('.')) {
      const s = seg.trim()
      if (!s) continue
      node = node == null ? undefined : node[s]
    }
  }
  if (Array.isArray(node)) return node
  if (node && typeof node === 'object') {
    for (const k of ['items', 'data', 'value', 'workItems', 'results', 'list', 'rows', 'records']) {
      if (Array.isArray(node[k])) return node[k]
    }
  }
  return []
}

/** 常见字段别名 → 表格标准列（兼容 TFS 原始字段名与 PascalCase） */
const FIELD_ALIASES: Record<string, string[]> = {
  id: ['id', 'ID', 'Id', 'workItemId', 'workItemID', 'System.Id'],
  title: ['title', 'Title', 'System.Title', 'name', 'summary'],
  type: ['type', 'workItemType', 'System.WorkItemType'],
  state: ['state', 'System.State', 'status'],
  assignedTo: ['assignedTo', 'assignTo', 'System.AssignedTo', 'owner'],
  project: ['project', 'System.TeamProject', 'teamProject'],
  // 产品名称 / 客户名称（卫宁自定义字段，MCP 数据源同样按此别名归一）
  productName: ['productName', 'product', 'Winning.Product.Name', 'ProductName', 'Product.Name'],
  customerName: ['customerName', 'customer', 'Winning.Custom.Name', 'CustomerName', 'Custom.Name', 'hospital'],
  priority: ['priority', 'Microsoft.VSTS.Common.Priority', 'System.Priority'],
  severity: ['severity', 'Microsoft.VSTS.Common.Severity'],
  areaPath: ['areaPath', 'System.AreaPath'],
  iterationPath: ['iterationPath', 'System.IterationPath'],
  tags: ['tags', 'System.Tags'],
  createdDate: ['createdDate', 'System.CreatedDate', 'createdAt', 'created'],
  changedDate: ['changedDate', 'System.ChangedDate', 'changedAt', 'updatedAt'],
  description: ['description', 'System.Description'],
  reproSteps: ['reproSteps', 'Microsoft.VSTS.TCM.ReproSteps'],
  acceptanceCriteria: ['acceptanceCriteria', 'Microsoft.VSTS.Common.AcceptanceCriteria'],
  requirementAnalysis: ['requirementAnalysis'],
  targetDate: ['targetDate', 'TargetDate', 'Microsoft.VSTS.Scheduling.TargetDate'],
  url: ['url', 'htmlLink']
}

/** 把任意 MCP 返回的单条记录归一为表格可渲染的工作项（未识别字段原样保留） */
function normalizeWorkItem(raw: any): TfsWorkItem {
  if (raw == null) return {} as TfsWorkItem
  if (typeof raw !== 'object') return { title: String(raw) } as TfsWorkItem
  const out: any = {}
  for (const [std, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const a of aliases) {
      const v = raw[a]
      if (v !== undefined && v !== null && v !== '') { out[std] = v; break }
    }
  }
  const nId = Number(out.id)
  if (Number.isFinite(nId)) out.id = nId
  if (out.priority !== undefined) {
    const nPr = Number(out.priority)
    if (Number.isFinite(nPr)) out.priority = nPr
  }
  return { ...raw, ...out } as TfsWorkItem
}

/** 解析「参数 (JSON)」文本框；格式错误抛异常由调用方提示 */
function parseArgsText(text: string): Record<string, any> {
  const t = (text || '').trim()
  if (!t) return {}
  const parsed = JSON.parse(t)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('参数必须是 JSON 对象')
  }
  return parsed
}

async function loadTab(key: string) {
  const tab = TABS.find(t => t.key === key)
  if (!tab) return

  // ---- 数据源 = MCP 工具 ----
  if (configuredSources[key] === 'mcp') {
    const cfg = configuredMcp[key]
    if (!cfg || !cfg.serverId || !cfg.toolName) {
      tabItems[key] = []
      tabLoaded[key] = true
      return
    }
    tabLoading[key] = true
    try {
      const args = parseArgsText(cfg.argumentsText)
      const raw = await mcpApi.callTool(cfg.serverId, cfg.toolName, args)
      const rows = extractArray(raw, cfg.resultPath)
      if (rows.length === 0 && raw && typeof raw === 'object' && 'raw' in raw) {
        ElMessage.warning(`「${tab.label}」MCP 工具未返回 JSON 数组，请在配置中调整「结果路径」`)
      }
      tabItems[key] = rows.map(normalizeWorkItem)
      tabLoaded[key] = true
    } catch (e: any) {
      const detail = e?.response?.data?.error
      ElMessage.error(detail ? `加载「${tab.label}」失败：${detail}` : `加载「${tab.label}」失败，请检查 MCP 数据源配置`)
    } finally {
      tabLoading[key] = false
    }
    return
  }

  // ---- 数据源 = TFS ----
  // 关注需求：专用 following 端点（忽略 stored queryId，实时随账号关注变化）
  if (key === 'followed') {
    tabLoading[key] = true
    try {
      tabItems[key] = await tfsApi.getFollowed()
      tabLoaded[key] = true
    } catch (e: any) {
      const detail = e?.response?.data?.error
      ElMessage.error(detail ? `加载「关注需求」失败：${detail}` : `加载「关注需求」失败，请检查 TFS 服务`)
    } finally {
      tabLoading[key] = false
    }
    return
  }
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

// ========== 配置数据源对话框（TFS 查询链接 / MCP 工具）==========
const configDialogVisible = ref(false)
const configInput = ref('')
const configSaving = ref(false)

const formSource = ref<TabSource>('tfs')
const formMcp = reactive<McpTabConfig>({ serverId: 0, toolName: '', argumentsText: '', resultPath: '' })

const mcpServers = ref<McpServer[]>([])
const mcpTools = ref<McpToolInfo[]>([])
const mcpToolsLoading = ref(false)
const mcpTestLoading = ref(false)
const mcpTestInfo = ref('')

function mcpServerName(id?: number) {
  if (!id) return '未选择'
  const s = mcpServers.value.find(x => x.id === id)
  return s ? (s.displayName || s.name) : `#${id}`
}

async function ensureMcpServers() {
  if (mcpServers.value.length > 0) return
  try { mcpServers.value = await mcpApi.listServers() } catch { /* 列表失败不影响其它数据源 */ }
}

async function loadMcpTools(serverId: number) {
  mcpTools.value = []
  if (!serverId) return
  mcpToolsLoading.value = true
  try {
    mcpTools.value = await mcpApi.getServerTools(serverId)
  } catch {
    ElMessage.error('获取 MCP 工具列表失败，请确认该服务可正常启动')
  } finally {
    mcpToolsLoading.value = false
  }
}

function onMcpServerChange(id: number) {
  formMcp.toolName = ''
  mcpTestInfo.value = ''
  loadMcpTools(id)
}

/** 选中工具后按其 inputSchema 生成参数模板，减少手填成本 */
function onMcpToolChange(name: string) {
  const schema = mcpTools.value.find(t => t.name === name)?.inputSchema
  const props = schema?.properties as Record<string, any> | undefined
  if (!props) return
  const sample: Record<string, any> = {}
  for (const [k, v] of Object.entries(props)) {
    const meta = (v || {}) as any
    sample[k] = meta.default ?? (meta.type === 'number' ? 0 : meta.type === 'boolean' ? false : '')
  }
  formMcp.argumentsText = JSON.stringify(sample, null, 2)
}

/** 测试调用：验证「服务 + 工具 + 参数 + 结果路径」能否解析出记录数组 */
async function testMcpCall() {
  if (!formMcp.serverId || !formMcp.toolName) {
    ElMessage.error('请先选择 MCP 服务和工具')
    return
  }
  let args: Record<string, any> = {}
  try {
    args = parseArgsText(formMcp.argumentsText)
  } catch {
    ElMessage.error('参数 JSON 格式错误')
    return
  }
  mcpTestLoading.value = true
  mcpTestInfo.value = ''
  try {
    const raw = await mcpApi.callTool(formMcp.serverId, formMcp.toolName, args)
    const rows = extractArray(raw, formMcp.resultPath)
    if (rows.length > 0) {
      const first = rows[0] || {}
      const preview = String(first.title ?? first.id ?? '').slice(0, 30)
      mcpTestInfo.value = `调用成功，解析到 ${rows.length} 条记录${preview ? `（示例：${preview}）` : ''}`
    } else if (raw && typeof raw === 'object' && 'raw' in raw) {
      mcpTestInfo.value = '调用成功，但结果不是 JSON，请调整「结果路径」或改造工具输出'
    } else {
      mcpTestInfo.value = '调用成功，但未解析到数组，请调整「结果路径」（如 data.items）'
    }
  } catch (e: any) {
    mcpTestInfo.value = '调用失败：' + (e?.response?.data?.error || e?.message || '未知错误')
  } finally {
    mcpTestLoading.value = false
  }
}

function openConfigDialog() {
  configInput.value = activeQueryId.value || ''
  const key = activeTab.value
  formSource.value = configuredSources[key] === 'mcp' ? 'mcp' : 'tfs'
  const cfg = configuredMcp[key]
  formMcp.serverId = cfg?.serverId || 0
  formMcp.toolName = cfg?.toolName || ''
  formMcp.argumentsText = cfg?.argumentsText || ''
  formMcp.resultPath = cfg?.resultPath || ''
  mcpTestInfo.value = ''
  if (formSource.value === 'mcp') {
    ensureMcpServers().then(() => { if (formMcp.serverId) loadMcpTools(formMcp.serverId) })
  }
  configDialogVisible.value = true
}

// 从 URL 或裸 GUID 中提取查询 ID
function extractGuid(input: string): string | null {
  const m = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return m ? m[0] : null
}

async function saveTabConfig() {
  const tab = activeTabDef.value
  configSaving.value = true
  try {
    const cfg = loadLocalConfig()
    if (formSource.value === 'mcp') {
      if (!formMcp.serverId || !formMcp.toolName) {
        ElMessage.error('请选择 MCP 服务和工具')
        return
      }
      let args: Record<string, any> = {}
      try {
        args = parseArgsText(formMcp.argumentsText)
      } catch {
        ElMessage.error('参数 JSON 格式错误')
        return
      }
      cfg.mcp[tab.key] = { ...formMcp }
      cfg.sources[tab.key] = 'mcp'
      configuredMcp[tab.key] = { ...formMcp }
      configuredSources[tab.key] = 'mcp'
    } else {
      const guid = extractGuid(configInput.value)
      if (!guid) {
        ElMessage.error('未识别到有效的查询 ID（GUID），请粘贴 TFS 查询链接或 Query ID')
        return
      }
      cfg.queryIds[tab.configKey] = guid
      cfg.sources[tab.key] = 'tfs'
      configuredQueryIds[tab.configKey] = guid
      configuredSources[tab.key] = 'tfs'
      delete cfg.mcp[tab.key]
      delete configuredMcp[tab.key]
    }
    saveLocalConfig(cfg)
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
  // 清除该 Tab 的三类配置：查询链接 / 数据源类型 / MCP 配置
  const cfg = loadLocalConfig()
  delete cfg.queryIds[tab.configKey]
  delete cfg.sources[tab.key]
  delete cfg.mcp[tab.key]
  saveLocalConfig(cfg)
  delete configuredQueryIds[tab.configKey]
  delete configuredSources[tab.key]
  delete configuredMcp[tab.key]
  configInput.value = tab.defaultQueryId
  formSource.value = 'tfs'
  ElMessage.success(tab.defaultQueryId ? '已恢复默认数据源' : '已清除配置')
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

function formatDate(dateStr?: string): string {
  return dateStr ? formatDateTime(dateStr) : '-'
}

function renderMarkdown(content: string) {
  if (!content) return ''
  return md.render(content)
}

// ========== 统计栏 / 过滤（均针对当前 Tab） ==========
// stateFilter 与统计栏状态标签双向联动（点标签 = 选状态，选状态 = 高亮标签）
const stateFilter = ref('')
// 查询条件：ID / 产品名称 / 客户名称
const idFilter = ref('')
const productFilter = ref('')
const customerFilter = ref('')

const hasFilter = computed(
  () => !!(idFilter.value.trim() || stateFilter.value || productFilter.value || customerFilter.value)
)

/** 去重 + 排序，用于生成下拉选项（选项取自当前 Tab 已加载数据） */
function uniqueValues(values: (string | undefined)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const s = (v || '').trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
}

// 下拉选项随当前 Tab 数据变化，无需额外请求
const stateOptions = computed(() => uniqueValues(activeItems.value.map(i => i.state)))
const productOptions = computed(() => uniqueValues(activeItems.value.map(i => i.productName)))
const customerOptions = computed(() => uniqueValues(activeItems.value.map(i => i.customerName)))

/** ID 支持一次查多个：逗号/空格/分号分隔，任一命中即可（同时兼容部分匹配） */
function matchId(item: TfsWorkItem, keyword: string): boolean {
  const tokens = keyword.trim().split(/[\s,，;；]+/).filter(Boolean)
  if (tokens.length === 0) return true
  const id = String(item.id ?? '')
  return tokens.some(t => id.includes(t))
}

function resetFilters() {
  idFilter.value = ''
  productFilter.value = ''
  customerFilter.value = ''
  stateFilter.value = ''
  currentPage.value = 1
}

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

// 应用查询条件（ID / 产品名称 / 客户名称 / 状态）后的当前 Tab 数据
const filteredActiveItems = computed(() => {
  const kw = idFilter.value
  const state = stateFilter.value
  const product = productFilter.value
  const customer = customerFilter.value
  return activeItems.value.filter(item => {
    if (state && item.state !== state) return false
    if (product && (item.productName || '') !== product) return false
    if (customer && (item.customerName || '') !== customer) return false
    if (kw.trim() && !matchId(item, kw)) return false
    return true
  })
})

// ========== 分页（默认每页 20 条） ==========
const currentPage = ref(1)
const pageSize = ref(20)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredActiveItems.value.slice(start, start + pageSize.value)
})

// 切换 Tab 或改动任一查询条件、页大小时回到第一页；条件变化即持久化（记住每个 Tab 的配置）
watch([activeTab, stateFilter, idFilter, productFilter, customerFilter, pageSize], () => {
  currentPage.value = 1
  persistTabUi()
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
    // 详情接口覆盖不到 MCP 自定义字段时，保留列表行里已有的值
    selectedItem.value = { ...row, ...detail }
    attachments.value = []
    showDrawer.value = true
  } catch (e) {
    // MCP 数据源的行未必存在于 TFS：降级为展示列表字段，避免点开一片空白
    if (row && row.id) {
      selectedItem.value = row
      attachments.value = []
      showDrawer.value = true
      ElMessage.warning('该条来自 MCP 数据源，未能获取 TFS 完整详情，已展示列表字段')
    } else {
      ElMessage.error('获取工作项详情失败')
    }
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
  const key = String(name)
  // 切换 Tab 时恢复该 Tab 上次使用的查询条件（记住，不清空）；回到第一页
  applyTabUi(key)
  currentPage.value = 1
  persistTabUi()
  // TFS 不可用时，走 MCP 数据源的 Tab 仍应正常加载
  if (!tabLoaded[key] && (tfsAvailable.value || configuredSources[key] === 'mcp')) {
    loadTab(key)
  }
}

// ========== 初始化 ==========
onMounted(async () => {
  await checkStatus()
  await loadTabConfigs()
  // 恢复上次停留的 Tab 与该 Tab 的查询条件
  const restoredTab = TABS.some(t => t.key === reqUi.activeTab) ? reqUi.activeTab as string : 'followed'
  activeTab.value = restoredTab
  applyTabUi(restoredTab)
  // 预加载 MCP 服务列表：工具栏/配置弹窗要展示服务名
  await ensureMcpServers()
  // TFS 不可用时，若首屏 Tab 走的是 MCP 数据源，仍应尝试加载
  if (tfsAvailable.value || configuredSources[restoredTab] === 'mcp') {
    loadTab(restoredTab)
  }
})
</script>

<style scoped>
.requirements {
  padding: 0;
}



.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: var(--el-fill-color);
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
  color: var(--ink-text-secondary);
  white-space: nowrap;
}

.stats-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-text);
}

.stats-distribution {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.stats-empty {
  font-size: 13px;
  color: #b8b1a0;
}

.tab-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.query-hint {
  font-size: 12px;
  color: var(--ink-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color);
  border-radius: 6px;
}

.filter-count {
  font-size: 12px;
  color: var(--ink-text-secondary);
  white-space: nowrap;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.config-default {
  font-size: 12px;
  color: var(--ink-text-secondary);
  font-family: var(--app-font-mono);
}

.config-tip {
  font-size: 12px;
  color: var(--ink-text-secondary);
  line-height: 1.6;
  background: var(--el-fill-color);
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
  color: var(--ink-text);
  font-size: 16px;
}

.markdown-content {
  padding: 12px;
  background: var(--el-fill-color);
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
  background: #e1dbcb;
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
  color: var(--el-color-primary);
  text-decoration: none;
  cursor: pointer;
}
.id-link:hover {
  text-decoration: underline;
}
</style>
