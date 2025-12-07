import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchiveDialog } from './ArchiveDialog'
import type { Task } from '@/lib/api'

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-id',
  number: 1,
  title: 'Test Task',
  description: '# Test Description',
  status: 'done',
  priority: 'medium',
  assignees: [],
  categories: [],
  order: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  ...overrides,
})

describe('ArchiveDialog', () => {
  it('renders dialog when open', () => {
    const onOpenChange = vi.fn()
    const tasks = [createMockTask()]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Archived Tasks')).toBeInTheDocument()
  })

  it('displays task count in description', () => {
    const onOpenChange = vi.fn()
    const tasks = [
      createMockTask({ id: '1', number: 1 }),
      createMockTask({ id: '2', number: 2 }),
      createMockTask({ id: '3', number: 3 }),
    ]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Viewing 3 archived tasks from the done column.')).toBeInTheDocument()
  })

  it('displays single task message correctly', () => {
    const onOpenChange = vi.fn()
    const tasks = [createMockTask()]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Viewing 1 archived task from the done column.')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    const onOpenChange = vi.fn()
    const tasks = [createMockTask()]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Task #')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Last Updated')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders task rows with data', () => {
    const onOpenChange = vi.fn()
    const tasks = [
      createMockTask({
        id: '1',
        number: 123,
        title: 'Test Task 1',
        status: 'done',
        updatedAt: '2024-01-15T00:00:00Z',
      }),
    ]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('#123')).toBeInTheDocument()
    expect(screen.getByText('Test Task 1')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', () => {
    const onOpenChange = vi.fn()

    render(
      <ArchiveDialog tasks={[]} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('No archived tasks found')).toBeInTheDocument()
  })

  it('sorts tasks by updatedAt DESC', () => {
    const onOpenChange = vi.fn()
    const tasks = [
      createMockTask({ id: '1', number: 1, updatedAt: '2024-01-01T00:00:00Z' }),
      createMockTask({ id: '2', number: 2, updatedAt: '2024-01-15T00:00:00Z' }),
      createMockTask({ id: '3', number: 3, updatedAt: '2024-01-10T00:00:00Z' }),
    ]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const rows = screen.getAllByRole('row')
    // First row is headers, second row should be most recent task (#2)
    expect(rows[1]).toHaveTextContent('#2')
    expect(rows[2]).toHaveTextContent('#3')
    expect(rows[3]).toHaveTextContent('#1')
  })

  it('displays first 10 tasks on first page', () => {
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    // Should show tasks 1-10
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#10')).toBeInTheDocument()
    // Should not show task 11
    expect(screen.queryByText('#11')).not.toBeInTheDocument()
  })

  it('shows pagination controls when more than 10 tasks', () => {
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.getByText('Page 1 of 2 (15 total tasks)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('does not show pagination with 10 or fewer tasks', () => {
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 10 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    expect(screen.queryByText(/page/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const previousButton = screen.getByRole('button', { name: /previous/i })
    expect(previousButton).toBeDisabled()
  })

  it('navigates to next page when next button clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    // Should now show page 2
    expect(screen.getByText('Page 2 of 2 (15 total tasks)')).toBeInTheDocument()
    // Should show tasks 11-15
    expect(screen.getByText('#11')).toBeInTheDocument()
    expect(screen.getByText('#15')).toBeInTheDocument()
    // Should not show task 10
    expect(screen.queryByText('#10')).not.toBeInTheDocument()
  })

  it('navigates back to previous page', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    const previousButton = screen.getByRole('button', { name: /previous/i })
    await user.click(previousButton)

    // Should be back on page 1
    expect(screen.getByText('Page 1 of 2 (15 total tasks)')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('disables next button on last page', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(nextButton).toBeDisabled()
  })

  it('renders view button for each task', () => {
    const onOpenChange = vi.fn()
    const tasks = [createMockTask({ number: 1 })]

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    const viewButtons = screen.getAllByRole('button', { name: /view task/i })
    expect(viewButtons).toHaveLength(1)
  })

  it('manages pagination state correctly', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `${i}`, number: i + 1 })
    )

    render(
      <ArchiveDialog tasks={tasks} open={true} onOpenChange={onOpenChange} />
    )

    // Initially on page 1
    expect(screen.getByText('Page 1 of 2 (15 total tasks)')).toBeInTheDocument()

    // Go to page 2
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    expect(screen.getByText('Page 2 of 2 (15 total tasks)')).toBeInTheDocument()

    // Verify task #11 is visible on page 2
    expect(screen.getByText('#11')).toBeInTheDocument()
  })
})
