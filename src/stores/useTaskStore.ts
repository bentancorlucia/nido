import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete, dbRun } from '../lib/ipc'
import { generateNextInstanceData } from '../lib/recurrence'
import type { Task, Tag } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

export type SortOption = 'sort_order' | 'due_date' | 'priority' | 'title' | 'created_at'
export type FilterState = {
  tags: string[]
  priority: string | null
  important: boolean | null
  hasDate: boolean | null
  overdue: boolean | null
  search: string
}

const defaultFilters: FilterState = {
  tags: [],
  priority: null,
  important: null,
  hasDate: null,
  overdue: null,
  search: '',
}

interface TaskState {
  tasks: Task[]
  taskTags: Record<string, Tag[]>
  loading: boolean
  filters: FilterState
  sortBy: SortOption

  loadTasks: (projectId?: string | null) => Promise<void>
  loadTaskTags: (taskIds: string[]) => Promise<void>

  createTask: (data: {
    title: string
    project_id?: string | null
    column_id?: string | null
    parent_task_id?: string | null
    priority?: string
    description?: string
  }) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string, completed: boolean) => Promise<void>
  moveTask: (id: string, columnId: string, sortOrder: number) => Promise<void>
  reorderTasks: (columnId: string, taskIds: string[]) => Promise<void>

  addTagToTask: (taskId: string, tagId: string) => Promise<void>
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>

  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  setSortBy: (sort: SortOption) => void

  getFilteredTasks: (columnId: string) => Task[]
  getSubtasks: (parentId: string) => Task[]
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  taskTags: {},
  loading: false,
  filters: defaultFilters,
  sortBy: 'sort_order',

  loadTasks: async (projectId) => {
    set({ loading: true })
    let tasks: Task[]
    if (projectId) {
      tasks = await dbQuery<Task>(
        'SELECT * FROM tasks WHERE project_id = ? AND is_archived = 0 AND parent_task_id IS NULL ORDER BY sort_order ASC',
        [projectId]
      )
    } else {
      tasks = await dbQuery<Task>(
        'SELECT * FROM tasks WHERE is_archived = 0 AND parent_task_id IS NULL ORDER BY sort_order ASC'
      )
    }
    set({ tasks, loading: false })

    if (tasks.length > 0) {
      await get().loadTaskTags(tasks.map((t) => t.id))
    }
  },

  loadTaskTags: async (taskIds) => {
    if (taskIds.length === 0) return
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = await dbQuery<{ task_id: string; tag_id: string; name: string; color: string }>(
      `SELECT tt.task_id, t.id as tag_id, t.name, t.color
       FROM task_tags tt JOIN tags t ON tt.tag_id = t.id
       WHERE tt.task_id IN (${placeholders})`,
      taskIds
    )
    const tagMap: Record<string, Tag[]> = {}
    for (const row of rows) {
      if (!tagMap[row.task_id]) tagMap[row.task_id] = []
      tagMap[row.task_id].push({ id: row.tag_id, name: row.name, color: row.color })
    }
    set({ taskTags: tagMap })
  },

  createTask: async (data) => {
    const id = uuid()
    const now = new Date().toISOString()

    // Get sort_order: place at end of column
    let sortOrder = 0
    if (data.column_id) {
      const existing = get().tasks.filter((t) => t.column_id === data.column_id)
      sortOrder = existing.length
    }

    const task: Task = {
      id,
      title: data.title,
      description: data.description ?? null,
      project_id: data.project_id ?? null,
      column_id: data.column_id ?? null,
      parent_task_id: data.parent_task_id ?? null,
      priority: (data.priority as Task['priority']) ?? 'media',
      is_important: 0,
      due_date: null,
      due_time: null,
      estimated_minutes: null,
      actual_minutes: 0,
      is_completed: 0,
      completed_at: null,
      is_archived: 0,
      sort_order: sortOrder,
      is_recurring: 0,
      recurrence_rule: null,
      recurrence_end: null,
      recurrence_parent: null,
      created_at: now,
      updated_at: now,
    }

    await dbInsert('tasks', { ...task })
    // Reload tasks for the project
    if (data.project_id) {
      await get().loadTasks(data.project_id)
    }
    return task
  },

  updateTask: async (id, data) => {
    const cleanData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
    delete cleanData.id
    await dbUpdate('tasks', id, cleanData)

    // Find task to know which project to reload
    const task = get().tasks.find((t) => t.id === id)
    if (task?.project_id) {
      await get().loadTasks(task.project_id)
    }
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    await dbDelete('tasks', id)
    if (task?.project_id) {
      await get().loadTasks(task.project_id)
    }
  },

  completeTask: async (id, completed) => {
    await dbUpdate('tasks', id, {
      is_completed: completed ? 1 : 0,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })

    // Handle recurrence: generate next instance when completing a recurring task
    if (completed) {
      const task = get().tasks.find((t) => t.id === id)
      if (task && task.is_recurring === 1 && task.recurrence_rule) {
        const nextData = generateNextInstanceData(task)
        if (nextData) {
          const nextId = uuid()
          const now = new Date().toISOString()
          await dbInsert('tasks', {
            id: nextId,
            ...nextData,
            is_completed: 0,
            completed_at: null,
            is_archived: 0,
            sort_order: task.sort_order,
            actual_minutes: 0,
            due_time: task.due_time,
            parent_task_id: null,
            created_at: now,
            updated_at: now,
          })

          // Copy tags from original task
          const tags = await dbQuery<{ tag_id: string }>(
            'SELECT tag_id FROM task_tags WHERE task_id = ?',
            [id]
          )
          for (const { tag_id } of tags) {
            await dbRun('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [nextId, tag_id])
          }
        }
      }
    }

    const task = get().tasks.find((t) => t.id === id)
    if (task?.project_id) {
      await get().loadTasks(task.project_id)
    }
  },

  moveTask: async (id, columnId, sortOrder) => {
    await dbUpdate('tasks', id, {
      column_id: columnId,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
  },

  reorderTasks: async (columnId, taskIds) => {
    for (let i = 0; i < taskIds.length; i++) {
      await dbUpdate('tasks', taskIds[i], {
        column_id: columnId,
        sort_order: i,
        updated_at: new Date().toISOString(),
      })
    }
  },

  addTagToTask: async (taskId, tagId) => {
    await dbRun('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tagId])
    await get().loadTaskTags([taskId])
  },

  removeTagFromTask: async (taskId, tagId) => {
    await dbRun('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?', [taskId, tagId])
    await get().loadTaskTags([taskId])
  },

  setFilters: (filters) => {
    set((s) => ({ filters: { ...s.filters, ...filters } }))
  },

  resetFilters: () => set({ filters: defaultFilters }),

  setSortBy: (sort) => set({ sortBy: sort }),

  getFilteredTasks: (columnId) => {
    const { tasks, taskTags, filters, sortBy } = get()
    let filtered = tasks.filter((t) => t.column_id === columnId)

    // Apply filters
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q))
    }
    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority)
    }
    if (filters.important === true) {
      filtered = filtered.filter((t) => t.is_important === 1)
    }
    if (filters.hasDate === true) {
      filtered = filtered.filter((t) => t.due_date !== null)
    } else if (filters.hasDate === false) {
      filtered = filtered.filter((t) => t.due_date === null)
    }
    if (filters.overdue === true) {
      const now = new Date().toISOString().split('T')[0]
      filtered = filtered.filter((t) => t.due_date !== null && t.due_date < now && t.is_completed === 0)
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter((t) => {
        const tags = taskTags[t.id] ?? []
        return filters.tags.some((ft) => tags.some((tag) => tag.id === ft))
      })
    }

    // Sort
    if (sortBy === 'due_date') {
      filtered.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      })
    } else if (sortBy === 'priority') {
      const order = { alta: 0, media: 1, baja: 2 }
      filtered.sort((a, b) => order[a.priority] - order[b.priority])
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'created_at') {
      filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
    } else {
      filtered.sort((a, b) => a.sort_order - b.sort_order)
    }

    return filtered
  },

  getSubtasks: (parentId) => {
    const { tasks } = get()
    return tasks.filter((t) => t.parent_task_id === parentId)
  },
}))
