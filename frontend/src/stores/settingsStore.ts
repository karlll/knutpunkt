import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AppSettings {
  vimMode: boolean
  maxDoneTasksVisible: number
}

const DEFAULT_SETTINGS: AppSettings = {
  vimMode: false,
  maxDoneTasksVisible: 5,
}

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'knutpunkt-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
