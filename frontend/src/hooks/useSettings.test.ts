import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'
import { useSettingsStore } from '@/stores/settingsStore'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset Zustand store to default state
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useSettings())
    const [settings] = result.current

    expect(settings).toEqual({
      vimMode: false,
      maxDoneTasksVisible: 5,
    })
  })

  it('loads settings from store', () => {
    // Manually set the store state (simulating what would be loaded from localStorage)
    useSettingsStore.setState({
      settings: {
        vimMode: true,
        maxDoneTasksVisible: 10,
      },
    })

    const { result } = renderHook(() => useSettings())
    const [settings] = result.current

    expect(settings).toEqual({
      vimMode: true,
      maxDoneTasksVisible: 10,
    })
  })

  it('updates settings and saves to localStorage', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      const [, updateSettings] = result.current
      updateSettings({ vimMode: true })
    })

    const [settings] = result.current
    expect(settings.vimMode).toBe(true)
    expect(settings.maxDoneTasksVisible).toBe(5) // Should keep default

    const stored = localStorage.getItem('knutpunkt-settings')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.settings).toEqual({
      vimMode: true,
      maxDoneTasksVisible: 5,
    })
  })

  it('allows partial updates', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      const [, updateSettings] = result.current
      updateSettings({ vimMode: true })
    })

    act(() => {
      const [, updateSettings] = result.current
      updateSettings({ maxDoneTasksVisible: 15 })
    })

    const [settings] = result.current
    expect(settings).toEqual({
      vimMode: true,
      maxDoneTasksVisible: 15,
    })
  })

  it('allows updating individual settings while keeping others', () => {
    // Start with some custom settings
    useSettingsStore.setState({
      settings: {
        vimMode: true,
        maxDoneTasksVisible: 20,
      },
    })

    const { result } = renderHook(() => useSettings())

    // Update only maxDoneTasksVisible
    act(() => {
      const [, updateSettings] = result.current
      updateSettings({ maxDoneTasksVisible: 5 })
    })

    const [settings] = result.current
    expect(settings).toEqual({
      vimMode: true, // Should keep existing value
      maxDoneTasksVisible: 5, // Should use updated value
    })
  })

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('knutpunkt-settings', 'invalid json')

    const { result } = renderHook(() => useSettings())
    const [settings] = result.current

    expect(settings).toEqual({
      vimMode: false,
      maxDoneTasksVisible: 5,
    })
  })

  it('persists settings across hook instances', () => {
    const { result: result1 } = renderHook(() => useSettings())

    act(() => {
      const [, updateSettings] = result1.current
      updateSettings({ vimMode: true, maxDoneTasksVisible: 20 })
    })

    // Create a new hook instance
    const { result: result2 } = renderHook(() => useSettings())
    const [settings] = result2.current

    expect(settings).toEqual({
      vimMode: true,
      maxDoneTasksVisible: 20,
    })
  })

  it('shares state between multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useSettings())
    const { result: result2 } = renderHook(() => useSettings())

    // Both should start with defaults
    expect(result1.current[0]).toEqual(result2.current[0])

    // Update from first instance
    act(() => {
      const [, updateSettings] = result1.current
      updateSettings({ vimMode: true })
    })

    // Both instances should see the update
    expect(result1.current[0].vimMode).toBe(true)
    expect(result2.current[0].vimMode).toBe(true)
  })
})
