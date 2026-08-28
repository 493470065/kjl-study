import http from '@/api/http'

export interface RequirementAnalysisResult {
  summary: string
  complexity: string
  riskLevel: string
  estimatedEffort: number
  involvedModules: string[]
  modificationPoints: string[]
  technicalSuggestion: string
}

export interface CodeIssue {
  type: string
  severity: string
  description: string
  lineNumber: number
  suggestion: string
}

export interface CodeAnalysisResult {
  overview: string
  qualityScore: number
  issues: CodeIssue[]
  improvements: string[]
  dependencies: string[]
}

export function analyzeRequirement(requirement: string, context?: string) {
  return http.post('/structured/analyze-requirement', { requirement, context })
}

export function analyzeCode(code: string, fileName?: string, context?: string) {
  return http.post('/structured/analyze-code', { code, fileName, context })
}

export function getSchemas() {
  return http.get('/structured/schemas')
}