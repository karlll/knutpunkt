import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskDialog } from './TaskDialog'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const meta = {
  title: 'Kanban/TaskDialog',
  component: TaskDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof TaskDialog>

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper components
function InteractiveCreateDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Create Task</Button>
      <TaskDialog mode="create" open={open} onOpenChange={setOpen} />
    </div>
  )
}

function InteractiveEditDialog({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>Edit Task</Button>
      <TaskDialog mode="edit" task={task} open={open} onOpenChange={setOpen} />
    </div>
  )
}

const baseTask: Task = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  number: 42,
  title: 'Setup project infrastructure',
  description: `## Description

Setup the initial project structure including frontend and backend.

This task involves creating the basic architecture and tooling needed for the project.

## Acceptance Criteria

- [x] Create OpenAPI specification
- [x] Initialize frontend with Vite
- [ ] Initialize backend with Ktor
- [ ] Setup CI/CD pipeline

## Notes

Consider using Docker for development environment consistency.`,
  status: 'ongoing',
  order: 1,
  priority: 'high',
  assignees: ['alice', 'bob'],
  categories: ['infrastructure', 'setup'],
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T14:30:00Z',
}

// Create mode stories
export const CreateMode: Story = {
  args: {} as any,
  render: () => <InteractiveCreateDialog />,
}

export const CreateModeOpen: Story = {
  args: {
    mode: 'create',
    open: true,
    onOpenChange: () => {},
  },
}

// Edit mode stories
export const EditMode: Story = {
  args: {} as any,
  render: () => <InteractiveEditDialog task={baseTask} />,
}

export const EditPlannedTask: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440002',
        number: 43,
        title: 'Implement authentication',
        description: `## Description

Implement JWT-based authentication for the API.

## Tasks

- [ ] Create login endpoint
- [ ] Implement token validation middleware
- [ ] Add refresh token logic`,
        status: 'planned',
        priority: 'high',
        assignees: ['charlie'],
        categories: ['feature', 'backend', 'security'],
      }}
    />
  ),
}

export const EditDoneTask: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440003',
        number: 44,
        title: 'Design UI mockups',
        description: `## Description

Create Figma mockups for the main application views.

## Deliverables

- [x] Kanban board layout
- [x] Task detail view
- [x] User settings page

All mockups have been reviewed and approved by the team.`,
        status: 'done',
        priority: 'medium',
        assignees: ['alice', 'david'],
        categories: ['design', 'frontend'],
      }}
    />
  ),
}

export const EditLowPriorityTask: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440004',
        number: 45,
        title: 'Write documentation',
        description: 'Document all API endpoints with examples.',
        status: 'planned',
        priority: 'low',
        assignees: [],
        categories: ['documentation'],
      }}
    />
  ),
}

export const EditMinimalTask: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440005',
        number: 46,
        title: 'Quick bug fix',
        description: 'Fix typo in error message',
        status: 'planned',
        priority: 'low',
        assignees: [],
        categories: [],
      }}
    />
  ),
}

export const EditMultipleAssignees: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440006',
        number: 47,
        title: 'Team brainstorming session',
        description: `## Agenda

1. Discuss project roadmap
2. Review sprint goals
3. Plan next quarter

All team members should attend.`,
        status: 'ongoing',
        priority: 'medium',
        assignees: ['alice', 'bob', 'charlie', 'david', 'eve'],
        categories: ['planning', 'team'],
      }}
    />
  ),
}

export const EditManyCategories: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440007',
        number: 48,
        title: 'Refactor codebase',
        description: `## Overview

Major refactoring effort to improve code quality and maintainability.

## Areas to refactor

- Authentication module
- Database layer
- API routes
- Frontend components
- Test suite`,
        status: 'ongoing',
        priority: 'high',
        categories: [
          'refactor',
          'backend',
          'frontend',
          'testing',
          'performance',
          'code-quality',
          'technical-debt',
        ],
      }}
    />
  ),
}

export const EditLongDescription: Story = {
  args: {} as any,
  render: () => (
    <InteractiveEditDialog
      task={{
        ...baseTask,
        id: '550e8400-e29b-41d4-a716-446655440008',
        number: 49,
        title: 'Implement comprehensive error handling',
        description: `## Description

Implement a comprehensive error handling strategy across the entire application to improve user experience and debugging capabilities.

## Background

Currently, the application lacks consistent error handling, which leads to:
- Poor user experience when errors occur
- Difficulty in debugging production issues
- Inconsistent error messages across the application

## Requirements

### Frontend Error Handling

1. **Global Error Boundary**
   - Implement a React Error Boundary at the app root
   - Display user-friendly error messages
   - Log errors to monitoring service
   - Provide recovery options where possible

2. **API Error Handling**
   - Standardize error response format
   - Map HTTP status codes to user messages
   - Implement retry logic for transient failures
   - Show appropriate loading/error states

3. **Form Validation**
   - Client-side validation before submission
   - Display field-level error messages
   - Highlight invalid fields
   - Provide helpful error messages

### Backend Error Handling

1. **Exception Middleware**
   - Catch all unhandled exceptions
   - Log with appropriate context
   - Return standardized error responses
   - Don't expose sensitive information

2. **Error Types**
   - ValidationError (400)
   - AuthenticationError (401)
   - AuthorizationError (403)
   - NotFoundError (404)
   - ConflictError (409)
   - InternalServerError (500)

3. **Logging**
   - Structured logging format
   - Include request context
   - Log stack traces for debugging
   - Send critical errors to alerting system

## Acceptance Criteria

- [ ] All API endpoints return consistent error format
- [ ] Frontend displays user-friendly error messages
- [ ] Error Boundary catches and handles React errors
- [ ] All form validations show clear messages
- [ ] Errors are logged with proper context
- [ ] Critical errors trigger alerts
- [ ] Documentation updated with error handling guide

## Testing

- Unit tests for error handling logic
- Integration tests for error scenarios
- Manual testing of error states
- Test error monitoring integration

## Timeline

Estimated effort: 2 weeks
Priority: High`,
        status: 'planned',
        priority: 'high',
        assignees: ['alice', 'bob'],
        categories: ['error-handling', 'infrastructure', 'frontend', 'backend'],
      }}
    />
  ),
}

export const EditModeOpen: Story = {
  args: {
    mode: 'edit',
    task: baseTask,
    open: true,
    onOpenChange: () => {},
  },
}
