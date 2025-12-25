# VHS documentation: https://github.com/charmbracelet/vhs
#
# Demo: Knutpunkt MCP Server Integration
# This shows Claude Code interacting with the Knutpunkt task board

# Output settings
Output docs/images/demo-mcp.gif

# Terminal settings
Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 50ms
Set PlaybackSpeed 1.0

# Hide the actual prompt and show a clean one
Hide
Type "PS1='❯ '" Enter
Type "clear" Enter
Show

Sleep 500ms

# Start the demo with a prompt
Type "# Knutpunkt MCP Server Demo" Sleep 500ms Enter
Type "# Interacting with the task board via Claude Code" Sleep 500ms Enter
Sleep 1s
Enter

# Launch Claude Code (simulated)
Type "claude" Sleep 500ms Enter
Sleep 1s

# Clear and show the Claude prompt
Type "clear" Enter
Sleep 500ms

# Simulate Claude Code interface
Type "❯ " Sleep 200ms
Type "List all planned tasks" Sleep 100ms
Enter
Sleep 1.5s

# Show response (simulated)
Type "Found 3 task(s):" Enter
Sleep 200ms
Enter
Type "#30 - Frontend: Terminal emulator UI with xterm.js" Enter
Type "  ID: eafd0a27-93f9-46c5-9234-bd8dcf9163bb" Enter
Type "  Status: planned" Enter
Type "  Priority: medium" Enter
Type "  Assignees: None" Enter
Type "  Categories: frontend, feature, ui" Enter
Sleep 500ms
Enter
Type "#15 - Add dark mode support" Enter
Type "  ID: 123e4567-e89b-12d3-a456-426614174000" Enter
Type "  Status: planned" Enter
Type "  Priority: high" Enter
Type "  Assignees: None" Enter
Type "  Categories: frontend, ui" Enter
Sleep 500ms
Enter
Type "#8 - Implement search functionality" Enter
Type "  ID: 987fcdeb-51a2-43f7-8abc-def012345678" Enter
Type "  Status: planned" Enter
Type "  Priority: medium" Enter
Type "  Assignees: None" Enter
Type "  Categories: feature, backend" Enter
Sleep 2s
Enter

# Claim a task
Type "❯ " Sleep 200ms
Type "Claim task #15 and start working on it" Sleep 100ms
Enter
Sleep 1.5s

# Show claim response
Type "✓ Task claimed successfully!" Enter
Sleep 200ms
Enter
Type "#15 - Add dark mode support" Enter
Type "Status: planned → ongoing" Enter
Type "Assignees: Claude Code" Enter
Type "Priority: high" Enter
Sleep 2s
Enter

# Create a new task
Type "❯ " Sleep 200ms
Type "Create a task to add task filtering by priority" Sleep 100ms
Enter
Sleep 1.5s

# Show create response
Type "✓ Task created successfully!" Enter
Sleep 200ms
Enter
Type "#31 - Add task filtering by priority" Enter
Type "ID: 456e789f-12ab-34cd-56ef-789012345abc" Enter
Type "Status: planned" Enter
Type "Priority: medium" Enter
Type "Assignees: None" Enter
Type "Categories: None" Enter
Sleep 2s
Enter

# Show the task was added
Type "❯ " Sleep 200ms
Type "List all planned tasks" Sleep 100ms
Enter
Sleep 1s

Type "Found 3 task(s):" Enter
Sleep 200ms
Enter
Type "#31 - Add task filtering by priority" Enter
Type "  Status: planned" Enter
Type "  Priority: medium" Enter
Sleep 500ms
Enter
Type "#30 - Frontend: Terminal emulator UI with xterm.js" Enter
Type "  Status: planned" Enter
Type "  Priority: medium" Enter
Sleep 500ms
Enter
Type "#8 - Implement search functionality" Enter
Type "  Status: planned" Enter
Type "  Priority: medium" Enter
Sleep 3s

# End
Type "❯ " Sleep 1s
