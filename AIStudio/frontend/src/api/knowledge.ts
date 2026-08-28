import http from './http'


// ---- Data models ----

export interface KnowledgeDocument {
  id: number
  title: string
  content?: string
  contentPreview?: string
  category: string
  tags: string
  sourceType: string
  fileName?: string
  productLine?: string
  module?: string
  functionPoint?: string
  sourceUrl?: string
  extraFields?: string
  createdAt: string
  updatedAt?: string
  // 动态字段（extraFields 摊平，前端按字段名自动生成列）
  [key: string]: any
}

export interface SearchResult {
  content: string
  title: string
  category: string
  score: number
  documentId: number
  productLine?: string
}

export interface SearchResults {
  results: SearchResult[]
  total: number
}

export interface GraphContext {
  sourceName: string
  sourceType: string
  relationshipType: string
  relationDescription?: string
  targetName: string
  targetType: string
}

export interface GraphRagSearchResult {
  results: SearchResult[]
  total: number
  graphContexts?: GraphContext[]
  mergedContext?: string
}

export interface KnowledgeStatus {
  totalDocuments: number
  vectorSearchEnabled: boolean
  wikiTotal: number
  wikiByStatus: Record<string, number>
  graphStats: Record<string, number>
}

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

// ---- API functions ----

export const knowledgeApi = {
  /** List documents with optional category, sourceType, productLine, module, functionPoint, keyword filter and pagination */
  listDocuments(category?: string, sourceType?: string, productLine?: string,
                module?: string, functionPoint?: string, keyword?: string,
                page?: number, size?: number) {
    const params: Record<string, any> = {}
    if (category) params.category = category
    if (sourceType) params.sourceType = sourceType
    if (productLine) params.productLine = productLine
    if (module) params.module = module
    if (functionPoint) params.functionPoint = functionPoint
    if (keyword) params.keyword = keyword
    if (page !== undefined) params.page = page
    if (size !== undefined) params.size = size
    return http.get<PageResult<KnowledgeDocument>>('/knowledge', { params }).then(r => r.data)
  },

  /** Get a single document by id */
  getDocument(id: number) {
    return http.get<KnowledgeDocument>(`/knowledge/${id}`).then(r => r.data)
  },

  /** Upload a document (multipart form-data or JSON body) */
  uploadDocument(data: FormData | object) {
    const isFormData = data instanceof FormData
    return http.post<KnowledgeDocument>('/knowledge', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }).then(r => r.data)
  },

  /** Delete a document by id */
  deleteDocument(id: number) {
    return http.delete(`/knowledge/${id}`)
  },

  /** Update a document by id */
  updateDocument(id: number, data: { title?: string; category?: string; tags?: string; productLine?: string; module?: string; functionPoint?: string; content?: string; extraFields?: string }) {
    return http.put<KnowledgeDocument>(`/knowledge/${id}`, data).then(r => r.data)
  },

  /** Search knowledge base (mode: 'default' | 'semantic' | 'graphrag') + context filters */
  searchKnowledge(query: string, topK?: number, mode?: string, filters?: {
    category?: string; sourceType?: string; productLine?: string; module?: string; functionPoint?: string
  }) {
    const params: Record<string, any> = { q: query }
    if (topK !== undefined) params.topK = topK
    if (mode) params.mode = mode
    if (filters) {
      if (filters.category) params.category = filters.category
      if (filters.sourceType) params.sourceType = filters.sourceType
      if (filters.productLine) params.productLine = filters.productLine
      if (filters.module) params.module = filters.module
      if (filters.functionPoint) params.functionPoint = filters.functionPoint
    }
    return http.get<GraphRagSearchResult>('/knowledge/search', { params }).then(r => r.data)
  },

  /** Re-index all knowledge documents (build vector index / graph) */
  reindex() {
    return http.post<{ processed: number }>('/knowledge/reindex').then(r => r.data)
  },

  /** Get knowledge base status */
  status() {
    return http.get<KnowledgeStatus>('/knowledge/status').then(r => r.data)
  },

  /** List all categories, optionally filtered by source type */
  listCategories(sourceType?: string) {
    const params: Record<string, string> = {}
    if (sourceType) params.sourceType = sourceType
    return http.get<string[]>('/knowledge/categories', { params }).then(r => r.data)
  },

  /** List all source types */
  listSourceTypes() {
    return http.get<string[]>('/knowledge/source-types').then(r => r.data)
  },

  /** List product lines, optionally filtered by source type */
  async listProductLines(sourceType?: string): Promise<{name: string, displayName: string}[]> {
    const params: Record<string, string> = {}
    if (sourceType) params.sourceType = sourceType
    const res = await http.get<{name: string, displayName: string}[]>('/knowledge/product-lines', { params })
    return res.data
  },

  /** List modules, optionally filtered by source type */
  async listModules(sourceType?: string): Promise<string[]> {
    const params: Record<string, string> = {}
    if (sourceType) params.sourceType = sourceType
    const res = await http.get<string[]>('/knowledge/modules', { params })
    return res.data
  },

  /** List function points, optionally filtered by source type */
  async listFunctionPoints(sourceType?: string): Promise<string[]> {
    const params: Record<string, string> = {}
    if (sourceType) params.sourceType = sourceType
    const res = await http.get<string[]>('/knowledge/function-points', { params })
    return res.data
  },

  /** Columns descriptor: actual fields/tags present in data, for dynamic table */
  async listColumns(): Promise<string[]> {
    const res = await http.get<string[]>('/knowledge/columns')
    return res.data
  }
}

// ===================== 链接配置（持久化链接库） =====================

export interface LinkConfig {
  id?: number
  name: string
  url: string
  fetchMode?: string
  category?: string
  tags?: string
  productLine?: string
  module?: string
  functionPoint?: string
  enabled?: boolean
  lastStatus?: string
  lastMessage?: string
  lastFetchedAt?: string
  createdAt?: string
  updatedAt?: string
}

export const linkConfigApi = {
  list(enabled?: boolean) {
    const params: Record<string, any> = {}
    if (enabled !== undefined) params.enabled = enabled
    return http.get<LinkConfig[]>('/knowledge/links', { params }).then(r => r.data)
  },
  create(data: LinkConfig) {
    return http.post<LinkConfig>('/knowledge/links', data).then(r => r.data)
  },
  update(id: number, data: Partial<LinkConfig>) {
    return http.put<LinkConfig>(`/knowledge/links/${id}`, data).then(r => r.data)
  },
  delete(id: number) {
    return http.delete(`/knowledge/links/${id}`)
  },
  fetchOne(id: number) {
    return http.post<LinkConfig>(`/knowledge/links/${id}/fetch`).then(r => r.data)
  },
  fetchAll() {
    return http.post<{ total: number; success: number; failed: number }>('/knowledge/links/fetch-all').then(r => r.data)
  }
}
