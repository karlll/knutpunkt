import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders a div element', () => {
    const { container } = render(<Badge>Badge</Badge>)
    const badge = container.querySelector('div')
    expect(badge).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      const badge = screen.getByText('Secondary')
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>)
      const badge = screen.getByText('Error')
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText('Outline')
      expect(badge).toHaveClass('text-foreground')
    })
  })

  describe('styling', () => {
    it('has base badge styles', () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md', 'border')
    })

    it('has correct text size and padding', () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs', 'font-semibold')
    })

    it('has transition styles', () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('transition-colors')
    })
  })

  describe('custom props', () => {
    it('accepts custom className', () => {
      render(<Badge className="custom-badge">Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('custom-badge')
    })

    it('merges custom className with variant classes', () => {
      render(<Badge variant="secondary" className="m-2">Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('bg-secondary', 'm-2')
    })

    it('accepts data attributes', () => {
      render(<Badge data-testid="custom-badge">Badge</Badge>)
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    })

    it('accepts onClick handler', () => {
      const handleClick = vi.fn()
      render(<Badge onClick={handleClick}>Clickable</Badge>)
      const badge = screen.getByText('Clickable')
      badge.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('content', () => {
    it('renders text content', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('renders with number content', () => {
      render(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders with mixed content', () => {
      render(<Badge>🔥 Hot</Badge>)
      expect(screen.getByText('🔥 Hot')).toBeInTheDocument()
    })

    it('can render JSX children', () => {
      render(
        <Badge>
          <span>Custom</span> Badge
        </Badge>
      )
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.getByText(/Badge/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has focus ring styles', () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring')
    })
  })
})
