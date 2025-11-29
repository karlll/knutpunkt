import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  beforeEach(() => {
    // Reset the document element classes before each test
    document.documentElement.className = ''
  })

  afterEach(() => {
    // Clean up any observers
    vi.clearAllMocks()
  })

  it('renders an image', () => {
    render(<Logo />)
    const img = screen.getByAltText('Knutpunkt Logo')
    expect(img).toBeInTheDocument()
  })

  it('has correct alt text', () => {
    render(<Logo />)
    const img = screen.getByAltText('Knutpunkt Logo')
    expect(img).toHaveAttribute('alt', 'Knutpunkt Logo')
  })

  describe('size variants', () => {
    it('renders small size', () => {
      render(<Logo size="small" />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('h-6')
    })

    it('renders medium size (default)', () => {
      render(<Logo />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('h-10')
    })

    it('renders large size', () => {
      render(<Logo size="large" />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('h-16')
    })

    it('always has w-auto class', () => {
      render(<Logo />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('w-auto')
    })
  })

  describe('theme adaptation', () => {
    it('uses gray logo in dark mode', () => {
      document.documentElement.classList.add('dark')
      render(<Logo />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveAttribute('src', '/logo-gray.svg')
    })

    it('uses black logo in light mode', () => {
      document.documentElement.classList.remove('dark')
      render(<Logo />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveAttribute('src', '/logo-black.svg')
    })

    it('switches logo when theme changes', async () => {
      render(<Logo />)
      const img = screen.getByAltText('Knutpunkt Logo')

      // Initially light (no dark class)
      expect(img).toHaveAttribute('src', '/logo-black.svg')

      // Add dark class to trigger theme change
      document.documentElement.classList.add('dark')

      // Wait for the MutationObserver to trigger
      await waitFor(() => {
        expect(img).toHaveAttribute('src', '/logo-gray.svg')
      })

      // Remove dark class
      document.documentElement.classList.remove('dark')

      // Wait for switch back to light
      await waitFor(() => {
        expect(img).toHaveAttribute('src', '/logo-black.svg')
      })
    })
  })

  describe('custom props', () => {
    it('accepts custom className', () => {
      render(<Logo className="custom-class" />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('custom-class')
    })

    it('merges custom className with default classes', () => {
      render(<Logo size="small" className="my-4" />)
      const img = screen.getByAltText('Knutpunkt Logo')
      expect(img).toHaveClass('h-6', 'w-auto', 'my-4')
    })

    it('accepts additional img attributes', () => {
      render(<Logo data-testid="custom-logo" />)
      const img = screen.getByTestId('custom-logo')
      expect(img).toBeInTheDocument()
    })
  })
})
