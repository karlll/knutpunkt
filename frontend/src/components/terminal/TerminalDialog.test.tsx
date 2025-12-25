import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TerminalDialog } from './TerminalDialog'

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    terminal: {
      listSessions: vi.fn(() => Promise.resolve([])),
    },
  },
}))

// Mock the Terminal component
vi.mock('./Terminal', () => ({
  Terminal: ({
    taskId,
    sessionId,
    onClose,
  }: {
    taskId?: string
    sessionId?: string
    onClose?: () => void
  }) => {
    return (
      <div data-testid="terminal-component" data-task-id={taskId} data-session-id={sessionId}>
        Terminal Component
        {onClose && (
          <button onClick={onClose} data-testid="terminal-close">
            Close from Terminal
          </button>
        )}
      </div>
    )
  },
}))

// Helper to render with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}


describe('TerminalDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders dialog when open is true', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Terminal')).toBeInTheDocument()
    })

    it('does not render terminal when open is false', () => {
      renderWithQueryClient(<TerminalDialog open={false} onOpenChange={mockOnOpenChange} />)

      expect(screen.queryByTestId('terminal-component')).not.toBeInTheDocument()
    })

    it('shows empty state when no sessions exist', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        expect(screen.getByText('No Active Sessions')).toBeInTheDocument()
      })
      expect(screen.getByText(/You don't have any active terminal sessions/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Session' })).toBeInTheDocument()
    })

    it('passes taskId to Terminal component when creating new session', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} taskId="test-task-123" />)

      const user = userEvent.setup()

      // Click "Create Session" button in empty state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Session' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: 'Create Session' }))

      // Terminal should be shown with taskId
      await waitFor(() => {
        const terminal = screen.getByTestId('terminal-component')
        expect(terminal).toHaveAttribute('data-task-id', 'test-task-123')
      })
    })
  })

  describe('close button', () => {
    it('renders close button', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /close/i })
        const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')
        expect(footerCloseButton).toBeInTheDocument()
      })
    })

    it('calls onOpenChange with false when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Wait for dialog to render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Get all buttons with "Close" and find the one in the footer (has variant="outline")
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')

      await user.click(footerCloseButton!)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('terminal lifecycle', () => {
    it('passes onClose callback to Terminal component', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      const user = userEvent.setup()

      // Click "Create Session" to show terminal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Session' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: 'Create Session' }))

      await waitFor(() => {
        const terminalCloseButton = screen.getByTestId('terminal-close')
        expect(terminalCloseButton).toBeInTheDocument()
      })
    })

    it('closes dialog when Terminal triggers onClose', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Click "Create Session" to show terminal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Session' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: 'Create Session' }))

      await waitFor(() => {
        expect(screen.getByTestId('terminal-close')).toBeInTheDocument()
      })

      const terminalCloseButton = screen.getByTestId('terminal-close')
      await user.click(terminalCloseButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('remounts Terminal component on subsequent opens', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TerminalDialog open={true} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>
      )

      const user = userEvent.setup()

      // Click "Create Session" to show terminal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Session' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: 'Create Session' }))

      // Verify terminal is present after creating session
      await waitFor(() => {
        expect(screen.getByTestId('terminal-component')).toBeInTheDocument()
      })

      // Click the close button to close the dialog (this resets state)
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')
      expect(footerCloseButton).toBeInTheDocument()
      await user.click(footerCloseButton!)

      // Verify onOpenChange was called
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)

      // Simulate closing the dialog
      rerender(
        <QueryClientProvider client={queryClient}>
          <TerminalDialog open={false} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>
      )

      // Terminal should be removed when closed
      expect(screen.queryByTestId('terminal-component')).not.toBeInTheDocument()

      // Reopen dialog
      rerender(
        <QueryClientProvider client={queryClient}>
          <TerminalDialog open={true} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>
      )

      // Should show empty state again (since session creation is reset)
      await waitFor(() => {
        expect(screen.getByText('No Active Sessions')).toBeInTheDocument()
      })
    })
  })

  describe('layout and structure', () => {
    it('has proper dialog structure with header, content, and footer', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Terminal')).toBeInTheDocument()

      // Should show empty state when no sessions
      await waitFor(() => {
        expect(screen.getByText('No Active Sessions')).toBeInTheDocument()
      })

      // Verify footer close button exists
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')
      expect(footerCloseButton).toBeInTheDocument()
    })

    it('applies correct CSS classes for layout', async () => {
      renderWithQueryClient(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('flex', 'flex-col')
      })
    })
  })
})
