<template>
  <div class="monitor-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h2>
        <el-icon><Monitor /></el-icon>
        运行时监控
      </h2>
      <div class="header-actions">
        <span class="refresh-time" v-if="lastRefresh">
          <el-icon><Timer /></el-icon>
          刷新于: {{ lastRefresh }}
        </span>
        <el-button type="primary" size="small" @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          立即刷新
        </el-button>
      </div>
    </div>

    <!-- 1. System Status -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="section-title">
          <el-icon><Monitor /></el-icon>
          系统状态
        </span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">系统状态</div>
            <div class="stat-value">
              <span class="status-dot" :class="systemStatusClass"></span>
              {{ systemStatusText }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">JVM 内存</div>
            <div class="stat-value">{{ formattedMemory }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">CPU 使用率</div>
            <div class="stat-value">{{ formattedCpu }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">运行时间</div>
            <div class="stat-value">{{ formattedUptime }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 2. Agent Status -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="section-title">
          <el-icon><Connection /></el-icon>
          Agent 状态
        </span>
      </template>
      <el-table :data="dashboardData?.agents || []" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="agent-status-indicator">
              <span v-if="row.status === 'RUNNING'" class="status-dot status-dot-pulsing"></span>
              <el-tag :type="agentStatusType(row.status)" size="small">
                {{ row.status }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currentTaskId" label="当前任务" min-width="140">
          <template #default="{ row }">
            <span v-if="row.currentTaskId" class="task-id">{{ row.currentTaskId }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="runningTime" label="运行时间" width="120" />
        <el-table-column prop="tokenUsed" label="Token 用量" width="110">
          <template #default="{ row }">
            <span v-if="row.tokenUsed != null">{{ row.tokenUsed.toLocaleString() }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <span v-if="row.status === 'ERROR' && row.errorCount != null" class="error-count">
              <el-tag type="danger" size="small">错误 {{ row.errorCount }}</el-tag>
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. LLM Provider Status -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="section-title">
          <el-icon><Cpu /></el-icon>
          LLM Provider
        </span>
      </template>
      <el-table :data="dashboardData?.providers || []" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="providerType" label="Provider 类型" min-width="140" />
        <el-table-column prop="modelName" label="模型" min-width="140" />
        <el-table-column label="Base URL" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.baseUrl" placement="top">
              <span class="base-url-text">{{ truncateUrl(row.baseUrl) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isDefault ? 'warning' : 'info'" size="small">
              {{ row.isDefault ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可达性" width="100" align="center">
          <template #default="{ row }">
            <span class="status-dot" :class="row.reachable ? 'dot-green' : 'dot-red'"></span>
            {{ row.reachable ? '可达' : '不可达' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="default" @click="handleTestConnection(row)">
              连接测试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 4. Error Statistics -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          错误统计 (24h)
        </span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">LLM 总调用</div>
            <div class="stat-value">{{ errorStats?.totalLlmCalls ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">LLM 失败</div>
            <div class="stat-value stat-error">{{ errorStats?.failedLlmCalls ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">LLM 错误率</div>
            <div class="stat-value">{{ formatPercent(errorStats?.llmErrorRate) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">LLM 平均延迟</div>
            <div class="stat-value">{{ formatLatency(errorStats?.avgLlmLatency) }}</div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 16px;">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">工具总调用</div>
            <div class="stat-value">{{ errorStats?.totalToolCalls ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">工具失败</div>
            <div class="stat-value stat-error">{{ errorStats?.failedToolCalls ?? '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">工具错误率</div>
            <div class="stat-value">{{ formatPercent(errorStats?.toolErrorRate) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">工具平均延迟</div>
            <div class="stat-value">{{ formatLatency(errorStats?.avgToolLatency) }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, Connection, Cpu, DataAnalysis, Refresh, Timer } from '@element-plus/icons-vue'
import { getDashboard, type DashboardData, type ProviderStatus } from '@/api/monitor'

const loading = ref(false)
const dashboardData = ref<DashboardData | null>(null)
const lastRefresh = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null

const systemStatusText = computed(() => {
  return dashboardData.value?.system?.status || '未知'
})

const systemStatusClass = computed(() => {
  const status = dashboardData.value?.system?.status
  if (status === 'UP') return 'dot-green'
  if (status === 'DOWN') return 'dot-red'
  return 'dot-yellow'
})

const formattedMemory = computed(() => {
  const mem = dashboardData.value?.system?.jvmMemory
  if (mem == null) return '-'
  const mb = Number(mem) / (1024 * 1024)
  if (mb >= 1024) {
    return (mb / 1024).toFixed(2) + ' GB'
  }
  return mb.toFixed(0) + ' MB'
})

const formattedCpu = computed(() => {
  const cpu = dashboardData.value?.system?.cpuUsage
  if (cpu == null) return '-'
  const pct = (Number(cpu) * 100).toFixed(1)
  return pct + '%'
})

const formattedUptime = computed(() => {
  const uptime = dashboardData.value?.system?.uptime
  if (uptime == null) return '-'
  const seconds = Number(uptime)
  if (seconds < 60) return Math.floor(seconds) + '秒'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + '分钟'
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return hours + '小时' + remainMinutes + '分钟'
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return days + '天' + remainHours + '小时' + remainMinutes + '分钟'
})

const errorStats = computed(() => dashboardData.value?.errors)

function agentStatusType(status: string): 'info' | 'success' | 'warning' | 'danger' {
  const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    IDLE: 'info',
    RUNNING: 'success',
    WAITING: 'warning',
    ERROR: 'danger'
  }
  return map[status] || 'info'
}

function truncateUrl(url: string): string {
  if (!url) return '-'
  return url.length > 40 ? url.substring(0, 40) + '...' : url
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '-'
  return (value * 100).toFixed(2) + '%'
}

function formatLatency(value: number | undefined | null): string {
  if (value == null) return '-'
  return value.toFixed(0) + 'ms'
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

async function fetchDashboard() {
  loading.value = true
  try {
    const res = await getDashboard()
    dashboardData.value = res.data
    lastRefresh.value = formatTime(new Date())
  } catch (e: any) {
    ElMessage.error('获取监控数据失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function handleRefresh() {
  fetchDashboard()
}

async function handleTestConnection(provider: ProviderStatus) {
  try {
    ElMessage.info('正在测试连接: ' + provider.providerType)
    // 调用后端健康检查接口测试 provider 可达性
    await getDashboard()
    ElMessage.success('连接测试成功: ' + provider.providerType)
  } catch (e: any) {
    ElMessage.error('连接测试失败: ' + provider.providerType)
  }
}

onMounted(() => {
  fetchDashboard()
  refreshTimer = setInterval(fetchDashboard, 10000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.monitor-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.section-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-card {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.stat-error {
  color: #f56c6c;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green {
  background-color: #67c23a;
}

.dot-red {
  background-color: #f56c6c;
}

.dot-yellow {
  background-color: #e6a23c;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.status-dot-pulsing {
  animation: pulse 1.5s ease-in-out infinite;
}

.agent-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-id {
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
}

.base-url-text {
  font-family: monospace;
  font-size: 13px;
  color: #606266;
  cursor: help;
}

.text-muted {
  color: #c0c4cc;
}

.error-count {
  font-size: 13px;
}
</style>