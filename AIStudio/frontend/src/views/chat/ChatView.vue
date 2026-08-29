<template>
  <div class="chat-layout">
    <aside :class="['chat-sidebar', { collapsed: sidebarCollapsed }]">
      <div class="sidebar-header">
        <span v-if="!sidebarCollapsed" class="sidebar-title">对话列表</span>
        <el-button class="new-chat-btn" type="primary" size="small" @click="createNewChat">
          <el-icon><Plus /></el-icon>
          <span v-if="!sidebarCollapsed">新对话</span>
        </el-button>
      </div>
      <div v-if="!sidebarCollapsed" v-loading="initializing" class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.conversationId"
          :class="['conversation-item', { active: conv.conversationId === currentConversationId }]"
          role="button"
          tabindex="0"
          :aria-label="'切换到对话：' + (conv.title || '新对话')"
          @click="switchConversation(conv.conversationId)"
          @keydown.enter.prevent="switchConversation(conv.conversationId)"
          @keydown.space.prevent="switchConversation(conv.conversationId)"
        >
          <el-icon class="conv-icon"><ChatDotRound /></el-icon>
          <div class="conv-item-text">
            <div class="conv-title" :title="conv.title">{{ conv.title || '新对话' }}</div>
            <div class="conv-time" v-if="conv.createdAt">{{ formatConvTime(conv.createdAt) }}</div>
          </div>
          <el-button
            class="conv-delete" text size="small"
            aria-label="删除该对话"
            @click.stop="handleDeleteConversation(conv)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div v-if="!initializing && conversations.length === 0" class="no-conversations">
          暂无对话，点击"新对话"开始
        </div>
      </div>
    </aside>

    <button class="sidebar-toggle" :aria-label="sidebarCollapsed ? '展开对话列表' : '收起对话列表'"
            @click="sidebarCollapsed = !sidebarCollapsed">
      <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
    </button>

    <main class="chat-main">
      <div ref="messageListRef" class="message-list" role="log" aria-live="polite" @scroll="handleScroll">
        <div v-if="initializing" class="empty-state">
          <el-icon class="empty-icon is-loading"><Loading /></el-icon>
          <p>正在加载对话…</p>
        </div>
        <div v-else-if="messages.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon"><ChatDotRound /></el-icon>
          <p>开始一段新对话吧</p>
        </div>

        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div :class="['bubble', { 'bubble-error': msg.isError }]">
            <div v-if="msg.role === 'assistant'">
              <div v-if="msg.isError" class="error-banner">
                <el-icon><WarningFilled /></el-icon>
                <span>出错了</span>
              </div>
              <div v-if="msg.toolCalls && msg.toolCalls.length > 0" class="tool-calls-section">
                <el-collapse accordion>
                  <el-collapse-item v-for="(tc, i) in msg.toolCalls" :key="i">
                    <template #title>
                      <div class="tool-call-header">
                        <el-icon :size="14"><component :is="getToolIcon(tc.tool)" /></el-icon>
                        <span class="tool-name">{{ tc.tool }}</span>
                        <span :class="['tool-status', tc.success !== false ? 'success' : 'error']">
                          {{ tc.success === undefined ? '...' : tc.success ? '完成' : '失败' }}
                        </span>
                      </div>
                    </template>
                    <div class="tool-detail">
                      <div class="tool-detail-label">输入</div>
                      <pre class="tool-code-block">{{ formatJson(tc.input) }}</pre>
                      <div v-if="tc.output !== undefined" class="tool-detail-label">输出</div>
                      <pre v-if="tc.output !== undefined" class="tool-code-block">{{ truncateOutput(tc.output) }}</pre>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
              <div class="markdown-body" v-html="renderMsg(msg)" />
              <div class="msg-actions">
                <button v-if="msg.isError" class="msg-action-btn danger" @click="goPersonalConfig">去配置
                </button>
                <button v-if="msg.isError" class="msg-action-btn" @click="regenerate">重试</button>
                <button v-else class="msg-action-btn" @click="copyMessage(msg)">复制</button>
                <button v-if="!msg.isError && index === messages.length - 1 && !loading"
                        class="msg-action-btn" @click="regenerate">重新生成</button>
              </div>
            </div>
            <div v-else class="plain-text">{{ msg.content }}</div>
            <div v-if="msg.createdAt" class="msg-time">{{ formatMsgTime(msg.createdAt) }}</div>
          </div>
        </div>

        <div v-if="loading" class="message assistant">
          <div class="avatar">AI</div>
          <div class="bubble">
            <div v-if="pendingToolCalls.length > 0" class="tool-calls-section">
              <TransitionGroup name="tool-fade" tag="div">
                <div v-for="(tc, i) in pendingToolCalls" :key="'tc-' + tc.tool + '-' + i" class="tool-call-card">
                  <div class="tool-call-card-header">
                    <el-icon :size="14"><component :is="getToolIcon(tc.tool)" /></el-icon>
                    <span class="tool-name">{{ tc.tool }}</span>
                    <span v-if="tc.success === undefined" class="tool-status running">
                      <span class="status-dot"></span>执行中
                    </span>
                    <span v-else :class="['tool-status', tc.success ? 'success' : 'error']">
                      {{ tc.success ? '完成' : '失败' }}
                    </span>
                  </div>
                  <div class="tool-detail">
                    <div class="tool-detail-label">输入</div>
                    <pre class="tool-code-block">{{ formatJson(tc.input) }}</pre>
                    <div v-if="tc.output !== undefined" class="tool-detail-label">输出</div>
                    <pre v-if="tc.output !== undefined" class="tool-code-block">{{ truncateOutput(tc.output) }}</pre>
                  </div>
                </div>
              </TransitionGroup>
            </div>
            <div v-if="streamingContent" class="markdown-body" v-html="renderStreaming()" />
            <div v-else-if="pendingToolCalls.length === 0" class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <button v-if="showJumpBottom" class="jump-bottom-btn" aria-label="回到底部" @click="jumpToBottom">
        <el-icon><ArrowDown /></el-icon>
      </button>

      <div class="input-area">
        <div class="input-wrapper">
          <div class="input-top">
            <el-select
              v-model="selectedAgent"
              size="small"
              class="agent-select"
              aria-label="选择回答的 Agent"
              @change="saveAgentPref"
            >
              <el-option label="默认助手" value="" />
              <el-option v-for="a in agents" :key="a.name" :label="a.name" :value="a.name">
                <span>{{ a.name }}</span>
                <span class="agent-option-desc">{{ (a.description || '').slice(0, 20) }}</span>
              </el-option>
            </el-select>
            <span v-if="selectedAgent" class="agent-hint">将由「{{ selectedAgent }}」回答</span>
          </div>
          <textarea
            ref="textareaRef"
            v-model="inputText"
            class="chat-textarea"
            aria-label="聊天输入框"
            placeholder="输入问题，或粘贴需求号…（Enter 发送，Shift+Enter 换行）"
            rows="2"
            @keydown="handleKeydown"
            @input="autosizeTextarea"
          />
          <div class="input-actions">
            <span class="hint">Enter 发送 · Shift+Enter 换行</span>
            <el-button v-if="loading" type="danger" @click="stopGeneration">
              <el-icon style="margin-right: 4px;"><VideoPause /></el-icon>停止
            </el-button>
            <el-button v-else type="primary" :disabled="!inputText.trim()" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Delete, ChatDotRound, Fold, Expand, ArrowDown, Loading, WarningFilled, VideoPause,
  Search, Folder, Document, Setting, Tools
} from '@element-plus/icons-vue'
import { chatApi } from '@/api/chat'
import type { ChatMessage, ToolCallInfo, ConversationInfo } from '@/api/chat'
import { listAgentConfigs, type AgentConfig } from '@/api/agentConfig'
import { useMarkdown } from '@/composables/useMarkdown'

