import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BackendSettingsDialog } from './BackendSettingsDialog'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      get: vi.fn(),
    },
  },
}))

describe('BackendSettingsDialog', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const renderDialog = (open = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BackendSettingsDialog open={open} onOpenChange={() => {}} />
      </QueryClientProvider>
    )
  }

  it('renders the dialog when open', () => {
    vi.mocked(api.settings.get).mockResolvedValue({
      settings: [],
    })

    renderDialog(true)
    expect(screen.getByText('Backend Settings')).toBeInTheDocument()
    expect(screen.getByText('Current backend configuration (read-only)')).toBeInTheDocument()
  })

  it('does not fetch settings when dialog is closed', () => {
    renderDialog(false)
    expect(api.settings.get).not.toHaveBeenCalled()
  })

  it('displays loading state while fetching settings', () => {
    vi.mocked(api.settings.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderDialog(true)
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('displays settings in a table', async () => {
    const mockSettings = {
      settings: [
        {
          key: 'server.port',
          value: '8080',
          description: 'Server port',
        },
        {
          key: 'tasks.directory',
          value: './tasks',
          description: 'Tasks storage directory',
        },
        {
          key: 'terminal.enabled',
          value: 'false',
          description: 'PTY terminal support enabled',
        },
      ],
    }

    vi.mocked(api.settings.get).mockResolvedValue(mockSettings)

    renderDialog(true)

    await waitFor(() => {
      expect(screen.getByText('server.port')).toBeInTheDocument()
    })

    expect(screen.getByText('8080')).toBeInTheDocument()
    expect(screen.getByText('Server port')).toBeInTheDocument()

    expect(screen.getByText('tasks.directory')).toBeInTheDocument()
    expect(screen.getByText('./tasks')).toBeInTheDocument()
    expect(screen.getByText('Tasks storage directory')).toBeInTheDocument()

    expect(screen.getByText('terminal.enabled')).toBeInTheDocument()
    expect(screen.getByText('false')).toBeInTheDocument()
    expect(screen.getByText('PTY terminal support enabled')).toBeInTheDocument()
  })

  it('displays error state when API call fails', async () => {
    vi.mocked(api.settings.get).mockRejectedValue(new Error('API Error'))

    renderDialog(true)

    await waitFor(() => {
      expect(screen.getByText('Failed to load backend settings')).toBeInTheDocument()
    })
  })

  it('displays table headers', async () => {
    vi.mocked(api.settings.get).mockResolvedValue({
      settings: [
        {
          key: 'server.port',
          value: '8080',
          description: 'Server port',
        },
      ],
    })

    renderDialog(true)

    await waitFor(() => {
      expect(screen.getByText('Setting')).toBeInTheDocument()
      expect(screen.getByText('Value')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })
})
