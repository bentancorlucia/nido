import { useState, useEffect } from 'react'
import { CalendarClock } from 'lucide-react'
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

    // Group by date
    const grouped: Record<string, Task[]> = {}
    for (const task of tasks) {
      const date = task.due_date!
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    }

    const result: DeadlineGroup[] = Object.entries(grouped).map(([date, tasks]) => {
      const parsed = parseISO(date)
      let label = format(parsed, "EEEE d 'de' MMMM", { locale: es })
      if (isToday(parsed)) label = 'Hoy'
      else if (isTomorrow(parsed)) label = 'Mañana'
      return { label, date, tasks }
    })

    setGroups(result)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <CalendarClock size={28} className="text-primary/30 mb-2" />
          <p className="text-xs text-text-muted">Sin deadlines próximos</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
          {groups.map((group) => (
            <div key={group.date}>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 capitalize">
                {group.label}
              </h4>
              <div className="space-y-0.5">
                {group.tasks.map((task) => {
                  const daysLeft = Math.ceil(
                    (new Date(task.due_date!).getTime() - new Date(today).getTime()) / 86400000
                  )
                  const urgencyColor = daysLeft <= 0 ? 'bg-danger' : daysLeft <= 1 ? 'bg-warning' : 'bg-primary'

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-alt/60 transition-colors"
                    >
                      <div className={`w-1 h-6 rounded-full ${urgencyColor} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary truncate">{task.title}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-medium flex-shrink-0 ${
                        daysLeft <= 0 ? 'text-danger' : daysLeft <= 1 ? 'text-warning' : 'text-text-muted'
                      }`}>
                        {daysLeft <= 0 ? 'HOY' : `${daysLeft}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
