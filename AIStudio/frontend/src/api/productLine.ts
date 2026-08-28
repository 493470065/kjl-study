import http from './http'

export interface ProductLine {
  id: number
  name: string
  displayName: string
  description?: string
  claudeMd?: string
  docsPath?: string
  createdAt?: string
}

export interface ProductLineFile {
  path: string
  name: string
  size: number
  type: 'file' | 'directory'
  children?: ProductLineFile[]
}

export function listProductLines(search?: string) {
  return http.get<ProductLine[]>('/product-lines', { params: { search } }).then(r => r.data)
}

export function getProductLine(id: number) {
  return http.get<ProductLine>(`/product-lines/${id}`).then(r => r.data)
}

export function createProductLine(data: Partial<ProductLine>) {
  return http.post('/product-lines', data).then(r => r.data)
}

export function updateProductLine(id: number, data: Partial<ProductLine>) {
  return http.put(`/product-lines/${id}`, data).then(r => r.data)
}

export function deleteProductLine(id: number) {
  return http.delete(`/product-lines/${id}`).then(r => r.data)
}

export function saveClaudeMd(id: number, claudeMd: string) {
  return http.put(`/product-lines/${id}/claude-md`, { claudeMd }).then(r => r.data)
}

export function seedProductLines() {
  return http.post('/product-lines/seed').then(r => r.data)
}

export function getProductLineFiles(id: number) {
  return http.get<ProductLineFile[]>(`/product-lines/${id}/files`).then(r => r.data)
}

export function readProductLineFile(id: number, path: string) {
  return http.get<string>(`/product-lines/${id}/files/${path}`).then(r => r.data)
}

export function writeProductLineFile(id: number, path: string, content: string) {
  return http.put(`/product-lines/${id}/files/${path}`, { content }).then(r => r.data)
}
