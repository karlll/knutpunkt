import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/lib/api'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  title: string
}

const statusColors = {
  planned: 'bg-slate-100 border-slate-200',
  ongoing: 'bg-blue-100 border-blue-200',
  done: 'bg-green-100 border-green-200',
}

export function KanbanColumn({ status, tasks, title }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      <Card className={cn('flex flex-col h-full', statusColors[status])}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>{title}</span>
            <span className="text-muted-foreground">({tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div
            ref={setNodeRef}
            className={cn(
              'space-y-3 overflow-y-auto h-full p-1 rounded-md transition-colors',
              isOver && 'bg-primary/10'
            )}
          >
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} compact={status === 'done'} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No tasks
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
