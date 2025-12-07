import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TaskDialog } from './TaskDialog'
import type { Task } from '@/lib/api'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'

interface ArchiveDialogProps {
  tasks: Task[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TASKS_PER_PAGE = 10

export function ArchiveDialog({ tasks, open, onOpenChange }: ArchiveDialogProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewTaskDialogOpen, setViewTaskDialogOpen] = useState(false)

  // Sort tasks by updatedAt DESC (most recent first)
  const sortedTasks = [...tasks].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // Calculate pagination
  const totalPages = Math.ceil(sortedTasks.length / TASKS_PER_PAGE)
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE
  const endIndex = startIndex + TASKS_PER_PAGE
  const currentTasks = sortedTasks.slice(startIndex, endIndex)

  // Reset to first page when dialog opens or tasks change
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentPage(1)
    }
    onOpenChange(newOpen)
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setViewTaskDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent size="2xl" className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Archived Tasks</DialogTitle>
            <DialogDescription>
              Viewing {sortedTasks.length} archived task{sortedTasks.length !== 1 ? 's' : ''} from the done column.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Task #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[140px]">Last Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No archived tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-sm">#{task.number}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <span className="capitalize">{task.status}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(task.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View task</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({sortedTasks.length} total tasks)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Task Dialog (Read-Only) */}
      {selectedTask && (
        <TaskDialog
          mode="edit"
          task={selectedTask}
          open={viewTaskDialogOpen}
          onOpenChange={setViewTaskDialogOpen}
          readOnly={true}
        />
      )}
    </>
  )
}