type UiMessage = ChatMessage & { isError?: boolean }

const { renderMarkdown } = useMarkdown()
const router = useRouter()

const conversations = ref<ConversationInfo[]>([])
const currentConversationId = ref<string | undefined>(undefined)
const messages = ref<UiMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const initializing = ref(true)
const streamingContent = ref('')
const sidebarCollapsed = ref(false)
const pendingToolCalls = ref<ToolCallInfo[]>([])
const agents = ref<AgentConfig[]>([])
const selectedAgent = ref(localStorage.getItem('chat-agent-name') || '')

const stickToBottom = ref(true)
const showJumpBottom = ref(false)

const messageListRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

let abortController: AbortController | null = null
let userAborted = false
// 流式渲染节流：chunk 先入缓冲，约 66ms 批量渲染一次，避免长回答逐 chunk 全量重渲卡顿
let streamBuf = ''
let flushTimer: number | null = null

onMounted(async () => {
  loadAgents()
  await loadConversations()
  const savedId = localStorage.getItem('chat-conversation-id')
  if (savedId && conversations.value.some(c => c.conversationId === savedId)) {
    currentConversationId.value = savedId
    try {
      const history = await chatApi.getHistory(savedId)
      messages.value = history
      scrollToBottom(true)
    } catch {
      messages.value = []
      ElMessage.warning('历史消息加载失败，请稍后重试')
    }
  }
  initializing.value = false
})

