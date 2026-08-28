import http from './http'

export interface CodeRepository {
  id?: number
  name: string
  displayName: string
  tfsPath: string
  branch: string
  businessTags: string
  projectName: string
  repoId?: string
  opsAppId?: string
  productLine?: string
  productLineId?: number
  productLineName?: string
  productLineIds?: string
  productLineNames?: string
  description?: string
  claudeMd?: string
  docsPath?: string
  scanEnabled?: boolean
  lastScannedCommitId?: string
  lastScannedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface RepoModule {
  id?: number
  repoId?: number
  moduleName: string
  moduleType: string
  iteration?: string
  parentModule?: string
  enabled: boolean
}

export function listRepositories(search?: string, tag?: string) {
  return http.get<CodeRepository[]>('/repositories', { params: { search, tag } }).then(r => r.data)
}

export function getRepository(id: number) {
  return http.get<CodeRepository>(`/repositories/${id}`).then(r => r.data)
}

export function createRepository(repo: CodeRepository) {
  return http.post<CodeRepository>('/repositories', repo).then(r => r.data)
}

export function updateRepository(id: number, repo: CodeRepository) {
  return http.put<CodeRepository>(`/repositories/${id}`, repo).then(r => r.data)
}

export function deleteRepository(id: number) {
  return http.delete(`/repositories/${id}`).then(r => r.data)
}

export function getAllTags() {
  return http.get<string[]>('/repositories/tags/all').then(r => r.data)
}

// 子模块
export function getModules(repoId: number) {
  return http.get<RepoModule[]>(`/repositories/${repoId}/modules`).then(r => r.data)
}

export function saveModules(repoId: number, modules: RepoModule[]) {
  return http.post(`/repositories/${repoId}/modules`, modules).then(r => r.data)
}

export function toggleModule(moduleId: number) {
  return http.put(`/repositories/modules/${moduleId}/toggle`).then(r => r.data)
}

export function seedRepositories() {
  return http.post('/repositories/seed').then(r => r.data)
}

export function saveRepoClaudeMd(id: number, claudeMd: string) {
  return http.put(`/repositories/${id}/claude-md`, { claudeMd }).then(r => r.data)
}

// 文档目录文件 API
export interface RepoFile {
  path: string
  name: string
  size: number
  type: 'file' | 'directory'
  children?: RepoFile[]
}

export function getRepoFiles(id: number) {
  return http.get<RepoFile[]>(`/repositories/${id}/files`).then(r => r.data)
}

export function readRepoFile(id: number, path: string) {
  return http.get<string>(`/repositories/${id}/files/${path}`).then(r => r.data)
}

export function writeRepoFile(id: number, path: string, content: string) {
  return http.put(`/repositories/${id}/files/${path}`, { content }).then(r => r.data)
}
