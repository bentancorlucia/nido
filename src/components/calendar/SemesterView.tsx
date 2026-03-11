import { useMemo, useState } from 'react'
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
  differenceInDays,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { staggerContainer, staggerItem } from '../../lib/animations'
import { MiniDayCell } from './DayCell'

const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface SemesterViewProps {
  onClickDay: (date: Date) => void
}

export function SemesterView({ onClickDay }: SemesterViewProps) {
  const { currentDate, setCurrentDate, getEventsForDate, events } = useCalendarStore()
  const { projects } = useProjectStore()
  const { tasks } = useTaskStore()

  // Default semester: Mar-Jul or Aug-Dec
  const currentMonth = currentDate.getMonth()
  const defaultStart = currentMonth < 7 ? 2 : 7 // Mar(2) or Aug(7)
  const [semesterStart, setSemesterStart] = useState(defaultStart)
  const semesterMonths = 5

  const year = currentDate.getFullYear()
  const months = useMemo(
    () => Array.from({ length: semesterMonths }, (_, i) => new Date(year, semesterStart + i, 1)),
    [year, semesterStart]
  )

  const timelineStart = months[0]
  const timelineEnd = endOfMonth(months[months.length - 1])
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1

  // Active projects for timeline bars
  const activeProjects = useMemo(
    () => projects.filter((p) => p.is_archived === 0 && p.is_template === 0),
    [projects]
  )

  // Deadlines (tasks with due_date in semester range)
  const deadlines = useMemo(() => {
    const start = format(timelineStart, 'yyyy-MM-dd')
    const end = format(timelineEnd, 'yyyy-MM-dd')
    return tasks.filter(
      (t) => t.due_date && t.due_date >= start && t.due_date <= end && t.is_completed === 0
    )
  }, [tasks, timelineStart, timelineEnd])

  function dayToPercent(dateStr: string): number {
    const d = parseISO(dateStr)
    const days = differenceInDays(d, timelineStart)
    return (days / totalDays) * 100
  }

  const navigateSemester = (delta: number) => {
    const newStart = semesterStart + delta * semesterMonths
    if (newStart >= 0 && newStart < 12) {
      setSemesterStart(newStart)
    } else {
      setCurrentDate(new Date(year + delta, semesterStart, 1))
    }
  }

  const semesterLabel = `${format(months[0], 'MMMM', { locale: es })} - ${format(months[months.length - 1], 'MMMM yyyy', { locale: es })}`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-display font-bold text-text-primary capitalize tracking-tight">
          {semesterLabel}
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={semesterStart}
            onChange={(e) => setSemesterStart(Number(e.target.value))}
            className="text-xs rounded-lg px-2 py-1.5 border border-border bg-surface-solid/50
                       text-text-primary focus:border-border-focus outline-none"
          >
            <option value={2}>Mar - Jul</option>
            <option value={7}>Ago - Dic</option>
            <option value={0}>Ene - May</option>
          </select>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateSemester(-1)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                         hover:bg-surface-alt/60 transition-colors"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateSemester(1)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary
                         hover:bg-surface-alt/60 transition-colors"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-4">
        <div className="glass rounded-xl p-4 overflow-x-auto">
          {/* Month labels */}
          <div className="flex border-b border-border pb-2 mb-3">
            {months.map((m) => {
              const mStart = differenceInDays(m, timelineStart)
              const mEnd = differenceInDays(endOfMonth(m), timelineStart)
              const left = (mStart / totalDays) * 100
              const width = ((mEnd - mStart + 1) / totalDays) * 100
              return (
                <div
                  key={m.toISOString()}
                  className="text-[11px] font-semibold text-text-secondary capitalize"
                  style={{ width: `${width}%`, minWidth: 0 }}
                >
                  {format(m, 'MMMM', { locale: es })}
                </div>
              )
            })}
          </div>

          {/* Project bars */}
          <div className="relative min-h-[80px] space-y-2">
            {activeProjects.length === 0 && (
              <p className="text-xs text-text-muted py-4 text-center">
                No hay proyectos activos para mostrar
              </p>
            )}
            {activeProjects.slice(0, 8).map((project) => (
              <div key={project.id} className="relative h-7 flex items-center">
                <div
                  className="h-5 rounded-full flex items-center px-2 text-[10px] font-medium text-white truncate"
                  style={{
                    backgroundColor: project.color || 'var(--color-primary)',
                    width: `${60 + Math.random() * 30}%`,
                    opacity: 0.8,
                  }}
                >
                  {project.name}
                </div>
              </div>
            ))}

            {/* Deadline diamonds */}
            {deadlines.map((task) => {
              if (!task.due_date) return null
              const left = dayToPercent(task.due_date)
              if (left < 0 || left > 100) return null
              return (
                <div
                  key={task.id}
                  className="absolute -top-1"
                  style={{ left: `${left}%` }}
                  title={`${task.title} — ${task.due_date}`}
                >
                  <Diamond size={10} className="text-warning fill-warning" />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mini calendars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 grid grid-cols-5 gap-3 px-6 pb-6 overflow-y-auto"
      >
        {months.map((monthDate) => (
          <motion.div key={monthDate.getMonth()} variants={staggerItem}>
            <SemesterMiniMonth
              monthDate={monthDate}
              getEventsForDate={getEventsForDate}
              onClickDay={onClickDay}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function SemesterMiniMonth({
  monthDate,
  getEventsForDate,
  onClickDay,
}: {
  monthDate: Date
  getEventsForDate: (dateStr: string) => unknown[]
  onClickDay: (date: Date) => void
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
    <div className="glass rounded-xl p-3">
      <h3 className="text-[12px] font-display font-semibold text-text-primary mb-2 capitalize">
        {format(monthDate, 'MMMM', { locale: es })}
      </h3>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="text-center text-[9px] text-text-muted font-medium">
            {d}
          </span>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const eventCount = getEventsForDate(dateStr).length
            return (
              <MiniDayCell
                key={day.toISOString()}
                date={day}
                currentMonth={monthDate}
                eventCount={eventCount}
                onClick={onClickDay}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
