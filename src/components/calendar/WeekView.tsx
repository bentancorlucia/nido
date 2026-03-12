import { useMemo, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  differenceInMinutes,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import type { CalendarEvent } from '../../types'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7:00 - 23:00
const HOUR_HEIGHT = 64 // px per hour

interface WeekViewProps {
  onClickEvent: (event: CalendarEvent) => void
  onClickSlot: (date: Date, hour: number) => void
}

export function WeekView({ onClickEvent, onClickSlot }: WeekViewProps) {
  const { currentDate, navigateWeek, goToToday, getEventsForDate } = useCalendarStore()
  const [now, setNow] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)

  // Update "now" line every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = now.getHours()
      const scrollTo = Math.max(0, (currentHour - 7) * HOUR_HEIGHT - 100)
      scrollRef.current.scrollTop = scrollTo
    }
  }, [])

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  )

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    const startStr = format(weekStart, 'd', { locale: es })
    const endStr = format(end, 'd', { locale: es })
    const monthStr = format(weekStart, 'MMMM', { locale: es })
    const yearStr = format(weekStart, 'yyyy')
    return `Semana del ${startStr} - ${endStr} ${monthStr} ${yearStr}`
  }, [weekStart])

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.start_datetime)
    const end = parseISO(event.end_datetime)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const duration = Math.max(differenceInMinutes(end, start), 30)
    const top = ((startMinutes - 7 * 60) / 60) * HOUR_HEIGHT
    const height = (duration / 60) * HOUR_HEIGHT
    return { top: Math.max(0, top), height: Math.max(height, 24) }
  }

  return (
    <div className="week-root">
      {/* Header */}
      <div className="week-header">
        <div className="week-header-left">
          <h2 className="week-title">
            {weekLabel}
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="month-today-btn"
          >
            Hoy
          </motion.button>
        </div>
        <div className="week-nav">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateWeek(-1)}
            className="cal-nav-btn"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateWeek(1)}
            className="cal-nav-btn"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Day headers */}
      <div className="week-day-headers">
        <div />
        {days.map((day) => {
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={`week-day-header ${today ? 'week-day-header-today' : ''}`}
            >
              <span className="week-day-name">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span
                className={`week-day-num ${today ? 'week-day-num-today' : 'week-day-num-normal'}`}
              >
                {format(day, 'd')}
              </span>
            </div>
          )
        })}
      </div>

      {/* All-day events section */}
      <AllDaySection days={days} onClickEvent={onClickEvent} />

      {/* Timeline grid */}
      <div ref={scrollRef} className="week-timeline-scroll">
        <div className="week-timeline-grid">
          {/* Hour labels */}
          <div className="week-hours-col">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="week-hour-label"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="week-hour-label-text">{`${hour.toString().padStart(2, '0')}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEvents = getEventsForDate(dateStr).filter((e) => e.is_all_day !== 1)
            const today = isToday(day)

            return (
              <div
                key={dateStr}
                className={`week-day-col ${today ? 'week-day-col-today' : ''}`}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="week-hour-slot"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => onClickSlot(day, hour)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event)
                  const bgColor = event.color || 'var(--color-primary)'
                  return (
                    <motion.button
                      key={event.id}
                      whileHover={{ scale: 1.02, zIndex: 20 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onClickEvent(event)}
                      className="week-event-block"
                      style={{
                        top,
                        height,
                        backgroundColor: `${bgColor}25`,
                        borderLeft: `3px solid ${bgColor}`,
                      }}
                    >
                      <span className="week-event-title" style={{ color: bgColor }}>
                        {event.title}
                      </span>
                      {height > 40 && (
                        <span className="week-event-time" style={{ color: bgColor }}>
                          {format(parseISO(event.start_datetime), 'HH:mm')} -{' '}
                          {format(parseISO(event.end_datetime), 'HH:mm')}
                        </span>
                      )}
                    </motion.button>
                  )
                })}

                {/* Now line */}
                {today && <NowLine />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NowLine() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const minutes = now.getHours() * 60 + now.getMinutes()
  const top = ((minutes - 7 * 60) / 60) * HOUR_HEIGHT

  if (top < 0 || top > HOURS.length * HOUR_HEIGHT) return null

  return (
    <div
      className="week-now-line"
      style={{ top }}
    >
      <div className="week-now-line-inner">
        <div className="week-now-dot" />
        <div className="week-now-bar" />
      </div>
    </div>
  )
}

function AllDaySection({
  days,
  onClickEvent,
}: {
  days: Date[]
  onClickEvent: (event: CalendarEvent) => void
}) {
  const { getEventsForDate } = useCalendarStore()

  const allDayEvents = useMemo(() => {
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      return getEventsForDate(dateStr).filter((e) => e.is_all_day === 1)
    })
  }, [days, getEventsForDate])

  const hasAny = allDayEvents.some((e) => e.length > 0)
  if (!hasAny) return null

  return (
    <div className="week-allday">
      <div className="week-allday-label">
        Todo el día
      </div>
      {allDayEvents.map((events, i) => (
        <div key={i} className="week-allday-cell">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onClickEvent(event)}
              className="week-allday-event"
              style={{
                backgroundColor: `${event.color || 'var(--color-primary)'}25`,
                color: event.color || 'var(--color-primary)',
              }}
            >
              {event.title}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
