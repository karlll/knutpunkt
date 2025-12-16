import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskCard } from './TaskCard'
import type { Task } from '@/lib/api'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'

const mockTask: Task = {
  id: '1',
  number: 42,
  title: 'Test Task',
  description: '# Test Description\n\nSome details',
  status: 'planned',
  order: 1,
  priority: 'high',
  categories: ['feature', 'frontend'],
  assignees: ['alice', 'bob'],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

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

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <TestWrapper>
        <TaskCard task={mockTask} />
      </TestWrapper>
    )
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task description preview', () => {
    render(
      <TestWrapper>
        <TaskCard task={mockTask} />
      </TestWrapper>
    )
    // Description without markdown header
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not render description when empty', () => {
    const taskWithoutDesc = { ...mockTask, description: '' }
    const { container } = render(
      <TestWrapper>
        <TaskCard task={taskWithoutDesc} />
      </TestWrapper>
    )
    expect(container.textContent).not.toContain('Description')
  })

  describe('priority badge', () => {
    it('renders high priority with correct styling', () => {
      render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const badge = screen.getByText('high')
      // Check that the badge has Catppuccin color classes applied
      expect(badge).toHaveClass('text-ctp-red')
      expect(badge.className).toContain('color-mix')
    })

    it('renders medium priority with correct styling', () => {
      const mediumTask = { ...mockTask, priority: 'medium' as const }
      render(
        <TestWrapper>
          <TaskCard task={mediumTask} />
        </TestWrapper>
      )
      const badge = screen.getByText('medium')
      // Check that the badge has Catppuccin color classes applied
      expect(badge).toHaveClass('text-ctp-peach')
      expect(badge.className).toContain('color-mix')
    })

    it('renders low priority with correct styling', () => {
      const lowTask = { ...mockTask, priority: 'low' as const }
      render(
        <TestWrapper>
          <TaskCard task={lowTask} />
        </TestWrapper>
      )
      const badge = screen.getByText('low')
      // Check that the badge has Catppuccin color classes applied
      expect(badge).toHaveClass('text-ctp-green')
      expect(badge.className).toContain('color-mix')
    })
  })

  describe('categories', () => {
    it('renders category badges', () => {
      render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      expect(screen.getByText('feature')).toBeInTheDocument()
      expect(screen.getByText('frontend')).toBeInTheDocument()
    })

    it('does not render categories section when empty', () => {
      const taskWithoutCategories = { ...mockTask, categories: [] }
      const { container } = render(
        <TestWrapper>
          <TaskCard task={taskWithoutCategories} />
        </TestWrapper>
      )
      expect(container.querySelectorAll('[class*="flex-wrap"]')).toHaveLength(1) // Only assignees
    })
  })

  describe('assignees', () => {
    it('renders assignee avatars', () => {
      render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      // Check for avatar initials
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('shows full name on hover via title attribute', () => {
      const { container } = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const avatars = container.querySelectorAll('[title]')
      const titles = Array.from(avatars).map((el) => el.getAttribute('title'))
      expect(titles).toContain('alice')
      expect(titles).toContain('bob')
    })

    it('does not render assignees section when empty', () => {
      const taskWithoutAssignees = { ...mockTask, assignees: [] }
      const { container } = render(
        <TestWrapper>
          <TaskCard task={taskWithoutAssignees} />
        </TestWrapper>
      )
      expect(container.querySelectorAll('[class*="rounded-full"]')).toHaveLength(0)
    })

    it('capitalizes first letter of assignee name', () => {
      const taskWithLowercase = { ...mockTask, assignees: ['john'] }
      render(
        <TestWrapper>
          <TaskCard task={taskWithLowercase} />
        </TestWrapper>
      )
      expect(screen.getByText('J')).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('renders grip icon for dragging', () => {
      const { container} = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const gripButton = container.querySelector('button.cursor-grab')
      expect(gripButton).toBeInTheDocument()
      expect(gripButton).toHaveClass('cursor-grab')
    })

    it('has cursor-grab class on card', () => {
      const { container } = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const card = container.querySelector('[class*="cursor-grab"]')
      expect(card).toHaveClass('cursor-grab', 'active:cursor-grabbing')
    })

    it('has hover shadow effect', () => {
      const { container } = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const card = container.querySelector('[class*="hover:shadow"]')
      expect(card).toHaveClass('hover:shadow-md', 'transition-shadow')
    })
  })

  describe('description formatting', () => {
    it('removes markdown headers from description preview', () => {
      const taskWithHeader = {
        ...mockTask,
        description: '### Header\nContent below',
      }
      render(
        <TestWrapper>
          <TaskCard task={taskWithHeader} />
        </TestWrapper>
      )
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.queryByText('###')).not.toBeInTheDocument()
    })

    it('shows only first line of description', () => {
      const multiLineTask = {
        ...mockTask,
        description: 'First line\nSecond line\nThird line',
      }
      const { container } = render(
        <TestWrapper>
          <TaskCard task={multiLineTask} />
        </TestWrapper>
      )
      expect(screen.getByText('First line')).toBeInTheDocument()
      // line-clamp-2 class limits to 2 lines
      const desc = container.querySelector('.line-clamp-2')
      expect(desc).toBeInTheDocument()
    })
  })

  describe('card structure', () => {
    it('has proper title truncation', () => {
      const { container } = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      const title = container.querySelector('.line-clamp-2')
      expect(title).toBeInTheDocument()
    })

    it('uses Card components from shadcn', () => {
      const { container } = render(
        <TestWrapper>
          <TaskCard task={mockTask} />
        </TestWrapper>
      )
      // Check for Card structure
      const card = container.querySelector('[class*="rounded-xl"]')
      expect(card).toBeInTheDocument()
    })
  })
})
