import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, ArrowRight } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { dbQuery } from '../../lib/ipc'
import { localDateStr } from '../../lib/dates'
import { getEventTypeInfo, EventTypeIcon } from '../../lib/eventTypes'
import type { CalendarEvent } from '../../types'

interface EventWithProject extends CalendarEvent {
  project_name: string | null
  project_color: string | null
}

interface EventGroup {
  label: string
  date: string
  events: EventWithProject[]
}

const NON_EVENT_TYPES = ['parcial', 'reunion', 'entrega', 'hito', 'control']

export function UpcomingEventsWidget() {
  const [groups, setGroups] = useState<EventGroup[]>([])

  useEffect(() => {
    loadEvents()
    const interval = setInterval(loadEvents, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadEvents() {
    const today = localDateStr()
    const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

    const placeholders = NON_EVENT_TYPES.map(() => '?').join(',')
    const events = await dbQuery<EventWithProject>(
      `SELECT e.*, p.name as project_name, p.color as project_color
       FROM events e
       LEFT JOIN projects p ON e.project_id = p.id
       WHERE e.event_type IN (${placeholders})
         AND date(e.start_datetime) >= ? AND date(e.start_datetime) <= ?
       ORDER BY e.start_datetime ASC
       LIMIT 20`,
      [...NON_EVENT_TYPES, today, endDate]
    )

    const grouped: Record<string, EventWithProject[]> = {}
    for (const ev of events) {
      const date = ev.start_datetime.slice(0, 10)
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(ev)
    }

    const result: EventGroup[] = Object.entries(grouped).map(([date, groupedEvents]) => {
      const parsed = parseISO(date)
      let label = format(parsed, "EEEE d 'de' MMMM", { locale: es })
      if (isToday(parsed)) label = 'Hoy'
      else if (isTomorrow(parsed)) label = 'Mañana'
      return { label, date, events: groupedEvents }
    })

    setGroups(result)
  }

  const today = localDateStr()

  if (groups.length === 0) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">
          <CalendarClock size={22} />
        </div>
        <p className="upcevents-empty-title">Sin eventos próximos</p>
        <p className="upcevents-empty-subtitle">No hay parciales, entregas ni reuniones en los próximos 30 días</p>
      </div>
    )
  }

  return (
    <div className="widget-scroll upcevents-list">
      {groups.map((group, gi) => {
        const daysFromToday = Math.ceil(
          (new Date(group.date).getTime() - new Date(today).getTime()) / 86400000
        )

        return (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.06 }}
          >
            {/* Date label */}
            <div className="deadlines-date-row">
              <span
                className={`deadlines-date-label ${
                  daysFromToday <= 0 ? 'danger' : daysFromToday <= 2 ? 'warning' : 'normal'
                }`}
              >
                {group.label}
              </span>
              <div className="deadlines-divider" />
            </div>

            {/* Events */}
            <div className="deadlines-tasks">
              {group.events.map((ev) => {
                const daysLeft = Math.ceil(
                  (new Date(ev.start_datetime.slice(0, 10)).getTime() - new Date(today).getTime()) / 86400000
                )
                const typeInfo = getEventTypeInfo(ev.event_type)

                const badgeClass =
                  daysLeft <= 0 ? 'danger' : daysLeft <= 2 ? 'warning' : 'info'
                const badge = daysLeft <= 0 ? 'HOY' : daysLeft === 1 ? '1D' : `${daysLeft}D`

                const timeStr = ev.is_all_day
                  ? null
                  : format(parseISO(ev.start_datetime), 'HH:mm')

                return (
                  <div key={ev.id} className="upcevents-row">
                    {ev.project_color && (
                      <div
                        style={{
                          width: 3,
                          minHeight: 24,
                          borderRadius: 2,
                          backgroundColor: ev.project_color,
                        }}
                      />
                    )}
                    <div className={`upcevents-type-icon ${ev.event_type}`}>
                      <EventTypeIcon type={ev.event_type} size={13} />
                    </div>

                    <div className="deadlines-task-content">
                      <p className="deadlines-task-title">{ev.title}</p>
                      <div className="upcevents-meta">
                        <span className="upcevents-type-label">{typeInfo.label}</span>
                        {timeStr && (
                          <>
                            <span className="upcevents-dot">·</span>
                            <span className="upcevents-time">{timeStr}</span>
                          </>
                        )}
                        {ev.project_name && (
                          <>
                            <span className="upcevents-dot">·</span>
                            <span
                              className="deadlines-project-pill"
                              style={{
                                backgroundColor: ev.project_color
                                  ? `${ev.project_color}18`
                                  : undefined,
                                color: ev.project_color ?? undefined,
                              }}
                            >
                              {ev.project_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className={`urgency-badge ${badgeClass}`}>
                      {badge}
                      <ArrowRight size={9} />
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
