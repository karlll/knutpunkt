---
id: "7f773944-1e89-4137-abcc-6070b3f33209"
number: 17
title: "Update Kanban board on SSE "
createdAt: "2025-12-05T21:33:44.776318Z"
updatedAt: "2025-12-15T19:23:02.507304Z"
assignees:
- "Claude Code"
categories:
- "frontend"
priority: "medium"
order: 1
---

# Fetch tasks and update the board on receiving SSE

## Overview

The backend will emit SSE's on updates made to the tasks. This is to inform interested clients that the content has changed and they need to reload or otherwise refresh their view of the Kanban board. The frontend should be updated to do just that.

## Requirements

- When receiving an SSE, the kanban board should be updated
  - fetch the tasks
  - update the columns in the kanban board
- When the frontend is the "source" or "cause" of the SSE due to it creating or updating a card and invoking an API, care should be taken to not redraw or fetch the tasks in this scenario, since the updates should already be made locally

## Acceptance Criteria

- [ ] Kanban board content is refreshed when a task is updated by another client (or updated manually)
- [ ] New tests are created
- [ ] Old and new test are executed and are passing