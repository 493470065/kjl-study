import http from './http'

/**
 * 项目工作台数据快照（通用 JSON 文档存储，后端 project_journal 表）。
 * scope：项目标识；bucket：数据分类（milestones/docs/weeks/evals...）。
 */
export const journalApi = {
  /** 读取某项目全部 bucket：{ bucket: 载荷 } */
  async loadAll(scope: string): Promise<Record<string, any>> {
    return http.get(`/journal/${scope}`).then(r => r.data)
  },
  /** 读取单个 bucket（无数据返回 []） */
  async load<T = any>(scope: string, bucket: string): Promise<T> {
    return http.get(`/journal/${scope}/${bucket}`).then(r => r.data)
  },
  /** 整包覆盖写入 */
  async save(scope: string, bucket: string, payload: any): Promise<void> {
    await http.put(`/journal/${scope}/${bucket}`, payload)
  },
  /** 多语专项：从金山文档跟踪表同步 WBS 里程碑（后端调 kdocs-cli 分块拉取+重算，耗时约 30~60s，放宽超时） */
  async syncWbs(): Promise<any[]> {
    return http.post('/i18n/wbs-sync', null, { timeout: 180000 }).then(r => r.data.milestones)
  }
}
