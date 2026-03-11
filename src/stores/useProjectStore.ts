import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete, dbRun } from '../lib/ipc'
import type { Project, KanbanColumn } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

const DEFAULT_COLUMNS = [
  { name: 'Por hacer', sort_order: 0, is_default: 1 },
  { name: 'En proceso', sort_order: 1, is_default: 1 },
  { name: 'Realizado', sort_order: 2, is_default: 1 },
]

interface ProjectState {
  projects: Project[]
  columns: KanbanColumn[]
  selectedProjectId: string | null
  loading: boolean

  loadProjects: () => Promise<void>
  loadColumns: (projectId: string) => Promise<void>
  selectProject: (id: string | null) => void

  createProject: (data: { name: string; description?: string; parent_id?: string; color?: string; icon?: string }) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  moveProject: (id: string, newParentId: string | null) => Promise<void>

  createColumn: (projectId: string, name: string) => Promise<void>
  updateColumn: (id: string, data: Partial<KanbanColumn>) => Promise<void>
  deleteColumn: (id: string) => Promise<void>
  reorderColumns: (projectId: string, columnIds: string[]) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  columns: [],
  selectedProjectId: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true })
    const projects = await dbQuery<Project>(
      'SELECT * FROM projects WHERE is_template = 0 ORDER BY sort_order ASC, created_at ASC'
    )
    set({ projects, loading: false })
  },

  loadColumns: async (projectId: string) => {
    const columns = await dbQuery<KanbanColumn>(
      'SELECT * FROM kanban_columns WHERE project_id = ? ORDER BY sort_order ASC',
      [projectId]
    )
    set({ columns })
  },

  selectProject: (id) => {
    set({ selectedProjectId: id })
    if (id) get().loadColumns(id)
  },

  createProject: async (data) => {
    const id = uuid()
    const now = new Date().toISOString()
    const project: Project = {
      id,
      name: data.name,
      description: data.description ?? null,
      parent_id: data.parent_id ?? null,
      color: data.color ?? '#01A7C2',
      icon: data.icon ?? null,
      is_archived: 0,
      is_template: 0,
      template_name: null,
      sort_order: get().projects.length,
      created_at: now,
      updated_at: now,
    }

    await dbInsert('projects', { ...project })

    // Create 3 default columns
    for (const col of DEFAULT_COLUMNS) {
      await dbInsert('kanban_columns', {
        id: uuid(),
        name: col.name,
        project_id: id,
        color: null,
        sort_order: col.sort_order,
        is_default: col.is_default,
        created_at: now,
      })
    }

    await get().loadProjects()
    return project
  },

  updateProject: async (id, data) => {
    await dbUpdate('projects', id, { ...data, updated_at: new Date().toISOString() })
    await get().loadProjects()
  },

  deleteProject: async (id) => {
    await dbDelete('projects', id)
    const state = get()
    if (state.selectedProjectId === id) {
      set({ selectedProjectId: null, columns: [] })
    }
    await get().loadProjects()
  },

  archiveProject: async (id) => {
    await dbUpdate('projects', id, { is_archived: 1, updated_at: new Date().toISOString() })
    await get().loadProjects()
  },

  moveProject: async (id, newParentId) => {
    await dbUpdate('projects', id, { parent_id: newParentId, updated_at: new Date().toISOString() })
    await get().loadProjects()
  },

  createColumn: async (projectId, name) => {
    const columns = get().columns
    await dbInsert('kanban_columns', {
      id: uuid(),
      name,
      project_id: projectId,
      color: null,
      sort_order: columns.length,
      is_default: 0,
      created_at: new Date().toISOString(),
    })
    await get().loadColumns(projectId)
  },

  updateColumn: async (id, data) => {
    const { id: _id, ...updateData } = data as Record<string, unknown>
    await dbUpdate('kanban_columns', id, updateData)
    const { selectedProjectId } = get()
    if (selectedProjectId) await get().loadColumns(selectedProjectId)
  },

  deleteColumn: async (id) => {
    const { columns, selectedProjectId } = get()
    const firstDefault = columns.find((c) => c.is_default === 1)

    if (firstDefault) {
      // Move tasks from deleted column to first default column
      await dbRun(
        'UPDATE tasks SET column_id = ? WHERE column_id = ?',
        [firstDefault.id, id]
      )
    }

    await dbDelete('kanban_columns', id)
    if (selectedProjectId) await get().loadColumns(selectedProjectId)
  },

  reorderColumns: async (projectId, columnIds) => {
    for (let i = 0; i < columnIds.length; i++) {
      await dbUpdate('kanban_columns', columnIds[i], { sort_order: i })
    }
    await get().loadColumns(projectId)
  },
}))
