import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useTerminalSession, type ConnectionStatus } from '@/hooks/useTerminalSession'

interface TerminalProps {
  taskId?: string
  onClose?: () => void
  onStatusChange?: (status: ConnectionStatus, error?: string) => void
}

export function Terminal({ taskId, onClose, onStatusChange }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  // Handle terminal output from WebSocket
  const handleOutput = useCallback((data: string) => {
    xtermRef.current?.write(data)
  }, [])

  // Handle terminal errors from WebSocket
  const handleError = useCallback((error: string) => {
    xtermRef.current?.writeln(`\r\n\x1b[1;31mError: ${error}\x1b[0m\r\n`)
  }, [])

  // Handle terminal exit from WebSocket
  const handleExit = useCallback(
    (code: number) => {
      xtermRef.current?.writeln(`\r\n\x1b[1;33mProcess exited with code ${code}\x1b[0m`)
      if (onClose) {
        onClose()
      }
    },
    [onClose]
  )

  // WebSocket connection
  const { connectionStatus, send, resize, disconnect, error } = useTerminalSession({
    taskId,
    onOutput: handleOutput,
    onError: handleError,
    onExit: handleExit,
  })

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

    // Send user input to WebSocket
    const disposable = terminal.onData((data) => {
      send(data)
    })

    // Send resize events to WebSocket
    const handleTerminalResize = () => {
      fitAddon.fit()
      resize(terminal.cols, terminal.rows)
    }

    // Handle window resize
    window.addEventListener('resize', handleTerminalResize)

    // Initial resize after terminal is ready
    resize(terminal.cols, terminal.rows)

    // Cleanup
    return () => {
      disposable.dispose()
      window.removeEventListener('resize', handleTerminalResize)
      disconnect()
      terminal.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [send, resize, disconnect])

  // Display connection status
  useEffect(() => {
    if (!xtermRef.current) return

    switch (connectionStatus) {
      case 'connecting':
        xtermRef.current.writeln('\x1b[1;36mConnecting to terminal...\x1b[0m')
        break
      case 'connected':
        xtermRef.current.writeln('\x1b[1;32mConnected to terminal\x1b[0m\r\n')
        break
      case 'disconnected':
        xtermRef.current.writeln('\r\n\x1b[1;33mDisconnected from terminal\x1b[0m')
        break
      case 'error':
        xtermRef.current.writeln(
          `\r\n\x1b[1;31mConnection error: ${error || 'Unknown error'}\x1b[0m`
        )
        break
    }
  }, [connectionStatus, error])

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(connectionStatus, error)
    }
  }, [connectionStatus, error, onStatusChange])

  return (
    <div className="h-full w-full bg-[#1e1e1e] p-4 rounded-md">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  )
}
