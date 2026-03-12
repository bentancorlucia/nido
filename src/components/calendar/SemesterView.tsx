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
const FIXED_WEEKS = 6

interface SemesterViewProps {
  onClickDay: (date: Date) => void
}

export function SemesterView({ onClickDay }: SemesterViewProps) {
  const { currentDate, setCurrentDate, getEventsForDate } = useCalendarStore()
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

  // Compute project task counts for proportional bar widths
  const projectTaskInfo = useMemo(() => {
    const semStart = format(timelineStart, 'yyyy-MM-dd')
    const semEnd = format(timelineEnd, 'yyyy-MM-dd')
    return activeProjects.slice(0, 8).map((project) => {
      const projectTasks = tasks.filter((t) => t.project_id === project.id)
      const total = projectTasks.length
      const completed = projectTasks.filter((t) => t.is_completed === 1).length
      const hasDatesInRange = projectTasks.some(
        (t) => t.due_date && t.due_date >= semStart && t.due_date <= semEnd
      )
      return { project, total, completed, hasDatesInRange }
    })
  }, [activeProjects, tasks, timelineStart, timelineEnd])

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

  // Today marker position
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayPercent = dayToPercent(todayStr)
  const showTodayMarker = todayPercent >= 0 && todayPercent <= 100

  const navigateSemester = (delta: number) => {
    const newStart = semesterStart + delta * semesterMonths
    if (newStart >= 0 && newStart < 12) {
      setSemesterStart(newStart)
    } else {
      setCurrentDate(new Date(year + delta, semesterStart, 1))
    }
  }

  const semesterLabel = `${format(months[0], 'MMMM', { locale: es })} — ${format(months[months.length - 1], 'MMMM yyyy', { locale: es })}`

  return (
    <div className="semester-root">
      {/* Header */}
      <div className="semester-header">
        <h2 className="semester-title">
          {semesterLabel}
        </h2>
        <div className="semester-controls">
          <select
            value={semesterStart}
            onChange={(e) => setSemesterStart(Number(e.target.value))}
            className="semester-select"
          >
            <option value={2}>Mar — Jul</option>
            <option value={7}>Ago — Dic</option>
            <option value={0}>Ene — May</option>
          </select>
          <div className="semester-nav">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateSemester(-1)}
              className="cal-nav-btn"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateSemester(1)}
              className="cal-nav-btn"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="semester-timeline">
        <div className="glass semester-timeline-inner">
          {/* Month columns */}
          <div className="semester-month-labels">
            {months.map((m, idx) => {
              const mStart = differenceInDays(m, timelineStart)
              const mEnd = differenceInDays(endOfMonth(m), timelineStart)
              const width = ((mEnd - mStart + 1) / totalDays) * 100
              return (
                <div
                  key={m.toISOString()}
                  className={`semester-month-label ${idx < months.length - 1 ? 'semester-month-label-border' : ''}`}
                  style={{ width: `${width}%`, minWidth: 0 }}
                >
                  {format(m, 'MMM', { locale: es })}
                </div>
              )
            })}
          </div>

          {/* Project bars */}
          <div className="semester-bars">
            {projectTaskInfo.length === 0 && (
              <p className="semester-bars-empty">
                No hay proyectos activos para mostrar
              </p>
            )}
            {projectTaskInfo.map(({ project, total, completed }) => {
              // Deterministic width: base 40% + up to 55% based on task count
              const maxTasks = Math.max(...projectTaskInfo.map((p) => p.total), 1)
              const barWidth = 40 + (total / maxTasks) * 55
              const completionRatio = total > 0 ? completed / total : 0
              return (
                <div key={project.id} className="semester-project-row">
                  <div
                    className="semester-project-bar"
                    style={{
                      backgroundColor: project.color || 'var(--color-primary)',
                      width: `${barWidth}%`,
                    }}
                  >
                    <span className="semester-project-bar-name">{project.name}</span>
                    {total > 0 && (
                      <span className="semester-project-bar-progress">
                        {Math.round(completionRatio * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Today marker */}
            {showTodayMarker && (
              <div
                className="semester-today-marker"
                style={{ left: `${todayPercent}%` }}
              >
                <div className="semester-today-line" />
              </div>
            )}

            {/* Deadline diamonds */}
            {deadlines.length > 0 && (
              <div className="semester-deadlines-row">
                {deadlines.map((task) => {
                  if (!task.due_date) return null
                  const left = dayToPercent(task.due_date)
                  if (left < 0 || left > 100) return null
                  return (
                    <div
                      key={task.id}
                      className="semester-deadline"
                      style={{ left: `${left}%` }}
                      title={`${task.title} — ${task.due_date}`}
                    >
                      <Diamond size={10} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini calendars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="semester-mini-grid"
      >
        {months.map((monthDate) => {
          const isCurrentMonth =
            monthDate.getMonth() === new Date().getMonth() &&
            monthDate.getFullYear() === new Date().getFullYear()
          return (
            <motion.div key={monthDate.getMonth()} variants={staggerItem}>
              <SemesterMiniMonth
                monthDate={monthDate}
                isCurrent={isCurrentMonth}
                getEventsForDate={getEventsForDate}
                onClickDay={onClickDay}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

function SemesterMiniMonth({
  monthDate,
  isCurrent,
  getEventsForDate,
  onClickDay,
}: {
  monthDate: Date
  isCurrent: boolean
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
    <div className={`glass semester-mini-month ${isCurrent ? 'semester-mini-month-current' : ''}`}>
      <h3 className={`semester-mini-month-title ${isCurrent ? 'semester-mini-month-title-current' : ''}`}>
        {format(monthDate, 'MMMM', { locale: es })}
      </h3>

      <div className="semester-mini-weekdays">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="semester-mini-weekday">
            {d}
          </span>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="semester-mini-week">
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
