import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'
import { TabView, type Tab } from '@/components/TabView'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const tabs = useMemo<Tab[]>(
    () => [
      {
        id: 'kanban',
        label: 'Kanban Board',
        content: <KanbanBoard />,
      },
      // Future tabs will be added here dynamically
    ],
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TaskEventsProvider>
        <TabView tabs={tabs} defaultActiveTab="kanban" />
      </TaskEventsProvider>
    </QueryClientProvider>
  )
}

export default App
