import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ListChecks, Clock, Timer, Sparkles,
  Zap, Circle,
  CalendarClock, Inbox,
} from 'lucide-react'
import { FadeIn } from '../../lib/animations'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { dbQuery } from '../../lib/ipc'
import { TimelineHour, HOUR_HEIGHT } from './TimelineHour'
import { TodayTask } from './TodayTask'
import type { ProjectInfo } from './TodayTask'
import type { Task } from '../../types'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6:00–23:00

function getGreeting(hour: number) {
  if (hour < 6) return { text: 'Buenas noches', emoji: '🌙' }
  if (hour < 12) return { text: 'Buenos días', emoji: '☀️' }
  if (hour < 14) return { text: 'Buen mediodía', emoji: '🌤️' }
  if (hour < 19) return { text: 'Buenas tardes', emoji: '🌅' }
  return { text: 'Buenas noches', emoji: '🌙' }
}

const motivationalMessages = [
  '¡Día libre! Disfrutá el momento ✨',
  'Nada pendiente. ¿Qué te gustaría hacer hoy?',
  'Todo despejado. Un buen día para crear algo nuevo.',
  '¡Sin tareas! Descansá o empezá algo divertido.',
]

// Deterministic slight rotation per task for post-it feel
function getPostItRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 5) - 2 // -2 to 2 degrees
}

function formatRelativeDate(dateStr: string, todayStr: string): string {
  const diff = differenceInDays(parseISO(dateStr), parseISO(todayStr))
  if (diff === 1) return 'Mañana'
  if (diff === 2) return 'Pasado mañana'
  if (diff <= 7) return format(parseISO(dateStr), "EEEE", { locale: es })
  return format(parseISO(dateStr), "d 'de' MMM", { locale: es })
}

