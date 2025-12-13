# Terminal WebSocket Troubleshooting Session Summary

**Date:** 2025-12-13  
**Duration:** ~3 hours  
**Status:** ✅ RESOLVED

---

## Problem Statement

When testing the WebSocket terminal API with `websocat`, commands were not executing. The PTY was spawning correctly and the WebSocket was connecting, but input commands sent to the terminal were not producing any output.

---

## Root Cause

**Bash string escaping issue in test commands.**

When using bash single quotes `'...'` to construct JSON messages, the escape sequences were being preserved literally instead of being interpreted:

```bash
# WRONG - sends literal backslashes to shell
echo '{"type":"input","data":"pwd\\r\\n"}'
# Results in shell receiving: pwd\r\n (literal backslash-r-backslash-n)
```

The JSON spec requires `\r\n` (backslash-r-backslash-n as escape sequences) in the string, which `kotlinx.serialization` parses as CR+LF bytes (0x0D 0x0A). However, bash single quotes preserve everything literally, so `\\r` stayed as two backslashes and an 'r', not as the escape sequence `\r`.

---

## Solution

Use bash `$'...'` quoting syntax which interprets escape sequences:

```bash
# CORRECT - escape sequences are interpreted
echo $'{"type":"input","data":"pwd\\r\\n"}'
# Results in JSON: {"type":"input","data":"pwd\r\n"}
# kotlinx.serialization parses \r\n → CR+LF bytes
# Shell receives: pwd<CR><LF> (0x0D 0x0A) and executes command
```

Additionally, keep stdin open long enough to receive output:

```bash
{ echo $'{"type":"input","data":"pwd\\r\\n"}'; sleep 3; } | websocat --text ws://localhost:8080/api/v1/terminal/session
```

---

## Debugging Journey

### Phase 1: Coroutine Lifecycle Issues (Already Resolved)
- Previous session had fixed coroutine cancellation bugs
- Removed `select()` pattern, used direct `for (frame in incoming)` loop
- Changed from non-blocking `available()` to blocking `read()` for PTY output

### Phase 2: No Output Despite Connection (This Session)

**Symptoms:**
- WebSocket connects successfully
- PTY spawns and session created
- Initial shell prompt received
- But commands don't execute

**Investigation Steps:**

1. **Added extensive logging:**
   - Logged frame reception: "Received frame type: Text"
   - Logged message content: "Received text frame (40 bytes): {...}"
   - Logged PTY writes: "Sending input to PTY: echo TEST\r\n"

2. **Discovered messages were arriving:**
   - Server logs showed frames being received
   - JSON was being parsed correctly
   - Input was being written to PTY outputStream and flushed

3. **Examined actual PTY output:**
   - Shell was echoing the command: `echo TESTMARKER\\r\\n`
   - **The `\\r\\n` was literal!** Not CR+LF bytes
   - This revealed the shell received backslash-backslash-r-backslash-backslash-n

4. **Traced back to test command:**
   - Realized bash single quotes don't interpret escape sequences
   - `echo '...\\r\\n'` preserves the double backslashes
   - JSON parser sees `\\r` which it interprets as: backslash + 'r' (two chars)

5. **Tested with `$'...'` syntax:**
   ```bash
   { echo $'{"type":"input","data":"echo SUCCESS\\r\\n"}'; sleep 5; } | websocat --text ws://localhost:8080/api/v1/terminal/session
   ```
   - **Got output:** `{"type":"output","data":"SUCCESS\r\n"}`
   - ✅ **Commands now execute successfully!**

---

## Key Learnings

### 1. JSON Escape Sequences
- JSON requires `\r` and `\n` (backslash-r, backslash-n) in strings
- When parsed, these become bytes 0x0D (CR) and 0x0A (LF)
- Raw control characters are not valid in JSON strings

### 2. Bash Quoting Mechanisms
- **Single quotes `'...'`:** Preserve everything literally, no escaping
- **Double quotes `"..."`:** Allow variable expansion and some escaping
- **Dollar-single-quotes `$'...'`:** ANSI-C quoting, interprets escape sequences
  - `\\n` → `\n` (single backslash-n)
  - `\\r` → `\r` (single backslash-r)
  - `\\t` → `\t` (tab)
  - etc.

