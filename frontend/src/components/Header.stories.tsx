import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './Header'

const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
    },
    showLogo: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "knutpunkt",
    showLogo: true,
  },
}

export const WithoutLogo: Story = {
  args: {
    title: 'Knutpunkt',
    showLogo: false,
  },
}

export const CustomTitle: Story = {
  args: {
    title: 'My Custom App',
    showLogo: true,
  },
}

export const LongTitle: Story = {
  args: {
    title: 'Knutpunkt Task Management System',
    showLogo: true,
  },
}

export const WithContent: Story = {
  render: (args) => (
    <div className="h-screen flex flex-col">
      <Header {...args} />
      <main className="flex-1 p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Page Content</h2>
          <p className="text-muted-foreground">
            This demonstrates the header in context with page content below it.
            The header is sticky and will remain visible when scrolling.
          </p>
          <div className="mt-8 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 bg-card rounded-lg border">
                <h3 className="font-semibold mb-2">Card {i + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  Sample content to demonstrate scrolling behavior
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  ),
  args: {
    title: 'Knutpunkt',
    showLogo: true,
  },
}

export const ThemeToggleDemo: Story = {
  render: (args) => (
    <div className="h-screen flex flex-col">
      <Header {...args} />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Theme Toggle Demo</h2>
          <p className="text-muted-foreground max-w-md">
            Click the theme toggle button in the header to switch between light and dark modes.
            Notice how the logo automatically changes color to match the theme.
          </p>
        </div>
      </main>
    </div>
  ),
  args: {
    title: 'Knutpunkt',
    showLogo: true,
  },
}
