import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTaskEvents } from '@/contexts/TaskEventsContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor, type MarkdownEditorRef } from '@/components/ui/markdown-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, X } from 'lucide-react'
import { api, type Task, type TaskStatus, type TaskPriority } from '@/lib/api'
import { useSettings } from '@/hooks/useSettings'

interface TaskDialogProps {
  mode: 'create' | 'edit'
  task?: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
}

const DEFAULT_FORM_DATA = {
  title: 'New Task',
  description: `# [Short descriptive title]

## Overview

[A brief overview]

## Requirements

- [requirement 1]
- [requirement 2]

## Acceptance Criteria

- [ ] [criteria 1]
- [ ] [criteria 2]`,
  status: 'planned' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assignees: [] as string[],
  categories: [] as string[],
}

// Helper function to compare arrays
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, index) => val === sortedB[index])
}

export function TaskDialog({ mode, task, open, onOpenChange, readOnly = false }: TaskDialogProps) {
  const queryClient = useQueryClient()
  const [settings] = useSettings()
  const editorRef = useRef<MarkdownEditorRef>(null)
  const { trackMutation } = useTaskEvents()

  // Store initial form data for unsaved changes detection
  const initialFormDataRef = useRef(DEFAULT_FORM_DATA)

  // State for confirmation dialog
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  // Initialize form data based on mode
  const getInitialFormData = () => {
    if (mode === 'edit' && task) {
      return {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignees: task.assignees,
        categories: task.categories,
      }
    }
    return { ...DEFAULT_FORM_DATA }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [newAssignee, setNewAssignee] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [isMetadataOpen, setIsMetadataOpen] = useState(false)

  // Reset form data when dialog opens or mode/task changes
  useEffect(() => {
    if (open) {
      const initial = getInitialFormData()
      setFormData(initial)
      initialFormDataRef.current = initial
      setNewAssignee('')
      setNewCategory('')
      setShowConfirmClose(false)
    }
  }, [open, mode, task?.id])

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (readOnly) return false

    const initial = initialFormDataRef.current
    const current = formData

    return (
      initial.title !== current.title ||
      initial.description !== current.description ||
      initial.status !== current.status ||
      initial.priority !== current.priority ||
      !arraysEqual(initial.assignees, current.assignees) ||
      !arraysEqual(initial.categories, current.categories)
    )
  }, [formData, readOnly])

  // Handle close attempt (for Cancel button)
  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true)
    } else {
      onOpenChange(false)
    }
  }, [hasUnsavedChanges, onOpenChange])

  // Confirm close (discard changes)
  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false)
    onOpenChange(false)
  }, [onOpenChange])

  // Intercept Dialog's onOpenChange to check for unsaved changes
  const handleDialogOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges && !readOnly) {
      // User is trying to close the dialog with unsaved changes
      setShowConfirmClose(true)
    } else {
      // No unsaved changes, or opening the dialog, or read-only mode
      onOpenChange(newOpen)
    }
  }, [hasUnsavedChanges, readOnly, onOpenChange])

  // VIM Escape handling: use onEscapeKeyDown to intercept before Dialog closes
  const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
    if (editorRef.current?.isInVimEditMode()) {
      // In any VIM edit mode: prevent Dialog from closing and exit to NORMAL
      event.preventDefault()
      event.stopPropagation() // Stop event since we're handling VIM manually
      editorRef.current.exitVimEditMode() // Exit any VIM mode back to NORMAL
    } else if (hasUnsavedChanges) {
      // If not in VIM edit mode but has unsaved changes, show confirmation
      event.preventDefault()
      setShowConfirmClose(true)
    }
    // If no VIM edit mode and no unsaved changes, Dialog will close normally
  }, [hasUnsavedChanges])

  const createTaskMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const clientMutationId = crypto.randomUUID()
      trackMutation(clientMutationId)
      return api.tasks.create({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignees: data.assignees,
        categories: data.categories,
        order: 1, // Backend will auto-assign proper order
      }, clientMutationId)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false) // Call parent's onOpenChange directly to bypass unsaved changes check
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: string; updates: typeof formData }) => {
      const clientMutationId = crypto.randomUUID()
      trackMutation(clientMutationId)
      return api.tasks.update(data.id, data.updates, clientMutationId)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false) // Call parent's onOpenChange directly to bypass unsaved changes check
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create') {
      createTaskMutation.mutate(formData)
    } else if (task) {
      updateTaskMutation.mutate({
        id: task.id,
        updates: formData,
      })
    }
  }

  const addAssignee = () => {
    if (newAssignee.trim() && !formData.assignees.includes(newAssignee.trim())) {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, newAssignee.trim()],
      })
      setNewAssignee('')
    }
  }

  const removeAssignee = (assignee: string) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.filter((a) => a !== assignee),
    })
  }

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory.trim()],
      })
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== category),
    })
  }

  const isPending = mode === 'create' ? createTaskMutation.isPending : updateTaskMutation.isPending
  const dialogTitle = readOnly ? 'View Task' : (mode === 'create' ? 'Create New Task' : 'Edit Task')
  const dialogDescription = readOnly
    ? 'Viewing task details.'
    : (mode === 'create'
      ? 'Fill in the details for your new task.'
      : 'Make changes to the task details below.')
  const submitButtonText = mode === 'create' ? 'Create Task' : 'Save Changes'
  const pendingButtonText = mode === 'create' ? 'Creating...' : 'Saving...'

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={readOnly}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MarkdownEditor
              ref={editorRef}
              id="description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              vimMode={settings.vimMode}
              readOnly={readOnly}
            />
          </div>

          {/* Collapsible Metadata Section */}
          <Collapsible open={isMetadataOpen} onOpenChange={setIsMetadataOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center justify-between p-2 hover:bg-accent"
              >
                <span className="text-sm font-medium">
                  Task Details (Status, Priority, Assignees, Categories)
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMetadataOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, status: value as TaskStatus })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, priority: value as TaskPriority })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add assignee..."
                  value={newAssignee}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignee(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAssignee()
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addAssignee}>
                  Add
                </Button>
              </div>
            )}
            {formData.assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignees.map((assignee) => (
                  <Badge key={assignee} variant="secondary" className="gap-1">
                    {assignee}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeAssignee(assignee)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add category..."
                  value={newCategory}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCategory()
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCategory}>
                  Add
                </Button>
              </div>
            )}
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categories.map((category) => (
                  <Badge key={category} variant="outline" className="gap-1">
                    {category}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            {readOnly ? (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAttempt}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? pendingButtonText : submitButtonText}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Confirmation dialog for unsaved changes */}
    <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            There's unsaved changes. Close anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose}>
            Close Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
