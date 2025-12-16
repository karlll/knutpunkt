import { useSettingsStore } from '@/stores/settingsStore'
import type { AppSettings } from '@/stores/settingsStore'

export function useSettings(): [AppSettings, (settings: Partial<AppSettings>) => void] {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  return [settings, updateSettings]
}

export type { AppSettings }
