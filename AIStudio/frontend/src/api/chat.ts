import http from './http'

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

export const chatApi = {
  /** Send a message (non-streaming) */
  send(message: string, projectId?: string, conversationId?: string) {
    return http
      .post('/chat/message', { message, projectId, conversationId })
      .then(r => r.data)
  },

  /** Send a message with SSE streaming response */
  async stream(
    message: string,
    projectId?: string,
    conversationId?: string,
    callbacks?: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> {
    const raw = localStorage.getItem('auth')
    let token = ''
    try { token = raw ? JSON.parse(raw).token : '' } catch {}

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, projectId, conversationId }),
      signal
    })

    if (!response.ok) {
      const errMsg = `HTTP ${response.status}: ${response.statusText}`
      callbacks?.onError(errMsg)
      return ''
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks?.onError('无法读取响应流')
      return ''
    }

    const decoder = new TextDecoder()
    let fullText = ''
    // 行缓冲：SSE 数据行可能被拆到多次 read() 中，须拼接完整行再解析
    let buffer = ''

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
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return fullText
      }
      const errMsg = err instanceof Error ? err.message : String(err)
      callbacks?.onError(errMsg)
    } finally {
      reader.releaseLock()
    }

    callbacks?.onDone(fullText)
    return fullText
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
