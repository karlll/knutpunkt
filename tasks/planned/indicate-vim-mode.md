---
id: "012c13e7-0129-431a-9d48-fe14912d495b"
number: 33
title: "Indicate VIM mode"
createdAt: "2025-12-13T15:48:07.746557Z"
updatedAt: "2025-12-13T15:48:07.746557Z"
assignees: []
categories:
- "frontend"
priority: "medium"
order: 1
---

# Indicator showing VIM mode

## Overview

The MarkdownEditor has support for VIM mode. If it is active, a small below the MarkdownEditor should show this. Also, the current VIM editing mode of the MarkdownEditor should be printed (all modes available to the codemirro-vim plugin should be supported)

## Requirements

- When VIM mode is active, a text or label or other suitable UI element should indicate it just below the editor area.
- The current edit mode should also be indicated
- When VIM mode is not active, nothing should be displayed

## Acceptance Criteria

- [ ] Indicator and mode information is available for VIM mode
- [ ] When VIM mode is inactive, nothing is displayed