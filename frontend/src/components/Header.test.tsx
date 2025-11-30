import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  beforeEach(() => {
    document.documentElement.className = ''
  })

  it('renders as a header element', async () => {
    const { container } = render(<Header />)
    await waitFor(() => {}) // Let Logo effects settle
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('displays the default title', async () => {
    render(<Header />)
    await waitFor(() => {}) // Let Logo effects settle
    expect(screen.getByRole('heading', { name: 'Knutpunkt' })).toBeInTheDocument()
  })

  it('displays a custom title', async () => {
    render(<Header title="Custom Title" />)
    await waitFor(() => {}) // Let Logo effects settle
    expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument()
  })

  it('has sticky positioning', async () => {
    const { container } = render(<Header />)
    await waitFor(() => {}) // Let Logo effects settle
    const header = container.querySelector('header')
    expect(header).toHaveClass('sticky', 'top-0')
  })

  it('has proper z-index for overlay', async () => {
    const { container } = render(<Header />)
    await waitFor(() => {}) // Let Logo effects settle
    const header = container.querySelector('header')
    expect(header).toHaveClass('z-50')
  })

  it('has border and background styling', async () => {
    const { container } = render(<Header />)
    await waitFor(() => {}) // Let Logo effects settle
    const header = container.querySelector('header')
    expect(header).toHaveClass('border-b', 'border-border', 'bg-background/95', 'backdrop-blur')
  })

  describe('Logo display', () => {
    it('shows logo by default', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toBeInTheDocument()
    })

    it('shows logo when showLogo is true', async () => {
      render(<Header showLogo={true} />)
      await waitFor(() => {}) // Let Logo effects settle
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toBeInTheDocument()
    })

    it('hides logo when showLogo is false', async () => {
      render(<Header showLogo={false} />)
      await waitFor(() => {}) // Let effects settle
      const logo = screen.queryByAltText('Knutpunkt Logo')
      expect(logo).not.toBeInTheDocument()
    })

    it('renders logo in small size', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const logo = screen.getByAltText('Knutpunkt Logo')
      expect(logo).toHaveClass('h-6') // small size
    })
  })

  describe('Theme toggle', () => {
    it('renders the theme toggle button', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const themeButton = screen.getByRole('button')
      expect(themeButton).toBeInTheDocument()
    })

    it('theme toggle is positioned on the right', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('header')
      const innerContainer = header?.querySelector('div')
      expect(innerContainer).toHaveClass('justify-between')
    })
  })

  describe('Layout', () => {
    it('has proper container layout', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('flex', 'items-center', 'justify-between')
    })

    it('has proper height', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('h-14')
    })

    it('has responsive padding', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('px-4', 'md:px-6')
    })

    it('groups logo and title together', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('header')
      const leftGroup = header?.querySelector('.container > div')
      expect(leftGroup).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })

  describe('Custom props', () => {
    it('accepts custom className', async () => {
      const { container } = render(<Header className="custom-header" />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('header')
      expect(header).toHaveClass('custom-header')
    })

    it('merges custom className with default classes', async () => {
      const { container } = render(<Header className="my-custom-class" />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0', 'my-custom-class')
    })

    it('accepts additional HTML attributes', async () => {
      const { container } = render(<Header data-testid="main-header" />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('[data-testid="main-header"]')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Title styling', () => {
    it('has proper heading size', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'tracking-tight')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<Header title="My App" />)
      await waitFor(() => {}) // Let Logo effects settle
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('My App')
    })
  })
})
