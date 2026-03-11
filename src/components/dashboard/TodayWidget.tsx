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

  return (
    <div className="h-full flex flex-col gap-1 overflow-hidden">
      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <CheckCircle2 size={28} className="text-accent/40 mb-2" />
          <p className="text-xs text-text-muted">Todo al día</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => {
              const isOverdue = task.due_date !== null && task.due_date < today
              const isCompleting = completing === task.id
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: isCompleting ? 0.4 : 1, x: 0, scale: isCompleting ? 0.97 : 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-alt/60 transition-colors group"
                >
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all
                      ${isCompleting
                        ? 'bg-accent border-accent scale-110'
                        : 'border-border-strong hover:border-primary group-hover:border-primary'
                      }`}
                  >
                    {isCompleting && <CheckCircle2 size={12} className="text-text-on-accent m-auto" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium text-text-primary leading-tight truncate ${isCompleting ? 'line-through text-text-muted' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-danger font-medium">
                          <AlertTriangle size={9} />
                          Vencida
                        </span>
                      )}
                      {task.due_time && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
                          <Clock size={9} />
                          {task.due_time}
                        </span>
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        task.priority === 'alta' ? 'bg-priority-alta' :
                        task.priority === 'media' ? 'bg-priority-media' : 'bg-priority-baja'
                      }`} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
