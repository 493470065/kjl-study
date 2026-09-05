import http from './http'


export interface TfsWorkItem {
  id: number
  title: string
  type: string
  state: string
  /** 需求性质（卫宁自定义字段 Microsoft.VSTS.CMMI.RequirementType：功能性/接口/软件质量） */
  requirementType?: string
  /** 目标日期（TFS 调度字段 Microsoft.VSTS.Scheduling.TargetDate），超期状态判定依据 */
  targetDate?: string
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

export const tfsApi = {
  getStatus() {
    return http.get<TfsStatus>('/tfs/status').then(r => r.data)
  },

  listProjects() {
    return http.get<TfsProject[]>('/tfs/projects').then(r => r.data)
  },

  getWorkItem(id: number) {
    return http.get<TfsWorkItem>(`/tfs/work-items/${id}`).then(r => r.data)
  },

  getWorkItems(ids: number[]) {
    return http.get<TfsWorkItem[]>('/tfs/work-items/batch', {
      params: { ids: ids.join(',') }
    }).then(r => r.data)
  },

  getWorkItemsByQuery(queryId: string, project?: string) {
    const params: any = { queryId }
    if (project) params.project = project
    return http.get<TfsWorkItem[]>('/tfs/query', { params }).then(r => r.data)
  },

  /** 关注需求：当前 PAT 账号在 TFS 关注的工作项（跨项目），走专用 following 端点 */
  getFollowed() {
    return http.get<TfsWorkItem[]>('/tfs/following').then(r => r.data)
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
