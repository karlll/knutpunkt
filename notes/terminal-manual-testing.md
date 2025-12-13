# Terminal API Manual Testing Guide

**Date:** 2025-12-13  
**Tool:** websocat  
**Endpoint:** `ws://localhost:8080/api/v1/terminal/session`

---

## Prerequisites

1. **Install websocat:**
   ```bash
   # macOS
   brew install websocat
   
   # Or download from: https://github.com/vi/websocat/releases
   ```

2. **Start the server:**
   ```bash
   cd /Users/karl/Project/knutpunkt
   ./start.sh /Users/karl/Project/knutpunkt/tasks
   ```

3. **Verify server is running:**
   ```bash
   curl http://localhost:8080/api/v1/tasks
   ```

---

## ⚠️ IMPORTANT: Bash Escaping for JSON

When testing with websocat from bash, you **must** use the `$'...'` quoting syntax to properly handle escape sequences:

**Correct:**
```bash
echo $'{"type":"input","data":"pwd\\r\\n"}'
```

**Incorrect (will send literal backslashes to shell):**
```bash
echo '{"type":"input","data":"pwd\\r\\n"}'
```

**Why:**
- JSON requires `\r\n` (backslash-r-backslash-n) in the string
- `kotlinx.serialization` parses `\r\n` → CR+LF bytes (0x0D 0x0A)
- Bash single quotes `'...'` preserve everything literally (including backslashes)
- Bash `$'...'` interprets escape sequences: `\\r` → `\r` (single backslash-r)
- Without `$'...'`, the shell receives `\\r\\n` → literal backslash-backslash-r-backslash-backslash-n

**Keep stdin open:**
Always wrap commands in `{ ...; sleep N; }` to keep the WebSocket connection alive long enough to receive output.

---

## Message Format

All messages are JSON with the following structure:

**Client → Server:**
```json
{"type": "input", "data": "command\n"}
{"type": "resize", "cols": 120, "rows": 40}
```

**Server → Client:**
```json
{"type": "output", "data": "output text"}
{"type": "error", "message": "error description"}
{"type": "exit", "code": 0}
```

---

## Quick Working Examples

Here are verified working commands you can copy-paste:

### Example 1: Simple pwd command
```bash
{ echo $'{"type":"input","data":"pwd\\r\\n"}'; sleep 3; } | websocat --text ws://localhost:8080/api/v1/terminal/session
```

### Example 2: Echo test
```bash
{ echo $'{"type":"input","data":"echo SUCCESS\\r\\n"}'; sleep 3; } | websocat --text ws://localhost:8080/api/v1/terminal/session | grep -i success
```

### Example 3: Multiple commands
```bash
{
  echo $'{"type":"input","data":"pwd\\r\\n"}'
  sleep 1
  echo $'{"type":"input","data":"date\\r\\n"}'
  sleep 3
} | websocat --text ws://localhost:8080/api/v1/terminal/session
```

---

## Test Cases

**Note:** Many test cases below use old syntax. Apply the `$'...'` pattern shown above for all tests.

### Test 1: Basic Command Execution

**Description:** Execute a simple command and receive output

**Command:**
```bash
# IMPORTANT: Use $'...' syntax for proper escape sequence handling in bash
{ echo $'{"type":"input","data":"pwd\\r\\n"}'; sleep 3; } | websocat --text ws://localhost:8080/api/v1/terminal/session
```

**Why this syntax?**
- `$'...'` allows bash to interpret `\r` and `\n` as escape sequences
- The JSON must contain `\r\n` (backslash-r-backslash-n) which kotlinx.serialization parses as CR+LF bytes
- `{ ...; sleep N; }` keeps stdin open so we can receive output
- `--text` flag tells websocat to send text frames (recommended but optional)

**Expected Output:**
```json
{"type":"output","data":"pwd\r\n"}
{"type":"output","data":"\u001b[... (shell prompt with ANSI colors)"}
{"type":"output","data":"/Users/karl/Project/knutpunkt\r\n"}
{"type":"output","data":"... (new prompt)"}
```

**Success Criteria:**
- Receives output messages
- Current directory is shown: `/Users/karl/Project/knutpunkt`
- Shell prompt appears

---

### Test 2: Multiple Commands in Sequence

**Description:** Send multiple commands, one after another

