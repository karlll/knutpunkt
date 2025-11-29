import { useState, useMemo } from 'react'
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { Header } from '@/components/Header'
import { api, type Task, type TaskStatus } from '@/lib/api'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'planned', title: 'Planned' },
  { status: 'ongoing', title: 'Ongoing' },
  { status: 'done', title: 'Done' },
]

export function KanbanBoard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  // Mutation for updating task status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.tasks.updateStatus(id, status),
    // Optimistically update the cache before the mutation completes
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old
        return old.map((task) =>
          task.id === id ? { ...task, status, updatedAt: new Date().toISOString() } : task
        )
      })

      // Return a context object with the snapshotted value
      return { previousTasks }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Mutation for updating task order (and optionally status)
  const updateTaskOrderMutation = useMutation({
    mutationFn: ({ id, newOrder, newStatus }: { id: string; newOrder: number; newStatus?: TaskStatus }) =>
      api.tasks.updateOrder(id, newOrder, newStatus),
    onMutate: async ({ id, newOrder, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old

        const task = old.find((t) => t.id === id)
        if (!task) return old

        const oldStatus = task.status
        const targetStatus = newStatus || oldStatus
        const sameColumn = oldStatus === targetStatus

        let updated = [...old]

        if (sameColumn) {
          // Reordering within same column
          const oldOrder = task.order

          if (newOrder < oldOrder) {
            // Moving up: increment tasks between newOrder and oldOrder
            updated = updated.map((t) => {
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
            updated = updated.map((t) => {
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
          updated = updated.map((t) => {
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
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const draggedTaskId = active.id as string
    const draggedTask = tasks.find((t) => t.id === draggedTaskId)
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
      const targetTask = tasks.find((t) => t.id === over.id)
      if (!targetTask) return

      targetStatus = targetTask.status
      targetOrder = targetTask.order // Insert at this position (target task shifts down)
    }

    // Check if anything changed
    const statusChanged = draggedTask.status !== targetStatus
    const orderChanged = draggedTask.order !== targetOrder
    const sameColumn = !statusChanged

    if (!statusChanged && !orderChanged) return // No change

    // Update task position (handles both order and status changes)
    updateTaskOrderMutation.mutate({
      id: draggedTaskId,
      newOrder: targetOrder,
      newStatus: statusChanged ? targetStatus : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden p-6">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={tasksByStatus[column.status]}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}
