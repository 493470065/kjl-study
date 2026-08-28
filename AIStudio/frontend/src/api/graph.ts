import http from './http'

// ---- Data models ----

export interface GraphEntity {
  id: number
  name: string
  type: string
  description: string
}

export interface GraphRelationship {
  id: number
  type: string
  relType: string
  description: string
  startNodeId: number
  endNodeId: number
}

export interface GraphData {
  nodes: GraphEntity[]
  edges: GraphRelationship[]
}

export interface GraphStats {
  entityCount: number
  relationshipCount: number
  entityTypes: Record<string, number>
  relationshipTypes: Record<string, number>
}

// ---- API functions ----

export const graphApi = {
  /** List entities with optional filters */
  listEntities(params?: { limit?: number; type?: string }) {
    return http.get<GraphEntity[]>('/knowledge/graph/entities', { params }).then(r => r.data)
  },

  /** Get a single entity by id */
  getById(id: number) {
    return http.get<GraphEntity>(`/knowledge/graph/entities/${id}`).then(r => r.data)
  },

  /** Get relationships for an entity */
  getRelationships(id: number, maxHops?: number) {
    return http.get(`/knowledge/graph/entities/${id}/relationships`, { params: { maxHops } }).then(r => r.data)
  },

  /** Get visualization data for the graph */
  getVisualizationData(limit?: number) {
    return http.get<GraphData>('/knowledge/graph/visualize', { params: { limit } }).then(r => r.data)
  },

  /** Get graph statistics */
  getStats() {
    return http.get<GraphStats>('/knowledge/graph/stats').then(r => r.data)
  },

  /** Trigger graph extraction for a document */
  extractForDocument(documentId: number) {
    return http.post(`/knowledge/graph/extract/${documentId}`)
  }
}