**Command:**
```bash
{
  sleep 0.5
  echo $'{"type":"input","data":"pwd\\r\\n"}'
  sleep 1
  echo $'{"type":"input","data":"echo HELLO\\r\\n"}'
  sleep 1
  echo $'{"type":"input","data":"date\\r\\n"}'
  sleep 3
} | websocat --text ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
- Output from `pwd`
- Output "HELLO"
- Current date/time
- Shell prompts between commands

**Success Criteria:**
- All three commands execute
- Output appears in correct order
- No commands lost

---

### Test 3: Interactive Session with Multiple Inputs

**Description:** Keep connection alive and send multiple commands

**Command:**
```bash
websocat ws://localhost:8080/api/v1/terminal/session
```

Then type (manually - note: use literal backslash-r-backslash-n, not actual newlines):
```json
{"type":"input","data":"ls -la\r\n"}
{"type":"input","data":"echo test\r\n"}
{"type":"input","data":"exit\r\n"}
```

**Expected Behavior:**
- Each command executes as you type it
- Output appears immediately
- `exit` command closes the shell and connection

**Success Criteria:**
- Interactive session works
- Real-time command execution
- Clean exit with `{"type":"exit","code":0}`

---

### Test 4: Long-Running Command

**Description:** Test command that produces output over time

**Command:**
```bash
{ echo $'{"type":"input","data":"for i in {1..5}; do echo Line $i; sleep 1; done\\r\\n"}'; sleep 7; } | \
  websocat --text ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
```json
{"type":"output","data":"Line 1\r\n"}
{"type":"output","data":"Line 2\r\n"}
{"type":"output","data":"Line 3\r\n"}
{"type":"output","data":"Line 4\r\n"}
{"type":"output","data":"Line 5\r\n"}
```

**Success Criteria:**
- Lines appear one per second
- Connection stays alive for 5+ seconds
- All output received

---

### Test 5: Large Output

**Description:** Test handling of large output

**Command:**
```bash
echo '{"type":"input","data":"seq 1 1000\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | head -50
```

**Expected Output:**
- Numbers 1-1000 streamed
- Multiple `{"type":"output"}` messages
- No truncation or data loss

**Success Criteria:**
- All 1000 lines received (check with `grep -o "1000"`)
- No WebSocket frame size errors
- Performance acceptable

---

### Test 6: Control Characters (Ctrl-C)

**Description:** Test signal handling

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"sleep 100\n"}'
  sleep 1
  echo '{"type":"input","data":"\u0003"}'  # Ctrl-C (^C)
  sleep 1
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
- Command `sleep 100` starts
- After Ctrl-C: "^C" appears
- New prompt appears (command interrupted)

**Success Criteria:**
- Sleep command interrupted
- Shell remains responsive
- No zombie processes

**Note:** `\u0003` is the Unicode escape for ASCII 0x03 (ETX/Ctrl-C)

---

### Test 7: Command with ANSI Colors

**Description:** Test color output handling

**Command:**
```bash
echo '{"type":"input","data":"ls --color=auto\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | head -20
```

**Expected Output:**
```json
{"type":"output","data":"\u001b[0m\u001b[01;34mbackend\u001b[0m  ..."}
```

**Success Criteria:**
- ANSI escape sequences present (e.g., `\u001b[01;34m`)
- No ANSI stripping by server
- Output readable (when decoded)

---

### Test 8: Terminal Resize

**Description:** Test window size update

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"resize","cols":120,"rows":40}'
  sleep 0.5
  echo '{"type":"input","data":"stty size\n"}'
  sleep 2
) | websocat ws://localhost:8080/api/v1/terminal/session | grep "40 120"
```

**Expected Output:**
```
40 120
```

**Success Criteria:**
- `stty size` reports 40 rows × 120 cols
- Resize message processed correctly

---

### Test 9: Multi-line Input

**Description:** Test heredoc or multi-line command

**Command:**
```bash
echo '{"type":"input","data":"cat << EOF\nline1\nline2\nline3\nEOF\n"}' | \
  websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
```
line1
line2
line3
```

**Success Criteria:**
- All three lines echoed
- Heredoc processed correctly
- No truncation

---

### Test 10: Command with Environment Variables

**Description:** Test that environment is properly set

**Command:**
```bash
echo '{"type":"input","data":"echo $TERM\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | grep xterm-256color
```

**Expected Output:**
```
xterm-256color
```

**Success Criteria:**
- `$TERM` is set to `xterm-256color`
- Environment properly configured

---

### Test 11: Error Handling - Invalid JSON

**Description:** Test server response to malformed messages

