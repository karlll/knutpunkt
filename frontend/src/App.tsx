import { useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'
import { TabView, type Tab } from '@/components/TabView'
import { Terminal } from '@/components/terminal/Terminal'
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

  // Query for active terminal sessions
  const { data: sessions } = useQuery({
    queryKey: ['terminalSessions'],
    queryFn: () => api.terminal.listSessions(),
    refetchInterval: 5000, // Refresh every 5 seconds
  })

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
      content: <KanbanBoard />,
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
  }, [sessions, pinnedSessions])

  const handleTabClose = useCallback(
    (tabId: string) => {
      // When a terminal tab is closed, unpin the session
      if (tabId !== 'kanban') {
        handleCloseTerminalTab(tabId)
      }
    },
    [handleCloseTerminalTab]
  )

  return <TabView tabs={tabs} defaultActiveTab="kanban" onTabClose={handleTabClose} />
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
