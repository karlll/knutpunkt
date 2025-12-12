import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vim } from '@replit/codemirror-vim'
import { oneDark } from '@codemirror/theme-one-dark'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  vimMode?: boolean
  readOnly?: boolean
  className?: string
  id?: string
}

export interface MarkdownEditorRef {
  handleVimEscape: () => void
  hasFocus: () => boolean
  isInsertMode: () => boolean
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
  value,
  onChange,
  vimMode = false,
  readOnly = false,
  className,
  id,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleVimEscape: () => {
      if (viewRef.current && vimMode) {
        const view = viewRef.current
        const anyView = view as any

        try {
          if (anyView.cm?.state?.vim) {
            const vimState = anyView.cm.state.vim

            // Exit insert mode if currently in insert mode
            if (vimState.insertMode) {
              vimState.insertMode = false
              vimState.mode = 'normal'

              // Trigger view updates to notify VIM of the state change
              view.requestMeasure()
              view.update([])
              view.focus()
            }
          }
        } catch (error) {
          console.error('[MarkdownEditor] Error exiting VIM insert mode:', error)
        }
      }
    },
    hasFocus: () => {
      return viewRef.current?.hasFocus ?? false
    },
    isInsertMode: () => {
      if (!viewRef.current || !vimMode) {
        return false
      }
      const anyView = viewRef.current as any
      return anyView.cm?.state?.vim?.insertMode ?? false
    },
  }), [vimMode])

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

    // Add read-only mode if enabled
    if (readOnly) {
      extensions.push(EditorView.editable.of(false))
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
  }, [vimMode, readOnly]) // Only recreate editor when vimMode or readOnly changes

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
        readOnly && '[&_.cm-editor]:bg-muted/50 [&_.cm-editor]:cursor-not-allowed',
        className
      )}
      ref={editorRef}
    />
  )
})

MarkdownEditor.displayName = 'MarkdownEditor'
