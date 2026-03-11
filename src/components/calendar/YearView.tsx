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
import { staggerContainer, staggerItem } from '../../lib/animations'

const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface YearViewProps {
  onClickMonth: (date: Date) => void
}

export function YearView({ onClickMonth }: YearViewProps) {
  const { currentDate, setCurrentDate, getEventsForDate } = useCalendarStore()
  const year = currentDate.getFullYear()

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  )

  const navigateYear = (delta: number) => {
    setCurrentDate(new Date(year + delta, 0, 1))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-2xl font-display font-bold text-text-primary tracking-tight">
          {year}
        </h2>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateYear(-1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateYear(1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* 4×3 grid of mini calendars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 grid grid-cols-4 gap-4 px-6 pb-6 overflow-y-auto"
      >
        {months.map((monthDate) => (
          <motion.div key={monthDate.getMonth()} variants={staggerItem}>
            <MiniMonth
              monthDate={monthDate}
              getEventsForDate={getEventsForDate}
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
  getEventsForDate,
  onClick,
}: {
  monthDate: Date
  getEventsForDate: (dateStr: string) => unknown[]
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
    return rows
  }, [monthDate])

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="glass rounded-xl p-3 cursor-pointer text-left hover:shadow-md transition-shadow w-full"
    >
      <h3 className="text-[13px] font-display font-semibold text-text-primary mb-2 capitalize">
        {format(monthDate, 'MMMM', { locale: es })}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="text-center text-[9px] text-text-muted font-medium">
            {d}
          </span>
        ))}
      </div>

      {/* Days */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day) => {
            const inMonth = isSameMonth(day, monthDate)
            const today = isToday(day)
            const dateStr = format(day, 'yyyy-MM-dd')
            const eventCount = getEventsForDate(dateStr).length

            // Heatmap intensity
            let heatClass = ''
            if (eventCount > 0 && inMonth) {
              if (eventCount >= 4) heatClass = 'bg-primary/40'
              else if (eventCount >= 2) heatClass = 'bg-primary/25'
              else heatClass = 'bg-primary/12'
            }

            return (
              <div
                key={day.toISOString()}
                className={`
                  flex items-center justify-center w-full aspect-square
                  text-[10px] rounded-sm
                  ${!inMonth ? 'opacity-0' : ''}
                  ${today ? 'bg-primary text-text-on-primary font-bold rounded-full' : heatClass}
                  ${!today && inMonth ? 'text-text-secondary' : ''}
                `}
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
