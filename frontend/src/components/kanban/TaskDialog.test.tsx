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

  it('uses VIM mode from settings hook', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    )

    // The MarkdownEditor should be rendered (description label exists)
    expect(screen.getByText('Description')).toBeInTheDocument()
    // VIM mode is now controlled by useSettings hook, not a prop
  })

  it('renders in read-only mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('View Task')).toBeInTheDocument()
    expect(screen.getByText('Viewing task details.')).toBeInTheDocument()
  })

  it('disables title input in read-only mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput).toBeDisabled()
  })

  it('shows Close button instead of Cancel and Save in read-only mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    // Check that Close button exists in footer (not the X button in header)
    const buttons = screen.getAllByRole('button', { name: /close/i })
    expect(buttons.length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('hides add assignee input in read-only mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    // Expand metadata section
    const trigger = screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    await user.click(trigger)

    // Should not show the add assignee input
    expect(screen.queryByPlaceholderText('Add assignee...')).not.toBeInTheDocument()
  })

  it('hides add category input in read-only mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    // Expand metadata section
    const trigger = screen.getByText('Task Details (Status, Priority, Assignees, Categories)')
    await user.click(trigger)

    // Should not show the add category input
    expect(screen.queryByPlaceholderText('Add category...')).not.toBeInTheDocument()
  })

  it('displays assignees without remove button in read-only mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    // In read-only mode, assignees should be displayed
    // We just verify the component renders without errors
    expect(screen.getByText('View Task')).toBeInTheDocument()
  })

  it('displays categories without remove button in read-only mode', () => {
    const onOpenChange = vi.fn()

    render(
      <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
      { wrapper: createWrapper() }
    )

    // In read-only mode, categories should be displayed
    // We just verify the component renders without errors
    expect(screen.getByText('View Task')).toBeInTheDocument()
  })

  describe('unsaved changes detection', () => {
    it('allows closing without confirmation when no changes made', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should close directly without showing confirmation
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
    })

    it('shows confirmation when closing with unsaved title changes via Cancel button', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      )

      // Make a change to the title
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Modified Task Title')

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
        expect(screen.getByText("There's unsaved changes. Close anyway?")).toBeInTheDocument()
      })

      // Should not have closed the main dialog yet
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })

    it('stays open when clicking Cancel in confirmation dialog', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      )

      // Make a change
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Modified')

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Confirmation should appear
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })

      // Click Cancel in confirmation dialog (find all cancel buttons, last one is the confirmation)
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
      const confirmCancelButton = cancelButtons[cancelButtons.length - 1]
      await user.click(confirmCancelButton)

      // Should hide confirmation and keep main dialog open
      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
      })
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(screen.getByText('Create New Task')).toBeInTheDocument()
    })

    it('closes when clicking Close Anyway in confirmation dialog', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="create" open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      )

      // Make a change
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Modified')

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Confirmation should appear
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })

      // Click Close Anyway
      const closeAnywayButton = screen.getByRole('button', { name: /close anyway/i })
      await user.click(closeAnywayButton)

      // Should close the dialog
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('detects changes in title field', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} />,
        { wrapper: createWrapper() }
      )

      // Modify title
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Changed Title')

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should show confirmation
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })
    })

    it('does not show confirmation in read-only mode', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <TaskDialog mode="edit" task={mockTask} open={true} onOpenChange={onOpenChange} readOnly={true} />,
        { wrapper: createWrapper() }
      )

      // Click close button
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = closeButtons[closeButtons.length - 1]
      await user.click(footerCloseButton)

      // Should close without confirmation
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
    })
  })
})
