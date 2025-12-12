import { useEffect, useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export function TaskDialog({ mode, task, open, onOpenChange, readOnly = false }: TaskDialogProps) {
  const queryClient = useQueryClient()
  const [settings] = useSettings()
  const editorRef = useRef<MarkdownEditorRef>(null)

  // Intercept dialog close attempts when editor has focus and is in INSERT mode
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // If dialog is trying to close and editor is in VIM INSERT mode, exit INSERT mode instead
    if (!newOpen && editorRef.current?.hasFocus() && editorRef.current?.isInsertMode()) {
      editorRef.current.handleVimEscape()
      return
    }

    // Otherwise, allow the state change
    onOpenChange(newOpen)
  }, [onOpenChange])

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
      setFormData(getInitialFormData())
      setNewAssignee('')
      setNewCategory('')
    }
  }, [open, mode, task?.id])

  const createTaskMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.tasks.create({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignees: data.assignees,
        categories: data.categories,
        order: 1, // Backend will auto-assign proper order
      }),
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
      onOpenChange(false)
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: string; updates: typeof formData }) =>
      api.tasks.update(data.id, data.updates),
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
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
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
                  onClick={() => onOpenChange(false)}
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
  )
}
