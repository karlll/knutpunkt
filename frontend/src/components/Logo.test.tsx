import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('renders an svg', () => {
    render(<Logo />)
    const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
    expect(svg).toBeInTheDocument()
    expect(svg.tagName).toBe('svg')
  })

  it('has correct aria-label', () => {
    render(<Logo />)
    const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
    expect(svg).toHaveAttribute('aria-label', 'Knutpunkt Logo')
  })

  describe('size variants', () => {
    it('renders small size', () => {
      render(<Logo size="small" />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('h-6')
    })

    it('renders medium size (default)', () => {
      render(<Logo />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('h-10')
    })

    it('renders large size', () => {
      render(<Logo size="large" />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('h-16')
    })

    it('always has w-auto class', () => {
      render(<Logo />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('w-auto')
    })
  })

  describe('color customization', () => {
    it('uses currentColor by default', () => {
      render(<Logo />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      const gElement = svg.querySelector('g')
      expect(gElement).toHaveAttribute('fill', 'currentColor')
    })

    it('accepts custom color prop', () => {
      render(<Logo color="#ff0000" />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      const gElement = svg.querySelector('g')
      expect(gElement).toHaveAttribute('fill', '#ff0000')
    })

    it('applies color to all path groups', () => {
      const customColor = '#00ff00'
      render(<Logo color={customColor} />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      const gElements = svg.querySelectorAll('g')
      gElements.forEach((g) => {
        expect(g).toHaveAttribute('fill', customColor)
      })
    })
  })

  describe('custom props', () => {
    it('accepts custom className', () => {
      render(<Logo className="custom-class" />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('custom-class')
    })

    it('merges custom className with default classes', () => {
      render(<Logo size="small" className="my-4" />)
      const svg = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(svg).toHaveClass('h-6', 'w-auto', 'my-4')
    })

    it('accepts additional svg attributes', () => {
      render(<Logo data-testid="custom-logo" />)
      const svg = screen.getByTestId('custom-logo')
      expect(svg).toBeInTheDocument()
      expect(svg.tagName).toBe('svg')
    })
  })
})
