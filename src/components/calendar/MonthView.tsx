import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { DayCell } from './DayCell'
import { staggerContainer, staggerItem } from '../../lib/animations'
import type { CalendarEvent } from '../../types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface MonthViewProps {
  onClickEvent: (event: CalendarEvent) => void
  onClickDay: (date: Date) => void
}

export function MonthView({ onClickEvent, onClickDay }: MonthViewProps) {
  const { currentDate, navigateMonth, goToToday, getEventsForDate } = useCalendarStore()

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows: Date[][] = []
    let day = calStart
    while (day <= calEnd) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      rows.push(week)
    }
    return rows
  }, [currentDate])

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: es })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '16px 28px' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-bold text-text-primary capitalize tracking-tight">
            {monthLabel}
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
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                       hover:bg-surface-alt/60 transition-colors"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-[11px] font-semibold text-text-muted uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div
        key={monthLabel}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 flex-1"
      >
        {weeks.flat().map((date, idx) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const events = getEventsForDate(dateStr)
          return (
            <motion.div key={dateStr + idx} variants={staggerItem}>
              <DayCell
                date={date}
                currentMonth={currentDate}
                events={events}
                onClickDay={onClickDay}
                onClickEvent={onClickEvent}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
