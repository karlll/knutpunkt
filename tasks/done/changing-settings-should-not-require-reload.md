---
id: "44602a04-1f21-4a6f-b869-d5ede7eb83c2"
number: 37
title: "Changing settings should not require reload"
createdAt: "2025-12-15T19:54:50.407751Z"
updatedAt: "2025-12-16T19:09:31.298248Z"
assignees:
- "Claude Code"
categories:
- "frontend"
priority: "medium"
order: 1
---

# Changing setting should not require reload of the page

## Overview

Currently, if for instance VIM mode is activated in the settings and saved, opening a dialog in edit mode will not show the VIM mode in the MarkdownEditor. This is only activated if the page is reloaded manually. This is true for the number of tasks shown in the "Done" column as well.

The page should not need to be reloaded manually for the changes in settings to take effect.

## Requirements

- No reload should be needed when settings are changed for the new config to take effect

## Acceptance Criteria

- [ ] Settings takes effect when saved in the settings menu
- [ ] Tests are passing