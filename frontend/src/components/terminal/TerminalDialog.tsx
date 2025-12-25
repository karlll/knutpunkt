import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Terminal } from './Terminal'
import type { ConnectionStatus } from '@/hooks/useTerminalSession'
import { api } from '@/lib/api'

interface TerminalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
}

export function TerminalDialog({ open, onOpenChange, taskId }: TerminalDialogProps) {
  const [terminalKey, setTerminalKey] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | undefined>(undefined)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false)

  // Query for active terminal sessions
  const { data: sessions } = useQuery({
    queryKey: ['terminalSessions'],
    queryFn: () => api.terminal.listSessions(),
    enabled: open,
    refetchInterval: open ? 5000 : false, // Refresh every 5 seconds when open
  })

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Force remount of Terminal on next open for clean state
    setTerminalKey((prev) => prev + 1)
    // Reset status
    setConnectionStatus('connecting')
    setError(undefined)
    setSelectedSessionId(null)
    setIsCreatingNewSession(false)
  }, [onOpenChange])

  const handleNewSession = useCallback(() => {
    setIsCreatingNewSession(true)
    setSelectedSessionId(null)
    setTerminalKey((prev) => prev + 1)
  }, [])

  const handleSelectSession = useCallback((sessionId: string) => {
    setIsCreatingNewSession(false)
    setSelectedSessionId(sessionId)
    setTerminalKey((prev) => prev + 1)
  }, [])

  const handleStatusChange = useCallback((status: ConnectionStatus, errorMsg?: string) => {
    setConnectionStatus(status)
    setError(errorMsg)
    // Reset creating state when connection is established
    if (status === 'connected') {
      setIsCreatingNewSession(false)
    }
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

  // Determine which view to show
  const hasNoSessions = !sessions || sessions.length === 0
  const showEmptyState = hasNoSessions && !isCreatingNewSession
  const showSessionPicker = sessions && sessions.length > 0 && !selectedSessionId && !isCreatingNewSession
  const showTerminal = !showEmptyState && !showSessionPicker

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>Terminal</DialogTitle>
          <DialogDescription className="sr-only">
            Interactive terminal session with real-time command execution
          </DialogDescription>
          {getStatusBadge()}
        </DialogHeader>

        {showEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <h3 className="text-lg font-semibold">No Active Sessions</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You don't have any active terminal sessions. Create a new session to get started.
            </p>
            <Button onClick={handleNewSession} className="mt-2">
              Create Session
            </Button>
          </div>
        ) : showSessionPicker ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <p className="text-sm text-muted-foreground text-center">
              You have {sessions.length} active session{sessions.length > 1 ? 's' : ''}.
              Reconnect to an existing session or start a new one.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {sessions.map((session) => (
                <Button
                  key={session.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {session.id.substring(0, 8)}...
                      </span>
                      {session.taskId && (
                        <Badge variant="secondary" className="text-xs">
                          Task {session.taskId.substring(0, 8)}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {session.workingDirectory}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Last active: {new Date(session.lastActivity).toLocaleTimeString()}
                    </span>
                  </div>
                </Button>
              ))}
              <Button onClick={handleNewSession} className="mt-2">
                New Session
              </Button>
            </div>
          </div>
        ) : showTerminal ? (
          <div className="flex-1 min-h-0">
            {open && (
              <Terminal
                key={terminalKey}
                taskId={taskId}
                sessionId={selectedSessionId || undefined}
                onClose={handleClose}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        ) : null}

        <DialogFooter>
          {selectedSessionId && sessions && sessions.length > 0 && (
            <Button variant="ghost" onClick={() => setSelectedSessionId(null)}>
              Back to Sessions
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
