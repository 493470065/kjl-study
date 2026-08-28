<template>
  <div class="compute-view">
    <h2>本地算力</h2>

    <el-tabs v-model="activeTab">
      <!-- Tab 1: 计算节点 -->
      <el-tab-pane label="计算节点" name="nodes">
        <!-- Stats Cards -->
        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.totalNodes }}</div>
              <div class="stat-label">总节点数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #67c23a;">{{ stats.onlineNodes }}</div>
              <div class="stat-label">在线节点</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" :style="{ color: stats.successRate >= 80 ? '#67c23a' : '#e6a23c' }">{{ stats.successRate }}%</div>
              <div class="stat-label">成功率</div>
            </el-card>
          </el-col>
        </el-row>

        <div style="margin-bottom: 12px; display: flex; gap: 8px;">
          <el-button type="primary" @click="showConnectionGuide">
            <el-icon style="margin-right: 4px;"><Connection /></el-icon>连接指引
          </el-button>
          <el-button @click="loadNodes">
            <el-icon style="margin-right: 4px;"><Refresh /></el-icon>刷新
          </el-button>
        </div>

        <el-table :data="nodes" v-loading="loadingNodes" border stripe @row-click="openNodeDrawer">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="nodeId" label="节点 ID" min-width="180" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="nodeStatusTagType(row.status)" size="small">
                <span class="status-dot" :style="{ background: nodeStatusColor(row.status) }"></span>
                {{ nodeStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ipAddress" label="IP 地址" width="140" />
          <el-table-column prop="osInfo" label="操作系统" min-width="120" show-overflow-tooltip />
          <el-table-column prop="capabilities" label="能力" min-width="160">
            <template #default="{ row }">
              <el-tag
                v-for="cap in (row.capabilities || '').split(',').filter(Boolean)"
                :key="cap"
                size="small"
                style="margin-right: 4px; margin-bottom: 2px;"
              >{{ cap }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="90" />
          <el-table-column prop="lastHeartbeat" label="最后心跳" width="170">
            <template #default="{ row }">{{ formatTime(row.lastHeartbeat) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click.stop="handleDeleteNode(row)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 节点详情 Drawer -->
        <el-drawer
          v-model="nodeDrawerVisible"
          title="节点详情"
          size="500px"
        >
          <template v-if="selectedNode">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="名称">{{ selectedNode.name }}</el-descriptions-item>
              <el-descriptions-item label="节点 ID">{{ selectedNode.nodeId }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="nodeStatusTagType(selectedNode.status)" size="small">{{ nodeStatusLabel(selectedNode.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="IP 地址">{{ selectedNode.ipAddress }}</el-descriptions-item>
              <el-descriptions-item label="操作系统">{{ selectedNode.osInfo }}</el-descriptions-item>
              <el-descriptions-item label="能力">
                <el-tag
                  v-for="cap in (selectedNode.capabilities || '').split(',').filter(Boolean)"
                  :key="cap"
                  size="small"
                  style="margin-right: 4px;"
                >{{ cap }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="版本">{{ selectedNode.version }}</el-descriptions-item>
              <el-descriptions-item label="所属用户">{{ selectedNode.username }}</el-descriptions-item>
              <el-descriptions-item label="最后心跳">{{ formatTime(selectedNode.lastHeartbeat) }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatTime(selectedNode.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatTime(selectedNode.updatedAt) }}</el-descriptions-item>
            </el-descriptions>

            <h4 style="margin: 16px 0 8px;">任务历史</h4>
            <el-table :data="nodeTasks" v-loading="loadingNodeTasks" border stripe max-height="300">
              <el-table-column prop="taskId" label="任务 ID" min-width="140" />
              <el-table-column prop="taskType" label="类型" width="100" />
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row: t }">
                  <el-tag :type="taskStatusTagType(t.status)" size="small">{{ taskStatusLabel(t.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startedAt" label="开始时间" width="160">
                <template #default="{ row: t }">{{ formatTime(t.startedAt) }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-drawer>
      </el-tab-pane>

      <!-- Tab 2: 任务列表 -->
      <el-tab-pane label="任务列表" name="tasks">
        <el-table :data="tasks" v-loading="loadingTasks" border stripe max-height="500" @row-click="openTaskDrawer">
          <el-table-column prop="taskId" label="任务 ID" min-width="160" show-overflow-tooltip />
          <el-table-column prop="nodeId" label="节点 ID" min-width="160" show-overflow-tooltip />
          <el-table-column prop="taskType" label="任务类型" width="120" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="taskStatusTagType(row.status)" size="small">
                {{ taskStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startedAt" label="开始时间" width="170">
            <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
          </el-table-column>
          <el-table-column label="耗时" width="100" align="center">
            <template #default="{ row }">{{ formatDuration(row.startedAt, row.completedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="openTaskDrawer(row)">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="display: flex; justify-content: center; margin-top: 16px;">
          <el-pagination
            v-if="taskTotal > 0"
            v-model:current-page="taskPage"
            v-model:page-size="taskPageSize"
            :total="taskTotal"
            layout="total, prev, pager, next"
            @current-change="loadTasks"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 任务详情 Drawer -->
    <el-drawer
      v-model="taskDrawerVisible"
      title="任务详情"
      size="500px"
    >
      <template v-if="selectedTask">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="任务 ID">{{ selectedTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="节点 ID">{{ selectedTask.nodeId }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ selectedTask.taskType }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="taskStatusTagType(selectedTask.status)" size="small">{{ taskStatusLabel(selectedTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatTime(selectedTask.startedAt) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatTime(selectedTask.completedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">参数</h4>
          <pre class="payload">{{ formatJson(selectedTask.params) }}</pre>
        </div>
        <div v-if="selectedTask.result" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">结果</h4>
          <pre class="payload">{{ formatJson(selectedTask.result) }}</pre>
        </div>
        <div v-if="selectedTask.errorMessage" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">错误信息</h4>
          <pre class="payload" style="color: #f56c6c;">{{ selectedTask.errorMessage }}</pre>
        </div>
      </template>
    </el-drawer>

    <!-- 连接指引 Dialog -->
    <el-dialog
      v-model="guideDialogVisible"
      title="本地 Agent 连接指引"
      width="640px"
      :close-on-click-modal="false"
    >
      <div class="guide-content">
        <h3>本地 Agent 连接指引</h3>

        <ol>
          <li>
            <strong>确保本地机器已安装 Java 17+ 或 Node.js 18+</strong>
          </li>
          <li>
            <strong>下载 Agent 客户端脚本</strong>
          </li>
          <li>
            <strong>运行连接命令：</strong>
            <div style="margin: 8px 0;">
              <p style="margin-bottom: 4px; color: #909399;">使用 Java 客户端（推荐）</p>
              <pre class="code-block">java -jar agent-client.jar --server=ws://localhost:8090 --token=YOUR_JWT_TOKEN</pre>
            </div>
            <div style="margin: 8px 0;">
              <p style="margin-bottom: 4px; color: #909399;">或使用 Node.js 客户端</p>
              <pre class="code-block">npx winning-agent --server=ws://localhost:8090 --token=YOUR_JWT_TOKEN</pre>
            </div>
          </li>
          <li>
            <strong>连接成功后，平台即可向您的机器分发任务</strong>
          </li>
        </ol>
      </div>
      <template #footer>
        <el-button type="primary" @click="guideDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Delete, Refresh, View } from '@element-plus/icons-vue'
import {
  getNodes,
  deleteNode,
  getTasks,
  getNodeTasks,
  getStats,
  type LocalComputeNode,
  type LocalComputeTask,
  type ComputeStats
} from '@/api/compute'

const activeTab = ref('nodes')

// ========== Stats ==========
const stats = ref<ComputeStats>({
  totalNodes: 0,
  onlineNodes: 0,
  totalTasks: 0,
  successRate: 0
})

async function loadStats() {
  try {
    const res = await getStats()
    stats.value = res.data || stats.value
  } catch {
    // ignore
  }
}

// ========== Tab 1: Nodes ==========
const nodes = ref<LocalComputeNode[]>([])
const loadingNodes = ref(false)
const nodeDrawerVisible = ref(false)
const selectedNode = ref<LocalComputeNode | null>(null)
const nodeTasks = ref<LocalComputeTask[]>([])
const loadingNodeTasks = ref(false)

function nodeStatusTagType(status: string): string {
  switch (status) {
    case 'ONLINE': return 'success'
    case 'OFFLINE': return 'info'
    case 'BUSY': return 'warning'
    case 'ERROR': return 'danger'
    default: return 'info'
  }
}

function nodeStatusColor(status: string): string {
  switch (status) {
    case 'ONLINE': return '#67c23a'
    case 'OFFLINE': return '#909399'
    case 'BUSY': return '#e6a23c'
    case 'ERROR': return '#f56c6c'
    default: return '#909399'
  }
}

function nodeStatusLabel(status: string): string {
  switch (status) {
    case 'ONLINE': return '在线'
    case 'OFFLINE': return '离线'
    case 'BUSY': return '忙碌'
    case 'ERROR': return '异常'
    default: return status
  }
}

async function loadNodes() {
  loadingNodes.value = true
  try {
    const res = await getNodes()
    nodes.value = res.data || []
  } catch {
    ElMessage.error('加载节点失败')
  } finally {
    loadingNodes.value = false
  }
}

async function openNodeDrawer(row: LocalComputeNode) {
  selectedNode.value = row
  nodeDrawerVisible.value = true
  loadingNodeTasks.value = true
  try {
    const res = await getNodeTasks(row.nodeId)
    nodeTasks.value = res.data || []
  } catch {
    nodeTasks.value = []
  } finally {
    loadingNodeTasks.value = false
  }
}

async function handleDeleteNode(row: LocalComputeNode) {
  try {
    await ElMessageBox.confirm(`确定删除节点 "${row.name}"（${row.nodeId}）？`, '确认', { type: 'warning' })
    await deleteNode(row.nodeId)
    ElMessage.success('删除成功')
    await loadNodes()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败: ' + (e?.response?.data?.error || e.message))
  }
}

// ========== Connection Guide ==========
const guideDialogVisible = ref(false)

function showConnectionGuide() {
  guideDialogVisible.value = true
}

// ========== Tab 2: Tasks ==========
const tasks = ref<LocalComputeTask[]>([])
const loadingTasks = ref(false)
const taskPage = ref(1)
const taskPageSize = ref(20)
const taskTotal = ref(0)
const taskDrawerVisible = ref(false)
const selectedTask = ref<LocalComputeTask | null>(null)

function taskStatusTagType(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'success'
    case 'FAILED': return 'danger'
    case 'RUNNING': return 'primary'
    case 'PENDING': return 'info'
    case 'TIMEOUT': return 'warning'
    default: return 'info'
  }
}

function taskStatusLabel(status: string): string {
  switch (status) {
    case 'SUCCESS': return '成功'
    case 'FAILED': return '失败'
    case 'RUNNING': return '运行中'
    case 'PENDING': return '等待中'
    case 'TIMEOUT': return '超时'
    default: return status
  }
}

function formatTime(s?: string) {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

function formatDuration(start?: string, end?: string) {
  if (!start) return ''
  if (!end) return '进行中'
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const diff = Math.floor((e - s) / 1000)
  if (diff < 60) return diff + '秒'
  if (diff < 3600) return Math.floor(diff / 60) + '分' + (diff % 60) + '秒'
  return Math.floor(diff / 3600) + '时' + Math.floor((diff % 3600) / 60) + '分'
}

function formatJson(s?: string) {
  if (!s) return ''
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

function openTaskDrawer(row: LocalComputeTask) {
  selectedTask.value = row
  taskDrawerVisible.value = true
}

async function loadTasks() {
  loadingTasks.value = true
  try {
    const res = await getTasks(taskPage.value - 1, taskPageSize.value)
    tasks.value = res.data?.content || res.data || []
    taskTotal.value = res.data?.totalElements || res.data?.total || 0
  } catch {
    ElMessage.error('加载任务列表失败')
  } finally {
    loadingTasks.value = false
  }
}

// ========== Lifecycle ==========
watch(activeTab, (tab) => {
  if (tab === 'nodes') {
    loadNodes()
    loadStats()
  } else if (tab === 'tasks') {
    loadTasks()
  }
})

onMounted(() => {
  loadNodes()
  loadStats()
})
</script>

<style scoped>
.compute-view { padding: 0; }

.stat-card {
  text-align: center;
  cursor: default;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.guide-content {
  font-size: 14px;
  line-height: 1.8;
}

.guide-content ol {
  padding-left: 20px;
}

.guide-content li {
  margin-bottom: 16px;
}

.code-block {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
}

.payload {
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