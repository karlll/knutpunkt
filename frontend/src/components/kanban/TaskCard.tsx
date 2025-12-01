import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/api'
import { GripVertical, Pencil } from 'lucide-react'
import { TaskEditDialog } from './TaskEditDialog'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    animateLayoutChanges: () => false, // Disable automatic layout animations
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColor = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{task.number}</span>
                </div>
                <CardTitle className="text-base font-medium line-clamp-2">
                  {task.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditDialogOpen(true)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <button
                  className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
        <CardContent className="space-y-3">
          {/* Description preview */}
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description.split('\n')[0].replace(/^#+\s*/, '')}
            </p>
          )}

          {/* Priority badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={priorityColor[task.priority]}
            >
              {task.priority}
            </Badge>
          </div>

          {/* Categories */}
          {task.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Assignees */}
          {task.assignees.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.assignees.map((assignee) => (
                <div
                  key={assignee}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                  title={assignee}
                >
                  {assignee.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <TaskEditDialog
      task={task}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
    />
    </>
  )
}
