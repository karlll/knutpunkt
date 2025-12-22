import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTerminalSession } from './useTerminalSession'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    // Simulate connection opening after a tick
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 0)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  // Helper to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

describe('useTerminalSession', () => {
  let mockWs: MockWebSocket | null = null
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress console errors for expected error scenarios
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock global WebSocket with a class
    class MockedWebSocket extends MockWebSocket {
      constructor(url: string) {
        super(url)
        mockWs = this
      }
    }

    vi.stubGlobal('WebSocket', MockedWebSocket)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    vi.unstubAllGlobals()
    mockWs = null
  })

  describe('connection management', () => {
    it('initializes with connecting status', () => {
      const { result } = renderHook(() => useTerminalSession({}))

      expect(result.current.connectionStatus).toBe('connecting')
    })

    it('transitions to connected when WebSocket opens', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })
    })

    it('includes taskId in WebSocket URL when provided', () => {
      renderHook(() => useTerminalSession({ taskId: 'test-task-123' }))

      expect(mockWs?.url).toContain('taskId=test-task-123')
    })

    it('does not include taskId in URL when not provided', () => {
      renderHook(() => useTerminalSession({}))

      expect(mockWs?.url).not.toContain('taskId')
    })

    it('sets error status when WebSocket errors', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      // Wait for connection
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      // Simulate error
      mockWs?.simulateError()

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('error')
        expect(result.current.error).toBeDefined()
      })
    })

    it('sets disconnected status when WebSocket closes', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      mockWs?.close()

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected')
      })
    })

    it('cleans up WebSocket on unmount', async () => {
      const { unmount } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(mockWs?.readyState).toBe(MockWebSocket.OPEN)
      })

      const closeSpy = vi.spyOn(mockWs!, 'close')
      unmount()

      expect(closeSpy).toHaveBeenCalled()
    })
  })

  describe('send function', () => {
    it('sends input messages to WebSocket', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      result.current.send('test input')

      expect(mockWs?.sentMessages).toHaveLength(1)
      expect(JSON.parse(mockWs!.sentMessages[0])).toEqual({
        type: 'input',
        data: 'test input',
      })
    })

    it('does not send when WebSocket is not open', () => {
      const { result } = renderHook(() => useTerminalSession({}))

      // Try to send before connection is open
      result.current.send('test')

      expect(mockWs?.sentMessages).toHaveLength(0)
    })
  })

  describe('resize function', () => {
    it('sends resize messages to WebSocket', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      result.current.resize(80, 24)

      expect(mockWs?.sentMessages).toHaveLength(1)
      expect(JSON.parse(mockWs!.sentMessages[0])).toEqual({
        type: 'resize',
        cols: 80,
        rows: 24,
      })
    })

    it('does not send resize when WebSocket is not open', () => {
      const { result } = renderHook(() => useTerminalSession({}))

      result.current.resize(80, 24)

      expect(mockWs?.sentMessages).toHaveLength(0)
    })
  })

  describe('disconnect function', () => {
    it('closes WebSocket connection', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      result.current.disconnect()

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected')
      })
    })
  })

  describe('message handling', () => {
    it('calls onOutput when receiving output message', async () => {
      const onOutput = vi.fn()
      const { result } = renderHook(() => useTerminalSession({ onOutput }))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      mockWs?.simulateMessage({
        type: 'output',
        data: 'Hello, terminal!',
      })

      await waitFor(() => {
        expect(onOutput).toHaveBeenCalledWith('Hello, terminal!')
      })
    })

    it('calls onError when receiving error message', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useTerminalSession({ onError }))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      mockWs?.simulateMessage({
        type: 'error',
        message: 'Command not found',
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Command not found')
        expect(result.current.error).toBe('Command not found')
      })
    })

    it('calls onExit when receiving exit message', async () => {
      const onExit = vi.fn()
      const { result } = renderHook(() => useTerminalSession({ onExit }))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      mockWs?.simulateMessage({
        type: 'exit',
        code: 0,
      })

      await waitFor(() => {
        expect(onExit).toHaveBeenCalledWith(0)
        expect(result.current.connectionStatus).toBe('disconnected')
      })
    })

    it('handles invalid JSON messages gracefully', async () => {
      const { result } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      // Simulate invalid message
      if (mockWs?.onmessage) {
        mockWs.onmessage(new MessageEvent('message', { data: 'invalid json' }))
      }

      // Should not crash
      expect(result.current.connectionStatus).toBe('connected')
    })
  })

  describe('callback stability', () => {
    it('send function is stable across renders', async () => {
      const { result, rerender } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      const sendFn1 = result.current.send

      rerender()

      const sendFn2 = result.current.send

      expect(sendFn1).toBe(sendFn2)
    })

    it('resize function is stable across renders', async () => {
      const { result, rerender } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      const resizeFn1 = result.current.resize

      rerender()

      const resizeFn2 = result.current.resize

      expect(resizeFn1).toBe(resizeFn2)
    })

    it('disconnect function is stable across renders', async () => {
      const { result, rerender } = renderHook(() => useTerminalSession({}))

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      const disconnectFn1 = result.current.disconnect

      rerender()

      const disconnectFn2 = result.current.disconnect

      expect(disconnectFn1).toBe(disconnectFn2)
    })
  })
})
