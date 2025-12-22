import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  taskId?: string
  onClose?: () => void
}

export function Terminal({ taskId: _taskId, onClose: _onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize xterm.js
    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 1000,
    })

    // Load addons
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())

    // Open terminal in DOM
    terminal.open(terminalRef.current)

    // Fit terminal to container
    fitAddon.fit()

    // Store refs
    xtermRef.current = terminal
    fitAddonRef.current = fitAddon

    // Local echo for testing (will be removed in Step 3)
    terminal.onData((data) => {
      terminal.write(data)
    })

    // Welcome message
    terminal.writeln('Terminal initialized (local echo mode)')
    terminal.writeln('Type to test - output will be echoed locally')
    terminal.writeln('')

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  return (
    <div className="h-full w-full bg-[#1e1e1e] p-4 rounded-md">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  )
}
