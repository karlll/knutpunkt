import { useState, useMemo } from 'react'
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      planned: tasks.filter((task) => task.status === 'planned'),
      ongoing: tasks.filter((task) => task.status === 'ongoing'),
      done: tasks.filter((task) => task.status === 'done'),
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

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Only update if status changed
    if (task.status !== newStatus) {
      updateStatusMutation.mutate({ id: taskId, status: newStatus })
    }
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
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-bold">Knutpunkt Kanban</h1>
      </header>
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
