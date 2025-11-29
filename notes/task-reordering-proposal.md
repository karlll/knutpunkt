# Task Reordering Within Columns - Analysis & Proposal

## Current State Analysis

### Data Model
**Current `priority` field:**
- Type: `"low" | "medium" | "high"`
- Purpose: Urgency/importance indicator
- Display: Colored badge (red/yellow/green)
- **NOT used for ordering**

**Missing:**
- No `order` or `position` field for sorting tasks within columns
- Tasks currently don't persist their position

### Drag & Drop Implementation
**Current behavior:**
```typescript
// KanbanColumn.tsx
<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
  {tasks.map((task) => (
    <TaskCard key={task.id} task={task} />
  ))}
</SortableContext>
```

**Why tasks "slide back":**
1. `@dnd-kit` allows visual reordering via `SortableContext`
2. BUT there's no `onDragEnd` handler for same-column reordering
3. When React Query refetches, tasks return to original order (no `order` field to sort by)

### Current `handleDragEnd` Logic
```typescript
handleDragEnd(event: DragEndEvent) {
  // Only handles column changes (status updates)
  // Does NOT handle position changes within same column
  if (task.status !== newStatus) {
    updateStatusMutation.mutate({ id, status: newStatus })
  }
}
```

---

## Proposed Solution

### 1. Data Model Changes

#### Add `order` field to Task

**OpenAPI Schema (`api/openapi.yaml`):**
```yaml
Task:
  properties:
    # ... existing fields
    order:
      type: integer
      description: |
        Position of task within its column (1-based).
        Lower numbers appear first. 1 = highest priority position.
      minimum: 1
      example: 1
```

**YAML Front Matter (file storage):**
```yaml
---
id: "uuid"
title: "Task title"
status: "ongoing"
order: 2  # NEW FIELD
priority: "high"  # Keep existing (urgency indicator)
# ... other fields
---
```

**Clarification:**
- `order` (integer): Position within column (1 = top)
- `priority` (low/medium/high): Urgency/importance (visual indicator)

---

### 2. API Changes

#### Option A: New PATCH endpoint (Recommended)
```yaml
/tasks/{id}/order:
  patch:
    summary: Update task position
    description: |
      Update a task's position within its column, or move it to another column
      at a specific position. Automatically adjusts order of affected tasks.
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required:
              - newOrder
            properties:
              newOrder:
                type: integer
                minimum: 1
                description: Target position (1-based)
              newStatus:
                $ref: '#/components/schemas/TaskStatus'
                description: Target column (if moving between columns)
    responses:
      '200':
        description: Task positions updated
        content:
          application/json:
            schema:
              type: object
              properties:
                updated:
                  type: array
                  items:
                    $ref: '#/components/schemas/Task'
                  description: All tasks whose order was changed
```

#### Option B: Extend existing status endpoint
```yaml
/tasks/{id}/status:
  patch:
    requestBody:
      properties:
        status:
          $ref: '#/components/schemas/TaskStatus'
        order:
          type: integer
          minimum: 1
          description: Position within the column (optional)
```

**Recommendation:** Option A is cleaner separation of concerns.

---

### 3. Frontend Changes

