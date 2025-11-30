import type { Task, TaskStatus } from '@/lib/api'

const STATUSES: TaskStatus[] = ['planned', 'ongoing', 'done']

export interface DragPosition {
  targetStatus: TaskStatus
  targetOrder: number // 1-based order within that column
}

/**
 * Apply the result of dragging a task to a new column/position.
 * Returns a new array with updated tasks if anything changed.
 * Returns the same array reference if nothing changed (for detecting no-op drops).
 *
 * Uses 1-based ordering (order starts at 1, not 0).
 */
export function applyDragResult(
  tasks: Task[],
  activeId: string,
  position: DragPosition | null,
): Task[] {
  if (!position) return tasks

  const activeTask = tasks.find((t) => t.id === activeId)
  if (!activeTask) return tasks

  const { targetStatus, targetOrder } = position
  const sourceStatus = activeTask.status
  const sourceOrder = activeTask.order

  // If dropping into same column + same position => no change
  if (sourceStatus === targetStatus && sourceOrder === targetOrder) {
    return tasks
  }

  // Group tasks by status and sort by order
  const byStatus: Record<TaskStatus, Task[]> = {
    planned: [],
    ongoing: [],
    done: [],
  }

  for (const t of tasks) {
    // Clone each task to avoid mutations
    byStatus[t.status].push({ ...t })
  }

  // Sort each column by order
  for (const status of STATUSES) {
    byStatus[status].sort((a, b) => a.order - b.order)
  }

  const sourceCol = byStatus[sourceStatus]
  const targetCol = sourceStatus === targetStatus ? sourceCol : byStatus[targetStatus]

  // Find the task in the source column
  const sourceIndex = sourceCol.findIndex((t) => t.id === activeId)
  if (sourceIndex === -1) return tasks

  // Remove from source column
  const [movedTask] = sourceCol.splice(sourceIndex, 1)

  // Update task's status if moving to different column
  movedTask.status = targetStatus

  // Insert into target column at the target position (1-based)
  // Clamp to valid range: 1 to (column length + 1)
  const insertIndex = Math.max(0, Math.min(targetOrder - 1, targetCol.length))
  targetCol.splice(insertIndex, 0, movedTask)

  // Re-assign orders 1..N for each column
  for (const status of STATUSES) {
    byStatus[status].forEach((t, i) => {
      t.order = i + 1 // 1-based ordering
    })
  }

  // Flatten back into a single array
  const newTasks = [...byStatus.planned, ...byStatus.ongoing, ...byStatus.done]

  // Detect if anything actually changed by comparing id+status+order
  const changed =
    newTasks.length !== tasks.length ||
    newTasks.some((t) => {
      const old = tasks.find((o) => o.id === t.id)
      return !old || old.status !== t.status || old.order !== t.order
    })

  return changed ? newTasks : tasks
}