onBeforeUnmount(() => {
  abortStream()
  if (flushTimer != null) window.clearTimeout(flushTimer)
})

async function loadAgents() {
  try {
    const list = await listAgentConfigs()
    agents.value = (list || []).filter(a => a.enabled !== false)
  } catch {
    agents.value = [] // 加载失败则隐藏选择器，不影响基础对话
  }
}

function saveAgentPref() {
  if (selectedAgent.value) {
    localStorage.setItem('chat-agent-name', selectedAgent.value)
  } else {
    localStorage.removeItem('chat-agent-name')
  }
}

async function loadConversations() {
  try {
    conversations.value = await chatApi.getConversations()
  } catch {
    conversations.value = []
    ElMessage.error('对话列表加载失败，请刷新重试')
  }
}

function abortStream() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

function resetStreamState() {
  streamingContent.value = ''
  pendingToolCalls.value = []
  streamBuf = ''
  if (flushTimer != null) {
    window.clearTimeout(flushTimer)
    flushTimer = null
  }
}

function createNewChat() {
  abortStream()
  loading.value = false
  currentConversationId.value = undefined
  messages.value = []
  resetStreamState()
  localStorage.removeItem('chat-conversation-id')
  focusInput()
}

async function switchConversation(convId: string) {
  if (convId === currentConversationId.value) return
  abortStream() // 切换会话必须中止旧流，避免内容串台
  loading.value = false
  currentConversationId.value = convId
  localStorage.setItem('chat-conversation-id', convId)
  resetStreamState()
  initializing.value = true
  try {
    const history = await chatApi.getHistory(convId)
    messages.value = history
    scrollToBottom(true)
  } catch {
    messages.value = []
    ElMessage.warning('历史消息加载失败，请稍后重试')
  } finally {
    initializing.value = false
  }
}

