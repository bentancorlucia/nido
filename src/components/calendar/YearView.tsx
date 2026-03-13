import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { staggerContainer, staggerItem } from '../../lib/animations'

const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const FIXED_WEEKS = 6

interface YearViewProps {
  onClickMonth: (date: Date) => void
}

export function YearView({ onClickMonth }: YearViewProps) {
  const { currentDate, setCurrentDate, getEventsForDate } = useCalendarStore()
  const { tasks } = useTaskStore()
  const year = currentDate.getFullYear()
  const currentMonthIndex = currentDate.getMonth()

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  )

  const navigateYear = (delta: number) => {
    setCurrentDate(new Date(year + delta, 0, 1))
  }

  return (
    <div className="year-root">
      {/* Header */}
      <div className="year-header">
        <h2 className="year-title">
          {year}
        </h2>
        <div className="year-nav">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateYear(-1)}
            className="cal-nav-btn"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateYear(1)}
            className="cal-nav-btn"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* 4x3 grid of mini calendars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="year-grid"
      >
        {months.map((monthDate) => (
          <motion.div key={monthDate.getMonth()} variants={staggerItem}>
            <MiniMonth
              monthDate={monthDate}
              isCurrent={monthDate.getMonth() === currentMonthIndex}
              getEventsForDate={getEventsForDate}
              tasks={tasks}
              onClick={() => onClickMonth(monthDate)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function MiniMonth({
  monthDate,
  isCurrent,
  getEventsForDate,
  tasks,
  onClick,
}: {
  monthDate: Date
  isCurrent: boolean
  getEventsForDate: (dateStr: string) => import('../../types').CalendarEvent[]
  tasks: import('../../types').Task[]
  onClick: () => void
}) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
    const rows: Date[][] = []
    let day = start
    while (day <= end) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      rows.push(week)
    }
    // Pad to FIXED_WEEKS rows for uniform height
    while (rows.length < FIXED_WEEKS) {
      const lastDay = rows[rows.length - 1][6]
      const week: Date[] = []
      let d = addDays(lastDay, 1)
      for (let i = 0; i < 7; i++) {
        week.push(d)
        d = addDays(d, 1)
      }
      rows.push(week)
    }
    return rows
  }, [monthDate])

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`glass year-mini-month ${isCurrent ? 'year-mini-month-current' : ''}`}
    >
      <h3 className={`year-mini-month-title ${isCurrent ? 'year-mini-month-title-current' : ''}`}>
        {format(monthDate, 'MMMM', { locale: es })}
      </h3>

      {/* Weekday headers */}
      <div className="year-mini-weekdays">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="year-mini-weekday">
            {d}
          </span>
        ))}
      </div>

      {/* Days */}
      {weeks.map((week, wi) => (
        <div key={wi} className="year-mini-week">
          {week.map((day) => {
            const inMonth = isSameMonth(day, monthDate)
            const today = isToday(day)
            const dateStr = format(day, 'yyyy-MM-dd')
            const typedEvents = getEventsForDate(dateStr).filter((e) => e.event_type && e.event_type !== 'evento').length
            const taskCount = tasks.filter((t) => t.due_date && t.due_date.split('T')[0] === dateStr && t.is_archived === 0).length
            const eventCount = typedEvents + taskCount

            // Heatmap intensity
            let heatClass = ''
            if (eventCount > 0 && inMonth) {
              if (eventCount >= 4) heatClass = 'year-mini-day-heat-3'
              else if (eventCount >= 2) heatClass = 'year-mini-day-heat-2'
              else heatClass = 'year-mini-day-heat-1'
            }

            return (
              <div
                key={day.toISOString()}
                className={`year-mini-day ${
                  !inMonth
                    ? 'year-mini-day-hidden'
                    : today
                      ? 'year-mini-day-today'
                      : `year-mini-day-normal ${heatClass}`
                }`}
              >
                {inMonth ? day.getDate() : ''}
              </div>
            )
          })}
        </div>
      ))}
    </motion.button>
  )
}
