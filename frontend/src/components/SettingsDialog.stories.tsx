import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SettingsDialog } from './SettingsDialog'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Components/SettingsDialog',
  component: SettingsDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper component
function InteractiveSettingsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Open Settings</Button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

// Default story - interactive dialog
export const Default: Story = {
  args: {} as any,
  render: () => <InteractiveSettingsDialog />,
}

// Dialog open state - useful for visual testing
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
}

// Dialog with note about localStorage
export const WithLocalStorageNote: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground text-center max-w-md">
        <p className="mb-2">
          This dialog saves settings to localStorage. Try changing the settings and reopening the
          dialog to see them persist.
        </p>
        <p className="mb-4">
          Open your browser's developer tools to see the localStorage entries under the key
          'knutpunkt-settings'.
        </p>
      </div>
      <InteractiveSettingsDialog />
    </div>
  ),
}

// Story showing the settings in action with a mock editor
function SettingsWithMockEditor() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <Button onClick={() => setOpen(true)}>Open Settings</Button>

      <div className="w-full p-4 border rounded-md bg-background">
        <h3 className="text-lg font-semibold mb-2">Settings Demo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The settings you configure affect various parts of the application:
        </p>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li>
            <strong>VIM Mode:</strong> Enables VIM keybindings in the markdown editor when creating
            or editing tasks
          </li>
          <li>
            <strong>Max Done Tasks Visible:</strong> Controls how many completed tasks are shown in
            the "Done" column before they are archived
          </li>
        </ul>
      </div>

      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

export const WithExplanation: Story = {
  args: {} as any,
  render: () => <SettingsWithMockEditor />,
}
