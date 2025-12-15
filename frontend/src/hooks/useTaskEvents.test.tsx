import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTaskEvents } from './useTaskEvents'
import type { Task } from '@/lib/api'
import type { components } from '@/types/api'

type TaskEvent = components['schemas']['TaskEvent']

// Mock EventSource
class MockEventSource {
  url: string
  readyState: number = 1
  onopen: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private listeners: Map<string, Set<EventListener>> = new Map()

  constructor(url: string) {
    this.url = url
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  close(): void {
    this.readyState = 2
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
    return true
  }

  // Helper to simulate SSE message
  simulateMessage(type: string, data: any): void {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    this.dispatchEvent(event)
  }
}

describe('useTaskEvents', () => {
  let queryClient: QueryClient
  let eventSourceInstance: MockEventSource | null = null

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    // Mock EventSource constructor
    vi.stubGlobal('EventSource', class extends MockEventSource {
      constructor(url: string) {
        super(url)
        eventSourceInstance = this
      }
    })

    // Mock console.log to avoid noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    eventSourceInstance = null
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('connects to EventSource on mount', () => {
    renderHook(() => useTaskEvents(), { wrapper })

    expect(eventSourceInstance).not.toBeNull()
    expect(eventSourceInstance?.url).toContain('/events/tasks')
  })

  it('does not connect when disabled', () => {
    renderHook(() => useTaskEvents({ enabled: false }), { wrapper })

    expect(eventSourceInstance).toBeNull()
  })

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useTaskEvents(), { wrapper })

    const closeSpy = vi.spyOn(eventSourceInstance!, 'close')

    unmount()

    expect(closeSpy).toHaveBeenCalled()
  })

  it('tracks mutations', () => {
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    const mutationId = 'test-mutation-id'
    result.current.trackMutation(mutationId)

    // Mutation should be tracked (tested indirectly via event skipping)
    expect(result.current).toBeDefined()
  })

  it('handles task.created events and updates cache', async () => {
    // Set initial cache state
    queryClient.setQueryData<Task[]>(['tasks'], [])

    renderHook(() => useTaskEvents(), { wrapper })

    const newTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'New Task',
      description: 'Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    const eventData: TaskEvent = {
      eventType: 'task.created',
      taskId: 'task-1',
      timestamp: '2025-01-15T10:00:00Z',
      clientMutationId: null,
      task: newTask,
    }

    // Simulate SSE event
    eventSourceInstance!.simulateMessage('task.created', eventData)

    await waitFor(() => {
      const tasks = queryClient.getQueryData<Task[]>(['tasks'])
      expect(tasks).toHaveLength(1)
      expect(tasks![0]).toEqual(newTask)
    })
  })

  it('handles task.updated events and updates cache', async () => {
    const existingTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'Old Title',
      description: 'Old Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    queryClient.setQueryData<Task[]>(['tasks'], [existingTask])

    renderHook(() => useTaskEvents(), { wrapper })

    const updatedTask: Task = {
      ...existingTask,
      title: 'New Title',
      updatedAt: '2025-01-15T11:00:00Z',
    }

    const eventData: TaskEvent = {
      eventType: 'task.updated',
      taskId: 'task-1',
      timestamp: '2025-01-15T11:00:00Z',
      clientMutationId: null,
      task: updatedTask,
    }

    eventSourceInstance!.simulateMessage('task.updated', eventData)

    await waitFor(() => {
      const tasks = queryClient.getQueryData<Task[]>(['tasks'])
      expect(tasks).toHaveLength(1)
      expect(tasks![0].title).toBe('New Title')
    })
  })

  it('handles task.deleted events and updates cache', async () => {
    const existingTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'Task to Delete',
      description: 'Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    queryClient.setQueryData<Task[]>(['tasks'], [existingTask])

    renderHook(() => useTaskEvents(), { wrapper })

    const eventData: TaskEvent = {
      eventType: 'task.deleted',
      taskId: 'task-1',
      timestamp: '2025-01-15T12:00:00Z',
      clientMutationId: null,
      task: existingTask,
    }

    eventSourceInstance!.simulateMessage('task.deleted', eventData)

    await waitFor(() => {
      const tasks = queryClient.getQueryData<Task[]>(['tasks'])
      expect(tasks).toHaveLength(0)
    })
  })

  it('skips task.created events with tracked clientMutationId', async () => {
    queryClient.setQueryData<Task[]>(['tasks'], [])

    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    const mutationId = 'my-mutation-id'
    result.current.trackMutation(mutationId)

    const newTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'New Task',
      description: 'Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    const eventData: TaskEvent = {
      eventType: 'task.created',
      taskId: 'task-1',
      timestamp: '2025-01-15T10:00:00Z',
      clientMutationId: mutationId,
      task: newTask,
    }

    eventSourceInstance!.simulateMessage('task.created', eventData)

    // Wait a bit to ensure event is processed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Cache should NOT be updated because we tracked this mutation
    const tasks = queryClient.getQueryData<Task[]>(['tasks'])
    expect(tasks).toHaveLength(0)
  })

  it('skips task.updated events with tracked clientMutationId', async () => {
    const existingTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'Old Title',
      description: 'Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    queryClient.setQueryData<Task[]>(['tasks'], [existingTask])

    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    const mutationId = 'my-mutation-id'
    result.current.trackMutation(mutationId)

    const updatedTask: Task = {
      ...existingTask,
      title: 'New Title',
      updatedAt: '2025-01-15T11:00:00Z',
    }

    const eventData: TaskEvent = {
      eventType: 'task.updated',
      taskId: 'task-1',
      timestamp: '2025-01-15T11:00:00Z',
      clientMutationId: mutationId,
      task: updatedTask,
    }

    eventSourceInstance!.simulateMessage('task.updated', eventData)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Title should NOT change because we tracked this mutation
    const tasks = queryClient.getQueryData<Task[]>(['tasks'])
    expect(tasks![0].title).toBe('Old Title')
  })

  it('prevents duplicate tasks in cache', async () => {
    const existingTask: Task = {
      id: 'task-1',
      number: 1,
      title: 'Existing Task',
      description: 'Description',
      status: 'planned',
      priority: 'medium',
      order: 1,
      assignees: [],
      categories: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }

    queryClient.setQueryData<Task[]>(['tasks'], [existingTask])

    renderHook(() => useTaskEvents(), { wrapper })

    const eventData: TaskEvent = {
      eventType: 'task.created',
      taskId: 'task-1',
      timestamp: '2025-01-15T10:00:00Z',
      clientMutationId: null,
      task: existingTask,
    }

    eventSourceInstance!.simulateMessage('task.created', eventData)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Should still only have one task
    const tasks = queryClient.getQueryData<Task[]>(['tasks'])
    expect(tasks).toHaveLength(1)
  })

  it('logs connection events', async () => {
    const logSpy = vi.spyOn(console, 'log')

    renderHook(() => useTaskEvents(), { wrapper })

    // Simulate onopen
    if (eventSourceInstance!.onopen) {
      eventSourceInstance!.onopen(new Event('open'))
    }

    expect(logSpy).toHaveBeenCalledWith('[SSE] Connected to task events')
  })

  it('handles connection errors', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    renderHook(() => useTaskEvents(), { wrapper })

    // Simulate error
    if (eventSourceInstance!.onerror) {
      eventSourceInstance!.onerror(new Event('error'))
    }

    expect(errorSpy).toHaveBeenCalledWith('[SSE] Connection error:', expect.any(Event))
  })
})
