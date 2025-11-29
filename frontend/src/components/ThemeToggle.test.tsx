import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset the document element classes before each test
    document.documentElement.className = ''
  })

  it('renders a button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('starts with dark mode enabled', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('☀️')
    expect(button).toHaveAttribute('title', 'Switch to light mode')
  })

  it('applies dark class to document element on initial render', () => {
    render(<ThemeToggle />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Initial state: dark mode
    expect(button).toHaveTextContent('☀️')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Click to switch to light mode
    await user.click(button)
    expect(button).toHaveTextContent('🌙')
    expect(button).toHaveAttribute('title', 'Switch to dark mode')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Click again to switch back to dark mode
    await user.click(button)
    expect(button).toHaveTextContent('☀️')
    expect(button).toHaveAttribute('title', 'Switch to light mode')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('removes previous theme class when switching', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    await user.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(true)

    await user.click(button)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('has outline variant', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-input')
  })

  it('has icon size', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'w-9')
  })
})
