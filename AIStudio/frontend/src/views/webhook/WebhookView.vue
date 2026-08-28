<template>
  <div class="webhook-view">
    <h2>Webhook 通知</h2>

    <el-tabs v-model="activeTab">
      <!-- Tab 1: Webhook 配置 -->
      <el-tab-pane label="Webhook 配置" name="configs">
        <div style="margin-bottom: 12px;">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon style="margin-right: 4px;"><Bell /></el-icon>新建
          </el-button>
        </div>
        <el-table :data="configs" v-loading="loadingConfigs" border stripe max-height="500">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="url" label="URL" min-width="240" show-overflow-tooltip />
          <el-table-column prop="events" label="事件" width="160">
            <template #default="{ row }">
              <span v-if="row.events === '*'">
                <el-tag size="small" type="warning">全部</el-tag>
              </span>
              <span v-else>
                <el-tag v-for="e in row.events.split(',')" :key="e" size="small" style="margin-right: 4px; margin-bottom: 2px;">{{ e }}</el-tag>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="enabled" label="启用" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                {{ row.enabled ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retryCount" label="重试次数" width="90" align="center" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEditDialog(row)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button link type="success" size="small" @click="handleTest(row)">
                <el-icon><Check /></el-icon> 测试
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: 发送日志 -->
      <el-tab-pane label="发送日志" name="logs">
        <el-table :data="logs" v-loading="loadingLogs" border stripe max-height="500" @row-click="openLogDrawer">
          <el-table-column prop="webhookName" label="Webhook 名称" min-width="140" />
          <el-table-column prop="eventType" label="事件类型" width="160" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responseCode" label="响应码" width="90" align="center">
            <template #default="{ row }">
              <span :style="{ color: row.responseCode >= 400 ? '#f56c6c' : '#67c23a' }">{{ row.responseCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sentAt" label="发送时间" width="180">
            <template #default="{ row }">{{ formatTime(row.sentAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'FAILED'"
                link
                type="primary"
                size="small"
                @click.stop="handleRetry(row)"
              >
                <el-icon><Refresh /></el-icon> 重试
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="display: flex; justify-content: center; margin-top: 16px;">
          <el-pagination
            v-if="logTotal > 0"
            v-model:current-page="logPage"
            v-model:page-size="logPageSize"
            :total="logTotal"
            layout="total, prev, pager, next"
            @current-change="loadLogs"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建/编辑 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑 Webhook' : '新建 Webhook'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="输入 Webhook 名称" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
          <el-input v-model="form.url" placeholder="https://example.com/webhook" />
        </el-form-item>
        <el-form-item label="Secret">
          <el-input v-model="form.secret" placeholder="可选，签名密钥" show-password />
        </el-form-item>
        <el-form-item label="事件类型">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <el-checkbox v-model="selectAllEvents" :indeterminate="isEventIndeterminate" @change="handleSelectAllEvents">全部</el-checkbox>
          </div>
          <el-checkbox-group v-model="selectedEvents">
            <el-checkbox v-for="evt in eventOptions" :key="evt.value" :label="evt.value" :value="evt.value">
              {{ evt.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input-number v-model="form.retryCount" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="超时时间(ms)">
          <el-input-number v-model="form.timeoutMs" :min="1000" :max="60000" :step="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情 Drawer -->
    <el-drawer
      v-model="logDrawerVisible"
      title="日志详情"
      size="500px"
    >
      <template v-if="selectedLog">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Webhook 名称">{{ selectedLog.webhookName }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">{{ selectedLog.eventType }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(selectedLog.status)" size="small">{{ statusLabel(selectedLog.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应码">{{ selectedLog.responseCode }}</el-descriptions-item>
          <el-descriptions-item label="重试次数">{{ selectedLog.retryCount }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatTime(selectedLog.sentAt) }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">Payload</h4>
          <pre class="log-payload">{{ formatJson(selectedLog.payload) }}</pre>
        </div>
        <div v-if="selectedLog.responseBody" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">响应内容</h4>
          <pre class="log-payload">{{ formatJson(selectedLog.responseBody) }}</pre>
        </div>
        <div v-if="selectedLog.errorMessage" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">错误信息</h4>
          <pre class="log-payload" style="color: #f56c6c;">{{ selectedLog.errorMessage }}</pre>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Check, Delete, Edit, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getWebhookConfigs,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  testWebhook,
  getWebhookLogs,
  retryWebhook,
  type WebhookConfig,
  type WebhookLog
} from '@/api/webhook'

const activeTab = ref('configs')

// ========== Tab 1: Configs ==========
const configs = ref<WebhookConfig[]>([])
const loadingConfigs = ref(false)

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const eventOptions = [
  { value: 'PIPELINE_STARTED', label: '自动化任务开始' },
  { value: 'PIPELINE_COMPLETED', label: '自动化任务完成' },
  { value: 'PIPELINE_FAILED', label: '自动化任务失败' },
  { value: 'TASK_COMPLETED', label: '任务完成' },
  { value: 'TASK_FAILED', label: '任务失败' },
  { value: 'AGENT_ERROR', label: 'Agent 错误' },
  { value: 'SYSTEM_ALERT', label: '系统告警' }
]

const selectedEvents = ref<string[]>([])
const selectAllEvents = ref(false)
const isEventIndeterminate = ref(false)

const form = reactive<WebhookConfig>({
  name: '',
  url: '',
  secret: '',
  events: '',
  enabled: true,
  retryCount: 3,
  timeoutMs: 5000
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入 URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的 URL', trigger: 'blur' }
  ]
}

function handleSelectAllEvents(val: boolean) {
  selectedEvents.value = val ? eventOptions.map(e => e.value) : []
}

watch(selectedEvents, (vals) => {
  if (vals.length === eventOptions.length) {
    selectAllEvents.value = true
    isEventIndeterminate.value = false
  } else if (vals.length === 0) {
    selectAllEvents.value = false
    isEventIndeterminate.value = false
  } else {
    selectAllEvents.value = false
  }
})

function resetForm() {
  form.name = ''
  form.url = ''
  form.secret = ''
  form.events = ''
  form.enabled = true
  form.retryCount = 3
  form.timeoutMs = 5000
  selectedEvents.value = []
  selectAllEvents.value = false
  editingId.value = null
  isEditing.value = false
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: WebhookConfig) {
  resetForm()
  isEditing.value = true
  editingId.value = row.id!
  form.name = row.name
  form.url = row.url
  form.secret = row.secret || ''
  form.enabled = row.enabled
  form.retryCount = row.retryCount
  form.timeoutMs = row.timeoutMs
  if (row.events === '*') {
    selectedEvents.value = eventOptions.map(e => e.value)
    selectAllEvents.value = true
  } else {
    selectedEvents.value = row.events ? row.events.split(',').filter(Boolean) : []
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const eventsStr = selectedEvents.value.length === eventOptions.length
      ? '*'
      : selectedEvents.value.join(',')
    const data = { ...form, events: eventsStr }

    if (isEditing.value && editingId.value) {
      await updateWebhookConfig(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createWebhookConfig(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadConfigs()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: WebhookConfig) {
  try {
    await ElMessageBox.confirm(`确定删除 Webhook "${row.name}"？`, '确认', { type: 'warning' })
    await deleteWebhookConfig(row.id!)
    ElMessage.success('删除成功')
    await loadConfigs()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function handleTest(row: WebhookConfig) {
  try {
    await testWebhook(row.id!)
    ElMessage.success('测试事件已发送')
  } catch (e: any) {
    ElMessage.error('测试失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function loadConfigs() {
  loadingConfigs.value = true
  try {
    const res = await getWebhookConfigs()
    configs.value = res.data || []
  } catch (e: any) {
    ElMessage.error('加载配置失败')
  } finally {
    loadingConfigs.value = false
  }
}

// ========== Tab 2: Logs ==========
const logs = ref<WebhookLog[]>([])
const loadingLogs = ref(false)
const logPage = ref(1)
const logPageSize = ref(20)
const logTotal = ref(0)
const logDrawerVisible = ref(false)
const selectedLog = ref<WebhookLog | null>(null)

function statusTagType(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'success'
    case 'FAILED': return 'danger'
    case 'RETRYING': return 'warning'
    default: return 'info'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'SUCCESS': return '成功'
    case 'FAILED': return '失败'
    case 'RETRYING': return '重试中'
    default: return status
  }
}

function formatTime(s?: string) {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

function formatJson(s?: string) {
  if (!s) return ''
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

function openLogDrawer(row: WebhookLog) {
  selectedLog.value = row
  logDrawerVisible.value = true
}

async function handleRetry(row: WebhookLog) {
  try {
    await retryWebhook(row.id)
    ElMessage.success('已重新发送')
    await loadLogs()
  } catch (e: any) {
    ElMessage.error('重试失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    const res = await getWebhookLogs(logPage.value - 1, logPageSize.value)
    logs.value = res.data?.content || res.data || []
    logTotal.value = res.data?.totalElements || res.data?.total || 0
  } catch (e: any) {
    ElMessage.error('加载日志失败')
  } finally {
    loadingLogs.value = false
  }
}

// ========== Lifecycle ==========
watch(activeTab, (tab) => {
  if (tab === 'configs') loadConfigs()
  else if (tab === 'logs') loadLogs()
})

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.webhook-view { padding: 0; }
.log-payload {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
}
</style>