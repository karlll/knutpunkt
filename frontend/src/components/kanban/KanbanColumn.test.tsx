import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import type { Task } from '@/lib/api'

const mockTasks: Task[] = [
  {
    id: '1',
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

// Wrapper component to provide DndContext
function DndWrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>
}

describe('KanbanColumn', () => {
  it('renders column title', () => {
    render(
      <DndWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </DndWrapper>
    )
    expect(screen.getByText('Planned')).toBeInTheDocument()
  })

  it('displays task count', () => {
    render(
      <DndWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </DndWrapper>
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('updates task count based on tasks array', () => {
    const { rerender } = render(
      <DndWrapper>
        <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
      </DndWrapper>
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()

    rerender(
      <DndWrapper>
        <KanbanColumn status="planned" tasks={[mockTasks[0]]} title="Planned" />
      </DndWrapper>
    )
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  describe('status colors', () => {
    it('applies planned status color', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const card = container.querySelector('[class*="bg-slate-100"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('border-slate-200')
    })

    it('applies ongoing status color', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="ongoing" tasks={[]} title="Ongoing" />
        </DndWrapper>
      )
      const card = container.querySelector('[class*="bg-blue-100"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('border-blue-200')
    })

    it('applies done status color', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="done" tasks={[]} title="Done" />
        </DndWrapper>
      )
      const card = container.querySelector('[class*="bg-green-100"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('border-green-200')
    })
  })

  describe('empty state', () => {
    it('shows "No tasks" message when empty', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      expect(screen.getByText('No tasks')).toBeInTheDocument()
    })

    it('displays count as 0 when empty', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })

    it('empty message has correct styling', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const emptyMessage = screen.getByText('No tasks')
      expect(emptyMessage).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('task rendering', () => {
    it('renders all tasks', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
    })

    it('renders tasks in order', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      const titles = Array.from(container.querySelectorAll('[class*="text-base"]')).map(
        (el) => el.textContent
      )
      expect(titles.indexOf('Task 1')).toBeLessThan(titles.indexOf('Task 2'))
    })

    it('does not show empty message when tasks exist', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      expect(screen.queryByText('No tasks')).not.toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('has fixed width constraints', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const column = container.querySelector('[class*="min-w"]')
      expect(column).toHaveClass('min-w-[300px]', 'max-w-[350px]')
    })

    it('has full height', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const column = container.querySelector('[class*="h-full"]')
      expect(column).toBeInTheDocument()
    })

    it('has scrollable content area', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      const scrollArea = container.querySelector('[class*="overflow-y-auto"]')
      expect(scrollArea).toBeInTheDocument()
    })

    it('has proper spacing between tasks', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      const taskContainer = container.querySelector('[class*="space-y-3"]')
      expect(taskContainer).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('is a droppable area', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      // The droppable area should exist
      const droppableArea = container.querySelector('[class*="rounded-md"]')
      expect(droppableArea).toBeInTheDocument()
    })

    it('has transition for drop highlight', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const droppableArea = container.querySelector('[class*="transition-colors"]')
      expect(droppableArea).toBeInTheDocument()
    })
  })

  describe('card structure', () => {
    it('uses Card component', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const card = container.querySelector('[class*="rounded-xl"]')
      expect(card).toBeInTheDocument()
    })

    it('has header section', () => {
      const { container } = render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const header = container.querySelector('[class*="p-6"]')
      expect(header).toBeInTheDocument()
    })

    it('title has correct styling', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const titleElement = screen.getByText('Planned').parentElement
      expect(titleElement).toHaveClass('flex', 'items-center', 'justify-between')
    })
  })

  describe('accessibility', () => {
    it('task count is distinguishable from title', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={mockTasks} title="Planned" />
        </DndWrapper>
      )
      const count = screen.getByText('(2)')
      expect(count).toHaveClass('text-muted-foreground')
    })

    it('empty state message is accessible', () => {
      render(
        <DndWrapper>
          <KanbanColumn status="planned" tasks={[]} title="Planned" />
        </DndWrapper>
      )
      const message = screen.getByText('No tasks')
      expect(message).toBeInTheDocument()
      expect(message).toHaveClass('text-sm')
    })
  })
})
