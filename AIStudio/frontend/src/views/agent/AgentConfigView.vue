<template>
  <page-container title="Agent 管理" no-card>
    <template #actions>
      <el-button type="primary" @click="showCreateDialog = true">创建 Agent</el-button>
      <el-button @click="handleReload">重新加载</el-button>
    </template>

    <el-row :gutter="16">
      <el-col :span="8" v-for="agent in agents" :key="agent.name">
        <el-card class="agent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="agent-name">{{ agent.name }}</span>
              <!-- 状态徽章统一走全站映射（useStatusTag） -->
              <el-tag :type="statusType(agent.status)" size="small">
                {{ statusLabel(agent.status) }}
              </el-tag>
            </div>
          </template>
          <p class="agent-desc">{{ agent.description || '暂无描述' }}</p>
          <div class="tags-section">
            <div class="tag-row">
              <span class="tag-label">能力：</span>
              <el-tag
                v-for="cap in agent.capabilities"
                :key="cap"
                size="small"
                type="info"
                class="tag-item"
              >{{ cap }}</el-tag>
            </div>
            <div class="tag-row">
              <span class="tag-label">工具：</span>
              <el-tag
                v-for="tool in agent.tools"
                :key="tool"
                size="small"
                type="warning"
                class="tag-item"
              >{{ tool }}</el-tag>
              <span v-if="!agent.tools?.length" class="no-data">无</span>
            </div>
            <div v-if="agent.preferredSkills && agent.preferredSkills.length > 0" class="tag-row">
              <span class="tag-label">首选技能：</span>
              <el-tag
                v-for="skill in agent.preferredSkills"
                :key="skill"
                size="small"
                type="warning"
                class="tag-item"
              >{{ skill }}</el-tag>
            </div>
            <div v-if="agent.mcpServers && agent.mcpServers.length > 0" class="tag-row">
              <span class="tag-label">MCP：</span>
              <el-tag
                v-for="mcp in agent.mcpServers"
                :key="mcp"
                size="small"
                type="success"
                class="tag-item"
              >{{ mcp }}</el-tag>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" type="primary" @click="openRunDialog(agent)">运行</el-button>
            <el-button size="small" @click="viewDetail(agent.name)">详情</el-button>
            <el-button size="small" type="warning" @click="openEditDialog(agent)">修改</el-button>
            <el-button size="small" type="danger" @click="handleDelete(agent.name)">删除</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8" v-if="agents.length === 0">
        <el-empty description="暂无配置的 Agent，点击「创建 Agent」开始" />
      </el-col>
    </el-row>

    <!-- 创建 Agent 对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建 Agent" width="600px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="如 emr-reviewer" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" placeholder="Agent 功能描述" />
        </el-form-item>
        <el-form-item label="模型">
          <el-select
            v-model="createForm.model"
            clearable
            filterable
            allow-create
            default-first-option
            placeholder="留空 = 使用默认模型（全局）"
            style="width: 100%"
          >
            <el-option
              v-for="opt in modelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
              :disabled="opt.disabled"
            />
          </el-select>
          <div class="model-field-tip">候选来自「<el-link type="primary" :underline="false" @click="router.push('/providers')">LLM 管理</el-link>」；未配置 API Key 的 Provider 不可选，留空走平台全局模型</div>
        </el-form-item>
        <el-form-item label="能力标签">
          <el-input v-model="createForm.capabilitiesStr" placeholder="逗号分隔，如 code-analysis,emr-review" />
        </el-form-item>
        <el-form-item label="工具">
          <el-input v-model="createForm.toolsStr" placeholder="逗号分隔，如 search_code" />
        </el-form-item>
        <el-form-item label="首选技能">
          <el-select
            v-model="createForm.preferredSkills"
            multiple
            filterable
            allow-create
            clearable
            placeholder="从技能库选择，也可手动输入"
            popper-class="skill-select-popper"
            style="width: 100%"
          >
            <el-option v-for="s in skillOptions" :key="s.name" :label="s.name" :value="s.name">
              <div class="skill-option" :title="s.description || s.name">
                <span class="skill-option-name">{{ s.name }}</span>
                <span v-if="s.description" class="skill-option-desc">{{ s.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="MCP 服务">
          <el-select
            v-model="createForm.mcpServers"
            multiple
            filterable
            clearable
            placeholder="选择该 Agent 可调用的 MCP 服务"
            style="width: 100%"
          >
            <el-option v-for="m in mcpOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <div class="model-field-tip">候选来自「<el-link type="primary" :underline="false" @click="router.push('/mcp')">MCP 管理</el-link>」；关联后 Agent 运行时可调用该服务的工具</div>
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input
            v-model="createForm.systemPrompt"
            type="textarea"
            :rows="6"
            placeholder="Agent 的系统提示词（Markdown 格式）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 修改 Agent 对话框 -->
    <el-dialog v-model="showEditDialog" :title="'修改 Agent: ' + editName" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称">
          <el-input :model-value="editName" disabled />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" placeholder="Agent 功能描述" />
        </el-form-item>
        <el-form-item label="模型">
          <el-select
            v-model="editForm.model"
            clearable
            filterable
            allow-create
            default-first-option
            placeholder="留空 = 使用默认模型（全局）"
            style="width: 100%"
          >
            <el-option
              v-for="opt in modelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
              :disabled="opt.disabled"
            />
          </el-select>
          <div class="model-field-tip">候选来自「<el-link type="primary" :underline="false" @click="router.push('/providers')">LLM 管理</el-link>」；未配置 API Key 的 Provider 不可选，留空走平台全局模型</div>
        </el-form-item>
        <el-form-item label="能力标签">
          <el-input v-model="editForm.capabilitiesStr" placeholder="逗号分隔，如 code-analysis,emr-review" />
        </el-form-item>
        <el-form-item label="工具">
          <el-input v-model="editForm.toolsStr" placeholder="逗号分隔，如 search_code" />
        </el-form-item>
        <el-form-item label="首选技能">
          <el-select
            v-model="editForm.preferredSkills"
            multiple
            filterable
            allow-create
            clearable
            placeholder="从技能库选择，也可手动输入"
            popper-class="skill-select-popper"
            style="width: 100%"
          >
            <el-option v-for="s in skillOptions" :key="s.name" :label="s.name" :value="s.name">
              <div class="skill-option" :title="s.description || s.name">
                <span class="skill-option-name">{{ s.name }}</span>
                <span v-if="s.description" class="skill-option-desc">{{ s.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="MCP 服务">
          <el-select
            v-model="editForm.mcpServers"
            multiple
            filterable
            clearable
            placeholder="选择该 Agent 可调用的 MCP 服务"
            style="width: 100%"
          >
            <el-option v-for="m in mcpOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <div class="model-field-tip">候选来自「<el-link type="primary" :underline="false" @click="router.push('/mcp')">MCP 管理</el-link>」；关联后 Agent 运行时可调用该服务的工具</div>
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input
            v-model="editForm.systemPrompt"
            type="textarea"
            :rows="6"
            placeholder="Agent 的系统提示词（Markdown 格式）"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleUpdate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetailDialog" :title="detail.name" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detail.description }}</el-descriptions-item>
        <el-descriptions-item label="模型">{{ detail.model || '默认' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="目录">{{ detail.directory || '-' }}</el-descriptions-item>
        <el-descriptions-item label="能力">
          <el-tag v-for="cap in detail.capabilities" :key="cap" size="small" class="tag-item">{{ cap }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工具">
          <el-tag v-for="t in detail.tools" :key="t" size="small" type="warning" class="tag-item">{{ t }}</el-tag>
          <span v-if="!detail.tools?.length">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="首选技能">
          <el-tag v-for="s in detail.preferredSkills" :key="s" size="small" type="warning" class="tag-item">{{ s }}</el-tag>
          <span v-if="!detail.preferredSkills?.length">无</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="detail.systemPrompt" class="prompt-section">
        <h4>系统提示词</h4>
        <pre class="prompt-content">{{ detail.systemPrompt }}</pre>
      </div>
      <div v-if="detail.skills && Object.keys(detail.skills).length > 0" class="skills-section">
        <h4>技能文件</h4>
        <el-collapse>
          <el-collapse-item v-for="(content, name) in detail.skills" :key="name" :title="name">
            <pre class="skill-content">{{ content }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>
  </page-container>

  <!-- 运行 Agent 对话对话框 -->
  <el-dialog v-model="runDialogVisible" :title="'运行 Agent: ' + (runningAgent?.name || '')" width="800px" top="3vh" destroy-on-close @close="closeRunDialog">
    <div class="agent-run-layout">
      <!-- Agent 信息栏 -->
      <div v-if="runningAgent" class="agent-run-info">
        <el-tag size="small" type="info" class="run-info-tag">模型: {{ runningAgent.model || '默认' }}</el-tag>
        <el-tag size="small" type="success" class="run-info-tag">状态: {{ runningAgent.status }}</el-tag>
        <el-popover placement="bottom" :width="400" trigger="click">
          <template #reference>
            <el-button text size="small">查看系统提示词</el-button>
          </template>
          <pre class="prompt-content" style="max-height: 300px; overflow: auto;">{{ runningAgent.systemPrompt || '(无)' }}</pre>
        </el-popover>
      </div>

      <!-- 对话历史切换 -->
      <div class="run-conversation-bar">
        <el-select v-model="currentConvId" placeholder="选择历史对话" clearable filterable style="width: 300px" @change="onConversationSwitch">
          <el-option v-for="conv in conversations" :key="conv.conversationId" :label="conv.title" :value="conv.conversationId">
            <div class="conv-option">
              <span class="conv-option-title" :title="conv.title">{{ conv.title }}</span>
              <el-icon class="conv-option-del" title="删除该会话" @click.stop.prevent="deleteConversationInline(conv)">
                <Delete />
              </el-icon>
            </div>
          </el-option>
          <template #empty>
            <el-empty description="暂无历史对话，发送消息后自动创建" :image-size="60" />
          </template>
        </el-select>
        <el-button size="small" @click="createNewConversation">新对话</el-button>
        <el-button size="small" :disabled="!currentConvId" @click="handleDeleteConversation">删除</el-button>
      </div>

      <!-- 连接状态 / 进度条 -->
      <div class="run-progress-bar">
        <div class="run-progress-info">
          <span class="run-progress-label">
            <template v-if="streamingError">
              <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              {{ streamErrorMsg }}
            </template>
            <template v-else-if="streamingLoading && !progressLabel">
              <el-icon class="is-loading"><Loading /></el-icon>
              正在连接后端...
            </template>
            <template v-else>
              {{ progressLabel || (streamingLoading ? '处理中' : '就绪') }}
            </template>
          </span>
          <span class="run-progress-step">
            <template v-if="progressTotal > 0">{{ progressStep }}/{{ progressTotal }}</template>
            <template v-else-if="streamingLoading">0/0</template>
          </span>
        </div>
        <el-progress
          v-if="streamingLoading || progressVisible"
          :percentage="progressPercent"
          :status="streamingError ? 'exception' : (progressStatus === 'done' ? 'success' : '')"
          :stroke-width="6"
        />
        <div v-if="streamingError" class="run-error-actions">
          <el-button size="small" type="primary" @click="retryLastMessage">重试</el-button>
          <el-button size="small" @click="clearError">关闭</el-button>
        </div>
      </div>

      <!-- 执行过程实时信息 -->
      <div v-if="processFeed.length" class="run-process-panel">
        <div class="run-process-header">
          <span class="run-process-title">执行过程（{{ processFeed.length }} 条）</span>
          <el-button link size="small" @click="processFeedCollapsed = !processFeedCollapsed">
            {{ processFeedCollapsed ? '展开' : '收起' }}
          </el-button>
        </div>
        <div v-show="!processFeedCollapsed" ref="processListRef" class="run-process-list">
          <div v-for="(ev, i) in processFeed" :key="i" class="run-process-item">
            <span class="run-process-time">{{ ev.time }}</span>
            <template v-if="ev.kind === 'model_call'">
              <span class="run-process-text">第 {{ ev.round }} 轮 · 正在调用模型生成...</span>
            </template>
            <template v-else-if="ev.kind === 'tool_invoke'">
              <span class="run-process-text">第 {{ ev.round }} 轮 · 调用工具 <b>{{ ev.tool }}</b></span>
              <span class="run-process-args" :title="ev.args">{{ ev.args }}</span>
            </template>
            <template v-else-if="ev.kind === 'tool_result'">
              <span class="run-process-text">
                <span :class="ev.ok ? 'run-process-ok' : 'run-process-fail'">{{ ev.ok ? '✓' : '✗' }}</span>
                {{ ev.tool }} 返回
              </span>
              <details class="run-process-details">
                <summary>查看摘要</summary>
                <pre class="run-process-output">{{ ev.output }}</pre>
              </details>
            </template>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="messageListRef" class="run-message-list">
        <div v-if="runMessages.length === 0" class="run-empty-state">
          <p>输入消息开始与 Agent 对话</p>
        </div>
        <div v-for="(msg, idx) in runMessages" :key="idx" :class="['run-message', msg.role]">
          <div class="run-msg-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="run-msg-bubble">
            <!-- AI 回复：Markdown 渲染（与 AI 对话页一致）；用户消息：纯文本 -->
            <div v-if="msg.role === 'assistant'" class="run-msg-content markdown-body" v-html="renderMarkdown(msg.content)"></div>
            <div v-else class="run-msg-content run-msg-plain">{{ msg.content }}</div>
            <!-- 工具调用卡片 -->
            <div v-if="msg.toolCalls" class="tool-calls-section">
              <el-collapse accordion>
                <el-collapse-item v-for="(tc, i) in parseToolCalls(msg.toolCalls)" :key="i">
                  <template #title>
                    <div class="tool-call-header">
                      <span class="tool-name">{{ tc.name }}</span>
                      <el-tag :type="tc.success ? 'success' : 'danger'" size="small" class="tool-status-tag">
                        {{ tc.success ? '完成' : '失败' }}
                      </el-tag>
                    </div>
                  </template>
                  <div class="tool-detail">
                    <div class="tool-detail-label">调用参数</div>
                    <pre class="tool-code-block">{{ formatJson(tc.args) }}</pre>
                    <div v-if="tc.output" class="tool-detail-label">执行结果</div>
                    <pre v-if="tc.output" class="tool-code-block">{{ tc.output }}</pre>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div v-if="msg.createdAt" class="run-msg-time">{{ formatTime(msg.createdAt) }}</div>
          </div>
        </div>
        <div v-if="streamingText" class="run-message assistant">
          <div class="run-msg-avatar">AI</div>
          <div class="run-msg-bubble">
            <div class="run-msg-content markdown-body" v-html="renderMarkdown(streamingText)"></div>
            <span class="run-cursor">|</span>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="run-input-area">
        <el-input
          v-model="runInput"
          type="textarea"
          :rows="3"
          placeholder="输入任务描述..."
          :disabled="streamingLoading"
          @keydown.enter.ctrl="handleSendMessage"
        />
        <div class="run-input-actions">
          <span class="run-input-hint">Ctrl+Enter 发送</span>
          <div class="run-btn-group">
            <el-button
              v-if="streamingLoading"
              size="small"
              @click="handleCancelStream"
            >取消生成</el-button>
            <el-button type="primary" :loading="streamingLoading && !streamingError" :disabled="!runInput.trim() || streamingLoading" @click="handleSendMessage">
              {{ streamingLoading ? '生成中...' : '发送' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import { useStatusTag } from '@/composables/useStatusTag'

const { confirmDelete } = useConfirmDelete()
const { statusType, statusLabel } = useStatusTag()

const router = useRouter()
import { WarningFilled, Loading, Delete } from '@element-plus/icons-vue'
import { listAgentConfigs, getAgentConfig, createAgentConfig, updateAgentConfig, deleteAgentConfig, reloadAgentConfigs, AgentConfig } from '@/api/agentConfig'
import { agentRuntimeApi, type AgentConversation, type AgentMessage } from '@/api/agentRuntime'
import { llmProviderApi } from '@/api/llmProvider'
import { skillApi } from '@/api/skill'
import { mcpApi } from '@/api/mcp'
import { useMarkdown } from '@/composables/useMarkdown'

const { renderMarkdown } = useMarkdown()

const agents = ref<AgentConfig[]>([])
const showCreateDialog = ref(false)
const createFormRef = ref<FormInstance>()
// 统一表单规范：名称必填（原先无任何校验，可创建空名 Agent）
const createRules: FormRules = {
  name: [{ required: true, message: '请输入 Agent 名称', trigger: 'blur' }]
}
const showDetailDialog = ref(false)

const createForm = reactive({
  name: '',
  description: '',
  model: '',
  capabilitiesStr: '',
  toolsStr: '',
  preferredSkills: [] as string[],
  mcpServers: [] as string[],
  systemPrompt: ''
})

const showEditDialog = ref(false)
const editName = ref('')
const editLoading = ref(false)
const editForm = reactive({
  description: '',
  model: '',
  capabilitiesStr: '',
  toolsStr: '',
  preferredSkills: [] as string[],
  mcpServers: [] as string[],
  systemPrompt: '',
  enabled: true
})

const detail = ref<Partial<AgentConfig>>({})

/** 模型下拉候选：来自「LLM Provider」菜单（仅启用的；未配 API Key 的禁选） */
const modelOptions = ref<{ label: string; value: string; disabled: boolean }[]>([])

async function loadModelOptions() {
  try {
    const providers = await llmProviderApi.listProviders()
    modelOptions.value = providers
      .filter(p => p.enabled && p.modelName)
      .map(p => ({
        label: p.hasApiKey ? `${p.displayName} / ${p.modelName}` : `${p.displayName} / ${p.modelName}（未配置 API Key）`,
        value: p.modelName,
        disabled: !p.hasApiKey
      }))
  } catch { /* 静默失败：下拉为空时用户仍可手填（allow-create） */ }
}

/** 首选技能候选：来自平台技能库（Skill 管理），避免配置不存在的技能导致运行期静默跳过 */
const skillOptions = ref<{ name: string; description?: string }[]>([])

async function loadSkillOptions() {
  try {
    const skills = await skillApi.listSkills()
    skillOptions.value = skills.map(s => ({ name: s.name, description: s.description }))
  } catch { /* 静默失败：下拉为空时用户仍可手填（allow-create） */ }
}

/** 关联 MCP 候选：来自「MCP 管理」 */
const mcpOptions = ref<{ label: string; value: string }[]>([])

async function loadMcpOptions() {
  try {
    const servers = await mcpApi.listServers()
    mcpOptions.value = servers.map(s => ({
      label: `${s.displayName || s.name}（${s.name}）`,
      value: s.name
    }))
  } catch { /* 静默失败 */ }
}

async function loadAgents() {
  try {
    agents.value = await listAgentConfigs()
  } catch (e: any) {
    ElMessage.error('加载 Agent 列表失败')
  }
}

async function handleCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await createAgentConfig({
      name: createForm.name,
      description: createForm.description,
      model: createForm.model || undefined,
      capabilities: createForm.capabilitiesStr.split(',').map(s => s.trim()).filter(Boolean),
      tools: createForm.toolsStr.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: createForm.preferredSkills,
      mcpServers: createForm.mcpServers,
      systemPrompt: createForm.systemPrompt
    })
    ElMessage.success('Agent 创建成功')
    showCreateDialog.value = false
    Object.assign(createForm, { name: '', description: '', model: '', capabilitiesStr: '', toolsStr: '', preferredSkills: [], mcpServers: [], systemPrompt: '' })
    await loadAgents()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  }
}

function openEditDialog(agent: AgentConfig) {
  editName.value = agent.name
  Object.assign(editForm, {
    description: agent.description || '',
    model: agent.model || '',
    capabilitiesStr: (agent.capabilities || []).join(', '),
    toolsStr: (agent.tools || []).join(', '),
    preferredSkills: agent.preferredSkills || [],
    mcpServers: agent.mcpServers || [],
    systemPrompt: agent.systemPrompt || '',
    enabled: agent.enabled !== false
  })
  showEditDialog.value = true
}

async function handleUpdate() {
  editLoading.value = true
  try {
    await updateAgentConfig(editName.value, {
      description: editForm.description,
      model: editForm.model || undefined,
      capabilities: editForm.capabilitiesStr.split(',').map(s => s.trim()).filter(Boolean),
      tools: editForm.toolsStr.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: editForm.preferredSkills,
      mcpServers: editForm.mcpServers,
      systemPrompt: editForm.systemPrompt,
      enabled: editForm.enabled
    })
    ElMessage.success('Agent 修改成功')
    showEditDialog.value = false
    await loadAgents()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || e?.response?.data?.message || '修改失败')
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(name: string) {
  if (!await confirmDelete(`Agent "${name}"`)) return
  try {
    await deleteAgentConfig(name)
    ElMessage.success('已删除')
    await loadAgents()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

async function viewDetail(name: string) {
  try {
    detail.value = await getAgentConfig(name)
    showDetailDialog.value = true
  } catch (e: any) {
    ElMessage.error('获取详情失败')
  }
}

async function handleReload() {
  try {
    const res = await reloadAgentConfigs()
    ElMessage.success(`已重新加载 ${res.count} 个 Agent`)
    await loadAgents()
  } catch (e: any) {
    ElMessage.error('重新加载失败')
  }
}

// ==================== Agent 运行时 ====================

const runDialogVisible = ref(false)
const runningAgent = ref<AgentConfig | null>(null)
const runInput = ref('')
const runMessages = ref<{ role: string; content: string; createdAt?: string }[]>([])
const streamingText = ref('')
const streamingLoading = ref(false)
const streamingError = ref(false)
const streamErrorMsg = ref('')
const currentConvId = ref<string | undefined>()
const conversations = ref<AgentConversation[]>([])
const messageListRef = ref<HTMLElement | null>(null)
let streamController: AbortController | null = null
let lastSentMessage = '' // 保存最近一次发送的消息，用于重试

// 执行过程实时信息（模型调用/工具调用/工具结果）
interface ProcessEvent { time: string; kind: string; round?: number; tool?: string; args?: string; ok?: boolean; output?: string }
const processFeed = ref<ProcessEvent[]>([])
const processFeedCollapsed = ref(false)
const processListRef = ref<HTMLElement | null>(null)

function handleProcessEvent(evt: Record<string, any>) {
  processFeed.value.push(evt as ProcessEvent)
  nextTick(() => {
    if (processListRef.value) processListRef.value.scrollTop = processListRef.value.scrollHeight
  })
}

// 进度条状态
const progressVisible = ref(false)
const progressStep = ref(0)
const progressTotal = ref(0)
const progressLabel = ref('')
const progressStatus = ref('')
const progressPercent = computed(() => progressTotal.value > 0 ? Math.round((progressStep.value / progressTotal.value) * 100) : 0)

function openRunDialog(agent: AgentConfig) {
  runningAgent.value = agent
  runDialogVisible.value = true
  runMessages.value = []
  streamingText.value = ''
  currentConvId.value = undefined
  runInput.value = ''
  processFeed.value = []
  processFeedCollapsed.value = false
  loadConversations()
}

function closeRunDialog() {
  if (streamController) {
    streamController.abort()
    streamController = null
  }
  streamingText.value = ''
  streamingLoading.value = false
  streamingError.value = false
  streamErrorMsg.value = ''
  lastSentMessage = ''
}

async function loadConversations() {
  if (!runningAgent.value) return
  try {
    conversations.value = await agentRuntimeApi.listConversations(runningAgent.value.name)
  } catch { /* 静默失败 */ }
}

async function onConversationSwitch(convId: string | undefined) {
  processFeed.value = []
  if (!convId) {
    runMessages.value = []
    return
  }
  currentConvId.value = convId
  try {
    const history = await agentRuntimeApi.getHistory(convId)
    runMessages.value = history.map((m: AgentMessage) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt
    }))
    scrollToBottom()
  } catch (e: any) {
    ElMessage.error('加载历史消息失败')
  }
}

function createNewConversation() {
  currentConvId.value = undefined
  runMessages.value = []
  streamingText.value = ''
  runInput.value = ''
  processFeed.value = []
}

async function handleDeleteConversation() {
  if (!currentConvId.value) return
  try {
    await agentRuntimeApi.deleteConversation(currentConvId.value)
    ElMessage.success('已删除')
    currentConvId.value = undefined
    runMessages.value = []
    loadConversations()
  } catch {
    ElMessage.error('删除失败')
  }
}

/** 下拉框内删除单条历史会话（不影响下拉框打开状态之外的选择逻辑） */
async function deleteConversationInline(conv: AgentConversation) {
  if (!await confirmDelete(`会话「${conv.title}」`, '删除会话')) return
  try {
    await agentRuntimeApi.deleteConversation(conv.conversationId)
    ElMessage.success('已删除')
    // 若删除的是当前选中的会话，清空聊天区
    if (currentConvId.value === conv.conversationId) {
      currentConvId.value = undefined
      runMessages.value = []
      streamingText.value = ''
    }
    await loadConversations()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleSendMessage() {
  const msg = runInput.value.trim()
  if (!msg || !runningAgent.value) return

  // 保存消息用于重试
  lastSentMessage = msg

  // 添加用户消息到列表
  runMessages.value.push({ role: 'user', content: msg })
  runInput.value = ''
  streamingText.value = ''
  streamingLoading.value = true
  streamingError.value = false
  streamErrorMsg.value = ''

  // 重置进度
  progressVisible.value = true
  progressStep.value = 0
  progressTotal.value = 0
  progressLabel.value = '准备中'
  progressStatus.value = 'running'

  scrollToBottom()

  // 发起 SSE 流式请求
  streamController = agentRuntimeApi.streamChat(
    runningAgent.value.name,
    msg,
    currentConvId.value,
    // onMessage —— 收到内容块
    (text) => {
      streamingText.value += text
      scrollToBottom()
    },
    // onDone —— 完成
    (convId) => {
      // 如果有流式内容，保存为正式消息
      if (streamingText.value.trim()) {
        runMessages.value.push({ role: 'assistant', content: streamingText.value })
      }
      streamingText.value = ''
      streamingLoading.value = false
      streamingError.value = false
      progressVisible.value = false
      currentConvId.value = convId
      streamController = null
      loadConversations()
      scrollToBottom()
    },
    // onError —— 出错
    (err) => {
      console.error('[Agent-Dialog] SSE 错误:', err)
      streamingLoading.value = false
      streamingError.value = true
      streamErrorMsg.value = err || '未知错误'
      progressStatus.value = 'error'
      // 保留已收到的流式内容（如果有）
      if (streamingText.value.trim()) {
        runMessages.value.push({ role: 'assistant', content: streamingText.value + '\n\n[响应不完整，发生错误]' })
        streamingText.value = ''
      }
      streamController = null
    },
    // onProgress —— 进度更新
    (step, total, label, status) => {
      progressStep.value = step
      progressTotal.value = total
      progressLabel.value = label
      progressStatus.value = status
      progressVisible.value = true
      if (status === 'done') {
        setTimeout(() => { progressVisible.value = false }, 1500)
      }
    },
    // onProcess —— 执行过程实时事件（模型调用/工具调用/工具结果）
    handleProcessEvent
  )
}

/** 取消当前流式请求 */
function handleCancelStream() {
  if (streamController) {
    console.log('[Agent-Dialog] 用户主动取消')
    streamController.abort()
    streamController = null
  }
  // 保留已收到的内容
  if (streamingText.value.trim()) {
    runMessages.value.push({ role: 'assistant', content: streamingText.value + '\n\n[已取消]' })
    streamingText.value = ''
  }
  streamingLoading.value = false
  streamingError.value = false
}

/** 重试最近一次发送的消息 */
function retryLastMessage() {
  if (!lastSentMessage || !runningAgent.value) return
  console.log('[Agent-Dialog] 重试消息:', lastSentMessage)
  // 恢复输入框内容并重新发送
  runInput.value = lastSentMessage
  clearError()
  handleSendMessage()
}

/** 清除错误状态 */
function clearError() {
  streamingError.value = false
  streamErrorMsg.value = ''
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

// 解析工具调用字符串为结构化数组
function parseToolCalls(toolCallsStr: string): { name: string; args: string; output: string; success: boolean }[] {
  if (!toolCallsStr) return []
  // 格式: [1]工具名: 执行结果文本
  const parts = toolCallsStr.split(';').filter(Boolean)
  return parts.map(p => {
    const trimmed = p.trim().replace(/^\[\d+\]/, '')
    const colonIdx = trimmed.indexOf(':')
    const name = colonIdx > 0 ? trimmed.substring(0, colonIdx).trim() : trimmed
    const output = colonIdx > 0 ? trimmed.substring(colonIdx + 1).trim() : ''
    return { name, args: '{}', output, success: !output.includes('失败') }
  })
}

function formatJson(obj: any): string {
  if (typeof obj === 'string') return obj
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

onMounted(() => {
  loadAgents()
  loadModelOptions()
  loadSkillOptions()
  loadMcpOptions()
})
</script>

<style scoped>
/* 页边距统一交给 el-main（24px） */
.agent-config-view {
}



.agent-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-name {
  font-weight: 600;
  font-size: 16px;
}

.agent-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
  min-height: 20px;
}

.tags-section {
  margin-bottom: 12px;
}

.tag-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.tag-label {
  font-size: 12px;
  color: var(--ink-text-secondary);
  min-width: 40px;
}

.tag-item {
  margin: 2px;
}

.no-data {
  font-size: 12px;
  color: #ccc;
}

.card-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid #ede8da;
  padding-top: 12px;
}

.prompt-section, .skills-section {
  margin-top: 16px;
}

.prompt-section h4, .skills-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
}

.prompt-content, .skill-content {
  background: var(--el-border-color-extra-light);
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow: auto;
}

/* ===== Agent 运行对话框 ===== */
.agent-run-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 60vh;
  min-height: 400px;
}

.agent-run-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.run-info-tag {
  margin-right: 4px;
}

.run-conversation-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 历史对话下拉项：标题 + 删除图标 */
.conv-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}
.conv-option-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-option-del {
  flex-shrink: 0;
  color: #b8b1a0;
  font-size: 14px;
  padding: 2px;
  border-radius: 4px;
}
.conv-option-del:hover {
  color: #f56c6c;
  background: #fef0f0;
}
.conv-empty-tip {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--ink-text-secondary);
  text-align: center;
}
.model-field-tip {
  font-size: 12px;
  color: var(--ink-text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}
.skill-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.skill-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-option-desc {
  font-size: 12px;
  color: var(--ink-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  flex-shrink: 0;
}

/* 执行过程实时信息面板 */
.run-process-panel {
  flex-shrink: 0;
  border: 1px solid var(--paper-border);
  border-radius: 6px;
  background: #fafbfc;
  margin: 0 12px;
}
.run-process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.run-process-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-text-regular);
}
.run-process-list {
  max-height: 150px;
  overflow-y: auto;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.8;
}
.run-process-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.run-process-time {
  color: #b8b1a0;
  font-family: var(--app-font-mono);
  flex-shrink: 0;
}
.run-process-text { color: var(--ink-text-regular); }
.run-process-text b { color: var(--el-color-primary); font-weight: 600; }
.run-process-args {
  color: var(--ink-text-secondary);
  font-family: var(--app-font-mono);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420px;
}
.run-process-ok { color: #67c23a; font-weight: 700; }
.run-process-fail { color: #f56c6c; font-weight: 700; }
.run-process-details summary {
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 11px;
}
.run-process-output {
  margin: 4px 0 6px;
  padding: 6px 8px;
  background: var(--el-fill-color);
  border-radius: 4px;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}

.run-message-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--paper);
  border: 1px solid var(--paper-border);
  border-radius: 8px;
}

.run-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
}

.run-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.run-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.run-message.assistant {
  align-self: flex-start;
}

.run-msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.run-message.user .run-msg-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.run-message.assistant .run-msg-avatar {
  background: var(--ink-light);
  color: #fff;
}

.run-msg-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.run-message.user .run-msg-bubble {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.run-message.assistant .run-msg-bubble {
  background: #fff;
  border: 1px solid var(--paper-border);
  border-bottom-left-radius: 2px;
  color: var(--ink);
}

.run-msg-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  text-align: right;
}

/* 用户消息：保留换行的纯文本 */
.run-msg-plain {
  white-space: pre-wrap;
}

/* ===== AI 回复 Markdown 排版（与 AI 对话页风格一致） ===== */
.run-msg-content.markdown-body :deep(> *:first-child) {
  margin-top: 0;
}
.run-msg-content.markdown-body :deep(> *:last-child) {
  margin-bottom: 0;
}
.run-msg-content.markdown-body :deep(p) {
  margin: 0 0 8px;
  line-height: 1.7;
}
.run-msg-content.markdown-body :deep(h1),
.run-msg-content.markdown-body :deep(h2),
.run-msg-content.markdown-body :deep(h3),
.run-msg-content.markdown-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  color: var(--ink-deep);
  line-height: 1.4;
}
.run-msg-content.markdown-body :deep(h1) { font-size: 17px; }
.run-msg-content.markdown-body :deep(h2) { font-size: 16px; }
.run-msg-content.markdown-body :deep(h3) { font-size: 15px; }
.run-msg-content.markdown-body :deep(h4) { font-size: 14px; }
.run-msg-content.markdown-body :deep(ul),
.run-msg-content.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 4px 0 8px;
}
.run-msg-content.markdown-body :deep(li) {
  margin: 2px 0;
  line-height: 1.7;
}
.run-msg-content.markdown-body :deep(li > p) {
  margin: 0;
}
.run-msg-content.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--ink-deep);
}
.run-msg-content.markdown-body :deep(em) {
  font-style: italic;
}
.run-msg-content.markdown-body :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}
.run-msg-content.markdown-body :deep(a:hover) {
  text-decoration: underline;
}
/* 行内代码 */
.run-msg-content.markdown-body :deep(code) {
  background: #eef2f7;
  border: 1px solid var(--paper-border);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12.5px;
  font-family: var(--app-font-mono);
  color: #c7254e;
  word-break: break-word;
}
/* 代码块 */
.run-msg-content.markdown-body :deep(pre) {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 10px 12px;
  margin: 8px 0;
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
}
.run-msg-content.markdown-body :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: #d4d4d4;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre;
}
/* 表格 */
.run-msg-content.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  max-width: 100%;
  display: block;
  overflow-x: auto;
  font-size: 13px;
}
.run-msg-content.markdown-body :deep(th),
.run-msg-content.markdown-body :deep(td) {
  border: 1px solid var(--paper-border);
  padding: 5px 10px;
  text-align: left;
}
.run-msg-content.markdown-body :deep(th) {
  background: var(--paper-light);
  font-weight: 600;
}
/* 引用块 */
.run-msg-content.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--el-color-primary);
  background: #f5f6ff;
  color: #475569;
  padding: 6px 12px;
  margin: 8px 0;
  border-radius: 0 4px 4px 0;
}
.run-msg-content.markdown-body :deep(blockquote p) {
  margin: 0;
}
/* 分隔线 */
.run-msg-content.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--paper-border);
  margin: 10px 0;
}

