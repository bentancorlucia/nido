import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderTree } from 'lucide-react'
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <FolderTree size={28} className="text-text-muted/30 mb-2" />
          <p className="text-xs text-text-muted">Sin proyectos activos</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
          {projects.map((proj) => {
            const pct = Math.round((proj.completed / proj.total) * 100)
            return (
              <button
                key={proj.id}
                onClick={() => setCurrentPage('projects')}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                    <span className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                      {proj.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted flex-shrink-0 ml-2">
                    {proj.completed}/{proj.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${proj.color}, ${pct > 80 ? '#DDF45B' : proj.color}CC)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
