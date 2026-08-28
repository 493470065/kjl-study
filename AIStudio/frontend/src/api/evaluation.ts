import http from '@/api/http'

export interface EvaluationRequest {
  question: string
  answer: string
  context?: string
  groundTruth?: string
  evaluator?: string
}

export interface EvaluationScore {
  evaluatorName: string
  score: number
  explanation: string
  passed: boolean
  details?: string
}

export interface EvaluationResult {
  id: number
  evaluatorName: string
  question: string
  answer: string
  score: number
  threshold: number
  passed: boolean
  explanation: string
  details?: string
  createdAt: string
}

export interface EvaluationDataset {
  id?: number
  name: string
  description?: string
  items: string
  createdAt?: string
  updatedAt?: string
}

export interface EvaluationStats {
  totalEvaluations: number
  passRate: number
  averageScore: number
  byEvaluator: Array<{
    evaluatorName: string
    count: number
    passRate: number
    averageScore: number
  }>
}

export function getEvaluators() {
  return http.get('/evaluation/evaluators')
}

export function evaluate(data: EvaluationRequest) {
  return http.post('/evaluation/evaluate', data)
}

export function getResults() {
  return http.get('/evaluation/results')
}

export function getStats() {
  return http.get('/evaluation/results/stats')
}

export function clearResults() {
  return http.delete('/evaluation/results')
}

export function getDatasets() {
  return http.get('/evaluation/datasets')
}

export function getDataset(id: number) {
  return http.get(`/evaluation/datasets/${id}`)
}

export function createDataset(data: EvaluationDataset) {
  return http.post('/evaluation/datasets', data)
}

export function deleteDataset(id: number) {
  return http.delete(`/evaluation/datasets/${id}`)
}

export function runDataset(id: number) {
  return http.post(`/evaluation/datasets/${id}/run`)
}