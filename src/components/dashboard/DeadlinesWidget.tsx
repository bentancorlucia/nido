import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, ArrowRight } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { dbQuery } from '../../lib/ipc'
import type { Task } from '../../types'

interface DeadlineGroup {
  label: string
  date: string
  tasks: Task[]
}

export function DeadlinesWidget() {
  const [groups, setGroups] = useState<DeadlineGroup[]>([])

  useEffect(() => {
    loadDeadlines()
    const interval = setInterval(loadDeadlines, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadDeadlines() {
    const today = new Date().toISOString().split('T')[0]
    const endDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')

    const tasks = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE is_archived = 0 AND is_completed = 0
         AND due_date IS NOT NULL AND due_date >= ? AND due_date <= ?
       ORDER BY due_date ASC, CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END
       LIMIT 20`,
      [today, endDate]
    )

    const grouped: Record<string, Task[]> = {}
    for (const task of tasks) {
      const date = task.due_date!
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    }

    const result: DeadlineGroup[] = Object.entries(grouped).map(([date, groupedTasks]) => {
      const parsed = parseISO(date)
      let label = format(parsed, "EEEE d 'de' MMMM", { locale: es })
      if (isToday(parsed)) label = 'Hoy'
      else if (isTomorrow(parsed)) label = 'Mañana'
      return { label, date, tasks: groupedTasks }
    })

    setGroups(result)
  }

  const today = new Date().toISOString().split('T')[0]

  if (groups.length === 0) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">
          <CalendarClock size={22} />
        </div>
        <p className="deadlines-empty-title">Sin deadlines próximos</p>
        <p className="deadlines-empty-subtitle">Nada vence en los próximos 7 días</p>
      </div>
    )
  }

  return (
    <div className="widget-scroll deadlines-list">
      {groups.map((group, gi) => {
        const daysFromToday = Math.ceil(
          (new Date(group.date).getTime() - new Date(today).getTime()) / 86400000
        )

        return (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.06 }}
          >
            {/* Date label */}
            <div className="deadlines-date-row">
              <span
                className={`deadlines-date-label ${
                  daysFromToday <= 0 ? 'danger' : daysFromToday <= 1 ? 'warning' : 'normal'
                }`}
              >
                {group.label}
              </span>
              <div className="deadlines-divider" />
            </div>

            {/* Tasks */}
            <div className="deadlines-tasks">
              {group.tasks.map((task) => {
                const daysLeft = Math.ceil(
                  (new Date(task.due_date!).getTime() - new Date(today).getTime()) / 86400000
                )

                const badgeClass =
                  daysLeft <= 0 ? 'danger' : daysLeft <= 1 ? 'warning' : 'info'
                const badge = daysLeft <= 0 ? 'HOY' : daysLeft === 1 ? '1d' : `${daysLeft}d`

                return (
                  <div
                    key={task.id}
                    className="deadlines-task-row"
                  >
                    <div
                      className={`priority-stripe ${task.priority}`}
                      style={{ minHeight: 24, width: 3 }}
                    />

                    <div className="deadlines-task-content">
                      <p className="deadlines-task-title">
                        {task.title}
                      </p>
                      <p className="deadlines-task-date">
                        {format(parseISO(task.due_date!), "d 'de' MMM", { locale: es })}
                      </p>
                    </div>

                    <span className={`urgency-badge ${badgeClass}`}>
                      {badge}
                      <ArrowRight size={9} />
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
