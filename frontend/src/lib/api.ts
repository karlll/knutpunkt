import type { components } from '../types/api'

type Task = components['schemas']['Task']
type TaskCreate = components['schemas']['TaskCreate']
type TaskUpdate = components['schemas']['TaskUpdate']
type TaskStatus = components['schemas']['TaskStatus']
type TaskPriority = components['schemas']['TaskPriority']
type TaskOrderUpdate = components['schemas']['TaskOrderUpdate']
type Setting = components['schemas']['Setting']
type SettingsResponse = components['schemas']['SettingsResponse']
type SessionInfo = components['schemas']['SessionInfo']

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api/v1'

class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.code || 'UNKNOWN_ERROR',
      data.message || 'An error occurred'
    )
  }

  return data
}

export const api = {
  tasks: {
    list: async (params?: {
      status?: TaskStatus
      assignee?: string
      category?: string
      priority?: string
    }): Promise<Task[]> => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.assignee) searchParams.set('assignee', params.assignee)
      if (params?.category) searchParams.set('category', params.category)
      if (params?.priority) searchParams.set('priority', params.priority)

      const url = `${API_BASE}/tasks${searchParams.toString() ? `?${searchParams}` : ''}`
      const response = await fetch(url)
      return handleResponse<Task[]>(response)
    },

    get: async (id: string): Promise<Task> => {
      const response = await fetch(`${API_BASE}/tasks/${id}`)
      return handleResponse<Task>(response)
    },

    create: async (task: TaskCreate, clientMutationId?: string): Promise<Task> => {
      const body = clientMutationId ? { ...task, clientMutationId } : task
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return handleResponse<Task>(response)
    },

    update: async (id: string, task: TaskUpdate, clientMutationId?: string): Promise<Task> => {
      const body = clientMutationId ? { ...task, clientMutationId } : task
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return handleResponse<Task>(response)
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
      })
      return handleResponse<void>(response)
    },

    updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
      const response = await fetch(`${API_BASE}/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      return handleResponse<Task>(response)
    },

    updateOrder: async (
      id: string,
      newOrder: number,
      newStatus?: TaskStatus,
      clientMutationId?: string
    ): Promise<{ updated: Task[] }> => {
      const body: TaskOrderUpdate = { newOrder }
      if (newStatus) {
        body.newStatus = newStatus
      }
      if (clientMutationId) {
        body.clientMutationId = clientMutationId
      }

      const response = await fetch(`${API_BASE}/tasks/${id}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return handleResponse<{ updated: Task[] }>(response)
    },
  },

  settings: {
    get: async (): Promise<SettingsResponse> => {
      const response = await fetch(`${API_BASE}/settings`)
      return handleResponse<SettingsResponse>(response)
    },
  },

  terminal: {
    listSessions: async (): Promise<SessionInfo[]> => {
      const response = await fetch(`${API_BASE}/terminal/sessions`)
      return handleResponse<SessionInfo[]>(response)
    },

    deleteSession: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/terminal/sessions/${id}`, {
        method: 'DELETE',
      })
      return handleResponse<void>(response)
    },

    renameSession: async (id: string, name: string): Promise<{ id: string; name: string }> => {
      const response = await fetch(`${API_BASE}/terminal/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      return handleResponse<{ id: string; name: string }>(response)
    },
  },
}

export { ApiError }
export type {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskStatus,
  TaskPriority,
  Setting,
  SettingsResponse,
  SessionInfo,
}
