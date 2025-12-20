import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'

describe('Dialog', () => {
  it('renders dialog with content', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test dialog</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('This is a test dialog')).toBeInTheDocument()
  })

  it('renders with default size (md)', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Default Size</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-lg')
  })

  it('renders with sm size', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="sm">
          <DialogTitle>Small Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-sm')
  })

  it('renders with lg size', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="lg">
          <DialogTitle>Large Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-2xl')
  })

  it('renders with xl size', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="xl">
          <DialogTitle>Extra Large Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-4xl')
  })

  it('renders with 2xl size', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="2xl">
          <DialogTitle>2XL Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-6xl')
  })

  it('renders with full size', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="full">
          <DialogTitle>Full Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-[calc(100vw-2rem)]')
  })

  it('renders close button', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('renders header, title, description, and footer', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button>Footer Button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    expect(screen.getByText('Dialog Description')).toBeInTheDocument()
    expect(screen.getByText('Footer Button')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent className="custom-class">
          <DialogTitle>Test</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('custom-class')
  })

  it('combines size variant with custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent size="xl" className="custom-height">
          <DialogTitle>Test</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('max-w-4xl')
    expect(content).toHaveClass('custom-height')
  })
})
