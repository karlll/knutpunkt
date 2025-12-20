---
id: "c3803afb-c181-47a9-8f99-fef832407a55"
number: 41
title: "Make PTY terminal support configurable"
createdAt: "2025-12-17T20:38:37.467777Z"
updatedAt: "2025-12-18T19:03:04.807757Z"
assignees:
- "GitHub Copilot"
categories:
- "backend"
- "configuration"
- "feature"
priority: "medium"
order: 5
---

# Make PTY Terminal Support Configurable

## Overview

Add a configuration parameter to enable/disable the PTY terminal functionality. When disabled, the terminal routes and service should not be initialized, reducing resource usage and providing deployment flexibility.

## Requirements

- Add `knutpunkt.terminal.enabled` configuration parameter to `application.conf`
- Default to `true` (enabled) for backward compatibility
- Support environment variable override via `TERMINAL_ENABLED`
- Conditionally register terminal WebSocket routes based on config
- Conditionally instantiate `TerminalService` only when enabled
- When disabled, terminal endpoints should return 404 (or optionally a clear error message)
- Update `start.sh` documentation to include the new config option
- No changes needed to WebSockets plugin (can stay installed)
- PTY4J dependency remains in JAR (acceptable ~2MB overhead)

## Implementation Approach (Option 1)

### 1. Update `application.conf`

Add terminal configuration section:
```hocon
knutpunkt {
    terminal {
        enabled = true
        enabled = ${?TERMINAL_ENABLED}
        idleTimeoutMinutes = 30  # Optional: make timeout configurable
    }
}
```

### 2. Update `Routing.kt`

Read config and conditionally register terminal routes:
```kotlin
fun Application.configureRouting(taskService: TaskService, eventServices: EventServices, tasksDirectory: String) {
    val config = HoconApplicationConfig(ConfigFactory.load())
    val terminalEnabled = config.propertyOrNull("knutpunkt.terminal.enabled")
        ?.getString()?.toBoolean() ?: true
    
    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventServices.taskEventService, eventServices.fileEventService)
            
            if (terminalEnabled) {
                val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
                val terminalService = TerminalService(tasksDirectory, scope)
                
                environment.monitor.subscribe(ApplicationStopping) {
                    terminalService.close()
                }
                
                terminalRoutes(terminalService)
                log.info("Terminal support enabled")
            } else {
                log.info("Terminal support disabled")
            }
        }
    }
}
```

### 3. Update `start.sh` documentation

Add to environment variables section:
```bash
#   TERMINAL_ENABLED   - Enable PTY terminal support [default: true]
```

### 4. Optional: Add explicit disabled endpoint

If desired, provide clear feedback when disabled:
```kotlin
if (!terminalEnabled) {
    get("/terminal/session") {
        call.respond(
            HttpStatusCode.ServiceUnavailable, 
            mapOf("error" to "Terminal feature is disabled in configuration")
        )
    }
}
```

## Files to Modify

1. `backend/src/main/resources/application.conf` - Add terminal config section
2. `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/plugins/Routing.kt` - Conditional route registration
3. `start.sh` - Update documentation
4. `backend/application.conf.example` - Add terminal config example

## Acceptance Criteria

- [ ] Application starts successfully with default config (terminal enabled)
- [ ] Application starts successfully with `TERMINAL_ENABLED=false`
- [ ] When enabled, WebSocket endpoint `/api/v1/terminal/session` is accessible
- [ ] When disabled, WebSocket endpoint returns 404 (or custom error)
- [ ] When disabled, `TerminalService` is not instantiated (no resource overhead)
- [ ] Configuration can be overridden via external config file
- [ ] Environment variable `TERMINAL_ENABLED` properly overrides config
- [ ] All existing tests pass
- [ ] Documentation in `start.sh` and `application.conf.example` is updated

## Testing

1. Build and test with default config (enabled):
   ```bash
   make dist
   ./start.sh ./tasks
   # Verify terminal WebSocket works
   ```

2. Test with environment variable (disabled):
   ```bash
   TERMINAL_ENABLED=false ./start.sh ./tasks
   # Verify terminal endpoint returns 404
   ```

3. Test with external config:
   ```bash
   CONFIG_FILE=/path/to/config.conf ./start.sh ./tasks
   # Where config.conf has terminal.enabled = false
   ```

## Benefits

- **Resource efficiency**: No terminal service overhead when disabled
- **Security**: Disable terminal in production if not needed
- **Deployment flexibility**: Different configs for different environments
- **Backward compatible**: Default behavior unchanged
- **Simple implementation**: ~10 lines of code, 4 files

## Future Enhancements (Out of Scope)

- Make idle timeout configurable (currently hardcoded 30 minutes)
- Remove PTY4J from JAR when disabled (requires build-time flag)
- Add more terminal configuration options (shell, environment variables)