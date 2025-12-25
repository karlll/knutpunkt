import { useState, useCallback, useEffect } from 'react'
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
import { api } from '@/lib/api'

interface TerminalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
}

export function TerminalDialog({ open, onOpenChange, taskId }: TerminalDialogProps) {
  const [terminalKey, setTerminalKey] = useState(0)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false)
  const [sessionCountBeforeCreate, setSessionCountBeforeCreate] = useState<number | null>(null)

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
    // Reset state
    setSelectedSessionId(null)
    setIsCreatingNewSession(false)
    setSessionCountBeforeCreate(null)
  }, [onOpenChange])

  const handleNewSession = useCallback(() => {
    // Store current session count before creating new session
    setSessionCountBeforeCreate(sessions?.length ?? 0)
    setIsCreatingNewSession(true)
    setSelectedSessionId(null)
    setTerminalKey((prev) => prev + 1)
  }, [sessions])

  const handleSelectSession = useCallback((sessionId: string) => {
    setIsCreatingNewSession(false)
    setSessionCountBeforeCreate(null)
    setSelectedSessionId(sessionId)
    setTerminalKey((prev) => prev + 1)
  }, [])

  // Reset creating state when session count increases (new session created)
  useEffect(() => {
    if (
      isCreatingNewSession &&
      sessionCountBeforeCreate !== null &&
      sessions &&
      sessions.length > sessionCountBeforeCreate
    ) {
      setIsCreatingNewSession(false)
      setSessionCountBeforeCreate(null)
    }
  }, [isCreatingNewSession, sessionCountBeforeCreate, sessions])

  // Determine which view to show
  const hasNoSessions = !sessions || sessions.length === 0
  const showEmptyState = hasNoSessions && !isCreatingNewSession
  const showSessionPicker = sessions && sessions.length > 0 && !selectedSessionId && !isCreatingNewSession
  const showTerminal = !showEmptyState && !showSessionPicker

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Terminal</DialogTitle>
          <DialogDescription className="sr-only">
            Interactive terminal session with real-time command execution
          </DialogDescription>
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
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 overflow-hidden">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <p className="text-sm text-muted-foreground text-center">
              You have {sessions.length} active session{sessions.length > 1 ? 's' : ''}.
              Reconnect to an existing session or start a new one.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-md overflow-y-auto">
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
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
              </div>
              <Button onClick={handleNewSession}>
                New Session
              </Button>
            </div>
          </div>
        ) : showTerminal ? (
          <div className="flex-1 min-h-0 relative">
            {open && (
              <Terminal
                key={terminalKey}
                taskId={taskId}
                sessionId={selectedSessionId || undefined}
                onClose={handleClose}
              />
            )}
            {isCreatingNewSession && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Creating session...</p>
                </div>
              </div>
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