### 3. WebSocket + Shell Escaping Layers
When sending shell commands via WebSocket:
1. **Bash layer:** Must produce correct JSON string
2. **JSON layer:** Must contain `\r\n` escape sequences  
3. **Kotlin layer:** Parses `\r\n` → CR+LF bytes
4. **PTY layer:** Receives bytes and interprets as command terminator

### 4. websocat Behavior
- Operates in "line mode" by default (`Line2Message` transform)
- Converts each line from stdin to a WebSocket text message
- Closes connection when stdin closes
- Use `{ ...; sleep N; }` to keep stdin open for receiving output

---

## Testing Commands

### Working Examples

**Simple command:**
```bash
{ echo $'{"type":"input","data":"pwd\\r\\n"}'; sleep 3; } | websocat --text ws://localhost:8080/api/v1/terminal/session
```

**Multiple commands:**
```bash
{
  echo $'{"type":"input","data":"pwd\\r\\n"}'
  sleep 1
  echo $'{"type":"input","data":"echo TEST\\r\\n"}'  
  sleep 1
  echo $'{"type":"input","data":"date\\r\\n"}'
  sleep 3
} | websocat --text ws://localhost:8080/api/v1/terminal/session
```

**Grep for specific output:**
```bash
{ echo $'{"type":"input","data":"echo SUCCESS\\r\\n"}'; sleep 3; } | \
  websocat --text ws://localhost:8080/api/v1/terminal/session | \
  grep -i success
```

**Interactive mode:**
```bash
websocat --text ws://localhost:8080/api/v1/terminal/session
# Then manually type (with literal \r\n):
{"type":"input","data":"ls\r\n"}
```

---

## Files Modified

1. **`notes/terminal-manual-testing.md`** (NEW)
   - Comprehensive testing guide with 20 test cases
   - Critical bash escaping instructions
   - Troubleshooting tips and debugging commands

2. **`notes/terminal-backend-architecture.md`** (Created earlier)
   - Full architectural documentation
   - 828 lines covering implementation details

3. **Backend code** (temporary debug logs, reverted)
   - Added INFO-level logs during debugging
   - Reverted before commit to keep code clean

---

## Related Commits

1. **`caaea79`** - Initial WebSocket terminal backend implementation
2. **`58e265c`** - WIP: Improved coroutine handling (critical bug found)
3. **`ccf7df1`** - fix: resolve WebSocket terminal coroutine lifecycle issue
4. **`db1d0f3`** - fix: remove reference to undefined bytesRead variable
5. **`39a4c30`** - docs: add comprehensive WebSocket terminal testing guide

---

## Next Steps

### For Testing
- ✅ Backend implementation verified working
- ⏭️ Frontend implementation (Task #30)
- ⏭️ Create automated test suite
- ⏭️ Add integration tests

### For Production
- Add authentication/authorization
- Implement session limits per user
- Add proper exit code handling from PTY process
- Consider output rate limiting
- Add session persistence/reconnection

### For Documentation
- ✅ Testing guide complete
- ✅ Architecture documentation complete  
- ⏭️ Update CLAUDE.md with troubleshooting notes
- ⏭️ Create frontend integration guide

---

## Conclusion

The terminal WebSocket implementation is **fully functional**. The troubleshooting revealed a subtle but critical issue with bash string escaping that would have been easy to miss. The `$'...'` syntax is essential for proper JSON escape sequence handling when testing from the command line.

**Key Takeaway:** Always use `$'...'` when constructing JSON in bash that contains escape sequences like `\r`, `\n`, `\t`, etc.

---

## Resources

- websocat documentation: https://github.com/vi/websocat
- Bash ANSI-C Quoting: https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
- JSON specification: https://www.json.org/
- kotlinx.serialization docs: https://kotlinlang.org/docs/serialization.html