/* 进度条 */
.run-progress-bar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.run-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}
.run-progress-label {
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
  gap: 6px;
}
.run-progress-step {
  color: var(--el-text-color-secondary);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

/* 错误状态操作 */
.run-error-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.run-message.user .run-msg-time {
  color: rgba(255, 255, 255, 0.7);
}

.run-cursor {
  animation: blink 1s step-end infinite;
  color: var(--el-color-primary);
}

@keyframes blink {
  50% { opacity: 0; }
}

.run-input-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.run-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.run-btn-group {
  display: flex;
  gap: 8px;
}

.run-input-hint {
  font-size: 12px;
  color: #94a3b8;
}

/* 工具调用卡片 */
.tool-calls-section {
  margin-top: 8px;
  border-top: 1px solid var(--paper-border);
  padding-top: 8px;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.tool-name {
  font-weight: 600;
  color: var(--el-color-primary);
  font-family: var(--app-font-mono);
}

.tool-status-tag {
  flex-shrink: 0;
}

.tool-detail {
  padding: 8px 0;
}

.tool-detail-label {
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 4px;
  font-weight: 600;
}

.tool-detail-label:first-child {
  margin-top: 0;
}

.tool-code-block {
  background: var(--paper-light);
  border: 1px solid var(--paper-border);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>

<!-- 首选技能下拉面板（teleport 到 body，需非 scoped）：
     面板收缩至内容宽，再由 EP 行内 min-width（= 输入框宽度）兜底，
     最终面板宽度与首选技能输入框精确一致 -->
<style>
.skill-select-popper .el-select-dropdown {
  width: fit-content;
}
</style>
