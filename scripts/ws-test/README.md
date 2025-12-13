# WebSocket Terminal Testing Scripts

Simple scripts to test the Knutpunkt terminal WebSocket API without bash escaping headaches.

## Setup

```bash
cd scripts/ws-test
npm install
```

## Usage

```bash
# Default command (pwd)
node test-terminal.js

# Custom command
node test-terminal.js "ls -la"
node test-terminal.js "echo Hello World"
node test-terminal.js "date"

# Using npm script
npm test
```

## Features

- ✅ No bash escaping issues - just pass commands as strings
- ✅ Proper JSON serialization with `\r\n` handling
- ✅ ANSI color support (output preserves terminal formatting)
- ✅ 5-second timeout (configurable)
- ✅ Graceful Ctrl+C handling
- ✅ Clear error messages

## Examples

### Test basic commands
```bash
node test-terminal.js "pwd"
node test-terminal.js "whoami"
node test-terminal.js "date"
```

### Test with output
```bash
node test-terminal.js "echo SUCCESS"
node test-terminal.js "ls -la | head -10"
```

### Test long-running commands
```bash
node test-terminal.js "for i in {1..5}; do echo Line \$i; sleep 1; done"
```

### Test environment
```bash
node test-terminal.js "echo \$SHELL"
node test-terminal.js "echo \$TERM"
```

## Configuration

Edit the constants at the top of each script:

Edit the constants at the top of `test-terminal.js`:

```javascript
const WS_URL = 'ws://localhost:8080/api/v1/terminal/session';
const TIMEOUT_MS = 5000;
```

## Troubleshooting

### "Cannot find module 'ws'"
```bash
cd scripts/ws-test
npm install
```

### Connection refused
Make sure the Knutpunkt server is running:
```bash
cd /Users/karl/Project/knutpunkt
./start.sh /Users/karl/Project/knutpunkt/tasks
```

### No output received
The terminal may need more time. Increase the timeout in the script.
