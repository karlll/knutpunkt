import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TerminalDialog } from './TerminalDialog'

// Mock the Terminal component
vi.mock('./Terminal', () => ({
  Terminal: ({
    taskId,
    onClose,
    onStatusChange,
  }: {
    taskId?: string
    onClose?: () => void
    onStatusChange?: (status: string, error?: string) => void
  }) => {
    // Simulate connection status changes
    if (onStatusChange) {
      // Simulate connecting -> connected transition
      setTimeout(() => onStatusChange('connecting'), 0)
      setTimeout(() => onStatusChange('connected'), 10)
    }

    return (
      <div data-testid="terminal-component" data-task-id={taskId}>
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


describe('TerminalDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Terminal')).toBeInTheDocument()
    })

    it('does not render terminal when open is false', () => {
      render(<TerminalDialog open={false} onOpenChange={mockOnOpenChange} />)

      expect(screen.queryByTestId('terminal-component')).not.toBeInTheDocument()
    })

    it('renders terminal component when dialog is open', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByTestId('terminal-component')).toBeInTheDocument()
    })

    it('passes taskId to Terminal component', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} taskId="test-task-123" />)

      const terminal = screen.getByTestId('terminal-component')
      expect(terminal).toHaveAttribute('data-task-id', 'test-task-123')
    })
  })

  describe('connection status indicator', () => {
    it('displays "Connected" status when connected', async () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // The mock Terminal component simulates status changes
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })
    })

    it('displays "Connecting..." status initially', async () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Should start with "Connecting..." before the mock updates it
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('renders close button', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Get all buttons with "Close" and find the one in the footer (has variant="outline")
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')

      expect(footerCloseButton).toBeInTheDocument()
    })

    it('calls onOpenChange with false when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Get all buttons with "Close" and find the one in the footer (has variant="outline")
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')

      await user.click(footerCloseButton!)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('terminal lifecycle', () => {
    it('passes onClose callback to Terminal component', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      const terminalCloseButton = screen.getByTestId('terminal-close')
      expect(terminalCloseButton).toBeInTheDocument()
    })

    it('closes dialog when Terminal triggers onClose', async () => {
      const user = userEvent.setup()
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      const terminalCloseButton = screen.getByTestId('terminal-close')
      await user.click(terminalCloseButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('remounts Terminal component on subsequent opens', async () => {
      const { rerender } = render(
        <TerminalDialog open={true} onOpenChange={mockOnOpenChange} />
      )

      // Verify terminal is present on first open
      expect(screen.getByTestId('terminal-component')).toBeInTheDocument()

      // Close dialog
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')
      const user = userEvent.setup()
      await user.click(footerCloseButton!)

      // Simulate closing the dialog
      rerender(<TerminalDialog open={false} onOpenChange={mockOnOpenChange} />)

      // Terminal should be removed when closed
      expect(screen.queryByTestId('terminal-component')).not.toBeInTheDocument()

      // Reopen dialog
      rerender(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      // Terminal should be present again on reopen
      expect(screen.getByTestId('terminal-component')).toBeInTheDocument()
    })
  })

  describe('layout and structure', () => {
    it('has proper dialog structure with header, content, and footer', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Terminal')).toBeInTheDocument()
      expect(screen.getByTestId('terminal-component')).toBeInTheDocument()

      // Verify footer close button exists
      const buttons = screen.getAllByRole('button', { name: /close/i })
      const footerCloseButton = buttons.find((btn) => btn.textContent === 'Close')
      expect(footerCloseButton).toBeInTheDocument()
    })

    it('applies correct CSS classes for layout', () => {
      render(<TerminalDialog open={true} onOpenChange={mockOnOpenChange} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('flex', 'flex-col')
    })
  })
})
