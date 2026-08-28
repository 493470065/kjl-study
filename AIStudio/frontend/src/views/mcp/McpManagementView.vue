<template>
  <page-container title="MCP Server 管理">
    <template #actions>
      <el-button type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon> 上传 MCP Server
      </el-button>
      <el-button @click="showConfigDialog = true">
        <el-icon><Setting /></el-icon> 手动配置
      </el-button>
    </template>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="8" v-for="server in servers" :key="server.id">
        <el-card class="server-card" :class="'status-' + server.status.toLowerCase()">
          <template #header>
            <div class="card-header">
              <span class="server-name">{{ server.displayName || server.name }}</span>
              <el-tag :type="statusTagType(server.status)" size="small">
                {{ statusLabel(server.status) }}
              </el-tag>
            </div>
          </template>

          <div class="server-info">
            <div class="info-row">
              <span class="label">命令:</span>
              <code>{{ server.command }} {{ server.args || '' }}</code>
            </div>
            <div class="info-row">
              <span class="label">工作目录:</span>
              <span class="value">{{ server.workDir }}</span>
            </div>
            <div class="info-row">
              <span class="label">工具数量:</span>
              <el-tag size="small" type="info">{{ server.toolCount }}</el-tag>
            </div>
            <div v-if="server.description" class="info-row">
              <span class="label">描述:</span>
              <span class="value">{{ server.description }}</span>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              v-if="server.status !== 'RUNNING'"
              type="success"
              size="small"
              @click="handleStart(server)"
              :loading="loadingId === server.id"
            >启动</el-button>
            <el-button
              v-if="server.status === 'RUNNING'"
              type="warning"
              size="small"
              @click="handleStop(server)"
              :loading="loadingId === server.id"
            >停止</el-button>
            <el-button
              type="primary"
              size="small"
              @click="openEdit(server)"
            >修改</el-button>
            <el-button
              size="small"
              @click="openDetail(server)"
            >详情</el-button>
            <el-button
              size="small"
              :loading="testingId === server.id"
              @click="handleTest(server)"
            >测试连接</el-button>
            <el-button
              v-if="server.status === 'RUNNING'"
              size="small"
              @click="showTools(server)"
            >查看工具</el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(server)"
            >删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="servers.length === 0" description="暂无 MCP Server，请上传或手动配置" />

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="上传 MCP Server" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="uploadForm.name" placeholder="例如: mcp-tfs-query" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="uploadForm.displayName" placeholder="TFS 需求管理" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="MCP Server 描述" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".zip"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择 ZIP 文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- Config Dialog -->
    <el-dialog v-model="showConfigDialog" title="手动配置 MCP Server" width="500px">
      <el-form label-width="100px">
        <el-form-item label="文件路径">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="configFilePath" placeholder="目录路径或 mcp-server.json 文件路径" style="flex: 1" />
            <el-button @click="handleLoadFromFile" :loading="loadingFromFile">加载</el-button>
          </div>
        </el-form-item>
        <div style="border-bottom: 1px solid #eee; margin-bottom: 16px" />
        <el-form-item label="名称">
          <el-input v-model="configForm.name" placeholder="唯一标识" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="configForm.displayName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="configForm.description" type="textarea" placeholder="描述" />
        </el-form-item>
        <el-form-item label="命令">
          <el-input v-model="configForm.command" placeholder="node" />
        </el-form-item>
        <el-form-item label="参数">
          <el-input v-model="configForm.args" placeholder="index.js" />
        </el-form-item>
        <el-form-item label="工作目录">
          <el-input v-model="configForm.workDir" placeholder="绝对路径" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfigDialog = false; configFilePath = ''">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- Tools Dialog -->
    <el-dialog v-model="showToolsDialog" :title="toolsTitle" width="600px">
      <el-table :data="currentTools" stripe>
        <el-table-column prop="name" label="工具名称" width="200" />
        <el-table-column prop="description" label="描述" />
      </el-table>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" :title="`MCP Server 详情：${detailServer?.displayName || detailServer?.name || ''}`" width="640px">
      <el-descriptions v-if="detailServer" :column="1" border size="small">
        <el-descriptions-item label="名称">{{ detailServer.name }}</el-descriptions-item>
        <el-descriptions-item label="显示名">{{ detailServer.displayName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailServer.status)" size="small">{{ statusLabel(detailServer.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="命令">{{ detailServer.command }} {{ detailServer.args || '' }}</el-descriptions-item>
        <el-descriptions-item label="工作目录">{{ detailServer.workDir }}</el-descriptions-item>
        <el-descriptions-item label="环境变量">{{ detailServer.envVars || '（无）' }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailServer.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工具数量">{{ detailServer.toolCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailServer.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detailServer.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="detailServer" @click="showTools(detailServer)">查看工具</el-button>
        <el-button v-if="detailServer" type="primary" @click="openEdit(detailServer); showDetailDialog = false">修改</el-button>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Connection Test Result Dialog -->
    <el-dialog v-model="showTestDialog" :title="`连接测试：${testResult?.serverName || ''}`" width="560px">
      <template v-if="testResult">
        <el-result
          :icon="testResult.success ? 'success' : 'error'"
          :title="testResult.success ? '连接成功' : '连接失败'"
          :sub-title="testResult.success ? `耗时 ${testResult.elapsedMs} ms` : ''"
        />
        <el-descriptions v-if="testResult.success" :column="1" border size="small">
          <el-descriptions-item label="MCP Server">{{ testResult.mcpServerName }} {{ testResult.mcpServerVersion }}</el-descriptions-item>
          <el-descriptions-item label="协议版本">{{ testResult.protocolVersion }}</el-descriptions-item>
          <el-descriptions-item label="工具数量">{{ testResult.toolCount }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="testResult.success && testResult.tools?.length" class="test-tools-block">
          <div class="test-tools-title">工具清单</div>
          <div class="test-tools-list">
            <el-tag v-for="t in testResult.tools" :key="t.name" size="small" class="test-tool-tag" :title="t.description">
              {{ t.name }}
            </el-tag>
          </div>
        </div>
        <el-alert v-if="!testResult.success" :title="testResult.error || '未知错误'" type="error" :closable="false" show-icon />
      </template>
      <template #footer>
        <el-button @click="showTestDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" :title="`修改 MCP Server：${editForm.name}`" width="560px">
      <el-alert
        v-if="editStatus === 'RUNNING'"
        title="该服务正在运行，保存修改后需「停止」再「启动」才会生效"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      />
      <el-form label-width="100px">
        <el-form-item label="名称">
          <el-input :model-value="editForm.name" disabled />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="editForm.displayName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="描述" />
        </el-form-item>
        <el-form-item label="命令">
          <el-input v-model="editForm.command" placeholder="node" />
        </el-form-item>
        <el-form-item label="参数">
          <el-input v-model="editForm.args" placeholder="index.js" />
        </el-form-item>
        <el-form-item label="工作目录">
          <el-input v-model="editForm.workDir" placeholder="绝对路径" />
        </el-form-item>
        <el-form-item label="环境变量">
          <el-input v-model="editForm.envVars" type="textarea" :rows="2" placeholder='JSON 格式，如 {"KEY":"value"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="savingEdit">保存</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Setting } from '@element-plus/icons-vue'
import { mcpApi, type McpServer, type McpToolInfo, type McpTestResult } from '@/api/mcp'

const servers = ref<McpServer[]>([])
const loadingId = ref<number | null>(null)

const showUploadDialog = ref(false)
const uploadForm = ref({ name: '', displayName: '', description: '' })
const uploadFile = shallowRef<File | null>(null)
const uploading = ref(false)

const showConfigDialog = ref(false)
const configForm = ref({ name: '', displayName: '', description: '', command: 'node', args: 'index.js', workDir: '' })
const creating = ref(false)
const configFilePath = ref('')
const loadingFromFile = ref(false)

const showToolsDialog = ref(false)
const currentTools = ref<McpToolInfo[]>([])
const toolsTitle = ref('')

const showDetailDialog = ref(false)
const detailServer = ref<McpServer | null>(null)

const showTestDialog = ref(false)
const testResult = ref<McpTestResult | null>(null)
const testingId = ref<number | null>(null)

const showEditDialog = ref(false)
const editForm = ref({ id: 0, name: '', displayName: '', description: '', command: '', args: '', workDir: '', envVars: '' })
const editStatus = ref('')
const savingEdit = ref(false)

async function loadServers() {
  try {
    servers.value = await mcpApi.listServers()
  } catch (e) {
    ElMessage.error('加载 MCP Server 列表失败')
  }
}

function statusTagType(status: string) {
  return status === 'RUNNING' ? 'success' : status === 'ERROR' ? 'danger' : 'info'
}

function statusLabel(status: string) {
  return status === 'RUNNING' ? '运行中' : status === 'ERROR' ? '错误' : '已停止'
}

function handleFileChange(file: any) {
  uploadFile.value = file.raw
}

async function handleUpload() {
  if (!uploadForm.value.name || !uploadFile.value) {
    ElMessage.warning('请填写名称并选择文件')
    return
  }
  uploading.value = true
  try {
    await mcpApi.uploadServer(
      uploadForm.value.name,
      uploadFile.value,
      uploadForm.value.displayName || undefined,
      uploadForm.value.description || undefined
    )
    ElMessage.success('上传成功')
    showUploadDialog.value = false
    uploadForm.value = { name: '', displayName: '', description: '' }
    uploadFile.value = null
    await loadServers()
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || '上传失败'
    ElMessage.error(msg)
  } finally {
    uploading.value = false
  }
}

async function handleCreate() {
  if (!configForm.value.name || !configForm.value.workDir) {
    ElMessage.warning('请填写名称和工作目录')
    return
  }
  creating.value = true
  try {
    await mcpApi.createServer({
      name: configForm.value.name,
      displayName: configForm.value.displayName || undefined,
      description: configForm.value.description || undefined,
      command: configForm.value.command,
      args: configForm.value.args,
      workDir: configForm.value.workDir
    })
    ElMessage.success('创建成功')
    showConfigDialog.value = false
    configForm.value = { name: '', displayName: '', description: '', command: 'node', args: 'index.js', workDir: '' }
    configFilePath.value = ''
    await loadServers()
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function handleLoadFromFile() {
  if (!configFilePath.value) {
    ElMessage.warning('请输入文件路径或目录路径')
    return
  }
  loadingFromFile.value = true
  try {
    const data = await mcpApi.loadFromFile(configFilePath.value)
    if (data.error) {
      ElMessage.error(data.error)
      return
    }
    if (data.name) configForm.value.name = data.name
    if (data.displayName) configForm.value.displayName = data.displayName
    if (data.description) configForm.value.description = data.description
    if (data.command) configForm.value.command = data.command
    if (data.args) configForm.value.args = data.args
    if (data.workDir) configForm.value.workDir = data.workDir
    ElMessage.success('配置加载成功')
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || '加载失败'
    ElMessage.error(msg)
  } finally {
    loadingFromFile.value = false
  }
}

async function handleStart(server: McpServer) {
  loadingId.value = server.id
  try {
    await mcpApi.startServer(server.id)
    ElMessage.success(`${server.name} 已启动`)
    await loadServers()
  } catch (e) {
    ElMessage.error('启动失败')
  } finally {
    loadingId.value = null
  }
}

async function handleStop(server: McpServer) {
  loadingId.value = server.id
  try {
    await mcpApi.stopServer(server.id)
    ElMessage.success(`${server.name} 已停止`)
    await loadServers()
  } catch (e) {
    ElMessage.error('停止失败')
  } finally {
    loadingId.value = null
  }
}

async function handleDelete(server: McpServer) {
  try {
    await ElMessageBox.confirm(`确定要删除 MCP Server "${server.name}" 吗？`, '确认删除', {
      type: 'warning'
    })
    await mcpApi.deleteServer(server.id)
    ElMessage.success('已删除')
    await loadServers()
  } catch (e) {
    // cancelled or error
  }
}

async function showTools(server: McpServer) {
  try {
    currentTools.value = await mcpApi.getServerTools(server.id)
    toolsTitle.value = `${server.name} - 工具列表 (${currentTools.value.length})`
    showToolsDialog.value = true
  } catch (e) {
    ElMessage.error('获取工具列表失败')
  }
}

function openDetail(server: McpServer) {
  detailServer.value = server
  showDetailDialog.value = true
}

async function handleTest(server: McpServer) {
  testingId.value = server.id
  testResult.value = null
  try {
    const result = await mcpApi.testConnection(server.id)
    testResult.value = result
    showTestDialog.value = true
    if (result.success) {
      ElMessage.success(`${server.name} 连接正常（${result.toolCount} 个工具）`)
    } else {
      ElMessage.error(`${server.name} 连接失败`)
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || '测试请求失败'
    testResult.value = { serverId: server.id, serverName: server.name, success: false, error: msg }
    showTestDialog.value = true
  } finally {
    testingId.value = null
  }
}

function openEdit(server: McpServer) {
  editForm.value = {
    id: server.id,
    name: server.name,
    displayName: server.displayName || '',
    description: server.description || '',
    command: server.command || '',
    args: server.args || '',
    workDir: server.workDir || '',
    envVars: server.envVars || ''
  }
  editStatus.value = server.status
  showEditDialog.value = true
}

async function handleUpdate() {
  if (!editForm.value.command.trim() || !editForm.value.workDir.trim()) {
    ElMessage.warning('命令和工作目录不能为空')
    return
  }
  savingEdit.value = true
  try {
    await mcpApi.updateServer(editForm.value.id, {
      displayName: editForm.value.displayName,
      description: editForm.value.description,
      command: editForm.value.command.trim(),
      args: editForm.value.args,
      workDir: editForm.value.workDir.trim(),
      envVars: editForm.value.envVars
    })
    ElMessage.success('修改成功' + (editStatus.value === 'RUNNING' ? '，重启服务后生效' : ''))
    showEditDialog.value = false
    await loadServers()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '修改失败')
  } finally {
    savingEdit.value = false
  }
}

function formatTime(value?: string) {
  if (!value) return '-'
  return value.replace('T', ' ').substring(0, 19)
}

onMounted(loadServers)
</script>

<style scoped>
/* 全宽页面，不受 PageContainer 全局 max-width: 1400px 限制 */
.page-container {
  max-width: 100%;
}

.mcp-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.server-card {
  margin-bottom: 16px;
}

.server-card.status-running {
  border-left: 3px solid #67c23a;
}

.server-card.status-stopped {
  border-left: 3px solid #909399;
}

.server-card.status-error {
  border-left: 3px solid #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-weight: 600;
  font-size: 15px;
}

.server-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-row .label {
  color: #909399;
  min-width: 70px;
}

.info-row code {
  background: #f5f7fa;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.info-row .value {
  color: #606266;
  word-break: break-all;
}

.card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

/* 卡片操作区按钮收紧内边距，保证 6 个按钮单行排布不换行 */
.card-actions .el-button {
  padding: 5px 8px;
  flex-shrink: 0;
}

.test-tools-block {
  margin-top: 14px;
}
.test-tools-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.test-tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}
.test-tool-tag {
  cursor: default;
}
</style>
