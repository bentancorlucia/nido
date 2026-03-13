import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronRight, MapPin, Clock, X } from 'lucide-react'
import { dbQuery } from '../../lib/ipc'
import { localDateStr } from '../../lib/dates'
import { EventTypeIcon, getEventTypeInfo } from '../../lib/eventTypes'
import type { CalendarEvent } from '../../types'

interface ProjectEventsPanelProps {
  projectId: string
  projectColor?: string | null
  isOpen: boolean
  onToggle: () => void
}

interface EventGroup {
  label: string
  events: CalendarEvent[]
}

function groupEvents(events: CalendarEvent[]): EventGroup[] {
  const now = new Date()
  const todayStr = localDateStr(now)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
  const weekEndStr = localDateStr(weekEnd)

  const today: CalendarEvent[] = []
  const thisWeek: CalendarEvent[] = []
  const later: CalendarEvent[] = []

  for (const event of events) {
    const dateStr = event.start_datetime.split('T')[0]
    if (dateStr === todayStr) {
      today.push(event)
    } else if (dateStr <= weekEndStr) {
      thisWeek.push(event)
    } else {
      later.push(event)
    }
  }

  const groups: EventGroup[] = []
  if (today.length > 0) groups.push({ label: 'Hoy', events: today })
  if (thisWeek.length > 0) groups.push({ label: 'Esta semana', events: thisWeek })
  if (later.length > 0) groups.push({ label: 'Más adelante', events: later })
  return groups
}

function formatEventDate(datetime: string): string {
  const dateStr = datetime.split('T')[0]
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const todayStr = localDateStr(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = localDateStr(tomorrow)

  if (dateStr === todayStr) return 'Hoy'
  if (dateStr === tomorrowStr) return 'Mañana'
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', weekday: 'short' })
}

export function ProjectEventsPanel({ projectId, projectColor, isOpen, onToggle }: ProjectEventsPanelProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    loadEvents()
  }, [projectId])

  async function loadEvents() {
    const rows = await dbQuery<CalendarEvent>(
      `SELECT * FROM events
       WHERE project_id = ? AND end_datetime >= datetime('now')
       ORDER BY start_datetime ASC
       LIMIT 30`,
      [projectId]
    )
    setEvents(rows)
  }

  const groups = groupEvents(events)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="kevents-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div className="kevents-panel__inner">
            <div className="kevents-panel__header">
              <div className="kevents-panel__header-title">
                <Calendar size={14} />
                <span>Eventos</span>
                <span className="kevents-panel__count">{events.length}</span>
              </div>
              <button onClick={onToggle} className="kevents-panel__close">
                <X size={14} />
              </button>
            </div>

            <div className="kevents-panel__body">
              {groups.length === 0 && (
                <div className="kevents-panel__empty">
                  <Calendar size={24} />
                  <span>Sin eventos próximos</span>
                </div>
              )}

              {groups.map((group) => (
                <div key={group.label} className="kevents-panel__group">
                  <div className="kevents-panel__group-label">{group.label}</div>
                  {group.events.map((event) => {
                    const typeInfo = getEventTypeInfo(event.event_type)
                    const time = !event.is_all_day && event.start_datetime.includes('T')
                      ? event.start_datetime.split('T')[1]?.slice(0, 5)
                      : null

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="kevents-panel__card"
                      >
                        <div
                          className="kevents-panel__card-accent"
                          style={{ backgroundColor: event.color ?? projectColor ?? 'var(--color-primary)' }}
                        />
                        <div className="kevents-panel__card-content">
                          <div className="kevents-panel__card-header">
                            <EventTypeIcon type={event.event_type} size={13} className="kevents-panel__card-icon" />
                            <span className="kevents-panel__card-title">{event.title}</span>
                          </div>
                          <div className="kevents-panel__card-meta">
                            <span className="kevents-panel__card-date">
                              <Calendar size={10} />
                              {formatEventDate(event.start_datetime)}
                            </span>
                            {time && (
                              <span className="kevents-panel__card-time">
                                <Clock size={10} />
                                {time}
                              </span>
                            )}
                            {event.location && (
                              <span className="kevents-panel__card-location">
                                <MapPin size={10} />
                                {event.location}
                              </span>
                            )}
                          </div>
                          <span className="kevents-panel__card-type-badge">{typeInfo.label}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
