import { useEffect, useRef, useState, useCallback } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface TerminalMessage {
  type: 'output' | 'error' | 'exit'
  data?: string
  message?: string
  code?: number
}

export interface UseTerminalSessionOptions {
  taskId?: string
  sessionId?: string
  onOutput?: (data: string) => void
  onError?: (error: string) => void
  onExit?: (code: number) => void
}

export interface UseTerminalSessionResult {
  connectionStatus: ConnectionStatus
  send: (data: string) => void
  resize: (cols: number, rows: number) => void
  disconnect: () => void
  error?: string
}

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8080/api/v1'

export function useTerminalSession(
  options: UseTerminalSessionOptions
): UseTerminalSessionResult {
  const { taskId, sessionId, onOutput, onError, onExit } = options

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | undefined>(undefined)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Send input data to WebSocket
  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data }))
    }
  }, [])

  // Send resize command to WebSocket
  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setConnectionStatus('disconnected')
  }, [])

  // Connect to WebSocket
  useEffect(() => {
    // Build WebSocket URL with sessionId or taskId
    let url = `${WS_BASE_URL}/terminal/session`
    const params = new URLSearchParams()

    if (sessionId) {
      params.set('sessionId', sessionId)
    } else if (taskId) {
      params.set('taskId', taskId)
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    setConnectionStatus('connecting')
    setError(undefined)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionStatus('connected')
        setError(undefined)
      }

      ws.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'output':
              if (message.data && onOutput) {
                onOutput(message.data)
              }
              break

            case 'error':
              if (message.message) {
                setError(message.message)
                if (onError) {
                  onError(message.message)
                }
              }
              break

            case 'exit':
              if (message.code !== undefined && onExit) {
                onExit(message.code)
              }
              setConnectionStatus('disconnected')
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setConnectionStatus('error')
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        setConnectionStatus('disconnected')
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setConnectionStatus('error')
      setError('Failed to establish WebSocket connection')
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [taskId, sessionId, onOutput, onError, onExit])

  return {
    connectionStatus,
    send,
    resize,
    disconnect,
    error,
  }
}
