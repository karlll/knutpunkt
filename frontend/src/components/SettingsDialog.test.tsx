import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { SettingsDialog } from './SettingsDialog'
import * as useSettingsModule from '@/hooks/useSettings'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const mockBackendSettings = {
  settings: [
    { key: 'title', value: 'Knutpunkt', description: 'Application title' },
    { key: 'terminal.enabled', value: 'false', description: 'PTY terminal support enabled' },
  ],
}

describe('SettingsDialog', () => {
  const mockUpdateSettings = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    // Mock the useSettings hook
    vi.spyOn(useSettingsModule, 'useSettings').mockReturnValue([
      {
        vimMode: false,
        maxDoneTasksVisible: 5,
      },
      mockUpdateSettings,
    ])

    // Mock API calls
    vi.mocked(api.settings.get).mockResolvedValue(mockBackendSettings)
    vi.mocked(api.settings.update).mockResolvedValue({ message: 'Setting updated successfully' })
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the dialog when open', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText(/Configure your application preferences/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SettingsDialog open={false} onOpenChange={mockOnOpenChange} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('displays current settings values', () => {
    vi.spyOn(useSettingsModule, 'useSettings').mockReturnValue([
      {
        vimMode: true,
        maxDoneTasksVisible: 10,
      },
      mockUpdateSettings,
    ])

    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const vimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    expect(vimSwitch).toBeChecked()

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i)
    expect(maxTasksInput).toHaveValue(10)
  })

  it('toggles VIM mode switch', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const vimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    expect(vimSwitch).not.toBeChecked()

    fireEvent.click(vimSwitch)
    expect(vimSwitch).toBeChecked()
  })

  it('updates max done tasks visible input', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement
    expect(maxTasksInput.value).toBe('5')

    fireEvent.change(maxTasksInput, { target: { value: '15' } })
    expect(maxTasksInput.value).toBe('15')
  })

  it('validates max tasks input - rejects values below 1', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement

    fireEvent.change(maxTasksInput, { target: { value: '0' } })
    // Should keep previous value since 0 is invalid
    expect(maxTasksInput.value).toBe('5')
  })

  it('validates max tasks input - rejects values above 50', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement

    fireEvent.change(maxTasksInput, { target: { value: '100' } })
    // Should keep previous value since 100 is invalid
    expect(maxTasksInput.value).toBe('5')
  })

  it('validates max tasks input - rejects non-numeric values', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement

    fireEvent.change(maxTasksInput, { target: { value: 'abc' } })
    // Should keep previous value since 'abc' is invalid
    expect(maxTasksInput.value).toBe('5')
  })

  it('saves changes when Save Changes button is clicked', async () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    // Make some changes
    const vimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    fireEvent.click(vimSwitch)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i)
    fireEvent.change(maxTasksInput, { target: { value: '20' } })

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        vimMode: true,
        maxDoneTasksVisible: 20,
      })
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('discards changes when Cancel button is clicked', async () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    // Make some changes
    const vimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    fireEvent.click(vimSwitch)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i)
    fireEvent.change(maxTasksInput, { target: { value: '20' } })

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockUpdateSettings).not.toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('resets form data to current settings when dialog is reopened', () => {
    const { rerender } = render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    // Make some changes
    const vimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    fireEvent.click(vimSwitch)

    const maxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement
    fireEvent.change(maxTasksInput, { target: { value: '20' } })

    // Close dialog without saving
    rerender(<SettingsDialog open={false} onOpenChange={mockOnOpenChange} />)

    // Reopen dialog
    rerender(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    // Should show original values
    const reopenedVimSwitch = screen.getByRole('switch', { name: /vim mode/i })
    expect(reopenedVimSwitch).not.toBeChecked()

    const reopenedMaxTasksInput = screen.getByLabelText(/Maximum Done Tasks Visible/i) as HTMLInputElement
    expect(reopenedMaxTasksInput.value).toBe('5')
  })

  it('displays section headings', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Application')).toBeInTheDocument()
    expect(screen.getByText('Editor Settings')).toBeInTheDocument()
    expect(screen.getByText('Display Settings')).toBeInTheDocument()
  })

  it('shows VIM mode description', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText(/Enable VIM keybindings in the markdown editor/i)).toBeInTheDocument()
  })

  it('shows max tasks description with range', () => {
    render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText(/Number of tasks to show in the Done column before archiving \(1-50\)/i)).toBeInTheDocument()
  })

  describe('Title setting', () => {
    it('displays title input field', () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      const titleInput = screen.getByLabelText('Title')
      expect(titleInput).toBeInTheDocument()
    })

    it('shows title description', () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText(/Application title shown in the header and browser tab/i)).toBeInTheDocument()
    })

    it('populates title from backend settings when dialog opens', async () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title') as HTMLInputElement
        expect(titleInput.value).toBe('Knutpunkt')
      })
    })

    it('allows editing the title', async () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title') as HTMLInputElement
        expect(titleInput.value).toBe('Knutpunkt')
      })

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'My Board' } })
      expect(titleInput.value).toBe('My Board')
    })

    it('calls API to update title on save when title changed', async () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title') as HTMLInputElement
        expect(titleInput.value).toBe('Knutpunkt')
      })

      const titleInput = screen.getByLabelText('Title')
      fireEvent.change(titleInput, { target: { value: 'New Title' } })

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(api.settings.update).toHaveBeenCalledWith('title', 'New Title')
      })
    })

    it('does not call API when title is unchanged', async () => {
      render(<SettingsDialog open={true} onOpenChange={mockOnOpenChange} />)

      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title') as HTMLInputElement
        expect(titleInput.value).toBe('Knutpunkt')
      })

      // Save without changing title
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
      expect(api.settings.update).not.toHaveBeenCalled()
    })
  })
})
