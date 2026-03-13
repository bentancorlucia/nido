import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useProjectStore } from '../../stores/useProjectStore'
import { EventTypeIcon } from '../../lib/eventTypes'
import type { CalendarEvent } from '../../types'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7:00 - 23:00
const HOUR_HEIGHT = 64 // px per hour

interface WeekViewProps {
  onClickEvent: (event: CalendarEvent) => void
  onClickSlot: (date: Date, hour: number) => void
  /** Called when drag-creating to pass the range */
  onDragCreateSlot?: (date: Date, startHour: number, endHour: number) => void
  /** Called with anchor position for popover placement */
  onSlotClick?: (date: Date, hour: number, anchorPos: { top: number; left: number }) => void
}

export function WeekView({ onClickEvent, onClickSlot, onDragCreateSlot, onSlotClick }: WeekViewProps) {
  const { currentDate, navigateWeek, goToToday, getEventsForDate } = useCalendarStore()
  const { projects } = useProjectStore()
  const [now, setNow] = useState(new Date())

  // Build project_id → color map
  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of projects) {
      if (p.color) map[p.id] = p.color
    }
    return map
  }, [projects])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Drag-to-create state
  const [dragState, setDragState] = useState<{
    dayIndex: number
    startHour: number
    currentHour: number
    active: boolean
  } | null>(null)
  const dragRef = useRef(false)

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

  // Drag-to-create handlers
  const handleMouseDown = useCallback((dayIndex: number, hour: number, e: React.MouseEvent) => {
    // Only left click, not on events
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('.week-event-block')) return
    e.preventDefault()
    dragRef.current = true
    setDragState({ dayIndex, startHour: hour, currentHour: hour + 1, active: true })
  }, [])

  const handleMouseMove = useCallback((hour: number) => {
    if (!dragRef.current || !dragState) return
    const newEnd = Math.max(dragState.startHour + 1, hour + 1)
    if (newEnd !== dragState.currentHour) {
      setDragState((prev) => prev ? { ...prev, currentHour: newEnd } : null)
    }
  }, [dragState])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !dragState) return
    dragRef.current = false

    const day = days[dragState.dayIndex]
    const minHour = Math.min(dragState.startHour, dragState.currentHour)
    const maxHour = Math.max(dragState.startHour, dragState.currentHour)

    if (maxHour - minHour > 1 && onDragCreateSlot) {
      // Multi-hour drag: use drag create with range
      onDragCreateSlot(day, minHour, maxHour)
    } else if (maxHour - minHour <= 1) {
      // Single slot click: use popover or fallback
      if (onSlotClick) {
        const rect = (e.target as HTMLElement)?.getBoundingClientRect?.()
        const anchorPos = rect
          ? { top: rect.top, left: rect.left + rect.width / 2 }
          : { top: e.clientY, left: e.clientX }
        onSlotClick(day, dragState.startHour, anchorPos)
      } else {
        onClickSlot(day, dragState.startHour)
      }
    }

    setDragState(null)
  }, [dragState, days, onDragCreateSlot, onSlotClick, onClickSlot])

  useEffect(() => {
    if (dragRef.current) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  // Compute drag preview bounds
  const dragPreview = useMemo(() => {
    if (!dragState) return null
    const minHour = Math.min(dragState.startHour, dragState.currentHour)
    const maxHour = Math.max(dragState.startHour, dragState.currentHour)
    const top = (minHour - 7) * HOUR_HEIGHT
    const height = (maxHour - minHour) * HOUR_HEIGHT
    return { top, height, dayIndex: dragState.dayIndex, startHour: minHour, endHour: maxHour }
  }, [dragState])

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
      <AllDaySection days={days} onClickEvent={onClickEvent} projectColorMap={projectColorMap} />

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
          {days.map((day, dayIndex) => {
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
                    onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
                    onMouseEnter={() => handleMouseMove(hour)}
                  />
                ))}

                {/* Drag preview overlay */}
                <AnimatePresence>
                  {dragPreview && dragPreview.dayIndex === dayIndex && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="week-drag-preview"
                      style={{
                        top: dragPreview.top,
                        height: dragPreview.height,
                      }}
                    >
                      <span className="week-drag-preview-time">
                        {dragPreview.startHour.toString().padStart(2, '0')}:00 – {dragPreview.endHour.toString().padStart(2, '0')}:00
                      </span>
                      <span className="week-drag-preview-label">
                        Nuevo evento
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Events */}
                {dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event)
                  const bgColor = event.color || (event.project_id ? projectColorMap[event.project_id] : undefined) || '#01A7C2'
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
                        background: `linear-gradient(135deg, ${bgColor}30, ${bgColor}50)`,
                        borderLeft: `3.5px solid ${bgColor}`,
                        color: 'var(--color-text-primary)',
                        boxShadow: `0 1px 4px ${bgColor}18`,
                      }}
                    >
                      <span className="week-event-title">
                        <EventTypeIcon type={event.event_type} size={11} className="week-event-icon" />
                        {event.title}
                      </span>
                      {height > 40 && (
                        <span className="week-event-time">
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
  projectColorMap = {},
}: {
  days: Date[]
  onClickEvent: (event: CalendarEvent) => void
  projectColorMap?: Record<string, string>
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
          {events.map((event) => {
            const c = event.color || (event.project_id ? projectColorMap[event.project_id] : undefined) || '#01A7C2'
            return (
              <button
                key={event.id}
                onClick={() => onClickEvent(event)}
                className="week-allday-event"
                style={{
                  background: `linear-gradient(135deg, ${c}30, ${c}50)`,
                  borderLeft: `3px solid ${c}`,
                  color: 'var(--color-text-primary)',
                }}
              >
                {event.title}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
