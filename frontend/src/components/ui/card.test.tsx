import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

describe('Card', () => {
  it('renders a div element', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.querySelector('div')
    expect(card).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('has base card styles', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.querySelector('div')
    expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow')
  })

  it('accepts custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    const card = container.querySelector('div')
    expect(card).toHaveClass('custom-card', 'rounded-xl')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<Card ref={ref}>Content</Card>)
    expect(ref).toHaveBeenCalled()
  })

  it('accepts data attributes', () => {
    render(<Card data-testid="test-card">Content</Card>)
    expect(screen.getByTestId('test-card')).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('renders a div element', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    const header = container.querySelector('div')
    expect(header).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })

  it('has header styles', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    const header = container.querySelector('div')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('accepts custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>)
    const header = container.querySelector('div')
    expect(header).toHaveClass('custom-header', 'p-6')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardHeader ref={ref}>Header</CardHeader>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardTitle', () => {
  it('renders a div element', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    const title = container.querySelector('div')
    expect(title).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<CardTitle>Card Title</CardTitle>)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('has title styles', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    const title = container.querySelector('div')
    expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight')
  })

  it('accepts custom className', () => {
    const { container } = render(<CardTitle className="text-2xl">Title</CardTitle>)
    const title = container.querySelector('div')
    expect(title).toHaveClass('text-2xl', 'font-semibold')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardTitle ref={ref}>Title</CardTitle>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardDescription', () => {
  it('renders a div element', () => {
    const { container } = render(<CardDescription>Description</CardDescription>)
    const desc = container.querySelector('div')
    expect(desc).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<CardDescription>Card Description</CardDescription>)
    expect(screen.getByText('Card Description')).toBeInTheDocument()
  })

  it('has description styles', () => {
    const { container } = render(<CardDescription>Description</CardDescription>)
    const desc = container.querySelector('div')
    expect(desc).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('accepts custom className', () => {
    const { container } = render(
      <CardDescription className="text-base">Description</CardDescription>
    )
    const desc = container.querySelector('div')
    expect(desc).toHaveClass('text-base', 'text-muted-foreground')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardDescription ref={ref}>Description</CardDescription>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardContent', () => {
  it('renders a div element', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    const content = container.querySelector('div')
    expect(content).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<CardContent>Card Content</CardContent>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('has content styles', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    const content = container.querySelector('div')
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('accepts custom className', () => {
    const { container } = render(<CardContent className="custom-padding">Content</CardContent>)
    const content = container.querySelector('div')
    expect(content).toHaveClass('custom-padding', 'p-6', 'pt-0')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardContent ref={ref}>Content</CardContent>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardFooter', () => {
  it('renders a div element', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const footer = container.querySelector('div')
    expect(footer).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<CardFooter>Card Footer</CardFooter>)
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('has footer styles', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const footer = container.querySelector('div')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('accepts custom className', () => {
    const { container } = render(<CardFooter className="justify-end">Footer</CardFooter>)
    const footer = container.querySelector('div')
    expect(footer).toHaveClass('justify-end', 'flex')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardFooter ref={ref}>Footer</CardFooter>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('Card composition', () => {
  it('renders complete card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('can render card with only some components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
        <CardContent>Content only</CardContent>
      </Card>
    )

    expect(screen.getByText('Simple Card')).toBeInTheDocument()
    expect(screen.getByText('Content only')).toBeInTheDocument()
  })
})
