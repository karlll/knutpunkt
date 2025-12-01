import { describe, it, expect, beforeEach } from 'vitest'
import { updateTaskOrder, mockTasks } from './data'

describe('updateTaskOrder', () => {
  // Reset mock data before each test
  beforeEach(() => {
    // Clear the array and add fresh test data
    mockTasks.splice(0, mockTasks.length)
    mockTasks.push(
      {
        id: 'task-1',
        number: 1,
        title: 'Task 1',
        description: 'Description 1',
        status: 'planned',
        order: 1,
        priority: 'medium',
        assignees: [],
        categories: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'task-2',
        number: 2,
        title: 'Task 2',
        description: 'Description 2',
        status: 'planned',
        order: 2,
        priority: 'medium',
        assignees: [],
        categories: [],
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
      {
        id: 'task-3',
        number: 3,
        title: 'Task 3',
        description: 'Description 3',
        status: 'planned',
        order: 3,
        priority: 'medium',
        assignees: [],
        categories: [],
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      },
      {
        id: 'task-4',
        number: 4,
        title: 'Task 4',
        description: 'Description 4',
        status: 'ongoing',
        order: 1,
        priority: 'medium',
        assignees: [],
        categories: [],
        createdAt: '2025-01-04T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      },
      {
        id: 'task-5',
        number: 5,
        title: 'Task 5',
        description: 'Description 5',
        status: 'ongoing',
        order: 2,
        priority: 'medium',
        assignees: [],
        categories: [],
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      }
    )
  })

  describe('within same column', () => {
    it('should move task up within column (from order 3 to order 1)', () => {
      // Move task-3 from order 3 to order 1 within 'planned'
      const result = updateTaskOrder('task-3', 1)
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-3')
      expect(movedTask?.order).toBe(1)
      expect(movedTask?.status).toBe('planned')

      // Verify other tasks shifted down
      const task1 = mockTasks.find(t => t.id === 'task-1')
      const task2 = mockTasks.find(t => t.id === 'task-2')
      expect(task1?.order).toBe(2) // Was 1, shifted to 2
      expect(task2?.order).toBe(3) // Was 2, shifted to 3

      // Verify tasks in other columns unchanged
      const task4 = mockTasks.find(t => t.id === 'task-4')
      const task5 = mockTasks.find(t => t.id === 'task-5')
      expect(task4?.order).toBe(1)
      expect(task5?.order).toBe(2)
    })

    it('should move task down within column (from order 1 to order 3)', () => {
      // Move task-1 from order 1 to order 3 within 'planned'
      const result = updateTaskOrder('task-1', 3)
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-1')
      expect(movedTask?.order).toBe(3)
      expect(movedTask?.status).toBe('planned')

      // Verify other tasks shifted up
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')
      expect(task2?.order).toBe(1) // Was 2, shifted to 1
      expect(task3?.order).toBe(2) // Was 3, shifted to 2
    })

    it('should not change anything if moving to same position', () => {
      const result = updateTaskOrder('task-2', 2)
      expect(result).not.toBeNull()

      // All tasks should remain unchanged
      expect(mockTasks.find(t => t.id === 'task-1')?.order).toBe(1)
      expect(mockTasks.find(t => t.id === 'task-2')?.order).toBe(2)
      expect(mockTasks.find(t => t.id === 'task-3')?.order).toBe(3)
    })

    it('should handle moving to adjacent position up', () => {
      // Move task-2 from order 2 to order 1
      const result = updateTaskOrder('task-2', 1)
      expect(result).not.toBeNull()

      const task1 = mockTasks.find(t => t.id === 'task-1')
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')

      expect(task1?.order).toBe(2) // Shifted down
      expect(task2?.order).toBe(1) // Moved up
      expect(task3?.order).toBe(3) // Unchanged
    })

    it('should handle moving to adjacent position down', () => {
      // Move task-2 from order 2 to order 3
      const result = updateTaskOrder('task-2', 3)
      expect(result).not.toBeNull()

      const task1 = mockTasks.find(t => t.id === 'task-1')
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')

      expect(task1?.order).toBe(1) // Unchanged
      expect(task2?.order).toBe(3) // Moved down
      expect(task3?.order).toBe(2) // Shifted up
    })
  })

  describe('across different columns', () => {
    it('should move task from planned to ongoing at order 1', () => {
      // Move task-1 from planned (order 1) to ongoing (order 1)
      const result = updateTaskOrder('task-1', 1, 'ongoing')
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-1')
      expect(movedTask?.order).toBe(1)
      expect(movedTask?.status).toBe('ongoing')

      // Verify tasks in old column (planned) shifted up
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')
      expect(task2?.order).toBe(1) // Was 2, shifted to 1
      expect(task3?.order).toBe(2) // Was 3, shifted to 2

      // Verify tasks in new column (ongoing) shifted down
      const task4 = mockTasks.find(t => t.id === 'task-4')
      const task5 = mockTasks.find(t => t.id === 'task-5')
      expect(task4?.order).toBe(2) // Was 1, shifted to 2
      expect(task5?.order).toBe(3) // Was 2, shifted to 3
    })

    it('should move task to end of different column', () => {
      // Move task-1 from planned to ongoing at order 3 (after task-4 and task-5)
      const result = updateTaskOrder('task-1', 3, 'ongoing')
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-1')
      expect(movedTask?.order).toBe(3)
      expect(movedTask?.status).toBe('ongoing')

      // Verify tasks in old column adjusted
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')
      expect(task2?.order).toBe(1)
      expect(task3?.order).toBe(2)

      // Verify tasks in new column remain unchanged (nothing at or below order 3)
      const task4 = mockTasks.find(t => t.id === 'task-4')
      const task5 = mockTasks.find(t => t.id === 'task-5')
      expect(task4?.order).toBe(1)
      expect(task5?.order).toBe(2)
    })

    it('should move task to middle of different column', () => {
      // Move task-1 from planned to ongoing at order 2 (between task-4 and task-5)
      const result = updateTaskOrder('task-1', 2, 'ongoing')
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-1')
      expect(movedTask?.order).toBe(2)
      expect(movedTask?.status).toBe('ongoing')

      // Verify tasks in new column shifted
      const task4 = mockTasks.find(t => t.id === 'task-4')
      const task5 = mockTasks.find(t => t.id === 'task-5')
      expect(task4?.order).toBe(1) // Unchanged (below insertion point)
      expect(task5?.order).toBe(3) // Was 2, shifted to 3
    })

    it('should move task to empty column', () => {
      // First, verify 'done' column is empty
      const doneTasks = mockTasks.filter(t => t.status === 'done')
      expect(doneTasks).toHaveLength(0)

      // Move task-1 to done column at order 1
      const result = updateTaskOrder('task-1', 1, 'done')
      expect(result).not.toBeNull()

      // Verify the moved task
      const movedTask = mockTasks.find(t => t.id === 'task-1')
      expect(movedTask?.order).toBe(1)
      expect(movedTask?.status).toBe('done')

      // Verify old column adjusted
      const task2 = mockTasks.find(t => t.id === 'task-2')
      const task3 = mockTasks.find(t => t.id === 'task-3')
      expect(task2?.order).toBe(1)
      expect(task3?.order).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should return null for non-existent task', () => {
      const result = updateTaskOrder('non-existent', 1)
      expect(result).toBeNull()
    })

    it('should handle 1-based indexing correctly', () => {
      // Verify all tasks use 1-based ordering
      const plannedTasks = mockTasks.filter(t => t.status === 'planned')
      expect(plannedTasks.every(t => t.order >= 1)).toBe(true)

      // Move to order 1 (not 0)
      const result = updateTaskOrder('task-3', 1)
      expect(result).not.toBeNull()
      expect(mockTasks.find(t => t.id === 'task-3')?.order).toBe(1)
    })

    it('should update updatedAt timestamp', () => {
      const originalUpdatedAt = mockTasks.find(t => t.id === 'task-1')?.updatedAt

      // Wait a tiny bit to ensure timestamp changes
      const result = updateTaskOrder('task-1', 2)
      expect(result).not.toBeNull()

      const newUpdatedAt = mockTasks.find(t => t.id === 'task-1')?.updatedAt
      expect(newUpdatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('complex scenarios', () => {
    it('should handle moving last task to first position', () => {
      const result = updateTaskOrder('task-3', 1)
      expect(result).not.toBeNull()

      expect(mockTasks.find(t => t.id === 'task-3')?.order).toBe(1)
      expect(mockTasks.find(t => t.id === 'task-1')?.order).toBe(2)
      expect(mockTasks.find(t => t.id === 'task-2')?.order).toBe(3)
    })

    it('should handle moving first task to last position', () => {
      const result = updateTaskOrder('task-1', 3)
      expect(result).not.toBeNull()

      expect(mockTasks.find(t => t.id === 'task-1')?.order).toBe(3)
      expect(mockTasks.find(t => t.id === 'task-2')?.order).toBe(1)
      expect(mockTasks.find(t => t.id === 'task-3')?.order).toBe(2)
    })

    it('should preserve order integrity after multiple operations', () => {
      // Perform several moves
      updateTaskOrder('task-3', 1) // planned: 3,1,2
      updateTaskOrder('task-2', 3) // planned: 3,1,2 -> 3,2,1 (incorrect) or 1,3,2 (correct)
      updateTaskOrder('task-1', 1, 'ongoing') // Move to different column

      // Verify no gaps or duplicates in planned column
      const plannedTasks = mockTasks
        .filter(t => t.status === 'planned')
        .sort((a, b) => a.order - b.order)

      const plannedOrders = plannedTasks.map(t => t.order)
      expect(plannedOrders).toEqual([1, 2]) // Should be continuous from 1

      // Verify ongoing column
      const ongoingTasks = mockTasks
        .filter(t => t.status === 'ongoing')
        .sort((a, b) => a.order - b.order)

      const ongoingOrders = ongoingTasks.map(t => t.order)
      expect(ongoingOrders).toEqual([1, 2, 3]) // Should be continuous from 1
    })
  })
})
