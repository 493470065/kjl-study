import http from './http'

/**
 * 自动化管理（Automate）API 客户端
 * 命名约定：前端标识符统一为 Automate*；
 * 后端接口路径（/pipeline/*）与 pipelineId 字段为后端契约，保持不变。
 */

export interface AutomateStageResult {
  id: number
  stage: string
  status: string
  input?: string
  output?: string
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface AutomateTask {
  id: number
  tfsWorkItemId: number
  tfsTitle: string
  projectId?: string
  currentStage?: string
  status: string
  error?: string
  retryCount: number
  createdAt: string
  updatedAt?: string
  stageResults: AutomateStageResult[]
  skillName?: string
  productLineId?: number
  repoIds?: string
  confirmMessage?: string
  executionLog?: string
  interactive?: boolean
  workflowDefinitionId?: number
  workflowExecutionId?: number
  workflowPauseMode?: string
  taskType?: string
  paramsJson?: string
  createdBy?: string
  /** 本任务使用的 LLM 模型（空=全局模型） */
  model?: string
}

/** 任务类型启动表单字段定义（与后端 formSchema JSON 对应） */
export interface AutomateFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'textarea' | 'select'
  required?: boolean
  options?: { label: string; value: string }[]
  default?: string | number
  placeholder?: string
}

/** 自动化任务类型（统一入口的任务模板） */
export interface AutomateTaskType {
  id: number
  code: string
  name: string
  description?: string
  icon?: string
  skillName?: string
  workflowDefinitionId?: number
  /** 指定 LLM 模型（llm_providers.model_name；空=全局模型） */
  model?: string
  formSchema?: string
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface AutomateLog {
  timestamp: string
  level: string
  message: string
}

export interface AutomateExecutionStep {
  id: number
  pipelineId: number
  seqNo: number
  type: string
  status: string
  title: string
  detail?: string
  metadata?: string
  startedAt: string
  completedAt?: string
}

export interface AutomateFileChange {
  id: number
  pipelineId: number
  repoId?: number
  branch?: string
  filePath: string
  changeType: string
  oldContent?: string
  newContent?: string
  summary?: string
  createdAt: string
}

export interface AutomateArtifact {
  id: number
  pipelineId: number
  filePath: string
  artifactType: string
  summary?: string
  content?: string
  repoId?: number
  branch?: string
  createdAt: string
}

export const automateApi = {
  start(tfsWorkItemId: number, projectId?: string, skillName?: string, productLineId?: number, repoIds?: string, workflowDefinitionId?: number) {
    return http.post<AutomateTask>('/pipeline/start', { tfsWorkItemId, projectId, skillName, productLineId, repoIds, workflowDefinitionId }).then(r => r.data)
  },

  /** 按任务类型启动（统一入口） */
  startTyped(taskType: string, params: Record<string, unknown>) {
    return http.post<AutomateTask>('/pipeline/start', { taskType, params }).then(r => r.data)
  },

  get(id: number) {
    return http.get<AutomateTask>(`/pipeline/${id}`).then(r => r.data)
  },

  list() {
    return http.get<AutomateTask[]>('/pipeline').then(r => r.data)
  },

  retry(id: number) {
    return http.post<AutomateTask>(`/pipeline/${id}/retry`).then(r => r.data)
  },

  delete(id: number) {
    return http.delete(`/pipeline/${id}`).then(r => r.data)
  },

  getLogs(id: number) {
    return http.get<AutomateLog[]>(`/pipeline/${id}/logs`).then(r => r.data)
  },

  getSteps(id: number) {
    return http.get<AutomateExecutionStep[]>(`/pipeline/${id}/steps`).then(r => r.data)
  },

  confirm(id: number, approved: boolean, comment?: string) {
    return http.post(`/pipeline/${id}/confirm`, { approved, comment }).then(r => r.data)
  },

  getChanges(id: number) {
    return http.get<AutomateFileChange[]>(`/pipeline/${id}/changes`).then(r => r.data)
  },

  getArtifacts(id: number) {
    return http.get<AutomateArtifact[]>(`/pipeline/${id}/artifacts`).then(r => r.data)
  },

  retryWorkflowNode(id: number, nodeId: string) {
    return http.post<AutomateTask>(`/pipeline/${id}/workflow/retry-node`, { nodeId }).then(r => r.data)
  },

  continueWorkflowNode(id: number, nodeId: string, supplementalInput: string) {
    return http.post<AutomateTask>(`/pipeline/${id}/workflow/continue`, { nodeId, supplementalInput }).then(r => r.data)
  }
}

/** 任务类型管理 */
export const taskTypeApi = {
  list(enabledOnly = false) {
    return http.get<AutomateTaskType[]>('/automate/task-types', { params: { enabledOnly } }).then(r => r.data)
  },

  create(data: Partial<AutomateTaskType> & { formSchema?: string }) {
    return http.post<AutomateTaskType>('/automate/task-types', data).then(r => r.data)
  },

  update(id: number, data: Partial<AutomateTaskType>) {
    return http.put<AutomateTaskType>(`/automate/task-types/${id}`, data).then(r => r.data)
  },

  remove(id: number) {
    return http.delete(`/automate/task-types/${id}`).then(r => r.data)
  }
}
