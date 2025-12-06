import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible'

describe('Collapsible', () => {
  it('renders with trigger and content', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Toggle')).toBeInTheDocument()
  })

  it('content is hidden by default', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    )

    // Content should have data-state="closed"
    const trigger = screen.getByText('Toggle')
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('shows content when open prop is true', () => {
    render(
      <Collapsible open={true}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Visible content')).toBeVisible()
  })

  it('toggles content when trigger is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Toggle content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByText('Toggle')

    // Initially closed
    expect(trigger).toHaveAttribute('data-state', 'closed')

    // Click to open
    await user.click(trigger)
    expect(trigger).toHaveAttribute('data-state', 'open')

    // Click to close
    await user.click(trigger)
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('works with custom trigger element', async () => {
    const user = userEvent.setup()

    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button>Custom Button</button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const button = screen.getByRole('button', { name: 'Custom Button' })
    await user.click(button)

    expect(screen.getByText('Content')).toBeVisible()
  })

  it('handles controlled state', async () => {
    const user = userEvent.setup()
    let isOpen = false
    const handleChange = (open: boolean) => {
      isOpen = open
    }

    const { rerender } = render(
      <Collapsible open={isOpen} onOpenChange={handleChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByText('Toggle')
    await user.click(trigger)

    // Manually update the component with new state
    rerender(
      <Collapsible open={true} onOpenChange={handleChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    expect(screen.getByText('Content')).toBeVisible()
  })

  it('renders multiple collapsibles independently', async () => {
    const user = userEvent.setup()

    render(
      <>
        <Collapsible>
          <CollapsibleTrigger>First</CollapsibleTrigger>
          <CollapsibleContent>First content</CollapsibleContent>
        </Collapsible>
        <Collapsible>
          <CollapsibleTrigger>Second</CollapsibleTrigger>
          <CollapsibleContent>Second content</CollapsibleContent>
        </Collapsible>
      </>
    )

    const firstTrigger = screen.getByText('First')
    const secondTrigger = screen.getByText('Second')

    await user.click(firstTrigger)

    expect(firstTrigger).toHaveAttribute('data-state', 'open')
    expect(secondTrigger).toHaveAttribute('data-state', 'closed')

    await user.click(secondTrigger)

    expect(firstTrigger).toHaveAttribute('data-state', 'open')
    expect(secondTrigger).toHaveAttribute('data-state', 'open')
  })
})
