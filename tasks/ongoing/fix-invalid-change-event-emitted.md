---
id: "6764712f-6107-4f10-b56c-0cbe6be71c36"
number: 21
title: "Fix: invalid change event emitted"
createdAt: "2025-12-05T22:26:57.712799Z"
updatedAt: "2025-12-07T20:01:30.703616Z"
assignees: []
categories:
- "bug"
- "backend"
priority: "high"
order: 1
---

# Invalid SSE emitted when moving card between columns

## Overview

When moving a card (corresponding to the file `event-test.md` in the logs below), a file deleted and file created event is detected - as expected. However, instead of a "update" SSE is a "create" SSE emitted. See below log excerpt:

```
23:19:48.388 [DefaultDispatcher-worker-2] DEBUG c.n.k.services.FileWatchService - File deleted: /Users/karl/Project/knutpunkt/tasks/planned/event-test.md (status: planned)
23:19:48.388 [DefaultDispatcher-worker-2] DEBUG c.n.k.services.FileWatchService - File created: /Users/karl/Project/knutpunkt/tasks/ongoing/event-test.md (status: ongoing)
23:19:48.388 [DefaultDispatcher-worker-8] DEBUG c.n.knutpunkt.services.TaskService - Task cache invalidated
23:19:48.389 [DefaultDispatcher-worker-8] DEBUG c.n.knutpunkt.services.EventService - Emitted task event: task.created for task 0be68a73-a769-4b57-af67-07f0449affcd
```

## Acceptance Criteria

- [ ] "move"/"update" detection is more robus
- [ ] tests are updated