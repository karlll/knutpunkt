---
id: "d3b630f2-cb64-454f-9806-419438a3e1f6"
number: 38
title: "Bug: not possible to exit VISUAL mode"
createdAt: "2025-12-15T19:59:27.538513Z"
updatedAt: "2025-12-15T20:08:57.780085Z"
assignees:
- "Claude Code"
categories:
- "frontend"
priority: "medium"
order: 1
---

# In VIM mode, escape does not exit VISUAL mode

## Overview

When editing in VIM mode in MarkdownEditor and pressing 'i', INSERT mode is activated. Pressing escape exits INSERT mode back to NORMAL mode. It is expected that the same behavior works for the other valid VIM edit modes, like VISUAL mode etc. But entering VISUAL mode (pressing 'v') and pressing escape will close the Dialog instead of exiting back to NORMAL mode.

## Requirements

- When in VISUAL, VISUAL BLOCK, REPLACE (and any other valid) modes, pressing escape should exit back to NORMAL mode

## Acceptance Criteria

- [ ] It works to exit all VIM edit modes using escape, not just INSERT