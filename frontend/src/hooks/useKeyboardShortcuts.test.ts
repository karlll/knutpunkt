import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  let mockHandler: Mock

  beforeEach(() => {
    mockHandler = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('calls handler when registered key is pressed', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const event = new KeyboardEvent('keydown', { key: 'n' })
      window.dispatchEvent(event)

      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it('handles multiple shortcuts', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          n: handler1,
          s: handler2,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('is case insensitive', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'N' }))

      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it('does not call handler for unregistered keys', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('prevents default behavior for registered shortcuts', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const event = new KeyboardEvent('keydown', { key: 'n' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('does not prevent default for unregistered keys', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const event = new KeyboardEvent('keydown', { key: 'x' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('typing context detection', () => {
    it('does not trigger when typing in an input field', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const input = document.createElement('input')
      document.body.appendChild(input)

      const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      input.dispatchEvent(event)

      expect(mockHandler).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('does not trigger when typing in a textarea', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      textarea.dispatchEvent(event)

      expect(mockHandler).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('does not trigger when typing in a select element', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const select = document.createElement('select')
      document.body.appendChild(select)

      const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      select.dispatchEvent(event)

      expect(mockHandler).not.toHaveBeenCalled()

      document.body.removeChild(select)
    })

    it('does not trigger when typing in a contentEditable element', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)

      const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      div.dispatchEvent(event)

      expect(mockHandler).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })

    it('triggers when key is pressed outside input contexts', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      const div = document.createElement('div')
      document.body.appendChild(div)

      const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      div.dispatchEvent(event)

      expect(mockHandler).toHaveBeenCalledTimes(1)

      document.body.removeChild(div)
    })
  })

  describe('modifier keys', () => {
    it('does not trigger with Ctrl modifier', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('does not trigger with Alt modifier', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', altKey: true }))

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('does not trigger with Meta modifier', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true }))

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('does not trigger with Shift modifier', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', shiftKey: true }))

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('enabled option', () => {
    it('does not trigger shortcuts when enabled is false', () => {
      renderHook(() =>
        useKeyboardShortcuts(
          {
            n: mockHandler,
          },
          { enabled: false }
        )
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('triggers shortcuts when enabled is true', () => {
      renderHook(() =>
        useKeyboardShortcuts(
          {
            n: mockHandler,
          },
          { enabled: true }
        )
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it('defaults to enabled when option is not provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it('can be toggled dynamically', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useKeyboardShortcuts(
            {
              n: mockHandler,
            },
            { enabled }
          ),
        {
          initialProps: { enabled: true },
        }
      )

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
      expect(mockHandler).toHaveBeenCalledTimes(1)

      mockHandler.mockClear()

      // Disable shortcuts
      rerender({ enabled: false })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
      expect(mockHandler).not.toHaveBeenCalled()

      // Re-enable shortcuts
      rerender({ enabled: true })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
      expect(mockHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          n: mockHandler,
        })
      )

      unmount()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})
