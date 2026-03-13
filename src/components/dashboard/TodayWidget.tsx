import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Clock, Inbox, Star } from 'lucide-react'
import { dbQuery } from '../../lib/ipc'
import { localDateStr } from '../../lib/dates'
import type { Task } from '../../types'

const DEFAULT_POSTIT = { bg: 'linear-gradient(165deg, #FFF4D2 0%, #FFECC0 100%)', border: 'rgba(229, 204, 141, 0.6)' }

function projectColorToPostit(hex: string): { bg: string; border: string } {
  // Convert project hex color to a soft pastel gradient for the post-it
  return {
    bg: `linear-gradient(165deg, color-mix(in srgb, ${hex} 18%, #FFFFFF) 0%, color-mix(in srgb, ${hex} 28%, #FFFFFF) 100%)`,
    border: `color-mix(in srgb, ${hex} 40%, rgba(200, 200, 200, 0.6))`,
  }
}

export function TodayWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [noDateTasks, setNoDateTasks] = useState<Task[]>([])
  const [projectColors, setProjectColors] = useState<Record<string, string>>({})
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    loadTodayTasks()
    const interval = setInterval(loadTodayTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadTodayTasks() {
    const today = localDateStr()
    const rows = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE is_archived = 0 AND is_completed = 0
         AND (due_date = ? OR due_date < ?)
       ORDER BY
         CASE WHEN due_date < ? THEN 0 ELSE 1 END,
         CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END
       LIMIT 10`,
      [today, today, today]
    )
    setTasks(rows)

    const noDate = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE is_archived = 0 AND is_completed = 0
         AND due_date IS NULL
       ORDER BY
         CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
         is_important DESC,
         created_at DESC
       LIMIT 10`,
      []
    )
    setNoDateTasks(noDate)

    // Load project colors for all tasks with project_id
    const allTasks = [...rows, ...noDate]
    const projectIds = [...new Set(allTasks.map((t) => t.project_id).filter(Boolean))] as string[]
    if (projectIds.length > 0) {
      const placeholders = projectIds.map(() => '?').join(',')
      const projects = await dbQuery<{ id: string; color: string; name: string }>(
        `SELECT id, color, name FROM projects WHERE id IN (${placeholders})`,
        projectIds
      )
      const colorMap: Record<string, string> = {}
      const nameMap: Record<string, string> = {}
      for (const p of projects) {
        colorMap[p.id] = p.color ?? '#01A7C2'
        nameMap[p.id] = p.name
      }
      setProjectColors(colorMap)
      setProjectNames(nameMap)
    }
  }

  async function toggleComplete(id: string) {
    setCompleting(id)
    await window.nido.db.update('tasks', id, {
      is_completed: 1,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setNoDateTasks((prev) => prev.filter((t) => t.id !== id))
      setCompleting(null)
    }, 400)
  }

  const today = localDateStr()
  const overdueCount = tasks.filter((task) => task.due_date !== null && task.due_date < today).length
  const totalCount = tasks.length + noDateTasks.length

  if (totalCount === 0) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">
          <CheckCircle2 size={22} />
        </div>
        <p className="today-empty-title">Todo al día</p>
        <p className="today-empty-subtitle">No hay tareas pendientes para hoy</p>
      </div>
    )
  }

  function renderTaskItem(task: Task) {
    const isOverdue = task.due_date !== null && task.due_date < today
    const isCompleting = completing === task.id

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, x: -12 }}
        animate={{
          opacity: isCompleting ? 0.4 : 1,
          x: 0,
          scale: isCompleting ? 0.97 : 1,
        }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
        className="widget-task-item"
      >
        <button
          onClick={() => toggleComplete(task.id)}
          className={`task-check ${isCompleting ? 'completed' : ''}`}
        >
          {isCompleting && <CheckCircle2 size={11} className="today-check-icon" />}
        </button>

        <div className="today-task-content">
          <p className={`today-task-title ${isCompleting ? 'completing' : ''}`}>
            {task.title}
          </p>

          <div className="today-task-meta">
            {isOverdue && (
              <span className="urgency-badge danger" style={{ fontSize: 9, padding: '1px 6px' }}>
                Vencida
              </span>
            )}

            {task.due_time && (
              <span className="today-task-time">
                <Clock size={10} />
                {task.due_time}
              </span>
            )}

            <span
              className={`priority-stripe ${task.priority}`}
              style={{ width: 6, height: 6, minHeight: 6, borderRadius: '50%' }}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="today-container">
      {/* Summary bar */}
      <div className="today-summary">
        <div className="today-summary-left">
          <span className="today-count">{totalCount}</span>
          <span className="today-label">pendientes</span>
        </div>
        {overdueCount > 0 && (
          <span className="urgency-badge danger">
            <AlertTriangle size={10} />
            {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Task list */}
      <div className="widget-scroll today-task-list">
        <AnimatePresence mode="popLayout">
          {tasks.map(renderTaskItem)}
        </AnimatePresence>

        {/* No-date tasks as mini post-its */}
        {noDateTasks.length > 0 && (
          <>
            <div className="today-section-divider">
              <Inbox size={11} />
              <span>Sin fecha</span>
              <div className="today-section-line" />
            </div>
            <div className="today-nodate-grid">
              <AnimatePresence mode="popLayout">
                {noDateTasks.map((task, i) => {
                  const projColor = task.project_id ? projectColors[task.project_id] : null
                  const colors = projColor ? projectColorToPostit(projColor) : DEFAULT_POSTIT
                  const isCompleting = completing === task.id
                  const rotation = ((i % 3) - 1) * 1.5

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85, rotate: rotation * 2 }}
                      animate={{
                        opacity: isCompleting ? 0.4 : 1,
                        scale: isCompleting ? 0.92 : 1,
                        rotate: rotation,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ y: -3, rotate: 0, scale: 1.04 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="today-mini-postit"
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                      }}
                      onClick={() => toggleComplete(task.id)}
                    >
                      {task.is_important === 1 && (
                        <Star size={10} fill="#F2DE66" color="#D2B100" className="today-mini-postit-star" />
                      )}
                      <p className={`today-mini-postit-title ${isCompleting ? 'completing' : ''}`}>
                        {task.title}
                      </p>
                      <div className="today-mini-postit-footer">
                        {task.project_id && projectNames[task.project_id] && (
                          <span
                            className="today-mini-postit-project"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${projectColors[task.project_id] ?? '#01A7C2'} 18%, rgba(0,0,0,0.06))`,
                              color: `color-mix(in srgb, ${projectColors[task.project_id] ?? '#01A7C2'} 70%, #000)`,
                            }}
                          >
                            {projectNames[task.project_id]}
                          </span>
                        )}
                        <span
                          className={`priority-stripe ${task.priority}`}
                          style={{ width: 5, height: 5, minHeight: 5, borderRadius: '50%', flexShrink: 0 }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
