import http from './http'
import { getStoredToken } from '@/utils/authToken'

// ---- SSE event types ----

export interface ContentEvent {
  type: 'content'
  content: string
}

export interface ToolCallEvent {
  type: 'tool_call'
  tool: string
  input: Record<string, any>
}

export interface ToolResultEvent {
  type: 'tool_result'
  tool: string
  success: boolean
  output: string
}

export interface DoneEvent {
  type: 'done'
  conversationId: string
}

// ---- Data models ----

export interface ToolCallInfo {
  tool: string
  input: Record<string, any>
  output?: string
  success?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallInfo[]
  createdAt?: string
}

export interface ConversationInfo {
  conversationId: string
  title: string
  createdAt: string | null
}

export interface StreamCallbacks {
  onChunk: (text: string) => void
  onDone: (fullText: string, conversationId?: string) => void
  onError: (error: string) => void
  onToolCall?: (tool: string, input: Record<string, any>) => void
  onToolResult?: (tool: string, success: boolean, output: string) => void
}

export interface StreamOptions {
  projectId?: string
  conversationId?: string
  /** 指定回答的 Agent（使用其 systemPrompt 人设），缺省为默认助手 */
  agentName?: string
}

/** 首字节超时：后端挂起时不至于无限转圈 */
const FIRST_BYTE_TIMEOUT_MS = 60000

export const chatApi = {
  /** Send a message (non-streaming) */
  send(message: string, projectId?: string, conversationId?: string, agentName?: string) {
    return http
      .post('/chat/message', { message, projectId, conversationId, agentName })
      .then(r => r.data)
  },

  /** Send a message with SSE streaming response */
  async stream(
    message: string,
    options?: StreamOptions,
    callbacks?: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> {
    const token = getStoredToken()

    // 内部 controller：既响应用户中止（外部 signal），也响应首字节超时
    const controller = new AbortController()
    let timedOut = false
    const onOuterAbort = () => controller.abort()
    signal?.addEventListener('abort', onOuterAbort)
    const firstByteTimer = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, FIRST_BYTE_TIMEOUT_MS)

    let fullText = ''
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message,
          projectId: options?.projectId,
          conversationId: options?.conversationId,
          agentName: options?.agentName
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        // 优先读取后端返回的错误体（真实原因通常在 JSON body 里）
        let detail = ''
        try {
          const data = await response.json()
          detail = data?.message || data?.error || data?.content || ''
        } catch { /* body 非 JSON 时忽略 */ }
        callbacks?.onError(detail || `请求失败（HTTP ${response.status}）`)
        return ''
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks?.onError('无法读取响应流')
        return ''
      }

      const decoder = new TextDecoder()
      // 行缓冲：SSE 数据行可能被拆到多次 read() 中，须拼接完整行再解析
      let buffer = ''
      let firstByteReceived = false

    /** 处理单行 SSE 数据，返回 true 表示流已终结（done/error/[DONE]） */
    const processLine = (rawLine: string): boolean => {
      const trimmed = rawLine.trim()
      if (!trimmed || !trimmed.startsWith('data:')) return false

      const data = trimmed.slice(5).trim()

      if (data === '[DONE]') {
        callbacks?.onDone(fullText)
        return true
      }

      if (data.startsWith('[ERROR]')) {
        const errorMsg = data.slice(7)
        callbacks?.onError(errorMsg)
        return true
      }

      // Try to parse as JSON event
      if (data.startsWith('{')) {
        try {
          const event = JSON.parse(data)
          if (event.type === 'content') {
            fullText += event.content
            callbacks?.onChunk(event.content)
          } else if (event.type === 'tool_call') {
            callbacks?.onToolCall?.(event.tool, event.input)
          } else if (event.type === 'tool_result') {
            callbacks?.onToolResult?.(event.tool, event.success, event.output)
          } else if (event.type === 'error') {
            callbacks?.onError(event.content || '未知错误')
            return true
          } else if (event.type === 'done') {
            callbacks?.onDone(fullText, event.conversationId)
            return true
          }
          return false
        } catch {
          // Not valid JSON, fall through to plain text handling
        }
      }

      // Plain text chunk (backward compatible)
      fullText += data
      callbacks?.onChunk(data)
      return false
    }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          if (!firstByteReceived) {
            firstByteReceived = true
            window.clearTimeout(firstByteTimer)
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? '' // 最后一段可能是不完整行，留到下次拼接

          let terminated = false
          for (const line of lines) {
            if (processLine(line)) { terminated = true; break }
          }
          if (terminated) return fullText
        }
        // 流结束后处理残余的最后一行
        if (buffer.trim() && processLine(buffer)) return fullText
      } finally {
        reader.releaseLock()
      }

      callbacks?.onDone(fullText)
      return fullText
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (timedOut && !firstByteReceived) {
          callbacks?.onError('响应超时：服务端长时间未返回数据，请稍后重试')
          return ''
        }
        // 用户主动停止：返回已生成内容，由调用方落为消息
        return fullText
      }
      const errMsg = err instanceof Error ? err.message : String(err)
      callbacks?.onError(errMsg)
      return ''
    } finally {
      window.clearTimeout(firstByteTimer)
      signal?.removeEventListener('abort', onOuterAbort)
    }
  },

  /** List all conversation IDs */
  getConversations(): Promise<ConversationInfo[]> {
    return http.get<ConversationInfo[]>('/chat/conversations').then(r => r.data)
  },

  /** Get message history for a conversation */
  getHistory(conversationId: string): Promise<ChatMessage[]> {
    return http
      .get(`/chat/conversations/${encodeURIComponent(conversationId)}/history`)
      .then(r => r.data)
  },

  /** Delete a conversation */
  deleteConversation(conversationId: string): Promise<void> {
    return http
      .delete(`/chat/conversations/${encodeURIComponent(conversationId)}`)
      .then(() => undefined)
  }
}
