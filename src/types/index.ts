export type Page = 'dashboard' | 'today' | 'kanban' | 'calendar' | 'projects' | 'pomodoro' | 'settings'

export type Priority = 'alta' | 'media' | 'baja'

export type Theme = 'light' | 'dark'

export interface Project {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string | null
  icon: string | null
  is_archived: number
  is_template: number
  template_name: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface KanbanColumn {
  id: string
  name: string
  project_id: string
  color: string | null
  sort_order: number
  is_default: number
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  column_id: string | null
  parent_task_id: string | null
  priority: Priority
  is_important: number
  due_date: string | null
  due_time: string | null
  estimated_minutes: number | null
  actual_minutes: number
  is_completed: number
  completed_at: string | null
  is_archived: number
  sort_order: number
  is_recurring: number
  recurrence_rule: string | null
  recurrence_end: string | null
  recurrence_parent: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_datetime: string
  end_datetime: string
  is_all_day: number
  color: string | null
  location: string | null
  project_id: string | null
  is_recurring: number
  recurrence_rule: string | null
  recurrence_end: string | null
  google_event_id: string | null
  google_calendar_id: string | null
  last_synced: string | null
  created_at: string
  updated_at: string
}

export interface PostIt {
  id: string
  content: string
  color: string
  linked_task_id: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  is_pinned: number
  created_at: string
  updated_at: string
}

export interface PomodoroSession {
  id: string
  task_id: string | null
  duration_minutes: number
  break_minutes: number
  started_at: string
  ended_at: string | null
  was_completed: number
  created_at: string
}

export interface DashboardWidget {
  id: string
  widget_type: string
  grid_x: number
  grid_y: number
  grid_w: number
  grid_h: number
  is_visible: number
  config: string | null
}

export interface Setting {
  key: string
  value: string | null
}

export interface Template {
  id: string
  name: string
  description: string | null
  structure: string
  created_at: string
}

// Extend Window for Electron API
declare global {
  interface Window {
    nido: {
      db: {
        query: (sql: string, params?: unknown[]) => Promise<unknown[]>
        run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>
        get: (sql: string, params?: unknown[]) => Promise<unknown | undefined>
        getAll: (table: string) => Promise<unknown[]>
        insert: (table: string, data: Record<string, unknown>) => Promise<unknown>
        update: (table: string, id: string, data: Record<string, unknown>) => Promise<unknown>
        delete: (table: string, id: string) => Promise<void>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<void>
      }
      platform: string
    }
  }
}
