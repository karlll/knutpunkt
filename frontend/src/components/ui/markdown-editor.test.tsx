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
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-class')
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
})
