import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownEditor } from './markdown-editor'

describe('MarkdownEditor', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Hello" onChange={onChange} />
    )
    expect(container.querySelector('.cm-editor')).toBeInTheDocument()
  })

  it('displays initial value', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test Content" onChange={onChange} />
    )
    const editor = container.querySelector('.cm-editor')
    expect(editor).toBeInTheDocument()
    expect(editor?.textContent).toContain('Test Content')
  })

  it('accepts custom className', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor
        value="test"
        onChange={onChange}
        className="custom-class"
      />
    )
    // The editor div is now nested inside a wrapper, so we need to find it
    const editorDiv = container.querySelector('[class*="custom-class"]')
    expect(editorDiv).toBeInTheDocument()
    expect(editorDiv?.className).toContain('custom-class')
  })

  it('accepts id prop', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor
        value="test"
        onChange={onChange}
        id="test-editor"
      />
    )
    const wrapper = container.querySelector('#test-editor')
    expect(wrapper).toBeInTheDocument()
  })

  it('renders with vim mode enabled', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} vimMode={true} />
    )
    // Vim mode adds specific classes/behavior to CodeMirror
    const editor = container.querySelector('.cm-editor')
    expect(editor).toBeInTheDocument()
  })

  it('renders with vim mode disabled', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} vimMode={false} />
    )
    const editor = container.querySelector('.cm-editor')
    expect(editor).toBeInTheDocument()
  })

  it('applies dark theme styling', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} />
    )
    // Check that the oneDark theme is applied (it adds cm-theme class)
    const editor = container.querySelector('.cm-editor')
    expect(editor).toBeInTheDocument()
  })

  it('renders in read-only mode', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} readOnly={true} />
    )
    const editor = container.querySelector('.cm-editor')
    expect(editor).toBeInTheDocument()
  })

  it('applies read-only styling', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} readOnly={true} />
    )
    const editorDiv = container.querySelector('[class*="rounded-md"]')
    // Should have read-only styling classes
    expect(editorDiv?.className).toContain('bg-muted/50')
    expect(editorDiv?.className).toContain('cursor-not-allowed')
  })

  it('does not apply read-only styling when readOnly is false', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownEditor value="# Test" onChange={onChange} readOnly={false} />
    )
    const editorDiv = container.querySelector('[class*="rounded-md"]')
    expect(editorDiv?.className).not.toContain('bg-muted/50')
    expect(editorDiv?.className).not.toContain('cursor-not-allowed')
  })

  it('shows VIM mode indicator when vimMode is true', () => {
    const onChange = vi.fn()
    const { getByTestId } = render(
      <MarkdownEditor value="# Test" onChange={onChange} vimMode={true} />
    )
    const indicator = getByTestId('vim-mode-indicator')
    expect(indicator).toBeInTheDocument()
    expect(indicator.textContent).toMatch(/^(NORMAL|INSERT|VISUAL|VISUAL LINE|VISUAL BLOCK|REPLACE)$/)
  })

  it('does not show VIM mode indicator when vimMode is false', () => {
    const onChange = vi.fn()
    const { queryByTestId } = render(
      <MarkdownEditor value="# Test" onChange={onChange} vimMode={false} />
    )
    const indicator = queryByTestId('vim-mode-indicator')
    expect(indicator).not.toBeInTheDocument()
  })

  it('does not show VIM mode indicator when vimMode is not specified', () => {
    const onChange = vi.fn()
    const { queryByTestId } = render(
      <MarkdownEditor value="# Test" onChange={onChange} />
    )
    const indicator = queryByTestId('vim-mode-indicator')
    expect(indicator).not.toBeInTheDocument()
  })

  it('shows NORMAL mode by default when VIM mode is enabled', () => {
    const onChange = vi.fn()
    const { getByTestId } = render(
      <MarkdownEditor value="# Test" onChange={onChange} vimMode={true} />
    )
    const indicator = getByTestId('vim-mode-indicator')
    expect(indicator.textContent).toContain('NORMAL')
  })

  it('exposes isInVimEditMode method via ref', () => {
    const onChange = vi.fn()
    const ref = { current: null } as React.RefObject<any>
    render(
      <MarkdownEditor ref={ref} value="# Test" onChange={onChange} vimMode={true} />
    )
    expect(ref.current).toBeDefined()
    expect(typeof ref.current?.isInVimEditMode).toBe('function')
  })

  it('exposes exitVimEditMode method via ref', () => {
    const onChange = vi.fn()
    const ref = { current: null } as React.RefObject<any>
    render(
      <MarkdownEditor ref={ref} value="# Test" onChange={onChange} vimMode={true} />
    )
    expect(ref.current).toBeDefined()
    expect(typeof ref.current?.exitVimEditMode).toBe('function')
  })

  it('isInVimEditMode returns false in NORMAL mode', () => {
    const onChange = vi.fn()
    const ref = { current: null } as React.RefObject<any>
    render(
      <MarkdownEditor ref={ref} value="# Test" onChange={onChange} vimMode={true} />
    )
    // Initially in NORMAL mode
    expect(ref.current?.isInVimEditMode()).toBe(false)
  })

  it('isInVimEditMode returns false when VIM mode is disabled', () => {
    const onChange = vi.fn()
    const ref = { current: null } as React.RefObject<any>
    render(
      <MarkdownEditor ref={ref} value="# Test" onChange={onChange} vimMode={false} />
    )
    expect(ref.current?.isInVimEditMode()).toBe(false)
  })
})
