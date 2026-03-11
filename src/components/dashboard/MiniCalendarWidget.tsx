import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { dbQuery } from '../../lib/ipc'
import { useUIStore } from '../../stores/useUIStore'

export function MiniCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [eventDates, setEventDates] = useState<Set<string>>(new Set())
  const [taskDates, setTaskDates] = useState<Set<string>>(new Set())
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  useEffect(() => {
    loadDots()
  }, [currentMonth])

  async function loadDots() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const events = await dbQuery<{ start_datetime: string }>(
      `SELECT start_datetime FROM events WHERE date(start_datetime) >= ? AND date(start_datetime) <= ?`,
      [start, end]
    )
    const tasks = await dbQuery<{ due_date: string }>(
      `SELECT due_date FROM tasks WHERE due_date >= ? AND due_date <= ? AND is_archived = 0 AND is_completed = 0`,
      [start, end]
    )

    setEventDates(new Set(events.map((e) => e.start_datetime.split('T')[0])))
    setTaskDates(new Set(tasks.map((t) => t.due_date)))
  }

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div className="h-full flex flex-col">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
          className="p-0.5 rounded hover:bg-surface-alt transition-colors"
        >
          <ChevronLeft size={14} className="text-text-muted" />
        </button>
        <span className="text-xs font-semibold text-text-primary capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-0.5 rounded hover:bg-surface-alt transition-colors"
        >
          <ChevronRight size={14} className="text-text-muted" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-medium text-text-muted uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0 flex-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const hasEvent = eventDates.has(dateStr)
          const hasTask = taskDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => setCurrentPage('calendar')}
              className={`relative flex flex-col items-center justify-center rounded-md text-[10px] transition-all
                ${!inMonth ? 'text-text-muted/30' : 'text-text-primary hover:bg-surface-alt'}
                ${today ? 'bg-primary/15 text-primary font-bold ring-1 ring-primary/30' : ''}
              `}
              style={{ aspectRatio: '1' }}
            >
              {format(day, 'd')}
              {inMonth && (hasEvent || hasTask) && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {hasEvent && <span className="w-1 h-1 rounded-full bg-primary" />}
                  {hasTask && <span className="w-1 h-1 rounded-full bg-warning" />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
