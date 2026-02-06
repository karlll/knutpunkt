import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useSettings, type AppSettings } from '@/hooks/useSettings'
import { BackendSettingsDialog } from './BackendSettingsDialog'
import { api } from '@/lib/api'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, updateSettings] = useSettings()
  const [formData, setFormData] = useState<AppSettings>(settings)
  const [titleValue, setTitleValue] = useState('')
  const [backendSettingsOpen, setBackendSettingsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: backendSettings } = useQuery({
    queryKey: ['backendSettings'],
    queryFn: () => api.settings.get(),
    staleTime: 5 * 60 * 1000,
  })

  const titleMutation = useMutation({
    mutationFn: (newTitle: string) => api.settings.update('title', newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backendSettings'] })
    },
  })

  const backendTitle =
    backendSettings?.settings.find((s) => s.key === 'title')?.value ?? 'Knutpunkt'

  // Sync form data with settings when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(settings)
      setTitleValue(backendTitle)
    }
    // Only re-initialize when dialog opens, not when backend data re-fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () => {
    updateSettings(formData)
    if (titleValue.trim() && titleValue !== backendTitle) {
      titleMutation.mutate(titleValue.trim())
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    setFormData(settings) // Reset to current settings
    onOpenChange(false)
  }

  const handleMaxTasksChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setFormData({ ...formData, maxDoneTasksVisible: num })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your application preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Application Settings Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Application</h3>
                <div className="space-y-2">
                  <Label htmlFor="app-title">Title</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Application title shown in the header and browser tab
                  </p>
                  <Input
                    id="app-title"
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    placeholder="Knutpunkt"
                    className="w-64"
                  />
                </div>
              </div>
            </div>

            {/* Editor Settings Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Editor Settings</h3>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="vim-mode">VIM Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable VIM keybindings in the markdown editor
                    </p>
                  </div>
                  <Switch
                    id="vim-mode"
                    checked={formData.vimMode}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, vimMode: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Display Settings Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Display Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="max-done-tasks">
                    Maximum Done Tasks Visible
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Number of tasks to show in the Done column before archiving (1-50)
                  </p>
                  <Input
                    id="max-done-tasks"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxDoneTasksVisible}
                    onChange={(e) => handleMaxTasksChange(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setBackendSettingsOpen(true)}
            >
              Show Backend Settings
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BackendSettingsDialog
        open={backendSettingsOpen}
        onOpenChange={setBackendSettingsOpen}
      />
    </>
  )
}
