---
id: "4b661697-ac34-4611-8abb-3fac0f6635e8"
number: 34
title: "Dialog on unsaved changes"
createdAt: "2025-12-13T15:58:43.048723Z"
updatedAt: "2025-12-15T19:15:17.688319Z"
assignees:
- "Claude Code"
categories: []
priority: "medium"
order: 4
---

# Show dialog before closing with unsaved changes

## Overview

The TaskDialog may be closed unadvertedly with escape (especially in VIM mode) when unsaved changes exist. The dialog should detect unsaved changes and display a modal dialog, "There's unsaved changes. Close anyway?"

## Requirements

- Changes are tracked and unsaved changes are detected for all editable fields (and components like MarkdownEditor)
- When closing the dialog (either by escape or by cancel button) and there is unsaved changes, a dialog should be displayed
- The closing should be interrupted if the user don't want to close with unsaved changes
  
## Acceptance Criteria

- [ ] Dialog detects and warns users on unsaved changes
- [ ] Tests are updated, new tests are written if needed
- [ ] All new and old tests are passing