<template>
  <page-container title="定时任务" no-card>
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建任务</el-button>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="任务列表" name="tasks">
        <el-table :data="tasks" stripe style="width: 100%" v-loading="loading">
          <el-table-column prop="name" label="任务名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="cronExpression" label="Cron 表达式" width="150" />
          <el-table-column label="启用" width="80" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" @change="handleToggle(row)" />
            </template>
          </el-table-column>
          <el-table-column label="上次执行" width="160">
            <template #default="{ row }">
              <span v-if="row.lastRunTime">{{ formatTime(row.lastRunTime) }}</span>
              <span v-else class="text-muted">从未执行</span>
            </template>
          </el-table-column>
          <el-table-column label="上次状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.lastStatus" :type="statusType(row.lastStatus)" size="small">{{ statusLabel(row.lastStatus) }}</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastMessage" label="上次结果" min-width="200">
            <template #default="{ row }">
              <el-tooltip :content="row.lastMessage" placement="top" v-if="row.lastMessage">
                <span class="truncate-text">{{ row.lastMessage }}</span>
              </el-tooltip>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleTrigger(row)" :loading="triggeringId === row.id">执行</el-button>
              <el-button link type="primary" size="small" @click="handleEditCron(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteTask(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 缓存状态 -->
        <div class="cache-section">
          <h3>数据缓存状态</h3>
          <el-row :gutter="12">
            <el-col :span="6" v-for="(info, key) in cacheStatus" :key="key">
              <el-card shadow="hover" class="cache-card">
                <div class="cache-key">{{ cacheLabel(key as string) }}</div>
                <el-tag :type="info.hasData ? 'success' : 'info'" size="small">
                  {{ info.hasData ? '有缓存' : '无缓存' }}
                </el-tag>
                <div class="cache-time" v-if="info.updatedAt">
                  更新于 {{ formatTime(info.updatedAt) }}
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane label="执行记录" name="logs">
        <el-table :data="pagedLogs" stripe style="width: 100%" v-loading="logsLoading" :default-sort="{ prop: 'startTime', order: 'descending' }">
          <el-table-column prop="taskName" label="任务名称" width="150" />
          <el-table-column label="开始时间" width="180">
            <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="180">
            <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
          </el-table-column>
          <el-table-column label="耗时" width="100">
            <template #default="{ row }">{{ row.durationMs }} ms</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="结果" min-width="300">
            <template #default="{ row }">
              <el-tooltip :content="row.message" placement="top" v-if="row.message">
                <span class="truncate-text">{{ row.message }}</span>
              </el-tooltip>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
        </el-table>
        <div style="display: flex; justify-content: center; margin-top: 16px;">
          <el-pagination
            v-if="logs.length > 0"
            v-model:current-page="logPage"
            v-model:page-size="logPageSize"
            :total="logs.length"
            :page-sizes="[20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑 Cron 弹窗 -->
    <el-dialog v-model="cronDialogVisible" title="编辑定时任务" width="480px">
      <el-form :model="cronForm" label-width="100px">
        <el-form-item label="任务名称">
          <span>{{ cronForm.name }}</span>
        </el-form-item>
        <el-form-item label="执行时间">
          <SchedulePicker v-model="cronForm.cronExpression" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cronDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCron" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="createDialogVisible" title="新建定时任务" width="520px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="任务类型" required>
          <el-select v-model="createForm.typeCode" placeholder="选择自动化管理中已启用的任务类型" style="width: 100%">
            <el-option v-for="t in taskTypes" :key="t.code" :label="`${t.name}（${t.code}）`" :value="t.code" />
          </el-select>
          <div class="cron-hint">任务标识自动生成为 <code>automate:{{ createForm.typeCode || '<code>' }}</code>；每次触发会发起一次该类型的自动化执行，进度到自动化管理查看</div>
        </el-form-item>
        <el-form-item label="任务名称" required>
          <el-input v-model="createForm.name" placeholder="如 数据缓存刷新" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="任务用途说明（可选）" />
        </el-form-item>
        <el-form-item label="执行时间" required>
          <SchedulePicker v-model="createForm.cronExpression" />
        </el-form-item>
        <el-form-item label="执行参数">
          <el-input v-model="createForm.paramsJson" type="textarea" :rows="3"
                    placeholder='JSON 对象，字段由所选任务类型的表单定义；如 {"tfsWorkItemId": 123}' />
          <div class="cron-hint">留空表示无参数；任务类型必填参数缺集会执行失败并在日志中提示</div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="createForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { useStatusTag } from '@/composables/useStatusTag'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import SchedulePicker from './components/SchedulePicker.vue'
import { taskTypeApi, type AutomateTaskType } from '@/api/automate'
import {
  listTasks, createTask, updateTask, triggerTask, deleteTask, listLogs, getCacheStatus,
  type ScheduledTask, type TaskLog, type CacheStatus
} from '@/api/scheduledTasks'
import { formatDateTime } from '@/utils/format'

const { confirmDelete } = useConfirmDelete()

