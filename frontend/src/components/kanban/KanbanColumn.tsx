import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'
import { ArchiveDialog } from './ArchiveDialog'
import type { Task, TaskStatus } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Archive } from 'lucide-react'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  title: string
  maxVisibleTasks?: number
}

const statusColors = {
  planned: 'bg-slate-100 border-slate-200 dark:bg-gray-800/40 dark:border-gray-700',
  ongoing: 'bg-blue-100 border-blue-200 dark:bg-slate-800 dark:border-slate-700',
  done: 'bg-green-100 border-green-200 dark:bg-zinc-800 dark:border-zinc-700',
}

export function KanbanColumn({ status, tasks, title, maxVisibleTasks }: KanbanColumnProps) {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  // Limit visible tasks if maxVisibleTasks is set
  const visibleTasks = maxVisibleTasks ? tasks.slice(0, maxVisibleTasks) : tasks
  const archivedTasks = maxVisibleTasks && tasks.length > maxVisibleTasks
    ? tasks.slice(maxVisibleTasks)
    : []
  const hasArchivedTasks = archivedTasks.length > 0

  const taskIds = visibleTasks.map((task) => task.id)

  return (
    <>
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      <Card className={cn('flex flex-col h-full', statusColors[status])}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>{title}</span>
            <span className="text-muted-foreground">({tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div
            ref={setNodeRef}
            className={cn(
              'space-y-3 overflow-y-auto flex-1 p-1 rounded-md transition-colors',
              isOver && 'bg-primary/10'
            )}
          >
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {visibleTasks.map((task) => (
                <TaskCard key={task.id} task={task} compact={status === 'done'} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No tasks
              </div>
            )}
          </div>

          {/* Archive button */}
          {hasArchivedTasks && (
            <div className="pt-3 border-t mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setArchiveDialogOpen(true)}
              >
                <Archive className="h-4 w-4 mr-2" />
                View {archivedTasks.length} archived task{archivedTasks.length !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Archive Dialog */}
    <ArchiveDialog
      tasks={archivedTasks}
      open={archiveDialogOpen}
      onOpenChange={setArchiveDialogOpen}
    />
    </>
  )
}
