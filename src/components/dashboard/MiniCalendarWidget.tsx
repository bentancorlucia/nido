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
    <div className="minical-container">
      {/* Month navigation */}
      <div className="minical-nav">
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
          className="minical-nav-btn"
        >
          <ChevronLeft size={15} />
        </button>

        <button
          onClick={() => setCurrentMonth(new Date())}
          className="minical-month-btn"
        >
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </button>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="minical-nav-btn"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="minical-weekdays">
        {weekDays.map((d, i) => (
          <div key={i} className="minical-weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="minical-grid">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, currentMonth)
          const todayDay = isToday(day)
          const hasEvent = eventDates.has(dateStr)
          const hasTask = taskDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => setCurrentPage('calendar')}
              className={`mini-cal-day ${todayDay ? 'today' : ''} ${!inMonth ? 'other-month' : ''}`}
            >
              {format(day, 'd')}

              {inMonth && (hasEvent || hasTask) && (
                <div className="minical-dots">
                  {hasEvent && <span className="mini-cal-dot" style={{ background: 'var(--color-primary)' }} />}
                  {hasTask && <span className="mini-cal-dot" style={{ background: 'var(--color-warning)' }} />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