export function TodayView() {
  const { loadEvents, getEventsForDate } = useCalendarStore()
  const { completeTask } = useTaskStore()
  const { sessionsToday, totalFocusToday } = usePomodoroStore()

  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [projectMap, setProjectMap] = useState<Record<string, ProjectInfo>>({})
  const [currentTime, setCurrentTime] = useState(new Date())
  const timelineRef = useRef<HTMLDivElement>(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayEvents = getEventsForDate(todayStr)

  useEffect(() => {
    loadEvents()
    loadTodayTasks()
    usePomodoroStore.getState().loadStats()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Scroll timeline to current hour
  useEffect(() => {
    if (timelineRef.current) {
      const hourIndex = Math.max(0, currentTime.getHours() - 6)
      const scrollTarget = hourIndex * HOUR_HEIGHT - 40
      timelineRef.current.scrollTop = Math.max(0, scrollTarget)
    }
  }, [])

  async function loadTodayTasks() {
    // All incomplete tasks, ordered by deadline urgency
    const pending = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE is_archived = 0 AND parent_task_id IS NULL AND is_completed = 0
       ORDER BY
         CASE WHEN due_date = ? THEN 0
              WHEN due_date IS NOT NULL AND due_date < ? THEN 1
              WHEN due_date IS NOT NULL THEN 2
              ELSE 3 END,
         due_date ASC,
         CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
         sort_order ASC`,
      [todayStr, todayStr]
    )
    setPendingTasks(pending)

    // Load project info for tasks that have a project_id
    const projectIds = [...new Set(pending.map((t) => t.project_id).filter(Boolean))] as string[]
    if (projectIds.length > 0) {
      const placeholders = projectIds.map(() => '?').join(',')
      const projects = await dbQuery<{ id: string; name: string; color: string }>(
        `SELECT id, name, color FROM projects WHERE id IN (${placeholders})`,
        projectIds
      )
      const map: Record<string, ProjectInfo> = {}
      for (const p of projects) {
        map[p.id] = { name: p.name, color: p.color ?? '#01A7C2' }
      }
      setProjectMap(map)
    }
  }

  const handleComplete = async (id: string, completed: boolean) => {
    await completeTask(id, completed)
    await loadTodayTasks()
  }

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const greeting = getGreeting(currentHour)

  // Group pending tasks by urgency
  const todayDeadlineTasks = pendingTasks.filter((t) => t.due_date === todayStr)
  const overdueTasks = pendingTasks.filter((t) => t.due_date !== null && t.due_date < todayStr)
  const upcomingTasks = pendingTasks.filter((t) => t.due_date !== null && t.due_date > todayStr)
  const noDateTasks = pendingTasks.filter((t) => !t.due_date)

  const eventsHours = todayEvents.reduce((acc, e) => {
    const startH = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    const endH = parseInt(e.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return acc + Math.max(1, endH - startH)
  }, 0)

  const motivationalIndex = new Date().getDate() % motivationalMessages.length
  const hasContent = pendingTasks.length > 0 || todayEvents.length > 0

  return (
    <div className="today-root">
      {/* ─── Hero Section ─── */}
      <FadeIn>
        <div className="today-hero">
          <div className="today-hero-bg" />
          <div className="today-hero-content">
            <div className="today-hero-left">
              <motion.div
                className="today-greeting-emoji"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                {greeting.emoji}
              </motion.div>
              <div>
                <h1 className="today-greeting">{greeting.text}</h1>
                <p className="today-date">
                  {format(currentTime, "EEEE d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>

            {/* Stats inline */}
            <div className="today-hero-stats">
              <div className="today-hero-pills">
                <div className="today-mini-pill">
                  <ListChecks size={14} />
                  <span><b>{pendingTasks.length}</b> pendientes</span>
                </div>
                <div className="today-mini-pill">
                  <Clock size={14} />
                  <span><b>{eventsHours}h</b> eventos</span>
                </div>
                <div className="today-mini-pill">
                  <Timer size={14} />
                  <span><b>{sessionsToday}</b> pomodoros</span>
                </div>
                {totalFocusToday > 0 && (
                  <div className="today-mini-pill today-mini-pill-accent">
                    <Zap size={14} />
                    <span><b>{totalFocusToday}</b> min enfocada</span>
                  </div>
                )}
              </div>
            </div>

            <div className="today-hero-clock">
              <span className="today-clock-hours">{format(currentTime, 'HH')}</span>
              <motion.span
                className="today-clock-sep"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >:</motion.span>
              <span className="today-clock-minutes">{format(currentTime, 'mm')}</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ─── Main: Timeline + Tasks ─── */}
      <div className="today-columns">
        {/* ─── Timeline (Left) ─── */}
        <FadeIn delay={0.05} className="today-timeline-col">
          <div className="today-timeline-panel glass">
            <div className="today-timeline-header">
              <h2 className="today-timeline-title">Cronograma</h2>
              <span className="today-timeline-live">
                <span className="today-timeline-live-dot" />
                {format(currentTime, 'HH:mm')}
              </span>
            </div>
            <div ref={timelineRef} className="today-timeline-scroll">
              <div className="today-timeline-hours">
                {HOURS.map((hour) => (
                  <TimelineHour
                    key={hour}
                    hour={hour}
                    events={todayEvents}
                    isCurrentHour={hour === currentHour}
                    currentMinute={currentMinute}
                    projectColorMap={Object.fromEntries(
                      Object.entries(projectMap).map(([id, p]) => [id, p.color])
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ─── Tasks (Right) ─── */}
        <FadeIn delay={0.1} className="today-tasks-col">
          <div className="today-tasks-scroll">
            {/* Empty state */}
            {!hasContent && (
              <motion.div
                className="today-empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  className="today-empty-icon"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles size={32} />
                </motion.div>
                <p className="today-empty-title">
                  {motivationalMessages[motivationalIndex]}
                </p>
                <p className="today-empty-sub">
                  Podés agregar tareas desde el Kanban o el calendario
                </p>
              </motion.div>
            )}

            {/* ── Hoy: deadline tasks — MOST prominent ── */}
            {todayDeadlineTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title today-section-title-today">
                    <Zap size={16} className="today-section-icon-today" />
                    Hoy
                  </h2>
                  <span className="today-section-count today-section-count-today">
                    {todayDeadlineTasks.length}
                  </span>
                </div>
                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {todayDeadlineTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
                        variant="today"
                        project={task.project_id ? projectMap[task.project_id] ?? null : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Vencidas ── */}
            {overdueTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title today-section-title-danger">
                    <Circle size={8} className="today-dot-danger" />
                    Vencidas
                  </h2>
                  <span className="today-section-count today-section-count-danger">
                    {overdueTasks.length}
                  </span>
                </div>
                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {overdueTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
                        variant="overdue"
                        project={task.project_id ? projectMap[task.project_id] ?? null : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Próximas deadlines ── */}
            {upcomingTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title">
                    <CalendarClock size={16} className="today-section-icon" />
                    Próximas
                  </h2>
                  <span className="today-section-count">{upcomingTasks.length}</span>
                </div>
                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {upcomingTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
                        variant="upcoming"
                        dateLabel={task.due_date ? formatRelativeDate(task.due_date, todayStr) : undefined}
                        project={task.project_id ? projectMap[task.project_id] ?? null : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Sin fecha ── */}
            {noDateTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title today-section-title-muted">
                    <Inbox size={16} className="today-section-icon-muted" />
                    Sin fecha
                  </h2>
                  <span className="today-section-count">{noDateTasks.length}</span>
                </div>
                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {noDateTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
                        variant="nodate"
                        project={task.project_id ? projectMap[task.project_id] ?? null : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div style={{ height: 8 }} />
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
