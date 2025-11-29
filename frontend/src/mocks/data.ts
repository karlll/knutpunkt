import type { components } from '../types/api'

type Task = components['schemas']['Task']

// In-memory mock database
export const mockTasks: Task[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Setup project infrastructure',
    description: '## Description\n\nSetup the initial project structure including frontend and backend.\n\n## Acceptance Criteria\n\n- [x] Create OpenAPI specification\n- [x] Initialize frontend with Vite\n- [ ] Initialize backend with Ktor',
    status: 'ongoing',
    priority: 'high',
    assignees: ['alice'],
    categories: ['infrastructure', 'setup'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Implement authentication',
    description: '## Description\n\nImplement JWT-based authentication for the API.\n\n## Acceptance Criteria\n\n- [ ] Create login endpoint\n- [ ] Implement token validation middleware\n- [ ] Add refresh token logic',
    status: 'planned',
    priority: 'high',
    assignees: ['bob'],
    categories: ['feature', 'backend'],
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T09:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Design UI mockups',
    description: '## Description\n\nCreate Figma mockups for the main application views.\n\n## Acceptance Criteria\n\n- [x] Kanban board layout\n- [x] Task detail view\n- [x] User settings page',
    status: 'done',
    priority: 'medium',
    assignees: ['alice', 'charlie'],
    categories: ['design', 'frontend'],
    createdAt: '2025-01-14T08:00:00Z',
    updatedAt: '2025-01-15T17:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Write API documentation',
    description: '## Description\n\nDocument all API endpoints with examples.\n\n## Notes\n\nUse the OpenAPI spec as the source of truth.',
    status: 'planned',
    priority: 'low',
    assignees: [],
    categories: ['documentation'],
    createdAt: '2025-01-17T11:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
  },
]

// Helper functions for CRUD operations
export function getAllTasks(): Task[] {
  return mockTasks
}

export function getTaskById(id: string): Task | undefined {
  return mockTasks.find((task) => task.id === id)
}

export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const newTask: Task = {
    ...taskData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockTasks.push(newTask)
  return newTask
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
  const index = mockTasks.findIndex((task) => task.id === id)
  if (index === -1) return null

  mockTasks[index] = {
    ...mockTasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  return mockTasks[index]
}

export function deleteTask(id: string): boolean {
  const index = mockTasks.findIndex((task) => task.id === id)
  if (index === -1) return false

  mockTasks.splice(index, 1)
  return true
}

export function updateTaskStatus(id: string, status: Task['status']): Task | null {
  return updateTask(id, { status })
}
