import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trash2, Pencil } from 'lucide-react'
import { Terminal } from './Terminal'
import { api } from '@/lib/api'

interface TerminalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
}

export function TerminalDialog({ open, onOpenChange, taskId }: TerminalDialogProps) {
  const queryClient = useQueryClient()
  const [terminalKey, setTerminalKey] = useState(0)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false)
  const [sessionCountBeforeCreate, setSessionCountBeforeCreate] = useState<number | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [sessionToRename, setSessionToRename] = useState<{ id: string; currentName: string } | null>(null)
  const [newSessionName, setNewSessionName] = useState('')

  // Query for active terminal sessions
  const { data: sessions } = useQuery({
    queryKey: ['terminalSessions'],
    queryFn: () => api.terminal.listSessions(),
    enabled: open,
    refetchInterval: open ? 5000 : false, // Refresh every 5 seconds when open
  })

  // Mutation for deleting sessions
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.terminal.deleteSession(sessionId),
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({ queryKey: ['terminalSessions'] })
      setSessionToDelete(null)
    },
  })

  // Mutation for renaming sessions
  const renameSessionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.terminal.renameSession(id, name),
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({ queryKey: ['terminalSessions'] })
      setSessionToRename(null)
      setNewSessionName('')
    },
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

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(sessionToDelete)
    }
  }, [sessionToDelete, deleteSessionMutation])

  const handleRenameSession = useCallback((sessionId: string, currentName: string) => {
    setSessionToRename({ id: sessionId, currentName })
    setNewSessionName(currentName)
  }, [])

  const handleConfirmRename = useCallback(() => {
    if (sessionToRename && newSessionName.trim()) {
      renameSessionMutation.mutate({ id: sessionToRename.id, name: newSessionName.trim() })
    }
  }, [sessionToRename, newSessionName, renameSessionMutation])

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
                  <div key={session.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4 flex-1"
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex flex-col items-start gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {session.name}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleRenameSession(session.id, session.name)}
                      aria-label={`Rename ${session.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteSession(session.id)}
                      aria-label={`Delete ${session.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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

      <AlertDialog open={sessionToDelete !== null} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Terminal Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this terminal session? This will terminate the session and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={sessionToRename !== null} onOpenChange={(open) => !open && setSessionToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Terminal Session</DialogTitle>
            <DialogDescription>
              Enter a new name for this terminal session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Session name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSessionName.trim()) {
                  handleConfirmRename()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSessionToRename(null)
                setNewSessionName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRename}
              disabled={!newSessionName.trim() || renameSessionMutation.isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
