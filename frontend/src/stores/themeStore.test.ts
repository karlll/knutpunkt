import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeStore } from './themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset to default state
    useThemeStore.setState({ theme: 'dark' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with dark theme as default', () => {
    const { result } = renderHook(() => useThemeStore())

    expect(result.current.theme).toBe('dark')
  })

  it('sets theme to light', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
  })

  it('sets theme to dark', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setTheme('light')
    })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
  })

  it('toggles from dark to light', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
  })

  it('toggles from light to dark', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setTheme('light')
    })

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
  })

  it('toggles multiple times correctly', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.toggleTheme() // dark -> light
    })
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme() // light -> dark
    })
    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme() // dark -> light
    })
    expect(result.current.theme).toBe('light')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useThemeStore())

    act(() => {
      result.current.setTheme('light')
    })

    const stored = localStorage.getItem('knutpunkt-theme')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.theme).toBe('light')
  })

  it('shares state between multiple store instances', () => {
    const { result: result1 } = renderHook(() => useThemeStore())
    const { result: result2 } = renderHook(() => useThemeStore())

    // Both should start with dark
    expect(result1.current.theme).toBe('dark')
    expect(result2.current.theme).toBe('dark')

    // Update from first instance
    act(() => {
      result1.current.setTheme('light')
    })

    // Both instances should see the update
    expect(result1.current.theme).toBe('light')
    expect(result2.current.theme).toBe('light')
  })

  it('allows selective subscriptions', () => {
    // Test that we can subscribe to just the theme value
    const { result } = renderHook(() => useThemeStore((state) => state.theme))

    expect(result.current).toBe('dark')

    act(() => {
      useThemeStore.getState().setTheme('light')
    })

    expect(result.current).toBe('light')
  })

  it('allows selective subscriptions to toggle function', () => {
    // Test that we can subscribe to just the toggle function
    const { result } = renderHook(() => useThemeStore((state) => state.toggleTheme))

    act(() => {
      result.current()
    })

    expect(useThemeStore.getState().theme).toBe('light')
  })
})
