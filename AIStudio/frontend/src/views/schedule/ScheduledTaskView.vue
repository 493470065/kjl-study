<template>
  <div class="schedule-view">
    <div class="page-header">
      <h2>定时任务管理</h2>
      <div class="toolbar">
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

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
              <el-tag v-if="row.lastStatus" :type="row.lastStatus === 'SUCCESS' ? 'success' : 'danger'" size="small">
                {{ row.lastStatus === 'SUCCESS' ? '成功' : '失败' }}
              </el-tag>
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
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleTrigger(row)" :loading="triggeringId === row.id">执行</el-button>
              <el-button link type="primary" size="small" @click="handleEditCron(row)">编辑</el-button>
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
        <el-table :data="logs" stripe style="width: 100%" v-loading="logsLoading" :default-sort="{ prop: 'startTime', order: 'descending' }">
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
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑 Cron 弹窗 -->
    <el-dialog v-model="cronDialogVisible" title="编辑定时任务" width="480px">
      <el-form :model="cronForm" label-width="100px">
        <el-form-item label="任务名称">
          <span>{{ cronForm.name }}</span>
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="cronForm.cronExpression" placeholder="0 0 * * * ?" />
          <div class="cron-hint">常用: <code>0 0 * * * ?</code> 每小时, <code>0 */30 * * * ?</code> 每30分钟</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cronDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCron" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  listTasks, updateTask, triggerTask, listLogs, getCacheStatus,
  type ScheduledTask, type TaskLog, type CacheStatus
} from '@/api/scheduledTasks'

const activeTab = ref('tasks')
const loading = ref(false)
const logsLoading = ref(false)
const tasks = ref<ScheduledTask[]>([])
const logs = ref<TaskLog[]>([])
const cacheStatus = ref<CacheStatus>({})
const triggeringId = ref<number | null>(null)

const cronDialogVisible = ref(false)
const saving = ref(false)
const cronForm = ref({ id: 0, name: '', cronExpression: '' })

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

function formatTime(t: string): string {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 19)
}

function statusType(s: string): string {
  if (s === 'SUCCESS') return 'success'
  if (s === 'FAILED') return 'danger'
  if (s === 'RUNNING') return 'warning'
  return 'info'
}

function statusLabel(s: string): string {
  if (s === 'SUCCESS') return '成功'
  if (s === 'FAILED') return '失败'
  if (s === 'RUNNING') return '运行中'
  return s
}

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
.schedule-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #303133; }
.toolbar { display: flex; gap: 8px; }
.cache-section { margin-top: 24px; }
.cache-section h3 { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid #409EFF; }
.cache-card { text-align: center; margin-bottom: 12px; }
.cache-key { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.cache-time { font-size: 12px; color: #909399; margin-top: 6px; }
.text-muted { color: #c0c4cc; }
.truncate-text { display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
.cron-hint { font-size: 12px; color: #909399; margin-top: 4px; }
.cron-hint code { background: #f5f7fa; padding: 2px 4px; border-radius: 2px; }
</style>
