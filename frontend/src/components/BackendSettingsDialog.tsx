import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface BackendSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackendSettingsDialog({ open, onOpenChange }: BackendSettingsDialogProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['backendSettings'],
    queryFn: () => api.settings.get(),
    enabled: open, // Only fetch when dialog is open
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Backend Settings</DialogTitle>
          <DialogDescription>
            Current backend configuration (read-only)
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-destructive">Failed to load backend settings</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Setting</TableHead>
                  <TableHead className="w-[150px]">Value</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.settings.map((setting) => (
                  <TableRow key={setting.key}>
                    <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {setting.value}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
