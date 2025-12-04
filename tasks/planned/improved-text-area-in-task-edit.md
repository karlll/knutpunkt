---
id: "f6ad956b-f243-40c1-9876-9018a5503031"
number: 10
title: "Improved text area in task edit"
createdAt: "2025-12-04T20:43:51.524292Z"
updatedAt: "2025-12-04T20:43:51.524292Z"
assignees: []
categories:
- "frontend"
priority: "low"
order: 1
---

# VI and Markdown syntax HL in text edit control

## Overview

The "Description" text area should support syntax highlighting for markdown, as well as VI mode.

## Requirements

- This feature should be implemented using dependencies, i.e. it is not expected that neither Markdown syntax HL or VI edit mode should be implemented "from scratch"
- The text area control used in the "Edit Task" / "Create New Task" modals should support syntax highlighting for Markdown. It should also support a dark theme
- It should be possible to use VI (and "non-VI") when entering text
- The VI / Non-VI mode should be configurable
- It is sufficient if the configuration is a parameter to the Task Dialog component, it doesn't need to be changeable in the UI.
- The VI support should be provided by a third party library, or as a feature of the edit component that also supports Markdown HL

## Acceptance Criteria

- [] New dependencies are added
- [] New tests are added
- [] New and old tests are passing
- [] Stories (for Storybook) are updated