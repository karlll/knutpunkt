---
id: "eafd0a27-93f9-46c5-9234-bd8dcf9163bb"
number: 30
title: "Frontend: Terminal emulator UI with xterm.js"
createdAt: "2025-12-12T20:06:59.904678Z"
updatedAt: "2025-12-12T20:06:59.904678Z"
assignees: []
categories:
- "frontend"
- "feature"
- "ui"
priority: "medium"
order: 4
---

# Frontend: Terminal emulator UI with xterm.js

## Overview
Implement frontend terminal emulator component using xterm.js with WebSocket connection to backend PTY service. Provides embedded terminal functionality in the Kanban UI.

## Requirements

### 1. Install Dependencies (`frontend/`)
```bash
npm install xterm xterm-addon-fit xterm-addon-web-links
npm install -D @types/xterm
```

### 2. Create Terminal Component (`frontend/src/components/terminal/Terminal.tsx`)

**Core functionality:**
- Initialize xterm.js Terminal instance
- Establish WebSocket connection to backend (`ws://localhost:8080/api/v1/terminal/session`)
- Handle bidirectional communication (keyboard input → WebSocket, WebSocket → terminal output)
- Implement resize handler using xterm-addon-fit
- Handle connection states (connecting, connected, disconnected, error)
- Cleanup on unmount (close WebSocket, dispose terminal)

**Component structure:**
```typescript
interface TerminalProps {
  taskId?: string;
  onClose?: () => void;
}

export function Terminal({ taskId, onClose }: TerminalProps) {
  // xterm.js setup
  // WebSocket connection
  // Event handlers
  // Cleanup
}
```

### 3. Create Terminal Dialog (`frontend/src/components/terminal/TerminalDialog.tsx`)

**Features:**
- ShadCN Dialog wrapper component
- Embed Terminal component
- Session controls (close, clear, reconnect buttons)
- Handle dialog open/close states
- Resizable dialog (optional: fullscreen toggle)
- Loading state while connecting

**Component structure:**
```typescript
interface TerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
}

export function TerminalDialog({ open, onOpenChange, taskId }: TerminalDialogProps) {
  // Dialog state management
  // Terminal lifecycle
}
```

### 4. Create Terminal Hook (`frontend/src/hooks/useTerminalSession.ts`)

**Responsibilities:**
- WebSocket connection management
- State management (session ID, connection status)
- Message sending/receiving
- Reconnection logic (optional)
- Cleanup on unmount

**Hook interface:**
```typescript
interface UseTerminalSessionResult {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  send: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  disconnect: () => void;
  error?: string;
}

export function useTerminalSession(
  taskId?: string,
  onOutput?: (data: string) => void
): UseTerminalSessionResult
```

### 5. UI Integration

**Add "Open Terminal" controls:**
- Global toolbar button (top-right corner)
- Optional: Per-task context menu item on TaskCard
- Optional: Keyboard shortcut (Ctrl+` or Cmd+`)

**Integration points:**
- Update `frontend/src/App.tsx` or main layout component
- Add terminal dialog state management
- Handle multiple terminal sessions (optional: tabs)

## Implementation Details

### Terminal Component Setup
```typescript
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

const terminal = new XTerm({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    selection: '#264f78'
  },
  convertEol: true
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.loadAddon(new WebLinksAddon());
```

### WebSocket Communication
```typescript
const ws = new WebSocket(
  `ws://localhost:8080/api/v1/terminal/session${taskId ? `?taskId=${taskId}` : ''}`
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'output') {
    terminal.write(msg.data);
  } else if (msg.type === 'error') {
    console.error('Terminal error:', msg.message);
  } else if (msg.type === 'exit') {
    // Handle process exit
  }
};

terminal.onData((data) => {
  ws.send(JSON.stringify({ type: 'input', data }));
});
```

### Resize Handling
```typescript
useEffect(() => {
  const handleResize = () => {
    fitAddon.fit();
    const { cols, rows } = terminal;
    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Initial fit

  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Acceptance Criteria

- [ ] Dependencies installed (`xterm`, `xterm-addon-fit`, `xterm-addon-web-links`)
- [ ] `Terminal` component created with xterm.js integration
- [ ] `TerminalDialog` component created with ShadCN Dialog
- [ ] `useTerminalSession` hook implemented
- [ ] WebSocket connection established and bidirectional I/O works
- [ ] Terminal displays output correctly (colors, cursor movement)
- [ ] Keyboard input properly sent to backend
- [ ] Resize events handled (terminal fits dialog, PTY updated)
- [ ] Connection states displayed (connecting, error, disconnected)
- [ ] "Open Terminal" button added to UI (toolbar or task card)
- [ ] Dialog can be closed/reopened without issues
- [ ] Proper cleanup on unmount (no memory leaks)
- [ ] Basic error handling (connection failed, WebSocket closed)

## Testing Strategy

1. **Manual testing:**
   - Open terminal dialog
   - Run basic commands: `echo`, `ls`, `pwd`, `cd`
   - Test interactive programs: `vim`, `nano`, `less`
   - Test colors with `ls --color=auto`
   - Resize dialog and verify terminal adapts
   - Close and reopen dialog
   - Test multiple terminal sessions (if supported)

2. **Error scenarios:**
   - Backend not running
   - WebSocket connection drops
   - PTY process crashes

## Examples

### Terminal Component (Simplified)
```typescript
export function Terminal({ taskId, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { connectionStatus, send, resize } = useTerminalSession(taskId, (data) => {
    terminalInstance.current?.write(data);
  });

  useEffect(() => {
    const terminal = new XTerm({ /* options */ });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(terminalRef.current!);
    fitAddon.fit();
    
    terminal.onData((data) => send(data));
    
    return () => {
      terminal.dispose();
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1e1e1e] p-4">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
```

## Styling Considerations

- Use dark theme for terminal (matches developer expectations)
- Monospace font (Menlo, Monaco, Courier New)
- Dialog should be sizable (min 600x400, max fullscreen)
- Add padding around terminal for better UX
- Connection status indicator (colored dot: green=connected, yellow=connecting, red=error)

## References

- [xterm.js Documentation](https://xtermjs.org/)
- [xterm.js API Reference](https://github.com/xtermjs/xterm.js/blob/master/typings/xterm.d.ts)
- [xterm-addon-fit](https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-fit)
- [ShadCN Dialog](https://ui.shadcn.com/docs/components/dialog)

## Notes

- Start with single terminal session (no tabs)
- Test on different screen sizes (responsive dialog)
- Consider adding session persistence/reconnection in future
- May want to add terminal history/scrollback settings later
- Future: Support for multiple terminal tabs