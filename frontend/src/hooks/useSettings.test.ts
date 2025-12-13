import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('loads settings from localStorage', () => {
    const storedSettings = {
      vimMode: true,
      maxDoneTasksVisible: 10,
    }
    localStorage.setItem('knutpunkt-settings', JSON.stringify(storedSettings))

    const { result } = renderHook(() => useSettings())
    const [settings] = result.current

    expect(settings).toEqual(storedSettings)
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
    expect(JSON.parse(stored!)).toEqual({
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

  it('merges stored settings with defaults for new settings', () => {
    // Simulate old stored settings that don't have all current fields
    localStorage.setItem('knutpunkt-settings', JSON.stringify({ vimMode: true }))

    const { result } = renderHook(() => useSettings())
    const [settings] = result.current

    expect(settings).toEqual({
      vimMode: true,
      maxDoneTasksVisible: 5, // Should use default
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
})
