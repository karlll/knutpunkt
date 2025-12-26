import { useMemo, useCallback, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'
import { TabView, type Tab } from '@/components/TabView'
import { Terminal } from '@/components/terminal/Terminal'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { Header } from '@/components/Header'
import { useTerminalStore } from '@/stores/terminalStore'
import { api } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { pinnedSessions, unpinSession } = useTerminalStore()
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)

  // Fetch backend settings to check if terminal is enabled
  const { data: backendSettings } = useQuery({
    queryKey: ['backendSettings'],
    queryFn: () => api.settings.get(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on failure
  })

  // Query for active terminal sessions
  const { data: sessions } = useQuery({
    queryKey: ['terminalSessions'],
    queryFn: () => api.terminal.listSessions(),
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Check if terminal is enabled from backend settings
  const terminalEnabled =
    backendSettings?.settings.find((s) => s.key === 'terminal.enabled')?.value === 'true'

  const handleCloseTerminalTab = useCallback(
    (sessionId: string) => {
      unpinSession(sessionId)
    },
    [unpinSession]
  )

  const tabs = useMemo<Tab[]>(() => {
    const kanbanTab: Tab = {
      id: 'kanban',
      label: 'Kanban Board',
      content: (
        <KanbanBoard
          createDialogOpen={createTaskDialogOpen}
          onCreateDialogChange={setCreateTaskDialogOpen}
        />
      ),
      closable: false,
    }

    // Get pinned sessions and create tabs for them
    const pinnedSessionTabs: Tab[] = []
    if (sessions) {
      sessions.forEach((session) => {
        if (pinnedSessions.has(session.id)) {
          pinnedSessionTabs.push({
            id: session.id,
            label: session.name,
            content: (
              <div className="flex-1 min-h-0 p-4">
                <Terminal sessionId={session.id} />
              </div>
            ),
            closable: true,
          })
        }
      })
    }

    return [kanbanTab, ...pinnedSessionTabs]
  }, [sessions, pinnedSessions, createTaskDialogOpen])

  const handleTabClose = useCallback(
    (tabId: string) => {
      // When a terminal tab is closed, unpin the session
      if (tabId !== 'kanban') {
        handleCloseTerminalTab(tabId)
      }
    },
    [handleCloseTerminalTab]
  )

  return (
    <div className="h-screen flex flex-col">
      <Header
        onCreateTask={() => setCreateTaskDialogOpen(true)}
        onOpenTerminal={() => setTerminalDialogOpen(true)}
        terminalEnabled={terminalEnabled}
      />
      <TabView tabs={tabs} defaultActiveTab="kanban" onTabClose={handleTabClose} />
      <TerminalDialog open={terminalDialogOpen} onOpenChange={setTerminalDialogOpen} />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskEventsProvider>
        <AppContent />
      </TaskEventsProvider>
    </QueryClientProvider>
  )
}

export default App
