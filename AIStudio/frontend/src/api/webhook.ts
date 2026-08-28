import http from '@/api/http'

export interface WebhookConfig {
  id?: number
  name: string
  url: string
  secret?: string
  events: string
  enabled: boolean
  retryCount: number
  timeoutMs: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface WebhookLog {
  id: number
  webhookConfigId: number
  webhookName: string
  eventType: string
  payload: string
  status: string
  responseCode: number
  responseBody: string
  errorMessage: string
  retryCount: number
  sentAt: string
  createdAt: string
}

export function getWebhookConfigs() {
  return http.get('/webhook/configs')
}

export function createWebhookConfig(data: WebhookConfig) {
  return http.post('/webhook/configs', data)
}

export function updateWebhookConfig(id: number, data: Partial<WebhookConfig>) {
  return http.put(`/webhook/configs/${id}`, data)
}

export function deleteWebhookConfig(id: number) {
  return http.delete(`/webhook/configs/${id}`)
}

export function testWebhook(id: number) {
  return http.post(`/webhook/configs/${id}/test`)
}

export function getWebhookLogs(page = 0, size = 20) {
  return http.get(`/webhook/logs?page=${page}&size=${size}`)
}

export function getWebhookLogsByConfig(configId: number) {
  return http.get(`/webhook/logs/${configId}`)
}

export function retryWebhook(logId: number) {
  return http.post(`/webhook/logs/${logId}/retry`)
}