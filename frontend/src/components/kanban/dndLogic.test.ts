import { describe, it, expect } from 'vitest'
import { applyDragResult } from './dndLogic'
import type { Task, TaskStatus } from '@/lib/api'

function makeTask(id: string, status: TaskStatus, order: number): Task {
  return {
    id,
    title: id,
    description: '',
    status,
    order,
    priority: 'medium',
    categories: [],
    assignees: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  }
}

describe('applyDragResult', () => {
  describe('reordering within same column', () => {
    it('moves task down within column (1 → 3)', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
        makeTask('c', 'planned', 3),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'planned',
        targetOrder: 3,
      })

      const planned = result.filter((t) => t.status === 'planned')
      expect(planned.map((t) => t.id)).toEqual(['b', 'c', 'a'])
      expect(planned.map((t) => t.order)).toEqual([1, 2, 3])
    })

    it('moves task up within column (3 → 1)', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
        makeTask('c', 'planned', 3),
      ]

      const result = applyDragResult(tasks, 'c', {
        targetStatus: 'planned',
        targetOrder: 1,
      })

      const planned = result.filter((t) => t.status === 'planned')
      expect(planned.map((t) => t.id)).toEqual(['c', 'a', 'b'])
      expect(planned.map((t) => t.order)).toEqual([1, 2, 3])
    })

    it('moves task to middle position (1 → 2)', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
        makeTask('c', 'planned', 3),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'planned',
        targetOrder: 2,
      })

      const planned = result.filter((t) => t.status === 'planned')
      expect(planned.map((t) => t.id)).toEqual(['b', 'a', 'c'])
      expect(planned.map((t) => t.order)).toEqual([1, 2, 3])
    })
  })

  describe('moving between columns', () => {
    it('moves task from planned to ongoing', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
        makeTask('c', 'ongoing', 1),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 2,
      })

      const planned = result.filter((t) => t.status === 'planned')
      const ongoing = result.filter((t) => t.status === 'ongoing')

      expect(planned.map((t) => t.id)).toEqual(['b'])
      expect(planned.map((t) => t.order)).toEqual([1])

      expect(ongoing.map((t) => t.id)).toEqual(['c', 'a'])
      expect(ongoing.map((t) => t.order)).toEqual([1, 2])
      expect(ongoing.find((t) => t.id === 'a')?.status).toBe('ongoing')
    })

    it('moves task to empty column', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 1,
      })

      const planned = result.filter((t) => t.status === 'planned')
      const ongoing = result.filter((t) => t.status === 'ongoing')

      expect(planned.map((t) => t.id)).toEqual(['b'])
      expect(planned.map((t) => t.order)).toEqual([1])

      expect(ongoing.map((t) => t.id)).toEqual(['a'])
      expect(ongoing.map((t) => t.order)).toEqual([1])
    })

    it('moves task to beginning of target column', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'ongoing', 1),
        makeTask('c', 'ongoing', 2),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 1,
      })

      const ongoing = result.filter((t) => t.status === 'ongoing')
      expect(ongoing.map((t) => t.id)).toEqual(['a', 'b', 'c'])
      expect(ongoing.map((t) => t.order)).toEqual([1, 2, 3])
    })

    it('moves task to end of target column', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'ongoing', 1),
        makeTask('c', 'ongoing', 2),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 3,
      })

      const ongoing = result.filter((t) => t.status === 'ongoing')
      expect(ongoing.map((t) => t.id)).toEqual(['b', 'c', 'a'])
      expect(ongoing.map((t) => t.order)).toEqual([1, 2, 3])
    })
  })

  describe('no-op scenarios', () => {
    it('returns same array when dropping at same position', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'planned',
        targetOrder: 1,
      })

      expect(result).toBe(tasks) // Same reference
    })

    it('returns same array when position is null', () => {
      const tasks = [makeTask('a', 'planned', 1)]

      const result = applyDragResult(tasks, 'a', null)

      expect(result).toBe(tasks)
    })

    it('returns same array when task not found', () => {
      const tasks = [makeTask('a', 'planned', 1)]

      const result = applyDragResult(tasks, 'nonexistent', {
        targetStatus: 'planned',
        targetOrder: 1,
      })

      expect(result).toBe(tasks)
    })
  })

  describe('edge cases', () => {
    it('handles single task in column', () => {
      const tasks = [makeTask('a', 'planned', 1)]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 1,
      })

      expect(result.filter((t) => t.status === 'planned')).toHaveLength(0)
      expect(result.filter((t) => t.status === 'ongoing')).toHaveLength(1)
    })

    it('clamps targetOrder beyond column length', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'ongoing', 1),
        makeTask('c', 'ongoing', 2),
      ]

      // Try to insert at position 100
      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'ongoing',
        targetOrder: 100,
      })

      const ongoing = result.filter((t) => t.status === 'ongoing')
      // Should be inserted at the end
      expect(ongoing.map((t) => t.id)).toEqual(['b', 'c', 'a'])
      expect(ongoing.map((t) => t.order)).toEqual([1, 2, 3])
    })

    it('maintains order integrity across all columns', () => {
      const tasks = [
        makeTask('a', 'planned', 1),
        makeTask('b', 'planned', 2),
        makeTask('c', 'ongoing', 1),
        makeTask('d', 'done', 1),
        makeTask('e', 'done', 2),
      ]

      const result = applyDragResult(tasks, 'a', {
        targetStatus: 'done',
        targetOrder: 2,
      })

      const planned = result.filter((t) => t.status === 'planned')
      const ongoing = result.filter((t) => t.status === 'ongoing')
      const done = result.filter((t) => t.status === 'done')

      // Planned: removed 'a', so 'b' becomes order 1
      expect(planned.map((t) => t.order)).toEqual([1])

      // Ongoing: unchanged
      expect(ongoing.map((t) => t.order)).toEqual([1])

      // Done: inserted 'a' at position 2
      expect(done.map((t) => t.id)).toEqual(['d', 'a', 'e'])
      expect(done.map((t) => t.order)).toEqual([1, 2, 3])
    })
  })
})
