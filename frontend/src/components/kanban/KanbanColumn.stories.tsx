import type { Meta, StoryObj } from '@storybook/react'
import { DndContext } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import type { Task } from '@/lib/api'

const meta = {
  title: 'Kanban/KanbanColumn',
  component: KanbanColumn,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DndContext>
        <div className="h-[600px]">
          <Story />
        </div>
      </DndContext>
    ),
  ],
} satisfies Meta<typeof KanbanColumn>

export default meta
type Story = StoryObj<typeof meta>

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Setup project infrastructure',
    description: '## Description\n\nSetup the initial project structure.',
    status: 'planned',
    order: 1,
    priority: 'high',
    assignees: ['alice'],
    categories: ['infrastructure', 'setup'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
  },
  {
    id: '2',
    title: 'Implement authentication',
    description: '## Description\n\nImplement JWT-based authentication.',
    status: 'planned',
    order: 2,
    priority: 'medium',
    assignees: ['bob'],
    categories: ['feature', 'backend'],
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T09:00:00Z',
  },
  {
    id: '3',
    title: 'Write documentation',
    description: '## Description\n\nDocument all API endpoints.',
    status: 'planned',
    order: 3,
    priority: 'low',
    assignees: [],
    categories: ['documentation'],
    createdAt: '2025-01-17T11:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
  },
]

export const PlannedColumn: Story = {
  args: {
    status: 'planned',
    title: 'Planned',
    tasks: sampleTasks,
  },
}

export const OngoingColumn: Story = {
  args: {
    status: 'ongoing',
    title: 'Ongoing',
    tasks: sampleTasks.map(task => ({ ...task, status: 'ongoing' as const })),
  },
}

export const DoneColumn: Story = {
  args: {
    status: 'done',
    title: 'Done',
    tasks: sampleTasks.map(task => ({ ...task, status: 'done' as const })),
  },
}

export const EmptyColumn: Story = {
  args: {
    status: 'planned',
    title: 'Planned',
    tasks: [],
  },
}

export const SingleTask: Story = {
  args: {
    status: 'ongoing',
    title: 'Ongoing',
    tasks: [sampleTasks[0]],
  },
}

export const ManyTasks: Story = {
  args: {
    status: 'planned',
    title: 'Planned',
    tasks: Array.from({ length: 10 }, (_, i) => ({
      ...sampleTasks[0],
      id: `task-${i}`,
      title: `Task ${i + 1}`,
      priority: (['high', 'medium', 'low'] as const)[i % 3],
    })),
  },
}
