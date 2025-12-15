import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskEventsProvider>
        <KanbanBoard />
      </TaskEventsProvider>
    </QueryClientProvider>
  )
}

export default App
