<template>
  <page-container title="沙箱管理" no-card>
    <template #actions>
      <el-button prefix-icon="Refresh" @click="loadData">刷新</el-button>
      <el-button type="primary" prefix-icon="Plus" @click="openCreateDialog">创建沙箱</el-button>
    </template>

    <!-- 概览 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">
            <el-switch
              :model-value="sandboxStatus.enabled"
              :loading="toggleLoading"
              size="large"
              inline-prompt
              active-text="已启用"
              inactive-text="已停用"
              aria-label="沙箱功能总开关"
              @change="handleToggleEnabled"
            />
          </div>
          <div class="stat-label">启用状态<span class="stat-sub">{{ enabledSourceLabel }}</span></div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ engineLabel }}</div>
          <div class="stat-label">执行引擎</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ activeCount }}</div>
          <div class="stat-label">活跃沙箱</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">
            <el-switch
              :model-value="sandboxStatus.dockerEnabled"
              :loading="dockerToggleLoading"
              size="large"
              inline-prompt
              active-text="已配置"
              inactive-text="未配置"
              aria-label="Docker 引擎开关"
              @change="handleToggleDocker"
            />
          </div>
          <div class="stat-label">Docker 引擎<span class="stat-sub">{{ dockerStateLabel }}</span></div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="!sandboxStatus.enabled"
      type="warning"
      :closable="false"
      class="disabled-alert"
      title="沙箱功能未启用"
      description="可点击上方「启用状态」开关直接开启（即时生效）；也可在 backend/src/main/resources/application.yml 设置 racc.sandbox.enabled: true 作为默认值。"
    />

    <!-- 沙箱列表 -->
    <el-card v-if="sandboxStatus.enabled">
      <el-table :data="sandboxes" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="90" sortable />
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="模式" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.mode === 'DOCKER' ? 'primary' : 'info'">
              {{ modeLabel(row.mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timeoutSeconds" label="超时秒" width="90" />
        <el-table-column prop="createdBy" label="创建人" width="110" show-overflow-tooltip />
        <el-table-column label="创建时间" width="170" sortable :sort-method="(a: SandboxInfo, b: SandboxInfo) => (a.createdAt || '').localeCompare(b.createdAt || '')">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="row.status === 'DESTROYED'" @click="openExecDialog(row)">执行命令</el-button>
            <el-button link type="primary" size="small" @click="openDrawer(row)">详情</el-button>
            <el-button v-if="row.status !== 'DESTROYED'" link type="danger" size="small" @click="handleDestroy(row)">销毁</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && sandboxes.length === 0" description="暂无沙箱，点击右上角「创建沙箱」开始" />
    </el-card>

    <!-- 配置说明 -->
    <el-card class="config-card">
      <template #header>
        <span>配置说明</span>
      </template>
      <div class="config-info">
        <p><strong>当前引擎：</strong>{{ engineLabel }}<span class="config-hint">{{ engineHint }}</span></p>
        <p><strong>默认超时：</strong>{{ sandboxStatus.defaults?.timeoutSeconds ?? '-' }} 秒
          <strong class="config-gap">输出上限：</strong>{{ sandboxStatus.defaults?.maxOutputChars ?? '-' }} 字符
          <strong class="config-gap">工作根目录：</strong><code class="mono">{{ sandboxStatus.defaults?.dir || '-' }}</code></p>

        <template v-if="sandboxStatus.engine === 'LOCAL' || !sandboxStatus.dockerEnabled">
          <p><strong>本地进程沙箱（LOCAL）：</strong>每条命令在沙箱专属工作目录内以本地子进程执行，
            独立工作目录 + 超时强杀 + 输出全程留痕；与后端同权限运行，无权限/网络硬隔离。</p>
        </template>

        <template v-if="sandboxStatus.dockerEnabled">
          <p><strong>Docker 容器沙箱（DOCKER）：</strong>基础镜像 <code class="mono">{{ sandboxStatus.defaults?.docker?.image }}</code>
            <span v-if="!sandboxStatus.dockerAvailable" class="config-hint">（当前不可用，创建时将自动降级为本地进程沙箱）</span></p>
          <ul>
            <li>资源限制：内存 {{ sandboxStatus.defaults?.docker?.memory }} / CPU {{ sandboxStatus.defaults?.docker?.cpus }} 核</li>
            <li>只读根文件系统，仅工作目录可写</li>
            <li>容器内禁止外网访问（--network none）</li>
          </ul>
          <p class="build-hint">构建镜像：docker build -f Dockerfile.sandbox -t {{ sandboxStatus.defaults?.docker?.image }} .</p>
        </template>
      </div>
    </el-card>

    <!-- 创建对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建沙箱" width="520px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item label="沙箱名称" prop="name">
          <el-input v-model="createForm.name" maxlength="64" placeholder="例如：病历需求验证" />
        </el-form-item>
        <el-form-item label="关联任务类型" prop="taskId">
          <el-select
            v-model="createForm.taskId"
            filterable
            clearable
            :loading="taskTypesLoading"
            placeholder="可选，关联一个自动化任务类型"
            no-data-text="暂无启用的任务类型"
            style="width: 100%"
          >
            <el-option
              v-for="t in taskTypes"
              :key="t.id"
              :label="taskTypeOptionLabel(t)"
              :value="t.code"
            >
              <span>{{ t.icon ? t.icon + ' ' : '' }}{{ t.name }}</span>
              <span class="option-code">{{ t.code }}</span>
            </el-option>
          </el-select>
          <div class="form-hint">任务类型来自自动化管理（{{ taskTypes.length }} 个）；不关联也可直接创建</div>
        </el-form-item>
        <el-form-item label="运行模式" prop="mode">
          <el-radio-group v-model="createForm.mode">
            <el-radio value="LOCAL">本地进程</el-radio>
            <el-radio value="DOCKER" :disabled="!sandboxStatus.dockerAvailable">Docker 容器</el-radio>
          </el-radio-group>
          <div class="form-hint">Docker 不可用时将自动降级为本地进程沙箱</div>
        </el-form-item>
        <el-form-item label="超时秒数" prop="timeoutSeconds">
          <el-input-number v-model="createForm.timeoutSeconds" :min="1" :max="86400" />
          <span class="form-hint-inline">单条命令的执行时限</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 执行命令对话框 -->
    <el-dialog v-model="execDialogVisible" :title="`执行命令 — ${execTarget?.name ?? ''}`" width="560px" :close-on-click-modal="false">
      <el-form ref="execFormRef" :model="execForm" :rules="execRules" label-width="90px">
        <el-form-item label="命令" prop="command">
          <el-input v-model="execForm.command" type="textarea" :rows="4" placeholder="例如：dir /b 或 echo 你好" />
        </el-form-item>
        <el-form-item label="超时秒数" prop="timeoutSeconds">
          <el-input-number v-model="execForm.timeoutSeconds" :min="1" :max="86400" />
          <span class="form-hint-inline">留空则使用沙箱默认值</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="execDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="execSubmitting" @click="submitExec">执行</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`沙箱详情 — ${selectedSandbox?.name ?? ''}`" size="500px">
      <template v-if="selectedSandbox">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="ID">{{ selectedSandbox.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ selectedSandbox.name }}</el-descriptions-item>
          <el-descriptions-item label="模式">{{ modeLabel(selectedSandbox.mode) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(selectedSandbox.status)" size="small">{{ statusLabel(selectedSandbox.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工作目录">
            <span class="mono workdir-text">{{ selectedSandbox.workdir || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="超时秒数">{{ selectedSandbox.timeoutSeconds ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联任务类型">{{ selectedSandbox.taskId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedSandbox.createdBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(selectedSandbox.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(selectedSandbox.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">执行历史</h4>
        <el-table :data="executions" stripe size="small" max-height="300" v-loading="executionsLoading">
          <el-table-column prop="seqNo" label="#" width="55" />
          <el-table-column label="命令" min-width="140">
            <template #default="{ row }">
              <el-tooltip :content="row.commandPreview" placement="top">
                <span class="mono truncate-text">{{ row.commandPreview }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="85">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="退出码" width="70">
            <template #default="{ row }">{{ row.exitCode ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="耗时" width="90">
            <template #default="{ row }">{{ formatDuration(row.durationMs) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="65" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openOutputDialog(row)">输出</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!executionsLoading && executions.length === 0" description="暂无执行记录" :image-size="60" />
      </template>
    </el-drawer>

    <!-- 输出对话框 -->
    <el-dialog v-model="outputDialogVisible" :title="`执行输出 — 第 ${selectedExecution?.seqNo ?? '-'} 次`" width="60%">
      <div v-if="selectedExecution" class="output-meta">
        <el-tag :type="statusType(selectedExecution.status)" size="small">{{ statusLabel(selectedExecution.status) }}</el-tag>
        <span>退出码：{{ selectedExecution.exitCode ?? '-' }}</span>
        <span>耗时：{{ formatDuration(selectedExecution.durationMs) }}</span>
        <span>开始：{{ formatDateTime(selectedExecution.startedAt) }}</span>
      </div>
      <pre class="output-pre">{{ selectedExecution?.output?.trim() ? selectedExecution.output : '（无输出）' }}</pre>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useStatusTag } from '@/composables/useStatusTag'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import { formatDateTime, formatDuration } from '@/utils/format'
import { sandboxApi, type SandboxInfo, type SandboxStatus, type SandboxExecution } from '@/api/sandbox'
import { taskTypeApi, type AutomateTaskType } from '@/api/automate'

const { statusType, statusLabel } = useStatusTag()
const { confirmDelete } = useConfirmDelete()

// ========== 状态与列表 ==========
const sandboxStatus = ref<SandboxStatus>({ enabled: false })
const sandboxes = ref<SandboxInfo[]>([])
const loading = ref(false)

const activeCount = computed(() => sandboxes.value.filter(s => s.status === 'RUNNING').length)
const enabledSourceLabel = computed(() =>
  sandboxStatus.value.enabledSource === 'system_configs' ? '（运行时配置）' : '（application.yml）')
const engineLabel = computed(() =>
  sandboxStatus.value.engine === 'DOCKER' ? 'Docker 容器' : '本地进程')
const engineHint = computed(() =>
  sandboxStatus.value.engine === 'DOCKER'
    ? '（Docker 可用，默认容器隔离）'
    : '（本地进程执行，开箱即用）')
const dockerStateLabel = computed(() => {
  if (!sandboxStatus.value.dockerEnabled) return '（未启用）'
  return sandboxStatus.value.dockerAvailable ? '（可用）' : '（本机不可用）'
})

function modeLabel(mode?: string): string {
  if (mode === 'DOCKER') return '容器隔离'
  if (mode === 'LOCAL') return '本地进程'
  return mode || '-'
}

async function loadData() {
  loading.value = true
  try {
    const [status, list] = await Promise.all([sandboxApi.getStatus(), sandboxApi.list()])
    sandboxStatus.value = status
    sandboxes.value = list
  } catch {
    // 接口错误已由统一错误出口提示
  } finally {
    loading.value = false
  }
}

// ========== 运行时开关 ==========
const toggleLoading = ref(false)
const dockerToggleLoading = ref(false)

/** 切换启用状态：乐观更新，失败回滚（ScheduledTaskView 同款模式） */
async function handleToggleEnabled(value: string | number | boolean) {
  const target = value === true
  const prev = sandboxStatus.value.enabled
  sandboxStatus.value = { ...sandboxStatus.value, enabled: target }
  toggleLoading.value = true
  try {
    await sandboxApi.updateConfig({ enabled: target })
    ElMessage.success(target ? '沙箱已启用' : '沙箱已停用')
    await loadData()
  } catch {
    sandboxStatus.value = { ...sandboxStatus.value, enabled: prev }
    // 接口错误已由统一错误出口提示
  } finally {
    toggleLoading.value = false
  }
}

/** 切换 Docker 引擎开关：乐观更新，失败回滚；开启后状态接口会实时探测本机 Docker 可用性 */
async function handleToggleDocker(value: string | number | boolean) {
  const target = value === true
  const prev = sandboxStatus.value.dockerEnabled
  sandboxStatus.value = { ...sandboxStatus.value, dockerEnabled: target }
  dockerToggleLoading.value = true
  try {
    await sandboxApi.updateConfig({ dockerEnabled: target })
    ElMessage.success(target ? 'Docker 引擎已启用' : 'Docker 引擎已停用')
    await loadData()
  } catch {
    sandboxStatus.value = { ...sandboxStatus.value, dockerEnabled: prev }
    // 接口错误已由统一错误出口提示
  } finally {
    dockerToggleLoading.value = false
  }
}

// ========== 创建 ==========
const createDialogVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = ref({ name: '', taskId: '', mode: 'LOCAL', timeoutSeconds: 600 })
const createRules: FormRules = {
  name: [
    { required: true, message: '请输入沙箱名称', trigger: 'blur' },
    { min: 1, max: 64, message: '长度应为 1 到 64 个字符', trigger: 'blur' }
  ]
}

/** 关联任务类型下拉数据（自动化管理的任务类型，仅启用项） */
const taskTypes = ref<AutomateTaskType[]>([])
const taskTypesLoading = ref(false)

function taskTypeOptionLabel(t: AutomateTaskType): string {
  return `${t.icon ? t.icon + ' ' : ''}${t.name}（${t.code}）`
}

async function loadTaskTypes() {
  taskTypesLoading.value = true
  try {
    taskTypes.value = await taskTypeApi.list(true)
  } catch {
    // 接口错误已由统一错误出口提示
  } finally {
    taskTypesLoading.value = false
  }
}

function openCreateDialog() {
  createForm.value = { name: '', taskId: '', mode: 'LOCAL', timeoutSeconds: sandboxStatus.value.defaults?.timeoutSeconds ?? 600 }
  createDialogVisible.value = true
  loadTaskTypes()
}

async function submitCreate() {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }
  createSubmitting.value = true
  try {
    await sandboxApi.create({
      name: createForm.value.name,
      taskId: createForm.value.taskId || undefined,
      mode: createForm.value.mode,
      timeoutSeconds: createForm.value.timeoutSeconds
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    await loadData()
  } catch {
    // 接口错误已由统一错误出口提示
  } finally {
    createSubmitting.value = false
  }
}

// ========== 执行命令 ==========
const execDialogVisible = ref(false)
const execSubmitting = ref(false)
const execTarget = ref<SandboxInfo | null>(null)
const execFormRef = ref<FormInstance>()
const execForm = ref<{ command: string; timeoutSeconds: number | undefined }>({ command: '', timeoutSeconds: undefined })
const execRules: FormRules = {
  command: [{ required: true, message: '请输入要执行的命令', trigger: 'blur' }]
}

function openExecDialog(row: SandboxInfo) {
  execTarget.value = row
  execForm.value = { command: '', timeoutSeconds: undefined }
  execDialogVisible.value = true
}

async function submitExec() {
  try {
    await execFormRef.value?.validate()
  } catch {
    return
  }
  if (!execTarget.value?.id) return
  execSubmitting.value = true
  try {
    await sandboxApi.exec(execTarget.value.id, execForm.value.command, execForm.value.timeoutSeconds)
    ElMessage.success('已提交执行')
    execDialogVisible.value = false
    await loadData()
    await openDrawer(execTarget.value)
  } catch {
    // 接口错误已由统一错误出口提示
  } finally {
    execSubmitting.value = false
  }
}

// ========== 详情抽屉与执行历史轮询 ==========
const drawerVisible = ref(false)
const selectedSandbox = ref<SandboxInfo | null>(null)
const executions = ref<SandboxExecution[]>([])
const executionsLoading = ref(false)
let execTimer: ReturnType<typeof setInterval> | null = null

async function openDrawer(row: SandboxInfo) {
  selectedSandbox.value = row
  drawerVisible.value = true
  await loadExecutions(row.id!)
  startExecPolling()
}

async function loadExecutions(sandboxId: number) {
  executionsLoading.value = true
  try {
    executions.value = await sandboxApi.listExecutions(sandboxId)
  } catch {
    // 接口错误已由统一错误出口提示
  } finally {
    executionsLoading.value = false
  }
}

function startExecPolling() {
  stopExecPolling()
  execTimer = setInterval(async () => {
    if (!drawerVisible.value || !selectedSandbox.value?.id) {
      stopExecPolling()
      return
    }
    // 无运行中执行时跳过请求，避免无效轮询
    if (!executions.value.some(e => e.status === 'RUNNING')) return
    try {
      const next = await sandboxApi.listExecutions(selectedSandbox.value.id)
      if (JSON.stringify(next) !== JSON.stringify(executions.value)) {
        executions.value = next
      }
      // 输出对话框正展示一条运行中的执行时同步刷新
      if (outputDialogVisible.value && selectedExecution.value?.status === 'RUNNING' && selectedExecution.value.id) {
        selectedExecution.value = await sandboxApi.getExecution(selectedExecution.value.id)
      }
    } catch {
      // 轮询错误静默（请求已带 silent 标记）
    }
  }, 5000)
}

function stopExecPolling() {
  if (execTimer) {
    clearInterval(execTimer)
    execTimer = null
  }
}

watch(drawerVisible, v => {
  if (!v) stopExecPolling()
})

// ========== 输出查看 ==========
const outputDialogVisible = ref(false)
const selectedExecution = ref<SandboxExecution | null>(null)

async function openOutputDialog(row: SandboxExecution) {
  selectedExecution.value = row
  outputDialogVisible.value = true
  try {
    selectedExecution.value = await sandboxApi.getExecution(row.id)
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

// ========== 销毁 ==========
async function handleDestroy(row: SandboxInfo) {
  if (!await confirmDelete(`沙箱 "${row.name}"（工作目录内文件将一并删除）`, '销毁确认')) return
  try {
    await sandboxApi.destroySandbox(row.id!)
    ElMessage.success('沙箱已销毁')
    if (selectedSandbox.value?.id === row.id) {
      drawerVisible.value = false
    }
    await loadData()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

// ========== 生命周期 ==========
onMounted(loadData)
onUnmounted(() => {
  stopExecPolling()
})
</script>

<style scoped>
.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ink-text-secondary);
}

.stat-sub {
  margin-left: 4px;
  font-size: 11px;
}

.disabled-alert {
  margin-bottom: 16px;
}

.config-card {
  margin-top: 16px;
}

.config-info {
  font-size: 14px;
  line-height: 1.8;
}

.config-info p {
  margin: 8px 0;
}

.config-info ul {
  margin: 4px 0 8px 20px;
}

.config-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.config-gap {
  margin-left: 24px;
}

.mono {
  font-family: var(--app-font-mono);
  font-size: 12px;
}

.build-hint {
  font-family: var(--app-font-mono);
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.form-hint {
  font-size: 12px;
  color: var(--ink-text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}

.option-code {
  float: right;
  margin-left: 12px;
  font-family: var(--app-font-mono);
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.form-hint-inline {
  margin-left: 8px;
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.section-title {
  margin: 16px 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.workdir-text {
  word-break: break-all;
}

.truncate-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.output-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ink-text-secondary);
}

.output-pre {
  font-family: var(--app-font-mono);
  font-size: 12px;
  line-height: 1.6;
  background: var(--el-fill-color);
  border-radius: 4px;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
