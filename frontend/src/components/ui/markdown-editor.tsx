import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vim } from '@replit/codemirror-vim'
import { oneDark } from '@codemirror/theme-one-dark'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  vimMode?: boolean
  className?: string
  id?: string
}

export function MarkdownEditor({
  value,
  onChange,
  vimMode = false,
  className,
  id,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!editorRef.current) return

    // Build extensions array
    const extensions = [
      basicSetup,
      markdown(),
      oneDark,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          onChangeRef.current(newValue)
        }
      }),
    ]

    // Add vim mode if enabled
    if (vimMode) {
      extensions.push(vim())
    }

    // Create editor view
    const view = new EditorView({
      doc: value,
      extensions,
      parent: editorRef.current,
    })

    viewRef.current = view

    // Cleanup on unmount
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [vimMode]) // Only recreate editor when vimMode changes

  // Update editor content when value prop changes externally (but not from user typing)
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString()
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        })
      }
    }
  }, [value])

  return (
    <div
      id={id}
      className={cn(
        'rounded-md border border-input overflow-hidden',
        '[&_.cm-editor]:outline-none',
        '[&_.cm-editor]:h-[300px]',
        '[&_.cm-scroller]:h-full',
        '[&_.cm-scroller]:overflow-auto',
        '[&_.cm-scroller]:font-mono',
        '[&_.cm-scroller]:text-sm',
        className
      )}
      ref={editorRef}
    />
  )
}
