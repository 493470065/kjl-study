import http from './http'

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Todo {
  id: number
  userId: number
  title: string
  description?: string | null
  status: TodoStatus
  priority: TodoPriority
  dueDate?: string | null
  completedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface TodoPayload {
  title: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string | null
}

export const todoApi = {
  async list(): Promise<Todo[]> {
    const res = await http.get('/todos')
    return res.data
  },
  async create(payload: TodoPayload): Promise<Todo> {
    const res = await http.post('/todos', payload)
    return res.data
  },
  async update(id: number, payload: Partial<TodoPayload>): Promise<Todo> {
    const res = await http.put(`/todos/${id}`, payload)
    return res.data
  },
  async remove(id: number): Promise<void> {
    await http.delete(`/todos/${id}`)
  },
  async toggle(id: number): Promise<Todo> {
    const res = await http.patch(`/todos/${id}/toggle`)
    return res.data
  }
}
