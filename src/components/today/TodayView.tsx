import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarCheck, Clock, ListChecks, Timer, Sparkles,
} from 'lucide-react'
import { FadeIn } from '../../lib/animations'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { dbQuery } from '../../lib/ipc'
import { TimelineHour } from './TimelineHour'
import { TodayTask } from './TodayTask'
import type { Task } from '../../types'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6:00 - 23:00

const motivationalMessages = [
  'Nada pendiente para hoy. Disfrutá el momento.',
  'Tu día está libre. Aprovechalo como quieras.',
  'Sin tareas por ahora. Un buen momento para planificar.',
]

export function TodayView() {
  const { events, loadEvents, getEventsForDate } = useCalendarStore()
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

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Scroll to current hour on mount
  useEffect(() => {
    if (timelineRef.current) {
      const currentHour = currentTime.getHours()
      const hourIndex = Math.max(0, currentHour - 6)
      const scrollTarget = hourIndex * 64 - 100
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

  const pendingTasks = todayTasks.filter((t) => t.is_completed === 0)
  const completedTasks = todayTasks.filter((t) => t.is_completed === 1)
  const overdueTasks = pendingTasks.filter((t) => t.due_date && t.due_date < todayStr)
  const todayOnlyTasks = pendingTasks.filter((t) => !t.due_date || t.due_date >= todayStr)

  const eventsHours = todayEvents.reduce((acc, e) => {
    const startH = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    const endH = parseInt(e.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return acc + Math.max(1, endH - startH)
  }, 0)

  const hasContent = todayTasks.length > 0 || todayEvents.length > 0
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()

  // "Now" indicator position relative to timeline
  const nowOffsetPx = currentHour >= 6
    ? (currentHour - 6) * 64 + (currentMinute / 60) * 64
    : 0

  // Stable motivational message per day
  const motivationalIndex = new Date().getDate() % motivationalMessages.length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <FadeIn>
        <div style={{ padding: '24px 28px 18px' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 flex items-center justify-center shadow-sm">
              <CalendarCheck size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary capitalize tracking-tight leading-tight">
                {format(currentTime, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </h1>
              <p className="text-xs text-text-muted font-mono tabular-nums mt-0.5">
                {format(currentTime, 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <div className="pill-button bg-surface/60 border border-border text-text-secondary">
              <ListChecks size={13} className="text-primary/70" />
              <span className="text-[11.5px]">{pendingTasks.length} pendientes</span>
            </div>
            <div className="pill-button bg-surface/60 border border-border text-text-secondary">
              <Clock size={13} className="text-primary/70" />
              <span className="text-[11.5px]">{eventsHours}h de eventos</span>
            </div>
            <div className="pill-button bg-surface/60 border border-border text-text-secondary">
              <Timer size={13} className="text-primary/70" />
              <span className="text-[11.5px]">{sessionsToday} pomodoros</span>
            </div>
            {totalFocusToday > 0 && (
              <div className="pill-button bg-primary-light/40 border border-primary/15 text-primary">
                <Sparkles size={13} />
                <span className="text-[11.5px] font-medium">{totalFocusToday} min enfocada</span>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Main content */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0" style={{ padding: '0 28px 24px' }}>
        {/* Timeline */}
        <FadeIn delay={0.05} className="flex-1 min-w-0">
          <div className="glass rounded-2xl h-full flex flex-col overflow-hidden shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-text-primary tracking-tight">Timeline</h2>
              <span className="text-[10px] font-mono text-text-muted tabular-nums inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {format(currentTime, 'HH:mm')}
              </span>
            </div>
            <div ref={timelineRef} className="flex-1 overflow-y-auto px-5 py-3.5 relative">
              {/* "Now" line */}
              {currentHour >= 6 && currentHour <= 23 && (
                <div
                  className="absolute left-14 right-5 z-10 pointer-events-none flex items-center"
                  style={{ top: `${nowOffsetPx}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-md shadow-danger/25 -ml-1 ring-2 ring-danger/15" />
                  <div className="flex-1 h-[1.5px] bg-gradient-to-r from-danger/80 via-danger/40 to-transparent" />
                </div>
              )}

              {HOURS.map((hour) => (
                <TimelineHour
                  key={hour}
                  hour={hour}
                  events={todayEvents}
                  isCurrentHour={hour === currentHour}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Tasks panel */}
        <FadeIn delay={0.1} className="w-[350px] flex-shrink-0">
          <div className="glass rounded-2xl h-full flex flex-col overflow-hidden shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-text-primary tracking-tight">
                Tareas del día
              </h2>
              {todayTasks.length > 0 && (
                <span className="text-[10px] font-medium text-text-muted bg-surface-alt/50 px-2 py-0.5 rounded-full">
                  {completedTasks.length}/{todayTasks.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-5">
              {!hasContent && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center justify-center h-full text-center px-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 shadow-sm">
                    <Sparkles size={22} className="text-accent-dark" />
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed max-w-[200px]">
                    {motivationalMessages[motivationalIndex]}
                  </p>
                </motion.div>
              )}

              {/* Overdue */}
              {overdueTasks.length > 0 && (
                <div>
                  <p className="section-label text-danger mb-2.5 px-1">Vencidas ({overdueTasks.length})</p>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {overdueTasks.map((task) => (
                        <TodayTask
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Pending */}
              {todayOnlyTasks.length > 0 && (
                <div>
                  <p className="section-label mb-2.5 px-1">Por hacer ({todayOnlyTasks.length})</p>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {todayOnlyTasks.map((task) => (
                        <TodayTask
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedTasks.length > 0 && (
                <div>
                  <p className="section-label mb-2.5 px-1">Completadas ({completedTasks.length})</p>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {completedTasks.map((task) => (
                        <TodayTask
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
