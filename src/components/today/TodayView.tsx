import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Sun, Moon, Sunrise, Sunset, CloudSun,
  ListChecks, Clock, Timer, Sparkles,
  CalendarCheck, Zap, Trophy,
  CheckCircle2, Circle,
} from 'lucide-react'
import { FadeIn } from '../../lib/animations'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { dbQuery } from '../../lib/ipc'
import { TimelineHour } from './TimelineHour'
import { TodayTask } from './TodayTask'
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

export function TodayView() {
  const { loadEvents, getEventsForDate } = useCalendarStore()
  const { completeTask } = useTaskStore()
  const { sessionsToday, totalFocusToday } = usePomodoroStore()

  const [todayTasks, setTodayTasks] = useState<Task[]>([])
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
      const scrollTarget = hourIndex * 28 - 40
      timelineRef.current.scrollTop = Math.max(0, scrollTarget)
    }
  }, [])

  async function loadTodayTasks() {
    const rows = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE is_archived = 0 AND parent_task_id IS NULL
       AND (due_date = ? OR (due_date < ? AND is_completed = 0))
       ORDER BY is_completed ASC, due_time ASC NULLS LAST, priority ASC, sort_order ASC`,
      [todayStr, todayStr]
    )
    setTodayTasks(rows)
  }

  const handleComplete = async (id: string, completed: boolean) => {
    await completeTask(id, completed)
    await loadTodayTasks()
  }

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const greeting = getGreeting(currentHour)

  const pendingTasks = todayTasks.filter((t) => t.is_completed === 0)
  const completedTasks = todayTasks.filter((t) => t.is_completed === 1)
  const overdueTasks = pendingTasks.filter((t) => t.due_date && t.due_date < todayStr)
  const todayOnlyTasks = pendingTasks.filter((t) => !t.due_date || t.due_date >= todayStr)

  const totalTasks = todayTasks.length
  const completedCount = completedTasks.length
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  const eventsHours = todayEvents.reduce((acc, e) => {
    const startH = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    const endH = parseInt(e.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return acc + Math.max(1, endH - startH)
  }, 0)

  const motivationalIndex = new Date().getDate() % motivationalMessages.length
  const hasContent = todayTasks.length > 0 || todayEvents.length > 0

  // Progress ring
  const ringRadius = 54
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (progress / 100) * ringCircumference

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
              <div className="today-hero-ring">
                <svg className="today-progress-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={ringRadius} className="today-ring-bg" />
                  <motion.circle
                    cx="60" cy="60" r={ringRadius}
                    className="today-ring-fill"
                    strokeDasharray={ringCircumference}
                    initial={{ strokeDashoffset: ringCircumference }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="today-progress-center">
                  <span className="today-progress-value">{progress}%</span>
                </div>
              </div>

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
                  />
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ─── Tasks (Right) — Post-its ─── */}
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

            {/* Overdue */}
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
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Pending */}
            {todayOnlyTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title">
                    <CalendarCheck size={16} className="today-section-icon" />
                    Por hacer
                  </h2>
                  <span className="today-section-count">{todayOnlyTasks.length}</span>
                </div>
                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {todayOnlyTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <div className="today-postit-section">
                <div className="today-section-header">
                  <h2 className="today-section-title today-section-title-done">
                    <CheckCircle2 size={16} className="today-section-icon-done" />
                    Completadas
                  </h2>
                  <span className="today-section-count today-section-count-done">
                    {completedCount}/{totalTasks}
                  </span>
                </div>

                {progress === 100 && (
                  <motion.div
                    className="today-celebration"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Trophy size={16} />
                    <span>¡Completaste todo! Excelente día</span>
                  </motion.div>
                )}

                <div className="today-postit-board">
                  <AnimatePresence mode="popLayout">
                    {completedTasks.map((task) => (
                      <TodayTask
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        rotation={getPostItRotation(task.id)}
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
