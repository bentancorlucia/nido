import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete } from '../lib/ipc'
import type { CalendarEvent, EventType } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

export type CalendarViewType = 'month' | 'week' | 'semester' | 'year'

interface CalendarState {
  events: CalendarEvent[]
  loading: boolean
  currentDate: Date
  view: CalendarViewType

  loadEvents: () => Promise<void>
  loadEventsForRange: (start: string, end: string) => Promise<void>

  createEvent: (data: {
    title: string
    start_datetime: string
    end_datetime: string
    is_all_day?: boolean
    color?: string
    description?: string
    location?: string
    project_id?: string | null
    event_type?: EventType
  }) => Promise<CalendarEvent>
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  setView: (view: CalendarViewType) => void
  setCurrentDate: (date: Date) => void
  navigateMonth: (delta: number) => void
  navigateWeek: (delta: number) => void
  goToToday: () => void

  getEventsForDate: (dateStr: string) => CalendarEvent[]
  getEventsForRange: (start: string, end: string) => CalendarEvent[]
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,
  currentDate: new Date(),
  view: 'month',

  loadEvents: async () => {
    set({ loading: true })
    const events = await dbQuery<CalendarEvent>(
      'SELECT * FROM events ORDER BY start_datetime ASC'
    )
    set({ events, loading: false })
  },

  loadEventsForRange: async (start, end) => {
    set({ loading: true })
    const events = await dbQuery<CalendarEvent>(
      `SELECT * FROM events
       WHERE (start_datetime <= ? AND end_datetime >= ?)
          OR (start_datetime >= ? AND start_datetime <= ?)
       ORDER BY start_datetime ASC`,
      [end, start, start, end]
    )
    set({ events, loading: false })
  },

  createEvent: async (data) => {
    const id = uuid()
    const now = new Date().toISOString()

    const event: CalendarEvent = {
      id,
      title: data.title,
      description: data.description ?? null,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
      is_all_day: data.is_all_day ? 1 : 0,
      color: data.color ?? null,
      location: data.location ?? null,
      event_type: data.event_type ?? 'evento',
      project_id: data.project_id ?? null,
      is_recurring: 0,
      recurrence_rule: null,
      recurrence_end: null,
      google_event_id: null,
      google_calendar_id: null,
      last_synced: null,
      created_at: now,
      updated_at: now,
    }

    await dbInsert('events', { ...event })
    await get().loadEvents()
    return event
  },

  updateEvent: async (id, data) => {
    const cleanData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
    delete cleanData.id
    await dbUpdate('events', id, cleanData)
    await get().loadEvents()
  },

  deleteEvent: async (id) => {
    await dbDelete('events', id)
    await get().loadEvents()
  },

  setView: (view) => set({ view }),

  setCurrentDate: (date) => set({ currentDate: date }),

  navigateMonth: (delta) => {
    const current = get().currentDate
    const next = new Date(current.getFullYear(), current.getMonth() + delta, 1)
    set({ currentDate: next })
  },

  navigateWeek: (delta) => {
    const current = get().currentDate
    const next = new Date(current)
    next.setDate(next.getDate() + delta * 7)
    set({ currentDate: next })
  },

  goToToday: () => set({ currentDate: new Date() }),

  getEventsForDate: (dateStr) => {
    const { events } = get()
    return events.filter((e) => {
      const start = e.start_datetime.split('T')[0]
      let end = e.end_datetime.split('T')[0]
      // For all-day events, if end > start it may be an exclusive end date from Google
      // Use < instead of <= to treat end as exclusive for all-day events
      if (e.is_all_day && end > start) {
        return dateStr >= start && dateStr < end
      }
      return dateStr >= start && dateStr <= end
    })
  },

  getEventsForRange: (start, end) => {
    const { events } = get()
    return events.filter((e) => {
      const eStart = e.start_datetime.split('T')[0]
      let eEnd = e.end_datetime.split('T')[0]
      // For all-day events, treat end as exclusive
      if (e.is_all_day && eEnd > eStart) {
        // Subtract one day for exclusive end comparison
        const d = new Date(eEnd + 'T00:00:00')
        d.setDate(d.getDate() - 1)
        eEnd = d.toISOString().split('T')[0]
      }
      return eEnd >= start && eStart <= end
    })
  },
}))
