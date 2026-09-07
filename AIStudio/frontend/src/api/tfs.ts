import http from './http'


export interface TfsWorkItem {
  id: number
  title: string
  type: string
  state: string
  /** 需求性质（卫宁自定义字段 Microsoft.VSTS.CMMI.RequirementType：功能性/接口/软件质量） */
  requirementType?: string
  /** 完成日期（TFS 调度字段 Microsoft.VSTS.Scheduling.FinishDate），超期状态判定依据（积压报表口径） */
  finishDate?: string
  assignedTo?: string
  project?: string
  /** 产品名称（卫宁自定义字段 Winning.Product.Name） */
  productName?: string
  /** 客户名称（卫宁自定义字段 Winning.Custom.Name） */
  customerName?: string
  description?: string
  reproSteps?: string
  priority?: number
  severity?: string
  areaPath?: string
  iterationPath?: string
  tags?: string
  createdDate?: string
  changedDate?: string
  requirementAnalysis?: string
  acceptanceCriteria?: string
  url?: string
}

export interface TfsProject {
  name: string
  id: string
}

export interface TfsStatus {
  available: boolean
  message: string
}

export interface TfsAttachment {
  index: number
  name: string
  url: string
}

// TFS 存储查询实测可达 50s+（后端 120s 结果缓存过期后需重新 spawn MCP 进程查 TFS），
// 全局 30s 超时会掐断请求 → 前端报「加载失败，请检查查询链接配置或 TFS 服务」。
// 后端 MCP 调用上限 120s，这里放宽到 150s 对齐；其他轻接口沿用全局 30s。
const TFS_HEAVY_TIMEOUT = 150000

export const tfsApi = {
  getStatus() {
    return http.get<TfsStatus>('/tfs/status').then(r => r.data)
  },

  listProjects() {
    return http.get<TfsProject[]>('/tfs/projects', { timeout: TFS_HEAVY_TIMEOUT }).then(r => r.data)
  },

  getWorkItem(id: number) {
    return http.get<TfsWorkItem>(`/tfs/work-items/${id}`).then(r => r.data)
  },

  getWorkItems(ids: number[]) {
    return http.get<TfsWorkItem[]>('/tfs/work-items/batch', {
      params: { ids: ids.join(',') },
      timeout: TFS_HEAVY_TIMEOUT
    }).then(r => r.data)
  },

  getWorkItemsByQuery(queryId: string, project?: string, refresh?: boolean) {
    const params: any = { queryId }
    if (project) params.project = project
    if (refresh) params.refresh = 'true'   // 后端 SWR 缓存：强刷绕过新鲜期同步取最新
    return http.get<TfsWorkItem[]>('/tfs/query', { params, timeout: TFS_HEAVY_TIMEOUT }).then(r => r.data)
  },

  /** 关注需求：当前 PAT 账号在 TFS 关注的工作项（跨项目），走专用 following 端点 */
  getFollowed(refresh?: boolean) {
    const params: any = {}
    if (refresh) params.refresh = 'true'
    return http.get<TfsWorkItem[]>('/tfs/following', { params, timeout: TFS_HEAVY_TIMEOUT }).then(r => r.data)
  },

  createWorkItem(data: {
    project: string
    type: string
    title: string
    description?: string
    assignedTo?: string
    parentId?: number
    priority?: number
    tags?: string
  }) {
    return http.post<TfsWorkItem>('/tfs/work-items', data).then(r => r.data)
  },

  updateWorkItem(id: number, updates: Record<string, string>, comment?: string) {
    return http.put<TfsWorkItem>(`/tfs/work-items/${id}`, { updates, comment }).then(r => r.data)
  },

  listAttachments(id: number) {
    return http.get<TfsAttachment[]>(`/tfs/work-items/${id}/attachments`).then(r => r.data)
  }
}
