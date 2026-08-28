import http from './http'

// === WxP 代理 ===
// 通用 WxP 代理：自动解包 { code: 20000, data: ... } 标准响应
export function wxpProxy(path: string, body: any) {
  return http.post(`/wxp/${path}`, body, { timeout: 120000 }).then(r => {
    const res = r.data
    if (res?.code === 20000 && res?.data !== undefined) {
      return res.data
    }
    return res
  })
}

// 表结构分析 (GET with query params, matching WxP API)
export function tableAnalysis(projectName: string, tableName: string) {
  return http.get('/wxp/modeldesigner/tableAnalysis', { params: { projectName, tableName }, timeout: 120000 }).then(r => {
    const res = r.data
    if (res?.code === 20000 && res?.data !== undefined) {
      return res.data
    }
    return res
  })
}

// 查询 classId
export function queryClassId(projectName: string, tableName: string, moduleName?: string) {
  return wxpProxy('mdclients/aiModeling/queryClassId', { projectName, tableName, moduleName })
}

// 模型分析
export function modelAnalyze(classId: string) {
  return wxpProxy('mdclients/aiModeling/modelAnalyze', { classId })
}

// 查询表字段映射（查询字段）
export function queryTableFieldMapping(projectName: string, tableName: string) {
  return wxpProxy('mdclients/aiModeling/queryTableFieldMapping', { projectName, tableName })
}

// 按字段名查询（字段血缘）
export function queryFieldLineage(projectName: string, displayName: string) {
  return wxpProxy('mdclients/aiModeling/queryFieldLineage', { projectName, displayName })
}

// 补丁查询 DDL
export function ddlPatchSearch(params: any) {
  return wxpProxy('patch/patchSearch/patchList', params)
}

// 补丁查询 DML
export function dmlPatchSearch(params: any) {
  return wxpProxy('patch/patchSearch/dmlPatchList', params)
}

// 版本差异 - 查询实体
export function queryTableInfo(tableName: string) {
  return wxpProxy('mdclients/aiModeling/queryTableInfo', { tableName })
}

// 版本差异 - 版本列表
export function classVersionList(id: string) {
  return wxpProxy('mdclients/historyVersion/classVersionList', { id })
}

// 版本差异 - 差异树
export function classDiffTree(id: string, firstVersion: string, secondVersion: string) {
  return wxpProxy('mdclients/historyVersion/classDifTree', { id, firstVersion, secondVersion })
}

// 基准库搜索
export function standardQuery(projectName: string, keyword: string, databaseType?: string) {
  return wxpProxy('standard/query', { projectName, keyword, databaseType })
}

// 基准库制作参数
export function standardProductionParams(dbId: string) {
  return wxpProxy('standard/production/params', { dbId })
}

// 基准库制作日志
export function standardProductionLogs(params: { dataSourceId: string; sourceDataSourceId: string; syncId: string; projectNo: string; scene: string }) {
  return wxpProxy('standard/production/logs', params)
}

// === 运营平台 ===
export function queryDemandQueue(params: any) {
  return http.post('/ops/demand-queue/query', params, { timeout: 120000 }).then(r => r.data)
}

export function syncDemandQueue(params?: any) {
  return http.post('/ops/demand-queue/sync', params || {}, { timeout: 300000 }).then(r => r.data)
}

export function queryPrList(params: any) {
  return http.post('/ops/pr/list', params, { timeout: 120000 }).then(r => r.data)
}

export function createPr(params: any) {
  return http.post('/ops/pr/create', params, { timeout: 60000 }).then(r => r.data)
}

export function activatePr(params: { prId: string; id: string; repo: string }) {
  return http.post('/ops/pr/activate', params, { timeout: 60000 }).then(r => r.data)
}

export function listOpsRepos() {
  return http.get('/ops/repos').then(r => r.data)
}

export function getPrDemandBuild(taskNo: string) {
  return http.post('/ops/pr/demand-build', { taskNo }, { timeout: 60000 }).then(r => r.data)
}

export function buildDemand(demandId: string) {
  return http.post('/ops/pr/build-demand', { demandId }, { timeout: 120000 }).then(r => r.data)
}

export function queryIterations(versionId: string) {
  return http.post('/ops/pr/query-iterations', { versionId }, { timeout: 30000 }).then(r => r.data)
}
export function queryProductApps(versionId: string, iterationId: string) {
  return http.post('/ops/pr/query-apps', { versionId, iterationId }, { timeout: 30000 }).then(r => r.data)
}
export function batchBuild(body: any) {
  return http.post('/ops/pr/batch-build', body, { timeout: 120000 }).then(r => r.data)
}
export function querySubApps(productAppIdArray: string[], productVersionId: string, iterationId: string) {
  return http.post('/ops/pr/query-sub-apps', { productAppIdArray, productVersionId, iterationId }, { timeout: 60000 }).then(r => r.data)
}

export function queryBuildLog(productVersionId: string, productAppIdArray: string[], iterationId: string, pageSize = 10, pageIndex = 0) {
  return http.post('/ops/pr/query-build-log', { productVersionId, productAppIdArray, iterationId, pageSize, pageIndex }, { timeout: 30000 }).then(r => r.data)
}

export function queryBuildDetail(buildLogId: string) {
  return http.post('/ops/pr/query-build-detail', { buildLogId }, { timeout: 30000 }).then(r => r.data)
}
