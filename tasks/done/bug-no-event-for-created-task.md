---
id: "faa9b0e6-9a3f-423e-a03f-1f034a5e267a"
number: 22
title: "Bug: No event for created task "
createdAt: "2025-12-05T22:31:38.586116Z"
updatedAt: "2025-12-07T20:24:07.775343Z"
assignees: []
categories:
- "bug"
- "backend"
priority: "high"
order: 5
---

# SSE is missing when a new card is created.

## Overview

An observation is made where a card is created without the expected "creation" SSE being emitted. The log entry:
```
23:26:58.378 [DefaultDispatcher-worker-2] DEBUG c.n.k.services.FileWatchService - File created: /Users/karl/Project/knutpunkt/tasks/planned/fix-invalid-change-event-emitted.md (status: planned)
```

... in the log except below should generated an event. 

```
23:26:57.671 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Creating task: title='Fix: invalid change event emitted', status=planned
23:26:57.712 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.StateService - Allocated task number: 21
23:26:57.713 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task 'Fix: invalid change event emitted': assigned id=6764712f-6107-4f10-b56c-0cbe6be71c36, number=21, slug=fix-invalid-change-event-emitted, order=1
23:26:57.715 [eventLoopGroupProxy-4-3] INFO  c.n.knutpunkt.services.TaskService - Created task: id=6764712f-6107-4f10-b56c-0cbe6be71c36, number=21, title='Fix: invalid change event emitted', status=planned, order=1, file=fix-invalid-change-event-emitted.md
23:26:57.715 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task cache invalidated
23:26:57.740 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task cache built with 11 tasks
23:26:58.378 [DefaultDispatcher-worker-2] DEBUG c.n.k.services.FileWatchService - File created: /Users/karl/Project/knutpunkt/tasks/planned/fix-invalid-change-event-emitted.md (status: planned)
23:26:58.378 [DefaultDispatcher-worker-8] DEBUG c.n.knutpunkt.services.TaskService - Task cache invalidated
23:31:38.583 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Creating task: title='Bug: No event for created task ', status=planned
23:31:38.585 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.StateService - Allocated task number: 22
23:31:38.586 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task 'Bug: No event for created task ': assigned id=faa9b0e6-9a3f-423e-a03f-1f034a5e267a, number=22, slug=bug-no-event-for-created-task, order=1
23:31:38.587 [eventLoopGroupProxy-4-3] INFO  c.n.knutpunkt.services.TaskService - Created task: id=faa9b0e6-9a3f-423e-a03f-1f034a5e267a, number=22, title='Bug: No event for created task ', status=planned, order=1, file=bug-no-event-for-created-task.md
23:31:38.587 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task cache invalidated
23:31:38.606 [eventLoopGroupProxy-4-3] DEBUG c.n.knutpunkt.services.TaskService - Task cache built with 12 tasks
23:31:40.329 [DefaultDispatcher-worker-2] DEBUG c.n.k.services.FileWatchService - File created: /Users/karl/Project/knutpunkt/tasks/planned/bug-no-event-for-created-task.md (status: planned)
23:31:40.332 [DefaultDispatcher-worker-8] DEBUG c.n.knutpunkt.services.EventService - Emitted task event: task.created for task faa9b0e6-9a3f-423e-a03f-1f034a5e267a
```

The task card (#22) that is created after card #21 causes an `task.created` event to be emitted, as expected.

## Acceptance Criteria

- [ ] Creation event is deterministically emitted when a new card is created
- [ ] Tests are updated, if needed