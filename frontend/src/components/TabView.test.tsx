import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabView, type Tab } from './TabView'

describe('TabView', () => {
  const singleTab: Tab[] = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div>Content 1</div>,
    },
  ]

  const multipleTabs: Tab[] = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div>Content 1</div>,
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <div>Content 2</div>,
    },
    {
      id: 'tab3',
      label: 'Tab 3',
      content: <div>Content 3</div>,
    },
  ]

  describe('rendering', () => {
    it('renders nothing when tabs array is empty', () => {
      const { container } = render(<TabView tabs={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders single tab content without tab bar', () => {
      render(<TabView tabs={singleTab} />)

      // Content should be visible
      expect(screen.getByText('Content 1')).toBeInTheDocument()

      // Tab bar should NOT be visible (no TabsList)
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('renders multiple tabs with tab bar', () => {
      render(<TabView tabs={multipleTabs} />)

      // Tab bar should be visible
      expect(screen.getByRole('tablist')).toBeInTheDocument()

      // All tab triggers should be visible
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument()
    })

    it('shows first tab content by default', () => {
      render(<TabView tabs={multipleTabs} />)

      // First tab content should be visible
      expect(screen.getByText('Content 1')).toBeVisible()

      // Other tab contents should exist but be hidden
      expect(screen.getByText('Content 2')).toBeInTheDocument()
      expect(screen.getByText('Content 3')).toBeInTheDocument()
    })

    it('respects defaultActiveTab prop', () => {
      render(<TabView tabs={multipleTabs} defaultActiveTab="tab2" />)

      // Second tab content should be visible
      expect(screen.getByText('Content 2')).toBeVisible()
    })
  })

  describe('tab switching', () => {
    it('switches content when clicking different tab', async () => {
      const user = userEvent.setup()
      render(<TabView tabs={multipleTabs} />)

      // Initially on tab 1
      expect(screen.getByText('Content 1')).toBeVisible()

      // Click tab 2
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))

      // Content 2 should now be visible
      expect(screen.getByText('Content 2')).toBeVisible()
    })

    it('calls onTabChange callback when switching tabs', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()
      render(<TabView tabs={multipleTabs} onTabChange={onTabChange} />)

      // Click tab 2
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))

      expect(onTabChange).toHaveBeenCalledWith('tab2')
    })

    it('keeps all tab content mounted (preserves state)', async () => {
      const user = userEvent.setup()
      const tabs: Tab[] = [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: <input data-testid="input1" defaultValue="value1" />,
        },
        {
          id: 'tab2',
          label: 'Tab 2',
          content: <input data-testid="input2" defaultValue="value2" />,
        },
      ]

      render(<TabView tabs={tabs} />)

      // Both inputs should exist in the DOM
      const input1 = screen.getByTestId('input1')
      const input2 = screen.getByTestId('input2')

      expect(input1).toBeInTheDocument()
      expect(input2).toBeInTheDocument()

      // Modify input 1
      await user.clear(input1)
      await user.type(input1, 'modified')

      // Switch to tab 2
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))

      // Switch back to tab 1
      await user.click(screen.getByRole('tab', { name: 'Tab 1' }))

      // Input 1 should still have the modified value
      expect(input1).toHaveValue('modified')
    })
  })

  describe('edge cases', () => {
    it('handles invalid defaultActiveTab gracefully', () => {
      render(<TabView tabs={multipleTabs} defaultActiveTab="nonexistent" />)

      // Should fall back to first tab
      expect(screen.getByText('Content 1')).toBeVisible()
    })

    it('updates when tabs array changes', () => {
      const { rerender } = render(<TabView tabs={singleTab} />)

      // Initially single tab (no tab bar)
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()

      // Update to multiple tabs
      rerender(<TabView tabs={multipleTabs} />)

      // Now tab bar should appear
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
  })

  describe('styling and layout', () => {
    it('applies correct classes for single tab layout', () => {
      const { container } = render(<TabView tabs={singleTab} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex-1', 'flex', 'flex-col', 'h-screen')
    })

    it('applies correct classes for multiple tabs layout', () => {
      const { container } = render(<TabView tabs={multipleTabs} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex-1', 'flex', 'flex-col', 'h-screen')
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA roles for tabs', () => {
      render(<TabView tabs={multipleTabs} />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    })

    it('marks active tab correctly', () => {
      render(<TabView tabs={multipleTabs} />)

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      expect(tab1).toHaveAttribute('data-state', 'active')
    })
  })
})
