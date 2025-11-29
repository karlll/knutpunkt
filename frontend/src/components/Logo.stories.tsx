import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from './Logo'

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: 'small',
  },
}

export const Medium: Story = {
  args: {
    size: 'medium',
  },
}

export const Large: Story = {
  args: {
    size: 'large',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <Logo size="small" />
        <p className="text-sm text-muted-foreground">Small (24px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Logo size="medium" />
        <p className="text-sm text-muted-foreground">Medium (40px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Logo size="large" />
        <p className="text-sm text-muted-foreground">Large (64px)</p>
      </div>
    </div>
  ),
}

export const ThemeAdaptive: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Theme</h3>
        <Logo size="large" />
        <p className="text-sm text-muted-foreground mt-2">
          Toggle theme to see the logo change (grey in dark mode, black in light mode)
        </p>
      </div>
    </div>
  ),
}
