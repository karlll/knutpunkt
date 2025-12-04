---
id: "7447476b-a3a3-477c-b159-c9f08b9a9b1a"
number: 8
title: "Compacting task cards"
createdAt: "2025-12-04T20:08:58.215380Z"
updatedAt: "2025-12-04T20:09:09.550404Z"
assignees: []
categories:
- "frontend"
priority: "medium"
order: 1
---

# Minimize/compact finished tasks

## Overview

The Task Card component should have a minimized version, which should be the default when a task is moved to the "done" column.

## Requirements

- Update `frontend/src/components/kanban/TaskCard.tsx`
- Add a parameter to the component that will enable the minimized mode
- The minimized version of a task should display the title, the edit button, the drag handle and the task number

## Acceptance Criteria

- [ ] Task Card component supports both normal and minimized mode
- [ ] A Task Card that is moved to the "done" column will automatically be displayed as the minimized version
- [ ] Tests are updated
- [ ] Stories are updated