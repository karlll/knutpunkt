import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import type { Task } from '@/lib/api'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'

const mockTasks: Task[] = [
  {
    id: '1',
    number: 1,
    title: 'Task 1',
    description: 'Description 1',
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
    title: 'Task 2',
    description: 'Description 2',
    status: 'planned',
    order: 2,
    priority: 'medium',
    categories: ['bug'],
    assignees: ['bob'],
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
]

// Create a QueryClient instance for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Wrapper component to provide necessary context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskEventsProvider enabled={false}>
        <DndContext>{children}</DndContext>
      </TaskEventsProvider>
    </QueryClientProvider>
  )
}

describe('KanbanColumn', () => {
  it('renders column title', () => {
    render(
      <TestWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </TestWrapper>
    )
    expect(screen.getByText('Planned')).toBeInTheDocument()
  })

  it('displays task count', () => {
    render(
      <TestWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </TestWrapper>
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('updates task count based on tasks array', () => {
    const { rerender } = render(
      <TestWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </TestWrapper>
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()

    rerender(
      <TestWrapper>
        <KanbanColumn status="planned" tasks={[mockTasks[0]]} title="Planned" />
      </TestWrapper>
    )
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  describe('status colors', () => {
    it('applies planned status color', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      // Check that the card has color-mix classes applied (using Catppuccin lavender)
      const card = container.querySelector('[class*="color-mix"]')
      expect(card).toBeInTheDocument()
    })

    it('applies ongoing status color', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="ongoing" tasks={[]} title="Ongoing" />
        </TestWrapper>
      )
      // Check that the card has color-mix classes applied (using Catppuccin blue)
      const card = container.querySelector('[class*="color-mix"]')
      expect(card).toBeInTheDocument()
    })

    it('applies done status color', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="done" tasks={[]} title="Done" />
        </TestWrapper>
      )
      // Check that the card has color-mix classes applied (using Catppuccin green)
      const card = container.querySelector('[class*="color-mix"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows "No tasks" message when empty', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      expect(screen.getByText('No tasks')).toBeInTheDocument()
    })

    it('displays count as 0 when empty', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })

    it('empty message has correct styling', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const emptyMessage = screen.getByText('No tasks')
      expect(emptyMessage).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('task rendering', () => {
    it('renders all tasks', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
    })

    it('renders tasks in order', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      const titles = Array.from(container.querySelectorAll('[class*="text-base"]')).map(
        (el) => el.textContent
      )
      expect(titles.indexOf('Task 1')).toBeLessThan(titles.indexOf('Task 2'))
    })

    it('does not show empty message when tasks exist', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      expect(screen.queryByText('No tasks')).not.toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('has fixed width constraints', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const column = container.querySelector('[class*="min-w"]')
      expect(column).toHaveClass('min-w-[300px]', 'max-w-[350px]')
    })

    it('has full height', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const column = container.querySelector('[class*="h-full"]')
      expect(column).toBeInTheDocument()
    })

    it('has scrollable content area', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      const scrollArea = container.querySelector('[class*="overflow-y-auto"]')
      expect(scrollArea).toBeInTheDocument()
    })

    it('has proper spacing between tasks', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      const taskContainer = container.querySelector('[class*="space-y-3"]')
      expect(taskContainer).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('is a droppable area', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      // The droppable area should exist
      const droppableArea = container.querySelector('[class*="rounded-md"]')
      expect(droppableArea).toBeInTheDocument()
    })

    it('has transition for drop highlight', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const droppableArea = container.querySelector('[class*="transition-colors"]')
      expect(droppableArea).toBeInTheDocument()
    })
  })

  describe('card structure', () => {
    it('uses Card component', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const card = container.querySelector('[class*="rounded-xl"]')
      expect(card).toBeInTheDocument()
    })

    it('has header section', () => {
      const { container } = render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const header = container.querySelector('[class*="p-6"]')
      expect(header).toBeInTheDocument()
    })

    it('title has correct styling', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const titleElement = screen.getByText('Planned').parentElement
      expect(titleElement).toHaveClass('flex', 'items-center', 'justify-between')
    })
  })

  describe('accessibility', () => {
    it('task count is distinguishable from title', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </TestWrapper>
      )
      const count = screen.getByText('(2)')
      expect(count).toHaveClass('text-muted-foreground')
    })

    it('empty state message is accessible', () => {
      render(
        <TestWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </TestWrapper>
      )
      const message = screen.getByText('No tasks')
      expect(message).toBeInTheDocument()
      expect(message).toHaveClass('text-sm')
    })
  })
})
