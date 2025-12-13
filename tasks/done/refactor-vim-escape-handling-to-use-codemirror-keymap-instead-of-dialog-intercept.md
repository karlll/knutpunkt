---
id: "6705cde8-ab8b-46f1-8f7b-155521c44d21"
number: 32
title: "Refactor VIM Escape handling to use CodeMirror keymap instead of Dialog intercept"
createdAt: "2025-12-12T22:28:38.137233Z"
updatedAt: "2025-12-13T15:37:47.883160Z"
assignees:
- "Claude Code"
categories:
- "refactor"
- "technical-debt"
- "vim"
priority: "medium"
order: 5
---

# Refactor VIM Escape handling to use CodeMirror keymap

## Overview

Replace the current VIM Escape key handling implementation with a cleaner approach using CodeMirror's keymap extension system. The current solution works but is overly complex and handles the event at the wrong abstraction level (Dialog instead of Editor).

## Background - Current Implementation

**Commit reference:** `1f9d12e` - "fix: handle VIM Escape key correctly in TaskDialog MarkdownEditor"

**Current approach:**
- Intercepts Dialog's `onOpenChange` callback in `TaskDialog.tsx`
- Exposes three imperative ref methods: `isInsertMode()`, `handleVimEscape()`, `hasFocus()`
- Accesses VIM's internal state via type casting: `(view as any).cm.state.vim`
- Manually manipulates VIM state properties: `vimState.insertMode = false`, `vimState.mode = 'normal'`
- Manually triggers view updates: `view.requestMeasure()`, `view.update()`, `view.focus()`

**Problems with current approach:**
1. Accesses private/internal APIs (brittle, may break with updates)
2. Manages VIM's state from outside VIM
3. Couples Dialog and Editor concerns
4. Handles event at wrong level (Dialog instead of Editor)
5. Requires coordination between two components
6. Complex to understand and maintain

## Proposed Solution - CodeMirror Keymap

Use CodeMirror's keymap extension to handle Escape at the editor level and control event propagation.

### Implementation

**File:** `frontend/src/components/ui/markdown-editor.tsx`

```typescript
import { keymap } from "@codemirror/view"

// Add this keymap extension when building extensions array
const vimEscapeKeymap = keymap.of([{
  key: "Escape",
  run: (view) => {
    // Check if we're in VIM insert mode
    const vimState = (view as any).cm?.state?.vim
    if (vimState?.insertMode) {
      // VIM will handle this escape via its own keymap
      // Returning true prevents event from bubbling to Dialog
      return true  // "I handled it, stop propagation"
    }
    // Not in insert mode, allow event to bubble up (will close dialog)
    return false  // "Not handled, continue propagation"
  }
}])

// In the editor setup effect, add to extensions:
const extensions = [
  basicSetup,
  markdown(),
  oneDark,
  EditorView.lineWrapping,
  EditorView.updateListener.of((update) => { /* ... */ }),
]

if (vimMode) {
  extensions.push(vim())
  extensions.push(vimEscapeKeymap)  // Add this
}
```

### What This Eliminates

**From `markdown-editor.tsx`:**
- Remove `isInsertMode()` method from ref interface
- Remove `handleVimEscape()` method from ref interface
- Remove `hasFocus()` method from ref interface (or keep if needed elsewhere)
- Simplify to just expose editor operations, not VIM-specific state

**From `TaskDialog.tsx`:**
- Remove entire `handleOpenChange` callback wrapper
- Use Dialog's `onOpenChange` prop directly: `<Dialog open={open} onOpenChange={onOpenChange}>`
- Remove all VIM-related logic from TaskDialog

### Benefits

1. **Uses public API**: CodeMirror's keymap is the intended way to handle keys
2. **Correct abstraction level**: Editor handles its own keyboard events
3. **Separation of concerns**: Dialog doesn't know about VIM, Editor doesn't know about Dialog
4. **Less brittle**: No access to internal APIs
5. **Simpler**: VIM manages its own state naturally
6. **More maintainable**: Standard CodeMirror pattern, not custom solution
7. **Self-documenting**: Other developers immediately understand keymap approach

## Acceptance Criteria

- [ ] VIM Escape key works with single press to exit INSERT mode
- [ ] Dialog stays open when Escape exits INSERT mode
- [ ] Dialog closes when Escape pressed in NORMAL mode or editor not focused
- [ ] No imperative ref methods for VIM state management
- [ ] No Dialog-level intercept of onOpenChange
- [ ] Uses CodeMirror keymap extension
- [ ] All existing tests pass
- [ ] Manual testing confirms behavior identical to current implementation

## Testing Plan

1. Enable VIM mode in settings
2. Open TaskDialog (create or edit task)
3. Click in description editor, press `i` to enter INSERT mode
4. Press Escape once → should exit to NORMAL mode, dialog stays open
5. Press Escape again → should close dialog
6. Repeat test with editor not focused → Escape should close dialog immediately

## References

- CodeMirror keymap docs: https://codemirror.net/docs/ref/#view.keymap
- Current implementation: `frontend/src/components/ui/markdown-editor.tsx:36-72`
- Current implementation: `frontend/src/components/kanban/TaskDialog.tsx:64-74`
- Commit reference: `1f9d12e`

## Notes

This was discovered during a troubleshooting session where we went down the path of Dialog-level interception because we started solving the problem at the wrong level. The keymap approach is likely the standard solution in the CodeMirror community for this exact scenario.