#### A. Update `handleDragEnd` in KanbanBoard

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  setActiveTask(null)

  if (!over) return

  const draggedTaskId = active.id as string
  const draggedTask = tasks.find(t => t.id === draggedTaskId)
  if (!draggedTask) return

  // Determine target column and position
  let targetStatus: TaskStatus
  let targetOrder: number

  const validStatuses: TaskStatus[] = ['planned', 'ongoing', 'done']

  if (validStatuses.includes(over.id as TaskStatus)) {
    // Dropped in empty column space
    targetStatus = over.id as TaskStatus
    targetOrder = tasksByStatus[targetStatus].length + 1 // End of list
  } else {
    // Dropped over another task
    const targetTask = tasks.find(t => t.id === over.id)
    if (!targetTask) return

    targetStatus = targetTask.status

    // Calculate insertion position
    const columnTasks = tasksByStatus[targetStatus]
    const targetIndex = columnTasks.findIndex(t => t.id === targetTask.id)
    targetOrder = targetTask.order // Insert at this position (task shifts down)
  }

  // Check if anything changed
  const statusChanged = draggedTask.status !== targetStatus
  const orderChanged = draggedTask.order !== targetOrder
  const sameColumn = !statusChanged

  if (!statusChanged && !orderChanged) return // No change

  // Update task position
  updateTaskOrderMutation.mutate({
    id: draggedTaskId,
    newOrder: targetOrder,
    newStatus: statusChanged ? targetStatus : undefined,
  })
}
```

#### B. Add React Query Mutation

```typescript
const updateTaskOrderMutation = useMutation({
  mutationFn: ({
    id,
    newOrder,
    newStatus
  }: {
    id: string
    newOrder: number
    newStatus?: TaskStatus
  }) => api.tasks.updateOrder(id, newOrder, newStatus),

  onMutate: async ({ id, newOrder, newStatus }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] })
    const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

    queryClient.setQueryData<Task[]>(['tasks'], (old) => {
      if (!old) return old

      const task = old.find(t => t.id === id)
      if (!task) return old

      const oldStatus = task.status
      const targetStatus = newStatus || oldStatus
      const sameColumn = oldStatus === targetStatus

      let updated = [...old]

      if (sameColumn) {
        // Reordering within same column
        const columnTasks = updated
          .filter(t => t.status === targetStatus)
          .sort((a, b) => a.order - b.order)

        const oldOrder = task.order

        if (newOrder < oldOrder) {
          // Moving up: increment tasks between newOrder and oldOrder
          updated = updated.map(t => {
            if (t.status === targetStatus && t.order >= newOrder && t.order < oldOrder) {
              return { ...t, order: t.order + 1 }
            }
            if (t.id === id) {
              return { ...t, order: newOrder }
            }
            return t
          })
        } else if (newOrder > oldOrder) {
          // Moving down: decrement tasks between oldOrder and newOrder
          updated = updated.map(t => {
            if (t.status === targetStatus && t.order > oldOrder && t.order <= newOrder) {
              return { ...t, order: t.order - 1 }
            }
            if (t.id === id) {
              return { ...t, order: newOrder }
            }
            return t
          })
        }
      } else {
        // Moving to different column
        updated = updated.map(t => {
          // Decrement orders in old column (tasks below moved item)
          if (t.status === oldStatus && t.order > task.order) {
            return { ...t, order: t.order - 1 }
          }
          // Increment orders in new column (tasks at/below insertion point)
          if (t.status === targetStatus && t.order >= newOrder) {
            return { ...t, order: t.order + 1 }
          }
          // Update moved task
          if (t.id === id) {
            return { ...t, status: targetStatus, order: newOrder }
          }
          return t
        })
      }

      return updated
    })

    return { previousTasks }
  },

  onError: (_err, _variables, context) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(['tasks'], context.previousTasks)
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

#### C. Sort Tasks by Order

```typescript
// In KanbanBoard, when grouping tasks
const tasksByStatus = useMemo(() => {
  return {
    planned: tasks
      .filter((task) => task.status === 'planned')
      .sort((a, b) => a.order - b.order), // Sort by order!
    ongoing: tasks
      .filter((task) => task.status === 'ongoing')
      .sort((a, b) => a.order - b.order),
    done: tasks
      .filter((task) => task.status === 'done')
      .sort((a, b) => a.order - b.order),
  }
}, [tasks])
```

---

### 4. Backend Changes (Mock Data for now)

#### Update Mock Data (`mocks/data.ts`)

```typescript
export const mockTasks: Task[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Setup project infrastructure',
    status: 'ongoing',
    order: 1, // NEW: First in ongoing column
    priority: 'high',
    // ... rest
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Implement authentication',
    status: 'planned',
    order: 1, // NEW: First in planned column
    priority: 'high',
    // ... rest
  },
  // ...
]
```

#### Add `updateTaskOrder` Handler

