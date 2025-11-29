import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

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
      <KanbanBoard />
    </QueryClientProvider>
  )
}

export default App
