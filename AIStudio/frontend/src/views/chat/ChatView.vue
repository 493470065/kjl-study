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
      <div v-if="!sidebarCollapsed" class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.conversationId"
          :class="['conversation-item', { active: conv.conversationId === currentConversationId }]"
          @click="switchConversation(conv.conversationId)"
        >
          <el-icon class="conv-icon"><ChatDotRound /></el-icon>
          <div class="conv-item-text">
            <div class="conv-title" :title="conv.title">{{ conv.title || '新对话' }}</div>
            <div class="conv-time" v-if="conv.createdAt">{{ formatConvTime(conv.createdAt) }}</div>
          </div>
          <el-button class="conv-delete" text size="small" @click.stop="handleDeleteConversation(conv.conversationId)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div v-if="conversations.length === 0" class="no-conversations">暂无对话，点击"新对话"开始</div>
      </div>
    </aside>

    <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
      <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
    </button>

    <main class="chat-main">
      <div ref="messageListRef" class="message-list">
        <div v-if="messages.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon"><ChatDotRound /></el-icon>
          <p>开始一段新对话吧</p>
        </div>

        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="bubble">
            <div v-if="msg.role === 'assistant'">
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

      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            ref="textareaRef"
            v-model="inputText"
            class="chat-textarea"
            placeholder="输入问题，或粘贴需求号... (Ctrl+Enter 发送)"
            rows="3"
            @keydown="handleKeydown"
          />
          <div class="input-actions">
            <span class="hint">Ctrl + Enter 发送</span>
            <el-button type="primary" :loading="loading" :disabled="!inputText.trim()" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, type Component } from 'vue'
import {
  Plus, Delete, ChatDotRound, Fold, Expand,
  Search, Folder, Document, Setting, Tools
} from '@element-plus/icons-vue'
import { chatApi } from '@/api/chat'
import type { ChatMessage, ToolCallInfo, ConversationInfo } from '@/api/chat'
import { useMarkdown } from '@/composables/useMarkdown'

const { renderMarkdown } = useMarkdown()

const conversations = ref<ConversationInfo[]>([])
const currentConversationId = ref<string | undefined>(undefined)
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const streamingContent = ref('')
const sidebarCollapsed = ref(false)
const pendingToolCalls = ref<ToolCallInfo[]>([])

const messageListRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

let abortController: AbortController | null = null

onMounted(async () => {
  await loadConversations()
  const savedId = localStorage.getItem('chat-conversation-id')
  if (savedId && conversations.value.some(c => c.conversationId === savedId)) {
    currentConversationId.value = savedId
    try {
      const history = await chatApi.getHistory(savedId)
      messages.value = history
      scrollToBottom()
    } catch {
      messages.value = []
    }
  }
})

async function loadConversations() {
  try {
    const list = await chatApi.getConversations()
    conversations.value = list
  } catch {
    conversations.value = []
  }
}

function createNewChat() {
  currentConversationId.value = undefined
  messages.value = []
  streamingContent.value = ''
  pendingToolCalls.value = []
  localStorage.removeItem('chat-conversation-id')
}

async function switchConversation(convId: string) {
  if (convId === currentConversationId.value) return
  currentConversationId.value = convId
  localStorage.setItem('chat-conversation-id', convId)
  streamingContent.value = ''
  pendingToolCalls.value = []
  try {
    const history = await chatApi.getHistory(convId)
    messages.value = history
    scrollToBottom()
  } catch {
    messages.value = []
  }
}

async function handleDeleteConversation(convId: string) {
  try {
    await chatApi.deleteConversation(convId)
    conversations.value = conversations.value.filter(c => c.conversationId !== convId)
    if (currentConversationId.value === convId) {
      currentConversationId.value = undefined
      messages.value = []
      localStorage.removeItem('chat-conversation-id')
    }
  } catch {
    // silently fail
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

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text, createdAt: new Date().toISOString() })
  inputText.value = ''
  loading.value = true
  streamingContent.value = ''
  pendingToolCalls.value = []

  scrollToBottom()
  abortController = new AbortController()

  try {
    const result = await chatApi.stream(
      text,
      undefined,
      currentConversationId.value,
      {
        onChunk(chunk: string) {
          streamingContent.value += chunk
          scrollToBottom()
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
          const msg: ChatMessage = { role: 'assistant', content: fullText, createdAt: new Date().toISOString() }
          if (pendingToolCalls.value.length > 0) {
            msg.toolCalls = [...pendingToolCalls.value]
          }
          messages.value.push(msg)
          streamingContent.value = ''
          pendingToolCalls.value = []
          loading.value = false
          if (conversationId) {
            currentConversationId.value = conversationId
            localStorage.setItem('chat-conversation-id', conversationId)
          }
          loadConversations()
          scrollToBottom()
        },
        onError(error: string) {
          const isConfigError = error.includes('请先在「个人配置」中设置')
          messages.value.push({
            role: 'assistant',
            content: isConfigError ? error : '请求失败: ' + error,
            createdAt: new Date().toISOString()
          })
          streamingContent.value = ''
          pendingToolCalls.value = []
          loading.value = false
          scrollToBottom()
        }
      },
      abortController.signal
    )

    if (loading.value && result) {
      const msg: ChatMessage = { role: 'assistant', content: result, createdAt: new Date().toISOString() }
      if (pendingToolCalls.value.length > 0) {
        msg.toolCalls = [...pendingToolCalls.value]
      }
      messages.value.push(msg)
      streamingContent.value = ''
      pendingToolCalls.value = []
      loading.value = false
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    messages.value.push({ role: 'assistant', content: '请求失败: ' + errMsg, createdAt: new Date().toISOString() })
    loading.value = false
    streamingContent.value = ''
    pendingToolCalls.value = []
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    sendMessage()
  }
}

function renderMsg(msg: ChatMessage): string {
  return renderMarkdown(msg.content)
}

function renderStreaming(): string {
  return renderMarkdown(streamingContent.value)
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
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
  background: #f7f8fa;
  border-right: 1px solid #e8e8e8;
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
  border-bottom: 1px solid #e8e8e8;
  min-height: 52px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
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

.conversation-item:hover {
  background: #e8e9eb;
}

.conversation-item.active {
  background: #d9ecff;
  color: #409eff;
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
  color: #909399;
  margin-top: 2px;
}

.conv-delete {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.conversation-item:hover .conv-delete {
  opacity: 1;
}

.no-conversations {
  text-align: center;
  color: #999;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.25s ease;
}

.chat-sidebar.collapsed ~ .sidebar-toggle {
  left: 56px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
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
  color: #999;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  color: #ccc;
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
  background: #409eff;
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
  background: #ecf5ff;
  border-top-right-radius: 4px;
}

.message.assistant .bubble {
  background: #f4f4f5;
  border-top-left-radius: 4px;
}

.plain-text {
  white-space: pre-wrap;
}

.msg-time {
  font-size: 11px;
  color: #999;
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
  color: #409eff;
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
  background: #e8e8e8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
  background: #f5f5f5;
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
  color: #999;
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
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
  background: #999;
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

.input-area {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fff;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.chat-textarea:focus {
  border-color: #409eff;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 12px;
  color: #999;
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
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #303133;
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
  color: #909399;
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
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
