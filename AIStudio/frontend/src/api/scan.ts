import http from './http'

export interface ScanRequest {
  directory: string
  category?: string
}

export interface ScanResult {
  totalFiles: number
  importedFiles: number
  skippedFiles: number
  errors: string[]
  documentIds: number[]
}

export interface FileInfo {
  path: string
  size: number
  extension: string
}

export interface ScanPreview {
  files: FileInfo[]
}

export const scanApi = {
  preview(directory: string) {
    return http.post<ScanPreview>('/knowledge/scan/preview', { directory }).then(r => r.data)
  },
  scan(directory: string, category?: string) {
    return http.post<ScanResult>('/knowledge/scan', { directory, category }).then(r => r.data)
  }
}
