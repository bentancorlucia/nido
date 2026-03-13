import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronRight, FolderKanban } from 'lucide-react'
import { dbQuery } from '../../lib/ipc'
import type { Task } from '../../types'
import { useUIStore } from '../../stores/useUIStore'

interface ProjectGroup {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export function ProjectTasksWidget() {
  const [groups, setGroups] = useState<ProjectGroup[]>([])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [completing, setCompleting] = useState<string | null>(null)
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  useEffect(() => {
    loadProjectTasks()
    const interval = setInterval(loadProjectTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadProjectTasks() {
    const projects = await dbQuery<{ id: string; name: string; color: string }>(
      `SELECT id, name, color FROM projects
       WHERE is_archived = 0 AND is_template = 0 AND parent_id IS NULL
       ORDER BY sort_order ASC`
    )

    const result: ProjectGroup[] = []
    for (const proj of projects) {
      const tasks = await dbQuery<Task>(
        `SELECT * FROM tasks
         WHERE project_id = ? AND is_archived = 0 AND is_completed = 0
           AND parent_task_id IS NULL
         ORDER BY
           CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
           is_important DESC,
           sort_order ASC
         LIMIT 8`,
        [proj.id]
      )
      if (tasks.length > 0) {
        result.push({
          id: proj.id,
          name: proj.name,
          color: proj.color ?? '#01A7C2',
          tasks,
        })
      }
    }
    setGroups(result)
  }

  function toggleCollapse(projectId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  async function toggleComplete(id: string) {
    setCompleting(id)
    await window.nido.db.update('tasks', id, {
      is_completed: 1,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setTimeout(() => {
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, tasks: g.tasks.filter((t) => t.id !== id) }))
          .filter((g) => g.tasks.length > 0)
      )
      setCompleting(null)
    }, 400)
  }

  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0)

  if (groups.length === 0) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">
          <FolderKanban size={22} />
        </div>
        <p className="projtasks-empty-title">Sin tareas pendientes</p>
        <p className="projtasks-empty-subtitle">Tus proyectos están al día</p>
      </div>
    )
  }

  return (
    <div className="projtasks-container">
      <div className="projtasks-summary">
        <span className="projtasks-summary-count">{totalTasks} tareas</span>
        <span className="projtasks-summary-label">en {groups.length} proyecto{groups.length > 1 ? 's' : ''}</span>
      </div>

      <div className="widget-scroll projtasks-list">
        {groups.map((group, gi) => {
          const isCollapsed = collapsed.has(group.id)

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="projtasks-group"
            >
              <button
                className="projtasks-group-header"
                onClick={() => toggleCollapse(group.id)}
              >
                <div className="projtasks-group-left">
                  <div
                    className="projtasks-group-dot"
                    style={{
                      backgroundColor: group.color,
                      boxShadow: `0 0 8px ${group.color}40`,
                    }}
                  />
                  <span className="projtasks-group-name">{group.name}</span>
                  <span className="projtasks-group-count">{group.tasks.length}</span>
                </div>
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="projtasks-group-tasks">
                      {group.tasks.map((task) => {
                        const isCompleting = completing === task.id

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            animate={{
                              opacity: isCompleting ? 0.4 : 1,
                              scale: isCompleting ? 0.97 : 1,
                            }}
                            className="widget-task-item"
                          >
                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`task-check ${isCompleting ? 'completed' : ''}`}
                            >
                              {isCompleting && <CheckCircle2 size={11} />}
                            </button>
                            <div className="projtasks-task-content">
                              <p className={`projtasks-task-title ${isCompleting ? 'completing' : ''}`}>
                                {task.title}
                              </p>
                              <div className="projtasks-task-meta">
                                {task.due_date && (
                                  <span className="projtasks-task-date">{task.due_date}</span>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