const activeTab = ref('tasks')
const loading = ref(false)
const logsLoading = ref(false)
const tasks = ref<ScheduledTask[]>([])
const logs = ref<TaskLog[]>([])
// 执行记录为全量加载，前端切片分页（规范 §3.1）
const logPage = ref(1)
const logPageSize = ref(20)
const pagedLogs = computed(() => {
  const start = (logPage.value - 1) * logPageSize.value
  return logs.value.slice(start, start + logPageSize.value)
})
const cacheStatus = ref<CacheStatus>({})
const triggeringId = ref<number | null>(null)

const cronDialogVisible = ref(false)
const saving = ref(false)
const cronForm = ref({ id: 0, name: '', cronExpression: '' })

// 新建任务
const createDialogVisible = ref(false)
const creating = ref(false)
const taskTypes = ref<AutomateTaskType[]>([])
const defaultCreateForm = () => ({
  typeCode: '', paramsJson: '',
  name: '', description: '', cronExpression: '', enabled: true
})
const createForm = ref(defaultCreateForm())

async function openCreateDialog() {
  createForm.value = defaultCreateForm()
  createDialogVisible.value = true
  if (taskTypes.value.length === 0) {
    try { taskTypes.value = await taskTypeApi.list(true) } catch { /* 类型列表加载失败时下拉为空 */ }
  }
}

async function handleCreate() {
  const f = createForm.value
  if (!f.typeCode) { ElMessage.error('请选择自动化任务类型'); return }
  const taskKey = `automate:${f.typeCode}`
  const paramsJson = f.paramsJson.trim()
  if (paramsJson) {
    try {
      const parsed = JSON.parse(paramsJson)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error()
    } catch { ElMessage.error('执行参数必须是合法的 JSON 对象'); return }
  }
  if (!f.name.trim()) { ElMessage.error('请填写任务名称'); return }
  const cron = f.cronExpression.trim()
  if (!cron) { ElMessage.error('请填写 Cron 表达式'); return }
  creating.value = true
  try {
    await createTask({ taskKey, name: f.name.trim(), description: f.description || undefined,
      cronExpression: cron, paramsJson: paramsJson || undefined, enabled: f.enabled })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    await loadTasks()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    creating.value = false
  }
}

async function handleDeleteTask(row: ScheduledTask) {
  if (!await confirmDelete(`定时任务 "${row.name}"（执行记录将保留）`)) return
  try {
    await deleteTask(row.id)
    ElMessage.success('已删除')
    await loadTasks()
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function loadData() {
  await Promise.all([loadTasks(), loadLogs(), loadCacheStatus()])
}

async function loadTasks() {
  loading.value = true
  try { tasks.value = await listTasks() }
  catch { ElMessage.error('加载任务列表失败') }
  finally { loading.value = false }
}

async function loadLogs() {
  logsLoading.value = true
  try { logs.value = await listLogs() }
  catch { ElMessage.error('加载执行记录失败') }
  finally { logsLoading.value = false }
}

async function loadCacheStatus() {
  try { cacheStatus.value = await getCacheStatus() }
  catch { /* ignore */ }
}

async function handleToggle(row: ScheduledTask) {
  try {
    await updateTask(row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '已启用' : '已禁用')
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('操作失败')
  }
}

async function handleTrigger(row: ScheduledTask) {
  triggeringId.value = row.id
  try {
    const log = await triggerTask(row.id)
    ElMessage.success(`执行完成: ${log.status} (${log.durationMs}ms)`)
    await Promise.all([loadTasks(), loadLogs(), loadCacheStatus()])
  } catch (e: any) {
    ElMessage.error('执行失败: ' + (e?.response?.data?.message || e.message))
  } finally {
    triggeringId.value = null
  }
}

function handleEditCron(row: ScheduledTask) {
  cronForm.value = { id: row.id, name: row.name, cronExpression: row.cronExpression }
  cronDialogVisible.value = true
}

async function handleSaveCron() {
  saving.value = true
  try {
    await updateTask(cronForm.value.id, { cronExpression: cronForm.value.cronExpression })
    ElMessage.success('更新成功')
    cronDialogVisible.value = false
    await loadTasks()
  } catch { ElMessage.error('更新失败') }
  finally { saving.value = false }
}

function formatTime(s?: string): string {
  return s ? formatDateTime(s) : ''
}

// 状态徽章统一走全站映射（useStatusTag）
const { statusType, statusLabel } = useStatusTag()

function cacheLabel(key: string): string {
  const map: Record<string, string> = {
    workload: '工作量统计',
    exceptions: '异常统计',
    weekly: '周工作量',
    daily: '每日工作量'
  }
  return map[key] || key
}

onMounted(() => { loadData() })
</script>

<style scoped>
/* 页边距统一交给 el-main（24px） */
.schedule-view { }
.toolbar { display: flex; gap: 8px; }
.cache-section { margin-top: 24px; }
.cache-section h3 { font-size: 16px; font-weight: 600; color: var(--ink-text); margin-bottom: 12px; padding-left: 8px; border-left: 3px solid var(--el-color-primary); }
.cache-card { text-align: center; margin-bottom: 12px; }
.cache-key { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.cache-time { font-size: 12px; color: var(--ink-text-secondary); margin-top: 6px; }
.text-muted { color: #b8b1a0; }
.truncate-text { display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
.cron-hint { font-size: 12px; color: var(--ink-text-secondary); margin-top: 4px; }
.cron-hint code { background: var(--el-fill-color); padding: 2px 4px; border-radius: 2px; }
</style>