```typescript
// mocks/handlers.ts
http.patch(`${API_BASE}/tasks/:id/order`, async ({ params, request }) => {
  const { id } = params
  const body = await request.json()
  const { newOrder, newStatus } = body

  const task = getTaskById(id)
  if (!task) {
    return HttpResponse.json(
      { message: 'Task not found', code: 'TASK_NOT_FOUND' },
      { status: 404 }
    )
  }

  const oldStatus = task.status
  const targetStatus = newStatus || oldStatus
  const sameColumn = oldStatus === targetStatus

  if (sameColumn) {
    // Reorder within same column
    const oldOrder = task.order

    mockTasks.forEach(t => {
      if (t.status === targetStatus) {
        if (newOrder < oldOrder) {
          // Moving up: shift tasks down
          if (t.order >= newOrder && t.order < oldOrder) {
            t.order++
          }
        } else if (newOrder > oldOrder) {
          // Moving down: shift tasks up
          if (t.order > oldOrder && t.order <= newOrder) {
            t.order--
          }
        }
      }
    })

    task.order = newOrder
  } else {
    // Move to different column
    // Decrement orders in old column
    mockTasks.forEach(t => {
      if (t.status === oldStatus && t.order > task.order) {
        t.order--
      }
    })

    // Increment orders in new column
    mockTasks.forEach(t => {
      if (t.status === targetStatus && t.order >= newOrder) {
        t.order++
      }
    })

    task.status = targetStatus
    task.order = newOrder
  }

  task.updatedAt = new Date().toISOString()

  // Return all updated tasks
  const updatedTasks = mockTasks.filter(t =>
    t.status === oldStatus || t.status === targetStatus
  )

  return HttpResponse.json({ updated: updatedTasks })
})
```

---

## Implementation Steps

### Phase 1: Data Model
1. ✅ Update OpenAPI spec with `order` field
2. ✅ Generate TypeScript types
3. ✅ Update mock data with initial orders
4. ✅ Update CLAUDE.md file format documentation

### Phase 2: API
1. ✅ Add `/tasks/{id}/order` endpoint to OpenAPI
2. ✅ Implement mock handler for order updates
3. ✅ Add `api.tasks.updateOrder()` method

### Phase 3: Frontend
1. ✅ Update `handleDragEnd` to detect position changes
2. ✅ Add `updateTaskOrderMutation`
3. ✅ Sort tasks by `order` in `tasksByStatus`
4. ✅ Test reordering within columns
5. ✅ Test moving between columns with position

### Phase 4: Backend (Future)
- Implement Kotlin backend endpoint
- Update file storage to persist `order` field
- Handle order recalculation on file reads

---

## Key Design Decisions

### 1. 1-based vs 0-based indexing
**Decision:** 1-based
- Reason: More intuitive ("task 1" = first task)
- No task has order 0

### 2. Sparse vs Dense ordering
**Decision:** Dense (1, 2, 3, ...)
- Recalculate on every move
- Simpler to reason about
- Alternative: Sparse (100, 200, 300) allows insertions without recalc

### 3. Single endpoint vs extend status endpoint
**Decision:** New `/tasks/{id}/order` endpoint
- Clearer semantics
- Can update multiple tasks atomically
- Separation of concerns

### 4. Optimistic updates
**Decision:** Yes, with full recalculation
- Update all affected tasks immediately
- Rollback on error
- Refetch to sync with server

---

## Testing Strategy

1. **Unit Tests:**
   - Order calculation logic
   - Same-column reordering (up/down)
   - Cross-column moves
   - Edge cases (empty columns, single task)

2. **Integration Tests:**
   - Drag task within column
   - Drag task to different column
   - Multiple rapid reorders
   - Verify API calls

3. **Manual Testing:**
   - Test all scenarios in browser
   - Verify with DevTools closed/open
   - Check network requests

---

## Open Questions

1. **What happens to order when task is moved via API (not drag)?**
   - Default to end of column?
   - Require order in update request?

2. **Should backend enforce order uniqueness?**
   - Or recalculate on read if duplicates found?

3. **How to handle conflicts if two users reorder simultaneously?**
   - Last write wins?
   - Operational transformation?

4. **Should we show visual order numbers in UI?**
   - Helpful for debugging
   - Could add to task card

---

## Summary

**Current issue:** Tasks snap back because no `order` field exists.

**Solution:** Add `order` field + detect position changes in `handleDragEnd`.

**Impact:**
- API: Add 1 endpoint
- Frontend: Update 3 functions
- Backend: File format change (add `order:` to YAML)

**Effort:** ~1-2 days for full implementation + testing