async function handleDeleteConversation(conv: ConversationInfo) {
  try {
    await ElMessageBox.confirm(
      `确定删除对话「${conv.title || '新对话'}」吗？此操作不可恢复。`,
      '删除对话',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await chatApi.deleteConversation(conv.conversationId)
    conversations.value = conversations.value.filter(c => c.conversationId !== conv.conversationId)
    if (currentConversationId.value === conv.conversationId) {
      abortStream()
      loading.value = false
      currentConversationId.value = undefined
      messages.value = []
      resetStreamState()
      localStorage.removeItem('chat-conversation-id')
    }
  } catch {
    ElMessage.error('删除失败，请稍后重试')
  }
}

function formatConvTime(timeStr: string | null): string {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return ''
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${m}/${day} ${h}:${min}`
  } catch {
    return ''
  }
}

function formatMsgTime(timeStr: string | undefined): string {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return ''
  }
}

function queueChunk(text: string) {
  streamBuf += text
  if (flushTimer == null) {
    flushTimer = window.setTimeout(flushStream, 66)
  }
}

function flushStream() {
  flushTimer = null
  if (streamBuf) {
    streamingContent.value += streamBuf
    streamBuf = ''
    scrollToBottom()
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  await doSend(text)
}

async function doSend(text: string) {
  messages.value.push({ role: 'user', content: text, createdAt: new Date().toISOString() })
  inputText.value = ''
  autosizeTextarea()
  loading.value = true
  userAborted = false
  resetStreamState()

  stickToBottom.value = true
  scrollToBottom(true)
  abortController = new AbortController()

  let result = ''
  try {
    result = await chatApi.stream(
      text,
      { conversationId: currentConversationId.value, agentName: selectedAgent.value || undefined },
      {
        onChunk(chunk: string) {
          queueChunk(chunk)
        },
        onToolCall(tool: string, input: Record<string, any>) {
          pendingToolCalls.value.push({ tool, input })
          scrollToBottom()
        },
        onToolResult(tool: string, success: boolean, output: string) {
          const tc = [...pendingToolCalls.value].reverse().find(
            t => t.tool === tool && t.success === undefined
          )
          if (tc) {
            tc.success = success
            tc.output = output
          }
          scrollToBottom()
        },
        onDone(fullText: string, conversationId?: string) {
          flushStream()
          const msg: UiMessage = { role: 'assistant', content: fullText, createdAt: new Date().toISOString() }
          if (pendingToolCalls.value.length > 0) {
            msg.toolCalls = [...pendingToolCalls.value]
          }
          messages.value.push(msg)
          resetStreamState()
          loading.value = false
          if (conversationId) {
            currentConversationId.value = conversationId
            localStorage.setItem('chat-conversation-id', conversationId)
          }
          loadConversations()
          scrollToBottom(true)
        },
        onError(error: string) {
          flushStream()
          messages.value.push({
            role: 'assistant',
            content: error,
            isError: true,
            createdAt: new Date().toISOString()
          })
          resetStreamState()
          loading.value = false
          scrollToBottom(true)
        }
      },
      abortController.signal
    )

    // 兜底：onDone/onError 都未触发（如用户中途停止、流被静默截断）时落账
    if (loading.value) {
      flushStream()
      if (result || pendingToolCalls.value.length > 0) {
        const msg: UiMessage = {
          role: 'assistant',
          content: result || streamingContent.value,
          createdAt: new Date().toISOString()
        }
        if (pendingToolCalls.value.length > 0) {
          msg.toolCalls = [...pendingToolCalls.value]
        }
        messages.value.push(msg)
        if (userAborted) {
          ElMessage.info('已停止生成')
        }
      }
      resetStreamState()
      loading.value = false
      if (currentConversationId.value === undefined) {
        loadConversations()
      }
      scrollToBottom(true)
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    messages.value.push({
      role: 'assistant',
      content: '请求失败: ' + errMsg,
      isError: true,
      createdAt: new Date().toISOString()
    })
    loading.value = false
    resetStreamState()
    scrollToBottom(true)
  } finally {
    abortController = null
  }
}

function stopGeneration() {
  if (!loading.value) return
  userAborted = true
  abortStream()
}

/** 重新生成：重发最近一条用户消息 */
function regenerate() {
  if (loading.value) return
  const lastUser = [...messages.value].reverse().find(m => m.role === 'user')
  if (!lastUser) return
  // 移除最后一轮问答（末尾连续的 assistant 消息 + 那条 user 消息）
  while (messages.value.length && messages.value[messages.value.length - 1].role === 'assistant') {
    messages.value.pop()
  }
  if (messages.value.length && messages.value[messages.value.length - 1].role === 'user') {
    messages.value.pop()
  }
  doSend(lastUser.content)
}

function copyMessage(msg: UiMessage) {
  navigator.clipboard.writeText(msg.content || '').then(() => {
    ElMessage.success('已复制')
  }).catch(() => {
    ElMessage.error('复制失败，请手动选择复制')
  })
}

function goPersonalConfig() {
  router.push('/personal-config')
}

function handleKeydown(e: KeyboardEvent) {
  // 主流约定：Enter 发送，Shift+Enter 换行（兼容中文输入法组合键状态）
  if (e.key === 'Enter' && !e.isComposing) {
    if (e.shiftKey) return // 换行
    e.preventDefault()
    sendMessage()
  }
}

function autosizeTextarea() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function focusInput() {
  nextTick(() => textareaRef.value?.focus())
}

function renderMsg(msg: UiMessage): string {
  return renderMarkdown(msg.content)
}

function renderStreaming(): string {
  return renderMarkdown(streamingContent.value)
}

function handleScroll() {
  const el = messageListRef.value
  if (!el) return
  const gap = el.scrollHeight - el.scrollTop - el.clientHeight
  stickToBottom.value = gap < 80
  showJumpBottom.value = gap > 240
}

/** 仅在贴底时自动滚动：用户上滑看历史时不再被拽回底部 */
function scrollToBottom(force = false) {
  nextTick(() => {
    if (messageListRef.value && (force || stickToBottom.value)) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function jumpToBottom() {
  stickToBottom.value = true
  showJumpBottom.value = false
  scrollToBottom(true)
}

function getToolIcon(toolName: string): Component {
  const name = toolName.toLowerCase()
  if (name.includes('search') || name.includes('grep')) return Search
  if (name.includes('folder') || name.includes('list') || name.includes('dir')) return Folder
  if (name.includes('read') || name.includes('file') || name.includes('doc')) return Document
  if (name.includes('exec') || name.includes('run') || name.includes('shell')) return Setting
  return Tools
}

function formatJson(obj: Record<string, any>): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

function truncateOutput(output: string): string {
  const maxLen = 800
  if (output.length <= maxLen) return output
  return output.slice(0, maxLen) + '\n... (输出已截断，共 ' + output.length + ' 字符)'
}

watch(messageListRef, (el) => {
  if (!el) return
  el.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('copy-btn')) {
      const codeId = target.getAttribute('data-code-id')
      if (codeId) {
        const codeEl = document.getElementById(codeId)
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent || '').then(() => {
            const btn = target as HTMLElement
            btn.textContent = '已复制!'
            setTimeout(() => { btn.textContent = '复制' }, 2000)
          })
        }
      }
    }
  })
})
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.chat-sidebar {
  width: 260px;
  background: var(--paper-card);
  border-right: 1px solid var(--paper-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s ease;
}

.chat-sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--paper-border);
  min-height: 52px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-text);
}

.new-chat-btn {
  flex-shrink: 0;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.conversation-item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.conversation-item:hover {
  background: var(--paper-light);
}

.conversation-item.active {
  background: #d5dae1;
  color: var(--el-color-primary);
}

.conv-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.conv-item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.conv-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 11px;
  color: var(--ink-text-secondary);
  margin-top: 2px;
}

.conv-delete {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.conversation-item:hover .conv-delete,
.conversation-item:focus-within .conv-delete {
  opacity: 1;
}

.no-conversations {
  text-align: center;
  color: var(--ink-text-secondary);
  font-size: 13px;
  padding: 24px 12px;
}

.sidebar-toggle {
  position: absolute;
  top: 12px;
  left: 260px;
  z-index: 10;
  width: 24px;
  height: 24px;
  border: 1px solid var(--paper-border);
  border-radius: 4px;
  background: var(--paper-card);
  color: var(--ink-text-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.25s ease;
}

.sidebar-toggle:focus-visible {
  outline: 2px solid var(--el-color-primary);
}

.chat-sidebar.collapsed ~ .sidebar-toggle {
  left: 56px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
  background: var(--paper-card);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ink-text-secondary);
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  color: #b8b1a0;
}

.empty-state p {
  font-size: 14px;
}

.message {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.user .avatar {
  background: #67c23a;
}

.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.7;
  font-size: 14px;
  word-break: break-word;
}

.message.user .bubble {
  background: var(--el-color-primary-light-9);
  border-top-right-radius: 4px;
}

.message.assistant .bubble {
  background: var(--paper-light);
  border-top-left-radius: 4px;
}

.bubble.bubble-error {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #c45656;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #f56c6c;
}

.msg-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.msg-action-btn {
  background: transparent;
  border: 1px solid var(--paper-border, var(--el-border-color));
  color: var(--ink-text-regular);
  border-radius: 4px;
  font-size: 12px;
  padding: 2px 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.msg-action-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.msg-action-btn.danger {
  color: #f56c6c;
  border-color: #fbc4c4;
}

.msg-action-btn.danger:hover {
  background: #fef0f0;
}

.plain-text {
  white-space: pre-wrap;
}

.msg-time {
  font-size: 11px;
  color: var(--ink-text-secondary);
  margin-top: 4px;
  text-align: right;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}

.markdown-body :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(em) {
  font-style: italic;
}

.markdown-body :deep(code) {
  background: #e1dbcb;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: var(--app-font-mono);
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
  overflow-x: auto;
  display: block;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ddd;
  padding: 6px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--el-border-color-extra-light);
  font-weight: 600;
}

.markdown-body :deep(.code-block-wrapper) {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.markdown-body :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #3a3a3a;
}

.markdown-body :deep(.code-lang) {
  font-size: 12px;
  color: #9a9a9a;
  text-transform: uppercase;
}

.markdown-body :deep(.copy-btn) {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.markdown-body :deep(.copy-btn:hover) {
  background: #444;
  color: #fff;
}

.markdown-body :deep(.code-block) {
  margin: 0;
  padding: 12px 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

.markdown-body :deep(.code-block code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: #d4d4d4;
  font-family: var(--app-font-mono);
}

.loading-dots {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-text-secondary);
  animation: pulse 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.jump-bottom-btn {
  position: absolute;
  bottom: 140px;
  right: 32px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--paper-border, var(--el-border-color));
  background: var(--paper-card);
  color: var(--ink-text-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(44, 42, 38, 0.15);
  transition: all 0.15s;
}

.jump-bottom-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.input-area {
  padding: 16px 24px;
  border-top: 1px solid var(--paper-border);
  background: var(--paper-card);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-select {
  width: 200px;
}

.agent-option-desc {
  float: right;
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.agent-hint {
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.chat-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  background: #fff;
  transition: border-color 0.2s;
}

.chat-textarea:focus {
  border-color: var(--el-color-primary);
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 12px;
  color: var(--ink-text-secondary);
}

/* ---- Tool call styles ---- */

.tool-calls-section {
  margin-bottom: 10px;
}

.tool-calls-section :deep(.el-collapse) {
  border: none;
}

.tool-calls-section :deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  height: auto;
  padding: 4px 0;
  line-height: normal;
}

.tool-calls-section :deep(.el-collapse-item__wrap) {
  border: none;
}

.tool-calls-section :deep(.el-collapse-item__content) {
  padding-bottom: 4px;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.tool-name {
  font-weight: 600;
  font-family: var(--app-font-mono);
  color: var(--ink-text);
}

.tool-status {
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
}

.tool-status.success {
  color: #67c23a;
}

.tool-status.error {
  color: #f56c6c;
}

.tool-status.running {
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e6a23c;
  animation: status-blink 1.2s infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.tool-detail {
  padding: 4px 0 0;
}

.tool-detail-label {
  font-size: 12px;
  color: var(--ink-text-secondary);
  margin-bottom: 4px;
  margin-top: 6px;
}

.tool-code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  font-family: var(--app-font-mono);
  overflow-x: auto;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre;
}

.tool-call-card {
  background: #f0f1f3;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.tool-call-card:last-child {
  margin-bottom: 10px;
}

.tool-call-card .tool-call-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 4px;
}

.tool-call-card .tool-detail {
  padding: 0;
}

.tool-fade-enter-active {
  transition: all 0.35s ease-out;
}

.tool-fade-leave-active {
  transition: all 0.2s ease-in;
}

.tool-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.tool-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.tool-fade-move {
  transition: transform 0.25s ease;
}

@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    z-index: 20;
    height: 100%;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .chat-sidebar.collapsed {
    width: 0;
    overflow: hidden;
  }

  .sidebar-toggle {
    left: 12px;
  }

  .chat-sidebar:not(.collapsed) ~ .sidebar-toggle {
    left: 268px;
  }

  .bubble {
    max-width: 85%;
  }
}
</style>
