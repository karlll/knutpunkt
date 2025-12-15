import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock EventSource for SSE tests
class MockEventSource {
  url: string
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  private listeners: Map<string, Set<EventListener>> = new Map()

  constructor(url: string) {
    this.url = url
    this.readyState = 1 // OPEN
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
    this.readyState = 2 // CLOSED
  }

  dispatchEvent(_event: Event): boolean {
    return true
  }
}

// @ts-expect-error - Mocking browser API
global.EventSource = MockEventSource
