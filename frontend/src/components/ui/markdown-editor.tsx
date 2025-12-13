import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vim, Vim, getCM } from '@replit/codemirror-vim'
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
  hasFocus: () => boolean
  isVimInsertMode: () => boolean
  exitVimInsertMode: () => void
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
    hasFocus: () => {
      return viewRef.current?.hasFocus ?? false
    },
    isVimInsertMode: () => {
      if (!viewRef.current || !vimMode) return false
      const vimState = (viewRef.current as any).cm?.state?.vim
      return vimState?.insertMode ?? false
    },
    exitVimInsertMode: () => {
      if (!viewRef.current || !vimMode) return
      const cm = getCM(viewRef.current)
      if (cm && cm.state.vim) {
        Vim.exitInsertMode(cm as any)
        viewRef.current.focus()
      }
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
