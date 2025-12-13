import { useState, useEffect, useCallback } from 'react'

export interface AppSettings {
  vimMode: boolean
  maxDoneTasksVisible: number
}

const DEFAULT_SETTINGS: AppSettings = {
  vimMode: false,
  maxDoneTasksVisible: 5,
}

const STORAGE_KEY = 'knutpunkt-settings'

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle new settings added in updates
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      }
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error)
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
  }
}

export function useSettings(): [AppSettings, (settings: Partial<AppSettings>) => void] {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue)
          setSettings({ ...DEFAULT_SETTINGS, ...newSettings })
        } catch (error) {
          console.error('Failed to parse settings from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateSettings = useCallback((partialSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...partialSettings }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  return [settings, updateSettings]
}
