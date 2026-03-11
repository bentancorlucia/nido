import { create } from 'zustand'
import { dbQuery, dbUpdate, dbRun } from '../lib/ipc'
import type { DashboardWidget } from '../types'

export type WidgetType = 'today' | 'deadlines' | 'progress' | 'postits' | 'mini_calendar' | 'pomodoro'

export const WIDGET_LABELS: Record<WidgetType, string> = {
  today: 'Tareas de Hoy',
  deadlines: 'Próximos Deadlines',
  progress: 'Progreso de Proyectos',
  postits: 'Post-its',
  mini_calendar: 'Mini Calendario',
  pomodoro: 'Pomodoro',
}

const DEFAULT_LAYOUT: Omit<DashboardWidget, 'id'>[] = [
  { widget_type: 'today', grid_x: 0, grid_y: 0, grid_w: 4, grid_h: 2, is_visible: 1, config: null },
  { widget_type: 'deadlines', grid_x: 4, grid_y: 0, grid_w: 4, grid_h: 2, is_visible: 1, config: null },
  { widget_type: 'progress', grid_x: 8, grid_y: 0, grid_w: 4, grid_h: 2, is_visible: 1, config: null },
  { widget_type: 'postits', grid_x: 0, grid_y: 2, grid_w: 6, grid_h: 3, is_visible: 1, config: null },
  { widget_type: 'mini_calendar', grid_x: 6, grid_y: 2, grid_w: 3, grid_h: 3, is_visible: 1, config: null },
  { widget_type: 'pomodoro', grid_x: 9, grid_y: 2, grid_w: 3, grid_h: 3, is_visible: 1, config: null },
]

interface DashboardState {
  widgets: DashboardWidget[]
  loading: boolean
  draggingId: string | null

  loadWidgets: () => Promise<void>
  updateWidget: (id: string, data: Partial<DashboardWidget>) => Promise<void>
  toggleVisibility: (id: string) => Promise<void>
  resetLayout: () => Promise<void>
  setDragging: (id: string | null) => void
  reorderWidgets: (orderedIds: string[]) => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  widgets: [],
  loading: false,
  draggingId: null,

  loadWidgets: async () => {
    set({ loading: true })
    const widgets = await dbQuery<DashboardWidget>(
      'SELECT * FROM dashboard_layout ORDER BY grid_y ASC, grid_x ASC'
    )
    set({ widgets, loading: false })
  },

  updateWidget: async (id, data) => {
    const cleanData: Record<string, unknown> = { ...data }
    delete cleanData.id
    await dbUpdate('dashboard_layout', id, cleanData)
    set({
      widgets: get().widgets.map((w) =>
        w.id === id ? { ...w, ...data } : w
      ),
    })
  },

  toggleVisibility: async (id) => {
    const widget = get().widgets.find((w) => w.id === id)
    if (!widget) return
    const newVis = widget.is_visible === 1 ? 0 : 1
    await dbUpdate('dashboard_layout', id, { is_visible: newVis })
    set({
      widgets: get().widgets.map((w) =>
        w.id === id ? { ...w, is_visible: newVis } : w
      ),
    })
  },

  resetLayout: async () => {
    // Delete all and re-insert defaults
    await dbRun('DELETE FROM dashboard_layout')
    for (const w of DEFAULT_LAYOUT) {
      const id = crypto.randomUUID()
      await dbRun(
        'INSERT INTO dashboard_layout (id, widget_type, grid_x, grid_y, grid_w, grid_h, is_visible, config) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, w.widget_type, w.grid_x, w.grid_y, w.grid_w, w.grid_h, w.is_visible, w.config]
      )
    }
    await get().loadWidgets()
  },

  setDragging: (id) => set({ draggingId: id }),

  reorderWidgets: (orderedIds) => {
    const { widgets } = get()
    const reordered = orderedIds
      .map((id) => widgets.find((w) => w.id === id))
      .filter(Boolean) as DashboardWidget[]
    set({ widgets: reordered })

    // Persist new grid positions
    reordered.forEach(async (w, i) => {
      const row = Math.floor(i / 3)
      const col = (i % 3)
      await dbUpdate('dashboard_layout', w.id, {
        grid_x: col * 4,
        grid_y: row * 2,
      })
    })
  },
}))
