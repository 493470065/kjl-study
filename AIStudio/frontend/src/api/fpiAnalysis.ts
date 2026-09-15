import http from './http'

/** 合理性设计分析结果缓存（后端 fpi_analysis_result，按登录用户隔离，每功能点存最近一次） */
export interface FpiAnalysisCache {
  fpName: string | null
  skillName: string | null
  resultMd: string | null
  dataFingerprint: string | null
  fpSnapshot: string | null
  execDurationMs: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface FpiAnalysisSavePayload {
  fpName?: string | null
  skillName?: string | null
  resultMd?: string | null
  dataFingerprint?: string | null
  fpSnapshot?: string | null
  execDurationMs?: number | null
}

export const fpiAnalysisApi = {
  /** 读取最近一次分析结果；无则 value 为 null。静默失败（后端不可达时降级为无缓存，由调用方提示） */
  async get(lineKey: string, fpCode: string): Promise<{ value: FpiAnalysisCache | null }> {
    const res = await http.get<{ value: FpiAnalysisCache | null }>(
      `/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`,
      { silent: true } as any   // silent: 本项目自定义请求标记，失败不出全局错误弹窗
    )
    return res.data
  },

  /** 保存/覆盖最近一次分析结果（失败仅告警，由调用方兜底提示，不阻断展示） */
  async save(lineKey: string, fpCode: string, payload: FpiAnalysisSavePayload): Promise<void> {
    await http.put(`/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`, payload, {
      silent: true
    } as any)
  },

  /** 删除该功能点的分析结果（预留） */
  async remove(lineKey: string, fpCode: string): Promise<void> {
    await http.delete(`/fpi-analysis/${encodeURIComponent(lineKey)}/${encodeURIComponent(fpCode)}`, {
      silent: true
    } as any)
  }
}
