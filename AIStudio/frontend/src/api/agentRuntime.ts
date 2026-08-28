import http from './http'

/**
 * Agent 运行时 API。
 * 提供与 Agent 对话、会话管理等功能。
 *
 * 重要：SSE 流式请求直连后端 8091，绕过 Vite 开发代理（代理会缓冲 SSE 导致浏览器收不到流式数据）。
 */

export interface AgentChatResponse {
  content: string
  conversationId: string
  role: string
}

export interface AgentConversation {
  conversationId: string
  title: string
  createdAt: string
}

export interface AgentMessage {
  role: string
  content: string
  toolCalls?: string
  createdAt: string
}

/** 后端地址（SSE 直连用） */
const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8091`

/**
 * 读取登录令牌（与 http.ts 拦截器同源：localStorage/sessionStorage 的 auth）。
 * SSE 使用原生 fetch，无法复用 axios 拦截器，需手动附加，
 * 否则后端识别不到用户，会话会存成 anonymous，历史对话列表按用户过滤后为空。
 */
function getAuthToken(): string | null {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
  if (!raw) return null
  try {
    const auth = JSON.parse(raw)
    return auth.token || null
  } catch {
    return null
  }
}

/**
 * 解析 SSE 文本流。
 * 按事件分隔符（\n\n）切分，提取每个事件的 data: 行并回调。
 * 注意：Spring SseEmitter 输出 "data:" 后无空格，解析时不能要求 "data: "；
 * 同一事件内多个 data: 行需按 SSE 规范用 \n 拼接。
 */
function parseSSEBuffer(
  buffer: string,
  onContent: (text: string) => void,
  onProgress: (step: number, total: number, label: string, status: string) => void,
  onDone: (conversationId: string) => void,
  onError: (msg: string) => void,
  onProcess?: (evt: Record<string, any>) => void
): string {
  const events = buffer.split('\n\n')
  // 最后一个块可能不完整，保留到下次
  const remaining = events.pop() || ''

  for (const event of events) {
    const dataLines = event
      .split('\n')
      .filter(l => l.trimStart().startsWith('data:'))
      .map(l => l.trimStart().substring(5))
    if (dataLines.length === 0) continue

    const data = dataLines.join('\n').trim()
    if (!data || data === '[DONE]') continue
    if (data.startsWith('[ERROR]')) {
      onError(data.substring(7))
      continue
    }

    try {
      const parsed = JSON.parse(data)
      switch (parsed.type) {
        case 'content':
          onContent(parsed.content)
          break
        case 'progress':
          onProgress(
            Number(parsed.step) || 0,
            Number(parsed.total) || 0,
            parsed.label || '',
            parsed.status || ''
          )
          break
        case 'process':
          if (onProcess) onProcess(parsed)
          break
        case 'done':
          onDone(parsed.conversationId || '')
          break
      }
    } catch {
      // 非 JSON 数据忽略（如注释）
    }
  }
  return remaining
}

export const agentRuntimeApi = {
  /**
   * 向 Agent 发送消息（非流式）。
   */
  chat(agentName: string, message: string, conversationId?: string) {
    return http.post<AgentChatResponse>(`/agents/${agentName}/chat`, {
      message,
      conversationId
    }).then(r => r.data)
  },

  /**
   * 向 Agent 发送消息（SSE 流式）—— 重构版。
   *
   * 核心改进：
   * - 使用原生 fetch + ReadableStream，但加了多层保障
   * - 直连后端 8091，绕过 Vite 代理
   * - 每个步骤都有详细日志和状态回调
   * - 连接/首字节超时检测
   */
  streamChat(
    agentName: string,
    message: string,
    conversationId: string | undefined,
    onMessage: (text: string) => void,
    onDone: (conversationId: string) => void,
    onError: (err: string) => void,
    onProgress?: (step: number, total: number, label: string, status: string) => void,
    onProcess?: (evt: Record<string, any>) => void
  ): AbortController {
    const controller = new AbortController()
    const url = `${BACKEND_URL}/api/agents/${agentName}/chat/stream`

    console.log('[Agent-SSE] ===== 开始流式请求 =====')
    console.log('[Agent-SSE] URL:', url)
    console.log('[Agent-SSE] Agent:', agentName)
    console.log('[Agent-SSE] Message:', message.substring(0, 50))

    // 超时检测：15 秒内没收到任何数据就报错
    let receivedAnyData = false
    const firstByteTimeout = setTimeout(() => {
      if (!receivedAnyData && !controller.signal.aborted) {
        console.error('[Agent-SSE] 首字节超时(15s)：后端无响应，可能网关不可达或连接被阻塞')
        controller.abort()
        onError('连接超时：后端 15 秒内无响应，请检查后端服务是否正常运行（8091 端口）')
      }
    }, 15000)

    // 附加 JWT：SSE 走原生 fetch 不经过 axios 拦截器，缺失会导致会话存成 anonymous
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = getAuthToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversationId }),
      signal: controller.signal
    }).then(async response => {
      console.log('[Agent-SSE] 响应状态:', response.status, response.statusText)
      console.log('[Agent-SSE] 响应头 Content-Type:', response.headers.get('content-type'))
      console.log('[Agent-SSE] 响应头全部:', [...response.headers.entries()])

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        console.error('[Agent-SSE] HTTP 错误', response.status, ':', errText)
        onError(`HTTP ${response.status}: ${errText || response.statusText}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        console.error('[Agent-SSE] response.body 为空，无法读取流')
        onError('无法读取响应流（body 为空）')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log(`[Agent-SSE] 流结束，共 ${chunkCount} 个 chunk`)
            break
          }

          chunkCount++
          if (!receivedAnyData) {
            receivedAnyData = true
            clearTimeout(firstByteTimeout)
            console.log(`[Agent-SSE] ✅ 首个 chunk 到达（第 ${chunkCount} 个），大小 ${value.length} 字节`)
          }

          buffer += decoder.decode(value, { stream: true })
          buffer = parseSSEBuffer(
            buffer,
            (text) => {
              onMessage(text)
              // 每 10 个 content 事件打一次日志（避免刷屏）
              if (chunkCount % 10 < 2) {
                console.log(`[Agent-SSE] content(${text.length}字): "${text.substring(0, 40)}..."`)
              }
            },
            (step, total, label, status) => {
              console.log(`[Agent-SSE] 进度: ${label} [${step}/${total}] status=${status}`)
              if (onProgress) onProgress(step, total, label, status)
            },
            (convId) => {
              console.log('[Agent-SSE] ✅ 完成, conversationId:', convId)
              onDone(convId)
            },
            (errMsg) => {
              console.warn('[Agent-SSE] 服务端错误:', errMsg)
              onError(errMsg)
            },
            (evt) => {
              if (onProcess) onProcess(evt)
            }
          )
        }
      } catch (readErr: any) {
        if (readErr.name === 'AbortError') {
          console.log('[Agent-SSE] 请求被取消')
        } else {
          console.error('[Agent-SSE] 读取流异常:', readErr)
          onError(readErr.message || '读取响应流时出错')
        }
      }
    }).catch((err: any) => {
      clearTimeout(firstByteTimeout)
      if (err.name === 'AbortError') {
        console.log('[Agent-SSE] 请求被中止（AbortError）')
        // 不调用 onError，因为 abort 是用户主动取消
      } else {
        console.error('[Agent-SSE] fetch 异常:', err.name, err.message, err)
        const msg = err.message || ''
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          onError('网络错误：无法连接后端服务（8091），请确认后端已启动')
        } else if (msg.includes('CORS')) {
          onError('CORS 跨域错误：后端未允许前端来源访问')
        } else {
          onError(msg || '请求失败')
        }
      }
    })

    return controller
  },

  /**
   * 获取 Agent 的对话列表。
   */
  listConversations(agentName: string) {
    return http.get<AgentConversation[]>(`/agents/${agentName}/conversations`).then(r => r.data)
  },

  /**
   * 获取对话历史。
   */
  getHistory(conversationId: string) {
    return http.get<AgentMessage[]>(`/agents/conversations/${conversationId}/history`).then(r => r.data)
  },

  /**
   * 删除对话。
   */
  deleteConversation(conversationId: string) {
    return http.delete(`/agents/conversations/${conversationId}`)
  }
}
