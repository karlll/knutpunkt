import { useEffect } from 'react'

/**
 * A function that can be called with no arguments.
 * This type is compatible with both regular functions and vitest mocks.
 */
export type ShortcutHandler = { (): void }

/**
 * Map of keyboard shortcuts to their handler functions.
 * Keys are the keyboard keys (lowercase), values are the handler functions.
 */
export type ShortcutMap = Record<string, ShortcutHandler>

export interface UseKeyboardShortcutsOptions {
  /**
   * Whether the shortcuts are enabled. Defaults to true.
   * Use this to disable shortcuts when dialogs are open or when you want to temporarily disable them.
   */
  enabled?: boolean
}

/**
 * Check if the event target is an input-like element where we should not trigger shortcuts
 */
function isTypingContext(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
  const isContentEditable = target.isContentEditable || target.contentEditable === 'true'

  return isInput || isContentEditable
}

/**
 * Hook to register global keyboard shortcuts.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'n': () => setCreateDialogOpen(true),
 *   's': () => setSettingsOpen(true),
 * }, { enabled: !anyDialogOpen })
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (isTypingContext(event.target)) {
        return
      }

      // Ignore if modifier keys are pressed (Ctrl, Alt, Meta, Shift)
      // This allows shortcuts like Ctrl+N to still work for browser functions
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return
      }

      const key = event.key.toLowerCase()
      const handler = shortcuts[key]

      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}
