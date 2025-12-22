import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Terminal } from './Terminal'
import type { ConnectionStatus } from '@/hooks/useTerminalSession'

interface TerminalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
}

export function TerminalDialog({ open, onOpenChange, taskId }: TerminalDialogProps) {
  const [terminalKey, setTerminalKey] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | undefined>(undefined)

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Force remount of Terminal on next open for clean state
    setTerminalKey((prev) => prev + 1)
    // Reset status
    setConnectionStatus('connecting')
    setError(undefined)
  }, [onOpenChange])

  const handleStatusChange = useCallback((status: ConnectionStatus, errorMsg?: string) => {
    setConnectionStatus(status)
    setError(errorMsg)
  }, [])

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            Connecting...
          </Badge>
        )
      case 'connected':
        return (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </Badge>
        )
      case 'disconnected':
        return (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            Disconnected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            Error{error ? `: ${error}` : ''}
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>Terminal</DialogTitle>
          {getStatusBadge()}
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {open && (
            <Terminal
              key={terminalKey}
              taskId={taskId}
              onClose={handleClose}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
