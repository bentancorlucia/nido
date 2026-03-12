import { motion } from 'framer-motion'
import { isToday, isSameMonth } from 'date-fns'
import { EventChip } from './EventChip'
import type { CalendarEvent } from '../../types'

interface DayCellProps {
  date: Date
  currentMonth: Date
  events: CalendarEvent[]
  onClickDay?: (date: Date) => void
  onClickEvent?: (event: CalendarEvent) => void
}

const MAX_VISIBLE_EVENTS = 3

export function DayCell({ date, currentMonth, events, onClickDay, onClickEvent }: DayCellProps) {
  const today = isToday(date)
  const inMonth = isSameMonth(date, currentMonth)
  const dayNum = date.getDate()
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS)
  const remaining = events.length - MAX_VISIBLE_EVENTS

  return (
    <motion.div
      whileHover={{ backgroundColor: 'var(--color-surface-alt)' }}
      onClick={() => onClickDay?.(date)}
      className={`daycell ${!inMonth ? 'daycell-outside' : ''}`}
    >
      <div className="daycell-top">
        <span
          className={`daycell-num ${
            today
              ? 'daycell-num-today'
              : inMonth
                ? 'daycell-num-month'
                : 'daycell-num-other'
          }`}
        >
          {dayNum}
        </span>
      </div>

      <div className="daycell-events">
        {visibleEvents.map((event) => (
          <div key={event.id} onClick={(e) => e.stopPropagation()}>
            <EventChip
              event={event}
              compact
              onClick={() => onClickEvent?.(event)}
            />
          </div>
        ))}
        {remaining > 0 && (
          <span className="daycell-more">
            +{remaining} más
          </span>
        )}
      </div>
    </motion.div>
  )
}

interface MiniDayCellProps {
  date: Date
  currentMonth: Date
  eventCount: number
  onClick?: (date: Date) => void
}

export function MiniDayCell({ date, currentMonth, eventCount, onClick }: MiniDayCellProps) {
  const today = isToday(date)
  const inMonth = isSameMonth(date, currentMonth)

  return (
    <button
      onClick={() => onClick?.(date)}
      className={`mini-daycell ${!inMonth ? 'mini-daycell-outside' : ''} ${
        today
          ? 'mini-daycell-today'
          : 'mini-daycell-normal'
      }`}
    >
      {date.getDate()}
      {eventCount > 0 && !today && (
        <span className="mini-daycell-dots">
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
            <span key={i} className="mini-daycell-dot" />
          ))}
        </span>
      )}
    </button>
  )
}
