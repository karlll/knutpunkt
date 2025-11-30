import { http, HttpResponse } from 'msw'
import type { components } from '../types/api'
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskOrder,
} from './data'

type TaskCreate = components['schemas']['TaskCreate']
type TaskUpdate = components['schemas']['TaskUpdate']
type TaskStatusUpdate = components['schemas']['TaskStatusUpdate']
type TaskOrderUpdate = components['schemas']['TaskOrderUpdate']
type TaskStatus = components['schemas']['TaskStatus']
type TaskPriority = components['schemas']['TaskPriority']

const API_BASE = 'http://localhost:8080/api/v1'

export const handlers = [
  // GET /tasks - List all tasks with optional filtering
  http.get(`${API_BASE}/tasks`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as TaskStatus | null
    const assignee = url.searchParams.get('assignee')
    const category = url.searchParams.get('category')
    const priority = url.searchParams.get('priority') as TaskPriority | null

    let tasks = getAllTasks()

    // Apply filters
    if (status) {
      tasks = tasks.filter((task) => task.status === status)
    }
    if (assignee) {
      tasks = tasks.filter((task) => task.assignees.includes(assignee))
    }
    if (category) {
      tasks = tasks.filter((task) => task.categories.includes(category))
    }
    if (priority) {
      tasks = tasks.filter((task) => task.priority === priority)
    }

    return HttpResponse.json(tasks)
  }),

  // GET /tasks/{id} - Get a specific task
  http.get(`${API_BASE}/tasks/:id`, ({ params }) => {
    const { id } = params
    const task = getTaskById(id as string)

    if (!task) {
      return HttpResponse.json(
        { message: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json(task)
  }),

  // POST /tasks - Create a new task
  http.post(`${API_BASE}/tasks`, async ({ request }) => {
    try {
      const body = (await request.json()) as TaskCreate

      // Validate required fields
      if (!body.title || !body.description) {
        return HttpResponse.json(
          { message: 'Title and description are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      const newTask = createTask({
        title: body.title,
        description: body.description,
        status: body.status || 'planned',
        order: body.order || 1,
        priority: body.priority || 'medium',
        assignees: body.assignees || [],
        categories: body.categories || [],
      })

      return HttpResponse.json(newTask, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Invalid request body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
  }),

  // PUT /tasks/{id} - Update a task
  http.put(`${API_BASE}/tasks/:id`, async ({ params, request }) => {
    const { id } = params

    try {
      const body = (await request.json()) as TaskUpdate

      // Validate required fields
      if (!body.title || !body.description) {
        return HttpResponse.json(
          { message: 'Title and description are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      const updatedTask = updateTask(id as string, body)

      if (!updatedTask) {
        return HttpResponse.json(
          { message: 'Task not found', code: 'TASK_NOT_FOUND' },
          { status: 404 }
        )
      }

      return HttpResponse.json(updatedTask)
    } catch (error) {
      return HttpResponse.json(
        { message: 'Invalid request body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
  }),

  // DELETE /tasks/{id} - Delete a task
  http.delete(`${API_BASE}/tasks/:id`, ({ params }) => {
    const { id } = params
    const deleted = deleteTask(id as string)

    if (!deleted) {
      return HttpResponse.json(
        { message: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      )
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // PATCH /tasks/{id}/status - Update task status
  http.patch(`${API_BASE}/tasks/:id/status`, async ({ params, request }) => {
    const { id } = params

    try {
      const body = (await request.json()) as TaskStatusUpdate

      if (!body.status) {
        return HttpResponse.json(
          { message: 'Status is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      const updatedTask = updateTaskStatus(id as string, body.status)

      if (!updatedTask) {
        return HttpResponse.json(
          { message: 'Task not found', code: 'TASK_NOT_FOUND' },
          { status: 404 }
        )
      }

      return HttpResponse.json(updatedTask)
    } catch (error) {
      return HttpResponse.json(
        { message: 'Invalid request body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
  }),

  // PATCH /tasks/{id}/order - Update task position
  http.patch(`${API_BASE}/tasks/:id/order`, async ({ params, request }) => {
    const { id } = params

    try {
      const body = (await request.json()) as TaskOrderUpdate

      if (!body.newOrder || body.newOrder < 1) {
        return HttpResponse.json(
          { message: 'newOrder is required and must be >= 1', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      const result = updateTaskOrder(id as string, body.newOrder, body.newStatus)

      if (!result) {
        return HttpResponse.json(
          { message: 'Task not found', code: 'TASK_NOT_FOUND' },
          { status: 404 }
        )
      }

      return HttpResponse.json(result)
    } catch (error) {
      return HttpResponse.json(
        { message: 'Invalid request body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
  }),
]
