import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanBoard } from './KanbanBoard'
import { api } from '@/lib/api'
import type { Task } from '@/lib/api'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'
import userEvent from '@testing-library/user-event'

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    tasks: {
      list: vi.fn(),
      updateStatus: vi.fn(),
    },
  },
}))

// Mock the WorkflowViewerPane component
vi.mock('@/components/workflow/WorkflowViewerPane', () => ({
  WorkflowViewerPane: () => <div data-testid="workflow-viewer-pane">Workflow Viewer</div>,
}))

const mockTasks: Task[] = [
  {
    id: '1',
    number: 1,
    title: 'Planned Task',
    description: 'Test description',
    status: 'planned',
    order: 1,
    priority: 'high',
    categories: ['feature'],
    assignees: ['alice'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    number: 2,
    title: 'Ongoing Task',
    description: 'In progress',
    status: 'ongoing',
    order: 1,
    priority: 'medium',
    categories: ['bug'],
    assignees: ['bob'],
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    number: 3,
    title: 'Done Task',
    description: 'Completed',
    status: 'done',
    order: 1,
    priority: 'low',
    categories: ['docs'],
    assignees: ['charlie'],
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
]

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskEventsProvider enabled={false}>
        {component}
      </TaskEventsProvider>
    </QueryClientProvider>
  )
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading message while fetching tasks', () => {
      vi.mocked(api.tasks.list).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithQueryClient(<KanbanBoard />)
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument()
    })

    it('loading message has correct styling', () => {
      vi.mocked(api.tasks.list).mockImplementation(
        () => new Promise(() => {})
      )

      renderWithQueryClient(<KanbanBoard />)
      const loading = screen.getByText('Loading tasks...')
      expect(loading).toHaveClass('text-lg', 'text-muted-foreground')
    })

    it('centers loading message', () => {
      vi.mocked(api.tasks.list).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = renderWithQueryClient(<KanbanBoard />)
      const loadingContainer = container.querySelector('.flex.items-center.justify-center')
      expect(loadingContainer).toBeInTheDocument()
      expect(loadingContainer).toHaveClass('flex-1')
    })
  })

  describe('successful data loading', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('renders all column titles', async () => {
      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
        expect(screen.getByText('Ongoing')).toBeInTheDocument()
        expect(screen.getByText('Done')).toBeInTheDocument()
      })
    })

    it('distributes tasks to correct columns', async () => {
      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        expect(screen.getByText('Planned Task')).toBeInTheDocument()
        expect(screen.getByText('Ongoing Task')).toBeInTheDocument()
        expect(screen.getByText('Done Task')).toBeInTheDocument()
      })
    })

    it('shows correct task count in each column', async () => {
      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        // Each column should show count of 1
        const counts = screen.getAllByText('(1)')
        expect(counts).toHaveLength(3)
      })
    })

    it('handles empty columns', async () => {
      vi.mocked(api.tasks.list).mockResolvedValue([mockTasks[0]]) // Only planned task

      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        expect(screen.getByText('(1)')).toBeInTheDocument() // Planned count
        const noTasksMessages = screen.getAllByText('No tasks')
        expect(noTasksMessages).toHaveLength(2) // Ongoing and Done are empty
      })
    })
  })

  describe('layout', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('uses flex layout to fill available space', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const board = container.querySelector('.flex-1.flex.flex-col')
        expect(board).toBeInTheDocument()
      })
    })

    it('has horizontal scrolling for columns', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const columnsContainer = container.querySelector('.overflow-x-auto')
        expect(columnsContainer).toBeInTheDocument()
      })
    })

    it('has proper spacing between columns', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const columnsContainer = container.querySelector('.gap-6')
        expect(columnsContainer).toBeInTheDocument()
      })
    })

    it('has padding around board', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const main = container.querySelector('main')
        expect(main).toHaveClass('p-6')
      })
    })
  })

  describe('drag and drop context', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('provides DndContext to columns', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        // DndContext should be rendered
        expect(container.querySelector('[class*="cursor-grab"]')).toBeInTheDocument()
      })
    })

    it('renders columns in flex layout', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const columnsContainer = container.querySelector('.flex.gap-6')
        expect(columnsContainer).toBeInTheDocument()
      })
    })
  })

  describe('task grouping', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('groups tasks by status correctly', async () => {
      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        // Verify each column has the right task
        const planned = screen.getByText('Planned Task')
        const ongoing = screen.getByText('Ongoing Task')
        const done = screen.getByText('Done Task')

        expect(planned).toBeInTheDocument()
        expect(ongoing).toBeInTheDocument()
        expect(done).toBeInTheDocument()
      })
    })

    it('handles multiple tasks in same column', async () => {
      const multiplePlannedTasks = [
        mockTasks[0],
        { ...mockTasks[0], id: '4', title: 'Another Planned Task' },
      ]
      vi.mocked(api.tasks.list).mockResolvedValue(multiplePlannedTasks)

      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        expect(screen.getByText('Planned Task')).toBeInTheDocument()
        expect(screen.getByText('Another Planned Task')).toBeInTheDocument()
        expect(screen.getByText('(2)')).toBeInTheDocument() // Planned count
      })
    })
  })

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(api.tasks.list).mockRejectedValue(new Error('API Error'))

      renderWithQueryClient(<KanbanBoard />)

      // Should not crash
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('empty state', () => {
    it('shows empty columns when no tasks exist', async () => {
      vi.mocked(api.tasks.list).mockResolvedValue([])

      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const noTasksMessages = screen.getAllByText('No tasks')
        expect(noTasksMessages).toHaveLength(3) // All three columns
      })
    })

    it('shows zero count in all columns when empty', async () => {
      vi.mocked(api.tasks.list).mockResolvedValue([])

      renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        const zeroCounts = screen.getAllByText('(0)')
        expect(zeroCounts).toHaveLength(3)
      })
    })
  })

  describe('integration', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('renders complete board structure', async () => {
      const { container } = renderWithQueryClient(<KanbanBoard />)

      await waitFor(() => {
        // Should have main wrapper with flex-1
        expect(container.querySelector('.flex-1.flex.flex-col')).toBeInTheDocument()
        // Should have main section
        expect(container.querySelector('main')).toBeInTheDocument()
        // Should have three columns
        const columns = container.querySelectorAll('[class*="min-w-[300px]"]')
        expect(columns).toHaveLength(3)
      })
    })
  })

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      vi.mocked(api.tasks.list).mockResolvedValue(mockTasks)
    })

    it('opens create task dialog when pressing "n" key', async () => {
      const user = userEvent.setup()
      const onCreateDialogChange = vi.fn()
      renderWithQueryClient(<KanbanBoard onCreateDialogChange={onCreateDialogChange} />)

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
      })

      // Press 'n' key
      await user.keyboard('n')

      // onCreateDialogChange should be called with true
      expect(onCreateDialogChange).toHaveBeenCalledWith(true)
    })

    it('opens create task dialog when pressing "N" (uppercase)', async () => {
      const user = userEvent.setup()
      const onCreateDialogChange = vi.fn()
      renderWithQueryClient(<KanbanBoard onCreateDialogChange={onCreateDialogChange} />)

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
      })

      // Press 'N' key (uppercase)
      await user.keyboard('N')

      // onCreateDialogChange should be called with true
      expect(onCreateDialogChange).toHaveBeenCalledWith(true)
    })

    it('does not open dialog when "n" is pressed while dialog is already open', async () => {
      const user = userEvent.setup()
      const onCreateDialogChange = vi.fn()
      renderWithQueryClient(<KanbanBoard createDialogOpen={true} onCreateDialogChange={onCreateDialogChange} />)

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Create New Task')).toBeInTheDocument()
      })

      // Press 'n' while dialog is already open
      await user.keyboard('n')

      // onCreateDialogChange should not be called because shortcuts are disabled when dialog is open
      expect(onCreateDialogChange).not.toHaveBeenCalled()
    })

    it('does not trigger shortcut when typing in an input field', async () => {
      const user = userEvent.setup()
      const onCreateDialogChange = vi.fn()
      renderWithQueryClient(
        <KanbanBoard createDialogOpen={true} onCreateDialogChange={onCreateDialogChange} />
      )

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Create New Task')).toBeInTheDocument()
      })

      // Find the title input and type 'n'
      const titleInput = screen.getByLabelText('Title')
      await user.click(titleInput)
      await user.clear(titleInput)
      await user.type(titleInput, 'new task')

      // The text should be in the input (shortcut didn't interfere)
      expect(titleInput).toHaveValue('new task')

      // onCreateDialogChange should not be called because we're typing in an input
      expect(onCreateDialogChange).not.toHaveBeenCalled()
    })

    it('does not trigger shortcut with modifier keys', async () => {
      const user = userEvent.setup()
      const onCreateDialogChange = vi.fn()
      renderWithQueryClient(<KanbanBoard onCreateDialogChange={onCreateDialogChange} />)

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument()
      })

      // Press Ctrl+N (should not trigger)
      await user.keyboard('{Control>}n{/Control}')

      // onCreateDialogChange should not be called with modifier keys
      expect(onCreateDialogChange).not.toHaveBeenCalled()
    })
  })
})
