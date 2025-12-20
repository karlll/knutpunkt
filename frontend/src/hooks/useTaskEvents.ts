import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { components } from '@/types/api'

type Task = components['schemas']['Task']
type TaskEvent = components['schemas']['TaskEvent']

interface UseTaskEventsOptions {
  enabled?: boolean
}

/**
 * Hook to subscribe to Server-Sent Events (SSE) for real-time task updates.
 *
 * Features:
 * - Subscribes to /api/v1/events/tasks endpoint
 * - Updates React Query cache when events are received
 * - Deduplicates events using clientMutationId to avoid double-updates
 * - Auto-reconnects with exponential backoff
 * - Cleans up on unmount
 */
export function useTaskEvents(options: UseTaskEventsOptions = {}) {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef(1000) // Start with 1 second
  const pendingMutationsRef = useRef<Set<string>>(new Set())

  // Track pending mutations
  const trackMutation = (clientMutationId: string) => {
    pendingMutationsRef.current.add(clientMutationId)

    // Clean up after 30 seconds (fallback)
    setTimeout(() => {
      pendingMutationsRef.current.delete(clientMutationId)
    }, 30000)
  }

  const connect = () => {
    if (!enabled) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api/v1'
    const eventSource = new EventSource(`${apiBase}/events/tasks`)

    eventSource.onopen = () => {
      console.log('[SSE] Connected to task events')
      // Reset backoff on successful connection
      reconnectDelayRef.current = 1000
    }

    eventSource.addEventListener('task.created', (event) => {
      try {
        const data: TaskEvent = JSON.parse(event.data)

        // Skip if this event came from our own mutation
        if (data.clientMutationId && pendingMutationsRef.current.has(data.clientMutationId)) {
          console.log('[SSE] Skipping own task.created event:', data.clientMutationId)
          pendingMutationsRef.current.delete(data.clientMutationId)
          return
        }

        console.log('[SSE] task.created:', data.taskId)

        // Add new task to cache
        queryClient.setQueryData<Task[]>(['tasks'], (old = []) => {
          // Avoid duplicates
          if (old.some(t => t.id === data.task.id)) return old
          return [...old, data.task]
        })
      } catch (error) {
        console.error('[SSE] Failed to parse task.created event:', error)
      }
    })

    eventSource.addEventListener('task.updated', (event) => {
      try {
        const data: TaskEvent = JSON.parse(event.data)

        // Skip if this event came from our own mutation
        if (data.clientMutationId && pendingMutationsRef.current.has(data.clientMutationId)) {
          console.log('[SSE] Skipping own task.updated event:', data.clientMutationId)
          pendingMutationsRef.current.delete(data.clientMutationId)
          return
        }

        console.log('[SSE] task.updated:', data.taskId)

        // Update existing task in cache
        queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
          old.map(task => task.id === data.taskId ? data.task : task)
        )
      } catch (error) {
        console.error('[SSE] Failed to parse task.updated event:', error)
      }
    })

    eventSource.addEventListener('task.deleted', (event) => {
      try {
        const data: TaskEvent = JSON.parse(event.data)

        // Skip if this event came from our own mutation
        if (data.clientMutationId && pendingMutationsRef.current.has(data.clientMutationId)) {
          console.log('[SSE] Skipping own task.deleted event:', data.clientMutationId)
          pendingMutationsRef.current.delete(data.clientMutationId)
          return
        }

        console.log('[SSE] task.deleted:', data.taskId)

        // Remove task from cache
        queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
          old.filter(task => task.id !== data.taskId)
        )
      } catch (error) {
        console.error('[SSE] Failed to parse task.deleted event:', error)
      }
    })

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      eventSource.close()

      // Reconnect with exponential backoff (max 30 seconds)
      const delay = Math.min(reconnectDelayRef.current, 30000)
      console.log(`[SSE] Reconnecting in ${delay}ms...`)

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectDelayRef.current *= 2
        connect()
      }, delay)
    }

    eventSourceRef.current = eventSource
  }

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Disconnecting')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [enabled])

  return {
    trackMutation,
  }
}
