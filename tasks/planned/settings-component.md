---
id: "577da613-bdf5-425e-a199-b6777e8d8980"
number: 24
title: "Settings component"
createdAt: "2025-12-06T20:29:21.044976Z"
updatedAt: "2025-12-06T20:29:21.044976Z"
assignees: []
categories: []
priority: "medium"
order: 1
---

# Settings for the application in a modal

## Overview

There are some configurable values for the frontend. It should be possible to edit those and save them in localStorage. The configured value should be usable by the web appliation in its operation. 

## Requirements

- The settings should be saved in localStorage
- The settings should be displayed in a modal dialog
- The settings should be grouped by some category
- The modal dialog should be opened by a button in the header, besides the "add new task", and "change theme" buttons.

## Acceptance Criteria

- [ ] There exists a setting that toggles VIM editing mode in the MarkdownEditor
- [ ] There exists a setting that defined how many tasks is displayed in the done column, before they are considered archived, and visible in the archive list
- [ ] New tests are added
- [ ] Old and new tests are passing