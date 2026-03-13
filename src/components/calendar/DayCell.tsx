import { motion } from 'framer-motion'
import { isToday, isSameMonth } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import { EventChip } from './EventChip'
import type { CalendarEvent, Task } from '../../types'

interface DayCellProps {
  date: Date
  currentMonth: Date
  events: CalendarEvent[]
  tasks?: Task[]
  projectColorMap?: Record<string, string>
  onClickDay?: (date: Date) => void
  onClickEvent?: (event: CalendarEvent) => void
}

const MAX_VISIBLE_ITEMS = 3

export function DayCell({ date, currentMonth, events, tasks = [], projectColorMap = {}, onClickDay, onClickEvent }: DayCellProps) {
  const today = isToday(date)
  const inMonth = isSameMonth(date, currentMonth)
  const dayNum = date.getDate()

  // Merge events and tasks into a unified list for display limit
  const totalItems = events.length + tasks.length
  const visibleEvents = events.slice(0, MAX_VISIBLE_ITEMS)
  const remainingSlots = MAX_VISIBLE_ITEMS - visibleEvents.length
  const visibleTasks = tasks.slice(0, Math.max(0, remainingSlots))
  const remaining = totalItems - visibleEvents.length - visibleTasks.length

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
              projectColor={event.project_id ? projectColorMap[event.project_id] : undefined}
            />
          </div>
        ))}
        {visibleTasks.map((task) => {
          const taskColor = task.project_id ? projectColorMap[task.project_id] : undefined
          return (
            <div
              key={task.id}
              className={`daycell-task-chip${task.is_completed === 1 ? ' daycell-task-chip--done' : ''}`}
              style={taskColor ? {
                backgroundColor: `${taskColor}20`,
                borderLeft: `3px solid ${taskColor}`,
                color: taskColor,
              } : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle2 size={10} className="daycell-task-chip-icon" />
              <span className="daycell-task-chip-title">{task.title}</span>
            </div>
          )
        })}
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
