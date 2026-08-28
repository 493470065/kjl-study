import http from './http'


export interface PipelineStageResult {
  id: number
  stage: string
  status: string
  input?: string
  output?: string
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface PipelineTask {
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
  stageResults: PipelineStageResult[]
  skillName?: string
  productLineId?: number
  repoIds?: string
  confirmMessage?: string
  executionLog?: string
  interactive?: boolean
  workflowDefinitionId?: number
  workflowExecutionId?: number
  workflowPauseMode?: string
}

export interface PipelineLog {
  timestamp: string
  level: string
  message: string
}

export interface PipelineExecutionStep {
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

export interface PipelineFileChange {
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

export interface PipelineArtifact {
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

export const pipelineApi = {
  start(tfsWorkItemId: number, projectId?: string, skillName?: string, productLineId?: number, repoIds?: string, workflowDefinitionId?: number) {
    return http.post<PipelineTask>('/pipeline/start', { tfsWorkItemId, projectId, skillName, productLineId, repoIds, workflowDefinitionId }).then(r => r.data)
  },

  get(id: number) {
    return http.get<PipelineTask>(`/pipeline/${id}`).then(r => r.data)
  },

  list() {
    return http.get<PipelineTask[]>('/pipeline').then(r => r.data)
  },

  retry(id: number) {
    return http.post<PipelineTask>(`/pipeline/${id}/retry`).then(r => r.data)
  },

  delete(id: number) {
    return http.delete(`/pipeline/${id}`).then(r => r.data)
  },

  getLogs(id: number) {
    return http.get<PipelineLog[]>(`/pipeline/${id}/logs`).then(r => r.data)
  },

  getSteps(id: number) {
    return http.get<PipelineExecutionStep[]>(`/pipeline/${id}/steps`).then(r => r.data)
  },

  confirm(id: number, approved: boolean, comment?: string) {
    return http.post(`/pipeline/${id}/confirm`, { approved, comment }).then(r => r.data)
  },

  getChanges(id: number) {
    return http.get<PipelineFileChange[]>(`/pipeline/${id}/changes`).then(r => r.data)
  },

  getArtifacts(id: number) {
    return http.get<PipelineArtifact[]>(`/pipeline/${id}/artifacts`).then(r => r.data)
  },

  retryWorkflowNode(id: number, nodeId: string) {
    return http.post<PipelineTask>(`/pipeline/${id}/workflow/retry-node`, { nodeId }).then(r => r.data)
  },

  continueWorkflowNode(id: number, nodeId: string, supplementalInput: string) {
    return http.post<PipelineTask>(`/pipeline/${id}/workflow/continue`, { nodeId, supplementalInput }).then(r => r.data)
  }
}
