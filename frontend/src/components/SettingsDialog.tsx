import { useState, useEffect } from 'react'
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

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, updateSettings] = useSettings()
  const [formData, setFormData] = useState<AppSettings>(settings)

  // Sync form data with settings when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(settings)
    }
  }, [open, settings])

  const handleSave = () => {
    updateSettings(formData)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your application preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
