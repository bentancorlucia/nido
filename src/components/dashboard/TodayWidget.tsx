import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { dbQuery } from '../../lib/ipc'
import type { Task } from '../../types'

export function TodayWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    loadTodayTasks()
    const interval = setInterval(loadTodayTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadTodayTasks() {
    const today = new Date().toISOString().split('T')[0]
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
      setCompleting(null)
    }, 400)
  }

  const today = new Date().toISOString().split('T')[0]
  const overdueCount = tasks.filter((task) => task.due_date !== null && task.due_date < today).length

  if (tasks.length === 0) {
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

  return (
    <div className="today-container">
      {/* Summary bar */}
      <div className="today-summary">
        <div className="today-summary-left">
          <span className="today-count">{tasks.length}</span>
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
          {tasks.map((task) => {
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
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
