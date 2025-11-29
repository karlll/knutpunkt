import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  beforeEach(() => {
    document.documentElement.className = ''
  })

  it('renders as a header element', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('displays the default title', () => {
    render(<Header />)
    expect(screen.getByRole('heading', { name: 'Knutpunkt' })).toBeInTheDocument()
  })

  it('displays a custom title', () => {
    render(<Header title="Custom Title" />)
    expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument()
  })

  it('has sticky positioning', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toHaveClass('sticky', 'top-0')
  })

  it('has proper z-index for overlay', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toHaveClass('z-50')
  })

  it('has border and background styling', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toHaveClass('border-b', 'border-border', 'bg-background/95', 'backdrop-blur')
  })

  describe('Logo display', () => {
    it('shows logo by default', () => {
      render(<Header />)
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toBeInTheDocument()
    })

    it('shows logo when showLogo is true', () => {
      render(<Header showLogo={true} />)
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toBeInTheDocument()
    })

    it('hides logo when showLogo is false', () => {
      render(<Header showLogo={false} />)
      const logo = screen.queryByAltText('Knutpunkt Logo')
      expect(logo).not.toBeInTheDocument()
    })

    it('renders logo in small size', () => {
      render(<Header />)
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toHaveClass('h-6') // small size
    })
  })

  describe('Theme toggle', () => {
    it('renders the theme toggle button', () => {
      render(<Header />)
      const themeButton = screen.getByRole('button')
      expect(themeButton).toBeInTheDocument()
    })

    it('theme toggle is positioned on the right', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      const innerContainer = header?.querySelector('div')
      expect(innerContainer).toHaveClass('justify-between')
    })
  })

  describe('Layout', () => {
    it('has proper container layout', () => {
      const { container } = render(<Header />)
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('flex', 'items-center', 'justify-between')
    })

    it('has proper height', () => {
      const { container } = render(<Header />)
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('h-14')
    })

    it('has responsive padding', () => {
      const { container } = render(<Header />)
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('px-4', 'md:px-6')
    })

    it('groups logo and title together', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      const leftGroup = header?.querySelector('.container > div')
      expect(leftGroup).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })

  describe('Custom props', () => {
    it('accepts custom className', () => {
      const { container } = render(<Header className="custom-header" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-header')
    })

    it('merges custom className with default classes', () => {
      const { container } = render(<Header className="my-custom-class" />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0', 'my-custom-class')
    })

    it('accepts additional HTML attributes', () => {
      const { container } = render(<Header data-testid="main-header" />)
      const header = container.querySelector('[data-testid="main-header"]')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Title styling', () => {
    it('has proper heading size', () => {
      render(<Header />)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'tracking-tight')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Header title="My App" />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('My App')
    })
  })
})
