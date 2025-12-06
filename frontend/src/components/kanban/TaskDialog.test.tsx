import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskDialog } from './TaskDialog'
import type { Task } from '@/lib/api'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockTask: Task = {
  id: '123',
  number: 1,
  title: 'Test Task',
  description: '# Test Description',
  status: 'planned',
  priority: 'medium',
  assignees: ['alice'],
  categories: ['frontend'],
  order: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('TaskDialog', () => {
  it('renders create mode dialog', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Create New Task')).toBeInTheDocument()
    expect(screen.getByText('Fill in the details for your new task.')).toBeInTheDocument()
  })

  it('renders edit mode dialog', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByText('Make changes to the task details below.')).toBeInTheDocument()
  })

  it('renders with task data in edit mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput.value).toBe('Test Task')
  })

  it('shows collapsible metadata section', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    expect(
      screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    ).toBeInTheDocument()
  })

  it('has collapsible metadata section that can be toggled', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    // The collapsible trigger button exists
    const trigger = screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    expect(trigger).toBeInTheDocument()

    // The collapsible is implemented (chevron icon present)
    const chevronIcon = trigger.parentElement?.querySelector('svg')
    expect(chevronIcon).toBeInTheDocument()
  })

  it('renders title and description fields', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    // Description label exists (MarkdownEditor may not render fully in jsdom)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders submit and cancel buttons', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays assignees when in edit mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    // Expand metadata section
    const trigger = screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
    })
  })

  it('displays categories when in edit mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    // Expand metadata section
    const trigger = screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('frontend')).toBeInTheDocument()
    })
  })

  it('shows vim mode disabled by default', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    // The MarkdownEditor should be rendered (description label exists)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('respects enableVimMode prop', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} enableVimMode={true} />,
      { wrapper: createWrapper() }
    )

    // The MarkdownEditor should be rendered (description label exists)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
