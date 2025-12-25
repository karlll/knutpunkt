import type { Meta, StoryObj } from '@storybook/react'
import { DndContext } from '@dnd-kit/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskEventsProvider } from '@/contexts/TaskEventsContext'
import { TaskCard } from './TaskCard'
import type { Task } from '@/lib/api'

const meta = {
  title: 'Kanban/TaskCard',
  component: TaskCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })
      return (
        <QueryClientProvider client={queryClient}>
          <TaskEventsProvider>
            <DndContext>
              <div className="w-[350px]">
                <Story />
              </div>
            </DndContext>
          </TaskEventsProvider>
        </QueryClientProvider>
      )
    },
  ],
} satisfies Meta<typeof TaskCard>

export default meta
type Story = StoryObj<typeof meta>

const baseTask: Task = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  number: 1,
  title: 'Setup project infrastructure',
  description: '## Description\n\nSetup the initial project structure including frontend and backend.\n\n## Acceptance Criteria\n\n- [x] Create OpenAPI specification\n- [x] Initialize frontend with Vite\n- [ ] Initialize backend with Ktor',
  status: 'ongoing',
  order: 1,
  priority: 'high',
  assignees: ['alice'],
  categories: ['infrastructure', 'setup'],
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T14:30:00Z',
}

export const HighPriority: Story = {
  args: {
    task: baseTask,
  },
}

export const MediumPriority: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440002',
  number: 1,
      title: 'Implement authentication',
      description: '## Description\n\nImplement JWT-based authentication for the API.',
      priority: 'medium',
      assignees: ['bob'],
      categories: ['feature', 'backend'],
    },
  },
}

export const LowPriority: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440003',
  number: 1,
      title: 'Write documentation',
      description: '## Description\n\nDocument all API endpoints with examples.',
      priority: 'low',
      assignees: [],
      categories: ['documentation'],
    },
  },
}

export const MultipleAssignees: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440004',
  number: 1,
      title: 'Design UI mockups',
      assignees: ['alice', 'bob', 'charlie'],
      categories: ['design', 'frontend'],
    },
  },
}

export const ManyCategories: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440005',
  number: 1,
      title: 'Refactor codebase',
      categories: ['refactor', 'backend', 'frontend', 'testing', 'performance'],
      priority: 'medium',
    },
  },
}

export const MinimalTask: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440006',
  number: 1,
      title: 'Quick fix',
      description: 'A simple task',
      assignees: [],
      categories: [],
      priority: 'low',
    },
  },
}

export const LongTitle: Story = {
  args: {
    task: {
      ...baseTask,
      id: '550e8400-e29b-41d4-a716-446655440007',
  number: 1,
      title: 'This is a very long task title that should wrap to multiple lines to demonstrate how the card handles long titles',
      priority: 'medium',
    },
  },
}
