import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskDialog } from './TaskDialog'
import { api, type Task, type TaskStatus } from '@/lib/api'
import { applyDragResult, type DragPosition } from './dndLogic'
import { useSettings } from '@/hooks/useSettings'
import { useTaskEvents } from '@/contexts/TaskEventsContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { WorkflowViewerPane } from '@/components/workflow/WorkflowViewerPane'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'planned', title: 'Planned' },
  { status: 'ongoing', title: 'Ongoing' },
  { status: 'done', title: 'Done' },
]

// Disable drop animation to prevent visual glitch where card slides back to original position
const dropAnimationConfig: DropAnimation = {
  duration: 0,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0',
      },
    },
  }),
}

/**
 * Extract the drag position from a dnd-kit event.
 * Returns null if the drop target is invalid.
 */
function getPositionFromEvent(
  tasks: Task[],
  event: DragOverEvent | DragEndEvent,
): DragPosition | null {
  const { over } = event
  if (!over) return null

  const validStatuses: TaskStatus[] = ['planned', 'ongoing', 'done']
  const overId = String(over.id)

  // Check if hovering/dropping over a column (empty space)
  if (validStatuses.includes(overId as TaskStatus)) {
    const status = overId as TaskStatus
    // Count tasks in this column to determine end position
    const tasksInColumn = tasks.filter((t) => t.status === status)
    return {
      targetStatus: status,
      targetOrder: tasksInColumn.length + 1, // Append at end (1-based)
    }
  }

  // Hovering/dropping over another task
  const targetTask = tasks.find((t) => t.id === overId)
  if (!targetTask) return null

  return {
    targetStatus: targetTask.status,
    targetOrder: targetTask.order,
  }
}

interface KanbanBoardProps {
  createDialogOpen?: boolean
  onCreateDialogChange?: (open: boolean) => void
}

export function KanbanBoard({ createDialogOpen = false, onCreateDialogChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [originalTask, setOriginalTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()
  const [settings] = useSettings()

  // Access trackMutation for deduplication
  const { trackMutation } = useTaskEvents()

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      n: () => onCreateDialogChange?.(true),
    },
    { enabled: !createDialogOpen }
  )

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  // Mutation for updating task order (and optionally status)
  // Note: Optimistic updates are handled in handleDragEnd, not here
  const updateTaskOrderMutation = useMutation({
    mutationFn: ({
      id,
      newOrder,
      newStatus,
      clientMutationId
    }: {
      id: string
      newOrder: number
      newStatus?: TaskStatus
      clientMutationId: string
    }) => {
      // Track this mutation to skip the SSE event when it arrives
      trackMutation(clientMutationId)
      return api.tasks.updateOrder(id, newOrder, newStatus, clientMutationId)
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      // Snapshot previous state for rollback on error
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Refetch to sync with backend
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Group tasks by status and sort by order
  const tasksByStatus = useMemo(() => {
    return {
      planned: tasks
        .filter((task) => task.status === 'planned')
        .sort((a, b) => a.order - b.order),
      ongoing: tasks
        .filter((task) => task.status === 'ongoing')
        .sort((a, b) => a.order - b.order),
      done: tasks
        .filter((task) => task.status === 'done')
        .sort((a, b) => a.order - b.order),
    }
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
      // Store the original task state before any drag operations
      setOriginalTask({ ...task })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Get current cache state (which may have been updated by previous onDragOver calls)
    const currentTasks = queryClient.getQueryData<Task[]>(['tasks']) ?? tasks

    // Calculate the position from the event
    const position = getPositionFromEvent(currentTasks, event)
    if (!position) return

    // Apply the drag result to get preview
    const activeId = String(event.active.id)
    const previewTasks = applyDragResult(currentTasks, activeId, position)

    // Only update cache if something changed
    if (previewTasks !== currentTasks) {
      queryClient.setQueryData(['tasks'], previewTasks)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Get current cache state
    const currentTasks = queryClient.getQueryData<Task[]>(['tasks']) ?? tasks

    // Calculate the final position from the event
    const position = getPositionFromEvent(currentTasks, event)
    const activeId = String(event.active.id)

    // Apply the drag result to get the final order
    const newTasks = applyDragResult(currentTasks, activeId, position)

    // Find the task's new position and status
    const movedTask = newTasks.find((t) => t.id === activeId)

    // Clear active task state
    setActiveTask(null)

    // Check if the task actually moved by comparing with original state
    if (!originalTask || !movedTask) {
      setOriginalTask(null)
      return
    }

    const taskMoved =
      originalTask.status !== movedTask.status ||
      originalTask.order !== movedTask.order

    // Clear original task
    setOriginalTask(null)

    // If nothing changed, no need to persist
    if (!taskMoved) {
      return
    }

    // Apply optimistic update
    queryClient.setQueryData(['tasks'], newTasks)

    // Generate clientMutationId for deduplication
    const clientMutationId = crypto.randomUUID()

    // Persist to backend
    updateTaskOrderMutation.mutate({
      id: activeId,
      newOrder: movedTask.order,
      newStatus: movedTask.status,
      clientMutationId,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-lg text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden p-6">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full overflow-x-auto pb-4">
            {/* Kanban columns */}
            <div className="flex gap-6 flex-shrink-0">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.status}
                  status={column.status}
                  title={column.title}
                  tasks={tasksByStatus[column.status]}
                  maxVisibleTasks={column.status === 'done' ? settings.maxDoneTasksVisible : undefined}
                />
              ))}
            </div>

            {/* Workflow Viewer Pane */}
            <div className="flex-1 min-w-[400px]">
              <WorkflowViewerPane />
            </div>
          </div>
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Create task dialog */}
      <TaskDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={onCreateDialogChange || (() => {})}
      />
    </div>
  )
}
