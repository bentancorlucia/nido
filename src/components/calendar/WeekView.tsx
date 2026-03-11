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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-display font-bold text-text-primary capitalize tracking-tight">
            {weekLabel}
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-primary bg-primary-light/50 rounded-lg
                       hover:bg-primary-light transition-colors"
          >
            Hoy
          </motion.button>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div />
        {days.map((day) => {
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={`
                py-2.5 text-center border-l border-border
                ${today ? 'bg-primary-light/30' : ''}
              `}
            >
              <span className="text-[11px] text-text-muted uppercase tracking-wider block">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span
                className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-0.5
                  ${today ? 'bg-primary text-text-on-primary' : 'text-text-primary'}
                `}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end pr-3 text-[11px] text-text-muted font-mono"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="-mt-2">{`${hour.toString().padStart(2, '0')}:00`}</span>
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
                className={`relative border-l border-border ${today ? 'bg-primary-light/10' : ''}`}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/50 cursor-pointer hover:bg-surface-alt/30 transition-colors"
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
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer
                                 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        top,
                        height,
                        backgroundColor: `${bgColor}25`,
                        borderLeft: `3px solid ${bgColor}`,
                      }}
                    >
                      <span className="text-[11px] font-medium block truncate" style={{ color: bgColor }}>
                        {event.title}
                      </span>
                      {height > 40 && (
                        <span className="text-[10px] opacity-70 font-mono block" style={{ color: bgColor }}>
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
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top }}
    >
      <div className="relative flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-danger -ml-1 shadow-sm" />
        <div className="flex-1 h-[2px] bg-danger/70" />
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
    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
      <div className="flex items-center justify-end pr-3 text-[10px] text-text-muted font-medium">
        Todo el día
      </div>
      {allDayEvents.map((events, i) => (
        <div key={i} className="border-l border-border p-1 flex flex-col gap-0.5 min-h-[32px]">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onClickEvent(event)}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-left cursor-pointer
                         hover:opacity-80 transition-opacity"
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
