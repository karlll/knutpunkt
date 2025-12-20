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

// Mock Range.prototype.getClientRects and getBoundingClientRect for CodeMirror
// CodeMirror uses these methods which are not fully implemented in jsdom
if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = function() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function*() {},
    } as DOMRectList
  }

  Range.prototype.getBoundingClientRect = function() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect
  }
}
