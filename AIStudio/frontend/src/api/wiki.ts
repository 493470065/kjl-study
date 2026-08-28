import http from './http'

// ---- Data models ----

export interface WikiPage {
  id: number
  title: string
  summary: string
  keyConcepts: string
  sections: string  // JSON string of {heading, content}[]
  sourceDocumentId: number
  status: string  // GENERATED, GENERATING, FAILED, GRAPH_READY
  createdAt: string
  updatedAt: string
}

export interface WikiSection {
  heading: string
  content: string
}

// ---- API functions ----

export const wikiApi = {
  /** List wiki pages by source document */
  listByDocument(documentId: number) {
    return http.get<WikiPage[]>('/knowledge/wiki', { params: { documentId } }).then(r => r.data)
  },

  /** Get a single wiki page by id */
  getById(id: number) {
    return http.get<WikiPage>(`/knowledge/wiki/${id}`).then(r => r.data)
  },

  /** Trigger wiki generation for a document */
  generateForDocument(documentId: number) {
    return http.post(`/knowledge/wiki/generate/${documentId}`)
  },

  /** Regenerate a wiki page */
  regenerate(id: number) {
    return http.post(`/knowledge/wiki/${id}/regenerate`)
  },

  /** Delete a wiki page */
  delete(id: number) {
    return http.delete(`/knowledge/wiki/${id}`)
  }
}
