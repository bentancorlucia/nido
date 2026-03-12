import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderTree, CheckCircle2 } from 'lucide-react'
import { dbQuery } from '../../lib/ipc'
import { useUIStore } from '../../stores/useUIStore'

interface ProjectProgress {
  id: string
  name: string
  color: string
  total: number
  completed: number
}

export function ProgressWidget() {
  const [projects, setProjects] = useState<ProjectProgress[]>([])
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  useEffect(() => {
    loadProgress()
    const interval = setInterval(loadProgress, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadProgress() {
    const rows = await dbQuery<{ id: string; name: string; color: string }>(
      'SELECT id, name, color FROM projects WHERE is_archived = 0 AND is_template = 0 AND parent_id IS NULL ORDER BY sort_order ASC LIMIT 8'
    )

    const result: ProjectProgress[] = []
    for (const proj of rows) {
      const totalRows = await dbQuery<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND is_archived = 0 AND parent_task_id IS NULL',
        [proj.id]
      )
      const completedRows = await dbQuery<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND is_archived = 0 AND is_completed = 1 AND parent_task_id IS NULL',
        [proj.id]
      )
      const total = totalRows[0]?.cnt ?? 0
      const completed = completedRows[0]?.cnt ?? 0
      if (total > 0) {
        result.push({ id: proj.id, name: proj.name, color: proj.color ?? '#01A7C2', total, completed })
      }
    }

    setProjects(result)
  }

  const totalTasks = projects.reduce((acc, p) => acc + p.total, 0)
  const totalDone = projects.reduce((acc, p) => acc + p.completed, 0)

  if (projects.length === 0) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">
          <FolderTree size={22} />
        </div>
        <p className="progress-empty-title">Sin proyectos activos</p>
        <p className="progress-empty-subtitle">Creá uno para ver progreso</p>
      </div>
    )
  }

  return (
    <div className="progress-container">
      {/* Summary header */}
      <div className="progress-summary">
        <div>
          <span className="progress-summary-label">Resumen</span>
        </div>
        <div className="progress-summary-count">
          <CheckCircle2 size={12} className="progress-summary-count-icon" />
          <span className="progress-summary-count-text">{totalDone}/{totalTasks}</span>
        </div>
      </div>

      {/* Projects list */}
      <div className="widget-scroll progress-project-list">
        {projects.map((proj, i) => {
          const pct = Math.round((proj.completed / proj.total) * 100)

          return (
            <motion.button
              key={proj.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setCurrentPage('projects')}
              className="progress-project-btn"
            >
              <div className="progress-project-header">
                <div className="progress-project-info">
                  <div
                    className="progress-project-dot"
                    style={{
                      backgroundColor: proj.color,
                      boxShadow: `0 0 8px ${proj.color}40`,
                    }}
                  />
                  <span className="progress-project-name">
                    {proj.name}
                  </span>
                </div>

                <span className="progress-project-pct">
                  {pct}%
                </span>
              </div>

              <div className="progress-track">
                <motion.div
                  className="progress-fill"
                  style={{ backgroundColor: proj.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.08 }}
                />
              </div>

              <div className="progress-project-count-row">
                <span className="progress-project-count">
                  {proj.completed}/{proj.total}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
