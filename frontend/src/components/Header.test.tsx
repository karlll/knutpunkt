import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { userEvent } from '@testing-library/user-event'
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
      const logo = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(logo).toBeInTheDocument()
    })

    it('shows logo when showLogo is true', async () => {
      render(<Header showLogo={true} />)
      await waitFor(() => {}) // Let Logo effects settle
      const logo = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(logo).toBeInTheDocument()
    })

    it('hides logo when showLogo is false', async () => {
      render(<Header showLogo={false} />)
      await waitFor(() => {}) // Let effects settle
      const logo = screen.queryByRole('img', { name: 'Knutpunkt Logo' })
      expect(logo).not.toBeInTheDocument()
    })

    it('renders logo in small size', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const logo = screen.getByRole('img', { name: 'Knutpunkt Logo' })
      expect(logo).toHaveClass('h-6') // small size
    })
  })

  describe('Action buttons', () => {
    it('renders settings and theme toggle buttons', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2) // Settings + Theme toggle
    })

    it('renders settings button with proper title', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      expect(settingsButton).toHaveAttribute('title', 'Settings')
    })

    it('renders theme toggle button', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('action buttons are positioned on the right', async () => {
      const { container } = render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const header = container.querySelector('header')
      const innerContainer = header?.querySelector('div')
      expect(innerContainer).toHaveClass('justify-between')
    })

    it('opens settings dialog when settings button is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
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

  describe('Create task button', () => {
    it('does not render create button when onCreateTask is not provided', async () => {
      render(<Header />)
      await waitFor(() => {}) // Let Logo effects settle
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2) // Settings + Theme toggle
    })

    it('renders create button when onCreateTask is provided', async () => {
      const onCreateTask = vi.fn()
      render(<Header onCreateTask={onCreateTask} />)
      await waitFor(() => {}) // Let Logo effects settle
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // Create + Settings + Theme toggle
    })

    it('calls onCreateTask when create button is clicked', async () => {
      const user = userEvent.setup()
      const onCreateTask = vi.fn()
      render(<Header onCreateTask={onCreateTask} />)
      await waitFor(() => {}) // Let Logo effects settle

      const buttons = screen.getAllByRole('button')
      const createButton = buttons.find((btn) => btn.getAttribute('title') === 'Create new task')
      expect(createButton).toBeDefined()

      if (createButton) {
        await user.click(createButton)
        expect(onCreateTask).toHaveBeenCalledOnce()
      }
    })

    it('create button has proper accessibility attributes', async () => {
      const onCreateTask = vi.fn()
      render(<Header onCreateTask={onCreateTask} />)
      await waitFor(() => {}) // Let Logo effects settle

      const buttons = screen.getAllByRole('button')
      const createButton = buttons.find((btn) => btn.getAttribute('title') === 'Create new task')
      expect(createButton).toHaveAttribute('title', 'Create new task')
    })

    it('positions create button, settings, and theme toggle together', async () => {
      const onCreateTask = vi.fn()
      const { container } = render(<Header onCreateTask={onCreateTask} />)
      await waitFor(() => {}) // Let Logo effects settle

      const rightGroup = container.querySelector('.container > div:last-child')
      expect(rightGroup).toHaveClass('flex', 'items-center', 'gap-2')
    })
  })
})
