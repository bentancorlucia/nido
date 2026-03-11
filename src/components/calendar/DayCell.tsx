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
      className={`
        relative min-h-[96px] p-1.5 border-b border-r border-border/70
        cursor-pointer transition-colors duration-150
        ${!inMonth ? 'opacity-30' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            inline-flex items-center justify-center w-7 h-7 rounded-full
            text-[13px] font-medium transition-colors
            ${today
              ? 'bg-primary text-text-on-primary shadow-sm'
              : inMonth
                ? 'text-text-primary hover:bg-surface-alt'
                : 'text-text-muted'
            }
          `}
        >
          {dayNum}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
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
          <span className="text-[10px] text-text-muted font-medium px-1.5 py-0.5">
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
      className={`
        relative flex items-center justify-center w-7 h-7 rounded-full
        text-[11px] transition-colors cursor-pointer
        ${!inMonth ? 'opacity-25' : ''}
        ${today
          ? 'bg-primary text-text-on-primary font-bold'
          : 'text-text-primary hover:bg-surface-alt'
        }
      `}
    >
      {date.getDate()}
      {eventCount > 0 && !today && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-primary"
            />
          ))}
        </span>
      )}
    </button>
  )
}
