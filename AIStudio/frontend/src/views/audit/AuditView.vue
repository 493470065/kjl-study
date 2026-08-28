<template>
  <div class="audit-view">
    <h2>审计日志</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Token 概览" name="summary">
        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <span>筛选用户：</span>
          <el-select v-model="selectedUser" placeholder="全部用户" clearable style="width: 200px;" @change="loadSummary" :disabled="!isAdmin">
            <el-option v-for="u in userList" :key="u.username" :label="u.displayName + ' (' + u.username + ')'" :value="u.username" />
          </el-select>
        </div>
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-label">今日 Token</div>
              <div class="stat-value">{{ formatNum(summary?.today?.totalTokens) }}</div>
              <div class="stat-sub">{{ summary?.today?.callCount }} 次调用</div>
              <div class="stat-providers" v-if="summary?.today?.byUser?.length">
                <div v-for="p in summary.today.byUser" :key="p.username" class="provider-line">
                  {{ p.username }}: {{ formatNum(p.totalTokens) }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-label">本周 Token</div>
              <div class="stat-value">{{ formatNum(summary?.thisWeek?.totalTokens) }}</div>
              <div class="stat-sub">{{ summary?.thisWeek?.callCount }} 次调用</div>
              <div class="stat-providers" v-if="summary?.thisWeek?.byUser?.length">
                <div v-for="p in summary.thisWeek.byUser" :key="p.username" class="provider-line">
                  {{ p.username }}: {{ formatNum(p.totalTokens) }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-label">本月 Token</div>
              <div class="stat-value">{{ formatNum(summary?.thisMonth?.totalTokens) }}</div>
              <div class="stat-sub">{{ summary?.thisMonth?.callCount }} 次调用</div>
              <div class="stat-providers" v-if="summary?.thisMonth?.byUser?.length">
                <div v-for="p in summary.thisMonth.byUser" :key="p.username" class="provider-line">
                  {{ p.username }}: {{ formatNum(p.totalTokens) }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-label">累计调用</div>
              <div class="stat-value">{{ summary?.totalCalls || 0 }}</div>
              <div class="stat-sub">工具调用 {{ summary?.totalToolCalls || 0 }} 次</div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Per-User Token Breakdown - Today -->
        <el-card v-if="summary?.today?.byUser?.length" style="margin-bottom: 16px;">
          <template #header>今日用户 Token 用量</template>
          <el-table :data="summary.today.byUser" size="small" stripe>
            <el-table-column prop="username" label="用户" />
            <el-table-column prop="callCount" label="调用次数" width="100" />
            <el-table-column label="Total Tokens" width="140">
              <template #default="{ row }">{{ formatNum(row.totalTokens) }}</template>
            </el-table-column>
            <el-table-column label="Prompt Tokens" width="140">
              <template #default="{ row }">{{ formatNum(row.promptTokens) }}</template>
            </el-table-column>
            <el-table-column label="Completion Tokens" width="150">
              <template #default="{ row }">{{ formatNum(row.completionTokens) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card>
          <template #header>Token 趋势（近 7 天）</template>
          <div class="chart-placeholder" v-if="!tokenStats.length">暂无数据</div>
          <div v-else class="token-chart">
            <div v-for="item in tokenStats" :key="item.date" class="chart-bar-wrap">
              <div class="chart-bar" :style="{ height: barHeight(item.totalTokens) + 'px' }"></div>
              <div class="chart-label">{{ item.date.slice(5) }}</div>
              <div class="chart-count">{{ formatNum(item.totalTokens) }}</div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="工具调用" name="tools">
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
          <span>筛选用户：</span>
          <el-select v-model="selectedUser" placeholder="全部用户" clearable style="width: 200px;" @change="loadTools" :disabled="!isAdmin">
            <el-option v-for="u in userList" :key="u.username" :label="u.displayName + ' (' + u.username + ')'" :value="u.username" />
          </el-select>
        </div>
        <el-table :data="toolInvocations" v-loading="loadingTools" border stripe max-height="500">
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="toolName" label="工具" width="160" />
          <el-table-column prop="username" label="用户" width="100" />
          <el-table-column prop="latencyMs" label="耗时(ms)" width="100" />
          <el-table-column prop="success" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="toolInput" label="输入" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="LLM 调用" name="llm">
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
          <span>筛选用户：</span>
          <el-select v-model="selectedUser" placeholder="全部用户" clearable style="width: 200px;" @change="loadLlm" :disabled="!isAdmin">
            <el-option v-for="u in userList" :key="u.username" :label="u.displayName + ' (' + u.username + ')'" :value="u.username" />
          </el-select>
        </div>
        <el-table :data="llmCalls" v-loading="loadingLlm" border stripe max-height="500">
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="model" label="模型" width="120" />
          <el-table-column prop="username" label="用户" width="100" />
          <el-table-column prop="promptTokens" label="输入 Token" width="100" />
          <el-table-column prop="completionTokens" label="输出 Token" width="100" />
          <el-table-column prop="totalTokens" label="总 Token" width="100" />
          <el-table-column prop="latencyMs" label="耗时(ms)" width="100" />
          <el-table-column prop="success" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="任务执行" name="tasks">
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
          <span>筛选用户：</span>
          <el-select v-model="selectedUser" placeholder="全部用户" clearable style="width: 200px;" @change="loadTasks" :disabled="!isAdmin">
            <el-option v-for="u in userList" :key="u.username" :label="u.displayName + ' (' + u.username + ')'" :value="u.username" />
          </el-select>
        </div>
        <el-table :data="taskExecutions" v-loading="loadingTasks" border stripe max-height="500">
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="taskType" label="类型" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户" width="100" />
          <el-table-column prop="latencyMs" label="耗时(ms)" width="100" />
          <el-table-column prop="projectId" label="项目" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { auditApi, type TokenSummary, type ToolInvocation, type LlmCall, type TaskExecution } from '@/api/audit'
import { userApi, type UserInfo } from '@/api/user'
import { useAuthStore } from '@/stores/auth'

const activeTab = ref('summary')
const summary = ref<TokenSummary | null>(null)
const tokenStats = ref<any[]>([])
const toolInvocations = ref<ToolInvocation[]>([])
const llmCalls = ref<LlmCall[]>([])
const taskExecutions = ref<TaskExecution[]>([])
const loadingTools = ref(false)
const loadingLlm = ref(false)
const loadingTasks = ref(false)
const userList = ref<UserInfo[]>([])
const selectedUser = ref<string>('')
const authStore = useAuthStore()
const isAdmin = ref(authStore.isAdmin)

function formatNum(n?: number) {
  if (n == null) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatTime(s?: string) {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

function barHeight(tokens: number) {
  const max = Math.max(...tokenStats.value.map(i => i.totalTokens), 1)
  return Math.max(4, (tokens / max) * 120)
}

async function loadSummary() {
  try {
    const user = selectedUser.value || undefined
    const [s, stats] = await Promise.all([
      auditApi.getTokenSummary(user),
      auditApi.getTokenStats('week', user)
    ])
    summary.value = s
    tokenStats.value = stats
  } catch {}
}

async function loadUsers() {
  try {
    userList.value = await userApi.listUsers()
  } catch {}
}

async function loadTools() {
  loadingTools.value = true
  try { toolInvocations.value = await auditApi.listToolInvocations(selectedUser.value ? { username: selectedUser.value } : undefined) } catch {} finally { loadingTools.value = false }
}

async function loadLlm() {
  loadingLlm.value = true
  try { llmCalls.value = await auditApi.listLlmCalls(selectedUser.value ? { username: selectedUser.value } : undefined) } catch {} finally { loadingLlm.value = false }
}

async function loadTasks() {
  loadingTasks.value = true
  try { taskExecutions.value = await auditApi.listTaskExecutions(selectedUser.value ? { username: selectedUser.value } : undefined) } catch {} finally { loadingTasks.value = false }
}

watch(activeTab, (tab) => {
  if (tab === 'summary') loadSummary()
  else if (tab === 'tools') loadTools()
  else if (tab === 'llm') loadLlm()
  else if (tab === 'tasks') loadTasks()
})

onMounted(() => {
  if (!isAdmin.value && authStore.user) {
    selectedUser.value = authStore.user.username
  }
  loadSummary()
  loadUsers()
})
</script>

<style scoped>
.audit-view { padding: 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; }
.stat-sub { font-size: 12px; color: #909399; margin-top: 4px; }
.stat-providers { margin-top: 8px; font-size: 12px; color: #909399; }
.provider-line { line-height: 1.6; }
.chart-placeholder { text-align: center; color: #909399; padding: 40px 0; }
.token-chart { display: flex; align-items: flex-end; gap: 12px; height: 160px; padding: 10px 0; }
.chart-bar-wrap { display: flex; flex-direction: column; align-items: center; flex: 1; }
.chart-bar { width: 100%; max-width: 40px; background: linear-gradient(180deg, #409eff, #79bbff); border-radius: 4px 4px 0 0; min-height: 4px; }
.chart-label { font-size: 11px; color: #909399; margin-top: 4px; }
.chart-count { font-size: 11px; color: #606266; }
</style>
