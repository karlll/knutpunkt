# Quick Usage Guide

## Installation

```bash
cd scripts/ws-test
npm install
```

## Running Tests

```bash
# Basic commands
node test-terminal.js "pwd"
node test-terminal.js "ls -la"
node test-terminal.js "echo Hello World"

# With npm script
npm test

# Environment info
node test-terminal.js "echo \$SHELL"
node test-terminal.js "whoami"

# Multi-line commands
node test-terminal.js "for i in {1..3}; do echo Line \$i; sleep 1; done"
```

## What You'll See

The script will:
1. Connect to `ws://localhost:8080/api/v1/terminal/session`
2. Send your command with proper `\r\n` line endings
3. Display all output (including ANSI colors from your shell prompt)
4. Close after 5 seconds or when the command exits

## Advantages Over websocat

✅ **No bash escaping issues** - Just pass commands as normal strings
✅ **Proper JSON handling** - Script handles `\r\n` conversion automatically  
✅ **Clean output** - Formatted with emojis for readability
✅ **Error handling** - Shows WebSocket errors clearly

## Example Output

```
🔌 Connecting to ws://localhost:8080/api/v1/terminal/session...
📝 Command: pwd

✅ Connected!

📤 Sending command...

[your shell prompt with ANSI colors]
/Users/karl/Project/knutpunkt
[your shell prompt again]

⏱️  Timeout reached, closing connection...

🔌 Connection closed
```

## Troubleshooting

**Server not running?**
```bash
cd /Users/karl/Project/knutpunkt
./start.sh /Users/karl/Project/knutpunkt/tasks
```

**Module not found?**
```bash
npm install
```

**Need longer timeout?**  
Edit `TIMEOUT_MS = 5000` in `test-terminal.js`
