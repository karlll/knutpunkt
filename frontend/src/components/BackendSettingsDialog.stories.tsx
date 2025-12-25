import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { BackendSettingsDialog } from './BackendSettingsDialog'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Components/BackendSettingsDialog',
  component: BackendSettingsDialog,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get('http://127.0.0.1:8080/api/v1/settings', () => {
          return HttpResponse.json({
            server: {
              port: 8080,
              host: '127.0.0.1',
            },
            tasks: {
              directory: '/Users/user/tasks',
              enableCaching: true,
            },
            terminal: {
              enabled: true,
              idleTimeoutMinutes: 30,
              outputBufferSize: 100,
            },
          })
        }),
      ],
    },
  },
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
          <Story />
        </QueryClientProvider>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof BackendSettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper component
function InteractiveBackendSettingsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Backend Settings</Button>
      <BackendSettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

// Default story - interactive dialog
export const Default: Story = {
  args: {} as any,
  render: () => <InteractiveBackendSettingsDialog />,
}

// Dialog open state - useful for visual testing
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
}

// Story with explanation
function BackendSettingsWithExplanation() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <Button onClick={() => setOpen(true)}>Open Backend Settings</Button>

      <div className="w-full p-4 border rounded-md bg-background">
        <h3 className="text-lg font-semibold mb-2">Backend Settings Dialog</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This dialog displays the current backend configuration as read-only settings.
          It fetches settings from the backend API when opened.
        </p>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li>
            <strong>Server settings:</strong> Port and host configuration
          </li>
          <li>
            <strong>Tasks settings:</strong> Directory path and caching options
          </li>
          <li>
            <strong>Terminal settings:</strong> PTY support and timeout configuration
          </li>
        </ul>
      </div>

      <BackendSettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

export const WithExplanation: Story = {
  args: {} as any,
  render: () => <BackendSettingsWithExplanation />,
}