**Command:**
```bash
echo 'not valid json' | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
```json
{"type":"error","message":"Message handling error: ..."}
```

**Success Criteria:**
- Error message received
- Connection closes gracefully
- No server crash

---

### Test 12: Session Timeout (Long Test)

**Description:** Test idle timeout after 30 minutes

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"pwd\n"}'
  sleep 1800  # Wait 30 minutes
  echo '{"type":"input","data":"pwd\n"}'
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Behavior:**
- First `pwd` executes
- After 30 minutes, session terminated
- Second `pwd` fails (connection closed)

**Success Criteria:**
- Session cleaned up after timeout
- Server logs: "Terminating idle session"

**Note:** This is a 30+ minute test!

---

### Test 13: Multiple Concurrent Sessions

**Description:** Test multiple terminals at once

**Command (in 3 separate terminals):**
```bash
# Terminal 1
echo '{"type":"input","data":"echo Session 1\n"}' | websocat ws://localhost:8080/api/v1/terminal/session

# Terminal 2
echo '{"type":"input","data":"echo Session 2\n"}' | websocat ws://localhost:8080/api/v1/terminal/session

# Terminal 3
echo '{"type":"input","data":"echo Session 3\n"}' | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Behavior:**
- All three sessions run independently
- No output mixing between sessions
- Each gets unique session ID (check logs)

**Success Criteria:**
- 3 separate PTY processes spawned
- 3 session IDs in logs
- No interference between sessions

---

### Test 14: Working Directory Validation

**Description:** Verify shell starts in correct directory

**Command:**
```bash
echo '{"type":"input","data":"pwd\nls -la tasks\n"}' | \
  websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
- `/Users/karl/Project/knutpunkt`
- Listing of `tasks` directory showing `planned/`, `ongoing/`, `done/`

**Success Criteria:**
- Working directory is project root
- `tasks/` directory accessible

---

### Test 15: File Operations

**Description:** Test creating and reading files

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"echo test content > /tmp/websocat-test.txt\n"}'
  sleep 1
  echo '{"type":"input","data":"cat /tmp/websocat-test.txt\n"}'
  sleep 1
  echo '{"type":"input","data":"rm /tmp/websocat-test.txt\n"}'
  sleep 1
) | websocat ws://localhost:8080/api/v1/terminal/session | grep "test content"
```

**Expected Output:**
```
test content
```

**Success Criteria:**
- File created successfully
- Content readable
- File deleted (check `/tmp/`)

---

### Test 16: Exit Command

**Description:** Test graceful shell exit

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"pwd\n"}'
  sleep 1
  echo '{"type":"input","data":"exit\n"}'
  sleep 1
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
```json
{"type":"output","data":"/Users/karl/Project/knutpunkt"}
{"type":"exit","code":0}
```

**Success Criteria:**
- Exit message received
- Exit code is 0
- Connection closes cleanly

---

### Test 17: Background Process

**Description:** Test job control

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"sleep 5 &\n"}'
  sleep 1
  echo '{"type":"input","data":"jobs\n"}'
  sleep 6
  echo '{"type":"input","data":"jobs\n"}'
  sleep 1
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
- First `jobs`: Shows running background job
- Second `jobs`: Job completed (no output)

**Success Criteria:**
- Background job starts
- `jobs` command works
- Background job completes

---

### Test 18: Special Characters in Input

**Description:** Test escaping and special characters

