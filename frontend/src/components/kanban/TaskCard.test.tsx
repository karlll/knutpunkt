import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { TaskCard } from './TaskCard'
import type { Task } from '@/lib/api'

const mockTask: Task = {
  id: '1',
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

// Wrapper component to provide DndContext
function DndWrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>
}

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <DndWrapper>
        <TaskCard task={mockTask} />
      </DndWrapper>
    )
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task description preview', () => {
    render(
      <DndWrapper>
        <TaskCard task={mockTask} />
      </DndWrapper>
    )
    // Description without markdown header
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not render description when empty', () => {
    const taskWithoutDesc = { ...mockTask, description: '' }
    const { container } = render(
      <DndWrapper>
        <TaskCard task={taskWithoutDesc} />
      </DndWrapper>
    )
    expect(container.textContent).not.toContain('Description')
  })

  describe('priority badge', () => {
    it('renders high priority with correct styling', () => {
      render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      const badge = screen.getByText('high')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
    })

    it('renders medium priority with correct styling', () => {
      const mediumTask = { ...mockTask, priority: 'medium' as const }
      render(
        <DndWrapper>
          <TaskCard task={mediumTask} />
        </DndWrapper>
      )
      const badge = screen.getByText('medium')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200')
    })

    it('renders low priority with correct styling', () => {
      const lowTask = { ...mockTask, priority: 'low' as const }
      render(
        <DndWrapper>
          <TaskCard task={lowTask} />
        </DndWrapper>
      )
      const badge = screen.getByText('low')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })
  })

  describe('categories', () => {
    it('renders category badges', () => {
      render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      expect(screen.getByText('feature')).toBeInTheDocument()
      expect(screen.getByText('frontend')).toBeInTheDocument()
    })

    it('does not render categories section when empty', () => {
      const taskWithoutCategories = { ...mockTask, categories: [] }
      const { container } = render(
        <DndWrapper>
          <TaskCard task={taskWithoutCategories} />
        </DndWrapper>
      )
      expect(container.querySelectorAll('[class*="flex-wrap"]')).toHaveLength(1) // Only assignees
    })
  })

  describe('assignees', () => {
    it('renders assignee avatars', () => {
      render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      // Check for avatar initials
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('shows full name on hover via title attribute', () => {
      const { container } = render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      const avatars = container.querySelectorAll('[title]')
      const titles = Array.from(avatars).map((el) => el.getAttribute('title'))
      expect(titles).toContain('alice')
      expect(titles).toContain('bob')
    })

    it('does not render assignees section when empty', () => {
      const taskWithoutAssignees = { ...mockTask, assignees: [] }
      const { container } = render(
        <DndWrapper>
          <TaskCard task={taskWithoutAssignees} />
        </DndWrapper>
      )
      expect(container.querySelectorAll('[class*="rounded-full"]')).toHaveLength(0)
    })

    it('capitalizes first letter of assignee name', () => {
      const taskWithLowercase = { ...mockTask, assignees: ['john'] }
      render(
        <DndWrapper>
          <TaskCard task={taskWithLowercase} />
        </DndWrapper>
      )
      expect(screen.getByText('J')).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('renders grip icon for dragging', () => {
      const { container } = render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      const gripButton = container.querySelector('button')
      expect(gripButton).toBeInTheDocument()
      expect(gripButton).toHaveClass('cursor-grab')
    })

    it('has cursor-grab class on card', () => {
      const { container } = render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      const card = container.querySelector('[class*="cursor-grab"]')
      expect(card).toHaveClass('cursor-grab', 'active:cursor-grabbing')
    })

    it('has hover shadow effect', () => {
      const { container } = render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
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
        <DndWrapper>
          <TaskCard task={taskWithHeader} />
        </DndWrapper>
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
        <DndWrapper>
          <TaskCard task={multiLineTask} />
        </DndWrapper>
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
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      const title = container.querySelector('.line-clamp-2')
      expect(title).toBeInTheDocument()
    })

    it('uses Card components from shadcn', () => {
      const { container } = render(
        <DndWrapper>
          <TaskCard task={mockTask} />
        </DndWrapper>
      )
      // Check for Card structure
      const card = container.querySelector('[class*="rounded-xl"]')
      expect(card).toBeInTheDocument()
    })
  })
})
