import http from './http'

export interface SkillSummary {
  name: string
  description?: string
  version?: string
  commitId?: string
  directory?: string
  stageCount?: number
  referenceCount?: number
  disabled?: boolean
  copyEnabled?: boolean
}

export interface SkillDetail {
  name: string
  directory: string
  frontmatter: Record<string, any>
  content: string
  fileTree: FileTreeNode[]
}

export interface FileTreeNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileTreeNode[]
}

export interface GitInfo {
  lastCommit?: string
  remoteUrl?: string
  branch?: string
}

export const skillApi = {
  async listSkills(): Promise<SkillSummary[]> {
    const res = await http.get<SkillSummary[]>('/skills')
    return res.data
  },

  async getSkillDetail(name: string): Promise<SkillDetail> {
    const res = await http.get<SkillDetail>(`/skills/${name}`)
    return res.data
  },

  async readFile(name: string, path: string): Promise<{ path: string; content: string }> {
    const res = await http.get<{ path: string; content: string }>(`/skills/${name}/files/${path}`)
    return res.data
  },

  async writeFile(name: string, path: string, content: string): Promise<void> {
    await http.post(`/skills/${name}/files/${path}`, { content })
  },

  async deleteFile(name: string, path: string): Promise<void> {
    await http.delete(`/skills/${name}/files/${path}`)
  },

  async createSkill(data: { name: string }): Promise<void> {
    await http.post('/skills', data)
  },

  async cloneSkill(gitUrl: string, name?: string, branch?: string): Promise<{ name: string; directory: string }> {
    const res = await http.post<{ name: string; directory: string }>('/skills/clone', { gitUrl, name, branch })
    return res.data
  },

  async deleteSkill(name: string): Promise<void> {
    await http.delete(`/skills/${name}`)
  },

  async pullSkill(name: string): Promise<{ output: string; success: boolean }> {
    const res = await http.post<{ output: string; success: boolean }>(`/skills/${name}/pull`)
    return res.data
  },

  async getGitInfo(name: string): Promise<GitInfo> {
    const res = await http.get<GitInfo>(`/skills/${name}/git-info`)
    return res.data
  },

  async uploadSkill(name: string, file: File): Promise<{name: string; directory: string}> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    const res = await http.post<{name: string; directory: string}>('/skills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },

  async disableSkill(name: string): Promise<void> {
    await http.post(`/skills/${name}/disable`)
  },

  async enableSkill(name: string): Promise<void> {
    await http.post(`/skills/${name}/enable`)
  },

  async enableCopySkill(name: string): Promise<void> {
    await http.post(`/skills/${name}/enable-copy`)
  },

  async disableCopySkill(name: string): Promise<void> {
    await http.post(`/skills/${name}/disable-copy`)
  }
}