**Command:**
```bash
echo '{"type":"input","data":"echo \"Hello World\" && echo '\''single quotes'\'' && echo $USER\n"}' | \
  websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
```
Hello World
single quotes
<current-user>
```

**Success Criteria:**
- Double quotes work
- Single quotes work
- Variable expansion works

---

### Test 19: Connection Close Without Exit

**Description:** Test abrupt disconnect

**Command:**
```bash
(
  sleep 0.5
  echo '{"type":"input","data":"sleep 100\n"}'
  sleep 1
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Behavior:**
- Command starts
- After 1 second, websocat closes (no more input)
- Server detects disconnect and cleans up

**Success Criteria:**
- Server logs: "Terminal session terminated"
- PTY process killed
- No orphan processes (`ps aux | grep sleep`)

---

### Test 20: Rapid Commands

**Description:** Stress test with fast input

**Command:**
```bash
(
  for i in {1..20}; do
    echo '{"type":"input","data":"echo Command '$i'\n"}'
    sleep 0.1
  done
  sleep 2
) | websocat ws://localhost:8080/api/v1/terminal/session
```

**Expected Output:**
- All 20 commands execute
- All "Command 1" through "Command 20" appear
- No commands lost

**Success Criteria:**
- Count output lines: should have 20 command outputs
- No errors
- Correct order

---

## Debugging Commands

### View Server Logs
```bash
# If running with ./start.sh, check the terminal output
# For more verbose logging:
APP_LOG_LEVEL=DEBUG ./start.sh /Users/karl/Project/knutpunkt/tasks
```

### Check Active Sessions
```bash
# Look for pty processes
ps aux | grep pty4j

# Look for shell processes spawned by Java
ps aux | grep -E 'zsh|bash' | grep karl
```

### Monitor Network
```bash
# Watch WebSocket connections
netstat -an | grep 8080

# Or use lsof
lsof -i :8080
```

### Verify Session Cleanup
```bash
# After a test, check if processes were cleaned up
ps aux | grep java
ps aux | grep zsh | wc -l  # Should not grow indefinitely
```

---

## Common Issues and Solutions

### Issue: No Output Received

**Symptoms:** WebSocket connects but no output appears

**Solutions:**
1. Add longer `sleep` delays between commands
2. Check if shell prompt is being filtered
3. Use `head -n 100` to see initial output
4. Verify server logs for errors

### Issue: Connection Closes Immediately

**Symptoms:** WebSocket opens and closes in < 1 second

**Solutions:**
1. Add `sleep` before commands to keep connection alive
2. Check server logs for errors
3. Verify JSON message format
4. Use interactive mode: `websocat -v ws://...`

### Issue: Garbled Output

**Symptoms:** Output contains ANSI escape sequences

**Solutions:**
1. This is normal! Terminal emulators interpret these
2. Use `| cat -v` to see raw output
3. Use `| sed 's/\x1b\[[0-9;]*m//g'` to strip colors
4. Frontend should render ANSI properly

### Issue: Commands Timeout

**Symptoms:** Long-running commands interrupted

**Solutions:**
1. Increase WebSocket timeout in `WebSockets.kt`
2. Use longer `sleep` periods
3. Check network connectivity
4. Monitor server resources

---

## Advanced Testing

### JSON Test Helper Script

Create `test-terminal.sh`:
```bash
#!/bin/bash
WS_URL="ws://localhost:8080/api/v1/terminal/session"

send_input() {
  echo "{\"type\":\"input\",\"data\":\"$1\\n\"}"
}

send_resize() {
  echo "{\"type\":\"resize\",\"cols\":$1,\"rows\":$2}"
}

# Usage
send_input "pwd" | websocat $WS_URL
```

### Automated Test Suite

```bash
#!/bin/bash
# test-suite.sh

PASS=0
FAIL=0

test_pwd() {
  echo "Test: pwd command"
  RESULT=$(echo '{"type":"input","data":"pwd\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | grep -c "knutpunkt")
  if [ "$RESULT" -gt 0 ]; then
    echo "✅ PASS"
    ((PASS++))
  else
    echo "❌ FAIL"
    ((FAIL++))
  fi
}

test_echo() {
  echo "Test: echo command"
  RESULT=$(echo '{"type":"input","data":"echo TESTSTRING\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | grep -c "TESTSTRING")
  if [ "$RESULT" -gt 0 ]; then
    echo "✅ PASS"
    ((PASS++))
  else
    echo "❌ FAIL"
    ((FAIL++))
  fi
}

# Run tests
test_pwd
test_echo

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

---

## Performance Benchmarks

### Latency Test
```bash
# Measure round-trip time
time (echo '{"type":"input","data":"pwd\n"}' | websocat ws://localhost:8080/api/v1/terminal/session > /dev/null)
```

### Throughput Test
```bash
# Large output
time (echo '{"type":"input","data":"seq 1 10000\n"}' | websocat ws://localhost:8080/api/v1/terminal/session | wc -l)
```

### Concurrent Sessions Test
```bash
# Spawn 10 sessions simultaneously
for i in {1..10}; do
  echo '{"type":"input","data":"sleep 5\n"}' | websocat ws://localhost:8080/api/v1/terminal/session &
done
wait
```

---

## Notes

1. **Timing is important:** Add appropriate `sleep` delays to allow command execution
2. **ANSI codes are normal:** Terminal output includes color/formatting codes
3. **JSON escaping:** Use `\n` for newline, `\"` for quotes, `\\` for backslash
4. **Connection persistence:** WebSocket stays open until explicit close or error
5. **Session cleanup:** Server logs when sessions are created/terminated

---

## Related Files

- Backend implementation: `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/routes/TerminalRoutes.kt`
- Service layer: `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/services/TerminalService.kt`
- Architecture docs: `notes/terminal-backend-architecture.md`
