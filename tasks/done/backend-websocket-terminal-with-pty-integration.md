---
id: "733b4ba2-09b2-42ed-977a-26f8700ed244"
number: 31
title: "Backend: WebSocket terminal with PTY integration"
createdAt: "2025-12-12T20:06:59.906255Z"
updatedAt: "2025-12-15T19:15:17.688319Z"
assignees:
- "GitHub Copilot"
categories:
- "backend"
- "feature"
- "websocket"
priority: "medium"
order: 10
---

# Backend: WebSocket terminal with PTY integration

## Overview
Implement backend infrastructure for WebSocket-based terminal sessions using PTY (pseudo-terminal) process spawning. This provides the server-side foundation for embedded terminal functionality.

## Requirements

### 1. Add Dependencies (`backend/build.gradle.kts`)
```kotlin
dependencies {
    implementation("io.ktor:ktor-server-websockets:3.0.3")
    implementation("org.jetbrains.pty4j:pty4j:0.12.13")
}
```

### 2. Create Terminal Service (`backend/src/main/kotlin/com/ninjacontrol/knutpunkt/services/TerminalService.kt`)

**Core functionality:**
- Spawn PTY process with configurable shell (bash/zsh)
- Manage active terminal sessions (thread-safe in-memory map)
- Handle terminal resize events (cols/rows updates)
- Auto-cleanup on disconnect or idle timeout (30 minutes)
- Session lifecycle methods: `createSession()`, `attachSession()`, `terminateSession()`

**Session management:**
```kotlin
data class TerminalSession(
    val id: String,
    val ptyProcess: PtyProcess,
    val createdAt: Instant,
    var lastActivity: Instant,
    val workingDirectory: String
)
```

### 3. Create Terminal Routes (`backend/src/main/kotlin/com/ninjacontrol/knutpunkt/routes/TerminalRoutes.kt`)

**WebSocket endpoint:** `GET /api/v1/terminal/session?taskId={optional}`

**Handle WebSocket lifecycle:**
- `onConnect`: Create new PTY session, start I/O streaming
- `onMessage`: Handle client messages (input, resize)
- `onDisconnect`: Cleanup PTY process and session

**Message handling:**
- Read from PTY output stream → send to WebSocket
- Receive from WebSocket → write to PTY input stream
- Handle resize events → update PTY dimensions

### 4. Update Routing Plugin (`backend/src/main/kotlin/com/ninjacontrol/knutpunkt/plugins/Routing.kt`)
```kotlin
install(WebSockets) {
    pingPeriod = Duration.ofSeconds(15)
    timeout = Duration.ofSeconds(15)
    maxFrameSize = Long.MAX_VALUE
    masking = false
}

routing {
    // ... existing routes
    terminalRoutes(terminalService)
}
```

### 5. Security & Resource Management

**Implement:**
- Working directory restrictions (only project directories)
- Authentication checks for WebSocket connections
- CPU/memory limits per session (optional, OS-level)
- Idle timeout mechanism (kill after 30 minutes inactivity)
- Proper process cleanup on errors

**Optional security:**
- Command whitelist (configurable allow-list)
- Environment variable sanitization
- Rate limiting per user/IP

## API Design

### WebSocket Endpoint
```
ws://localhost:8080/api/v1/terminal/session?taskId={optional}
```

### Message Format (Client → Server)
```json
{
  "type": "input",
  "data": "command input string"
}
```
```json
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

### Message Format (Server → Client)
```json
{
  "type": "output",
  "data": "terminal output"
}
```
```json
{
  "type": "error",
  "message": "error description"
}
```
```json
{
  "type": "exit",
  "code": 0
}
```

## Acceptance Criteria

- [ ] Dependencies added to `build.gradle.kts`
- [ ] `TerminalService` created with session management
- [ ] `TerminalRoutes` WebSocket endpoint implemented
- [ ] PTY process spawns correctly with bash/zsh
- [ ] Bidirectional I/O streaming works (input → PTY → output)
- [ ] Resize events properly handled
- [ ] Session auto-cleanup on disconnect
- [ ] Idle timeout (30 min) terminates sessions
- [ ] Working directory restricted to safe locations
- [ ] Error handling (spawn failures, I/O errors, crashes)
- [ ] Manual testing with `websocat` or similar tool

## Examples

### PTY Process Spawning (Kotlin)
```kotlin
fun createSession(workingDir: File, taskId: String?): TerminalSession {
    val pty = PtyProcessBuilder()
        .setCommand(arrayOf("/bin/bash", "-i"))
        .setDirectory(workingDir.absolutePath)
        .setEnvironment(mapOf(
            "TERM" to "xterm-256color",
            "TASK_ID" to (taskId ?: "")
        ))
        .setInitialColumns(80)
        .setInitialRows(24)
        .start()
    
    val sessionId = UUID.randomUUID().toString()
    val session = TerminalSession(
        id = sessionId,
        ptyProcess = pty,
        createdAt = Instant.now(),
        lastActivity = Instant.now(),
        workingDirectory = workingDir.absolutePath
    )
    
    sessions[sessionId] = session
    return session
}
```

### WebSocket Route Handler (Kotlin)
```kotlin
webSocket("/api/v1/terminal/session") {
    val session = terminalService.createSession(workingDir, taskId)
    
    launch { // Read from PTY, send to WebSocket
        session.ptyProcess.outputStream.bufferedReader().use { reader ->
            val buffer = CharArray(1024)
            while (isActive) {
                val len = reader.read(buffer)
                if (len > 0) {
                    send(Frame.Text(json.encodeToString(
                        mapOf("type" to "output", "data" to String(buffer, 0, len))
                    )))
                }
            }
        }
    }
    
    for (frame in incoming) {
        when (frame) {
            is Frame.Text -> {
                val msg = json.decodeFromString<TerminalMessage>(frame.readText())
                when (msg.type) {
                    "input" -> session.ptyProcess.outputStream.write(msg.data.toByteArray())
                    "resize" -> session.ptyProcess.setWinSize(msg.cols, msg.rows)
                }
            }
        }
    }
    
    terminalService.terminateSession(session.id)
}
```

## Testing Strategy

1. **Unit tests:** Session management, cleanup logic
2. **Integration tests:** WebSocket connection lifecycle
3. **Manual testing:**
   - Use `websocat` CLI: `websocat ws://localhost:8080/api/v1/terminal/session`
   - Test commands: `echo`, `ls`, `pwd`, `cd`, `exit`
   - Test resize events
   - Test disconnect/reconnect

## References

- [pty4j GitHub](https://github.com/JetBrains/pty4j)
- [Ktor WebSockets](https://ktor.io/docs/websocket.html)
- [PTY process management](https://en.wikipedia.org/wiki/Pseudoterminal)

## Notes

- Start with simple command execution (echo, ls, pwd)
- Test process cleanup thoroughly to prevent zombie processes
- Log all session creation/termination for debugging
- Consider adding session reconnection support in future iteration