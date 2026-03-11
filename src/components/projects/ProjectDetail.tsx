import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Check } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { ProjectProgress } from './ProjectProgress'
import { dbQuery } from '../../lib/ipc'
import type { Project } from '../../types'

interface ProjectDetailProps {
  projectId: string
  onNavigateKanban: () => void
}

interface ProjectStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
}

export function ProjectDetail({ projectId, onNavigateKanban }: ProjectDetailProps) {
  const { projects, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === projectId)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stats, setStats] = useState<ProjectStats>({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 })

  const children = projects.filter((p) => p.parent_id === projectId && p.is_archived === 0)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
      loadStats()
    }
  }, [projectId, project])

  async function loadStats() {
    const now = new Date().toISOString().split('T')[0]
    const rows = await dbQuery<ProjectStats>(
      `WITH RECURSIVE project_tree AS (
        SELECT id FROM projects WHERE id = ?
        UNION ALL
        SELECT p.id FROM projects p JOIN project_tree pt ON p.parent_id = pt.id
      )
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.is_completed = 0 AND kc.sort_order = 1 THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN t.is_completed = 0 AND kc.sort_order = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN t.is_completed = 0 AND t.due_date IS NOT NULL AND t.due_date < ? THEN 1 ELSE 0 END) as overdue
      FROM tasks t
      LEFT JOIN kanban_columns kc ON t.column_id = kc.id
      WHERE t.project_id IN (SELECT id FROM project_tree) AND t.is_archived = 0`,
      [projectId, now]
    )
    if (rows.length > 0) setStats(rows[0])
  }

  const handleSave = async () => {
    if (!project) return
    await updateProject(project.id, { name, description: description || null } as Partial<Project>)
    setEditing(false)
  }

  if (!project) return null

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div style={{ padding: '24px 28px 16px' }}>
        <div className="flex items-start gap-3.5">
          {/* Color + icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm"
            style={{ backgroundColor: project.color ?? '#01A7C2' }}
          >
            {project.icon || project.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xl font-display font-bold bg-transparent border-b border-primary outline-none text-text-primary pb-1"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del proyecto..."
                  className="text-[13px] text-text-secondary bg-transparent border-b border-border outline-none resize-none pb-1"
                  rows={2}
                />
                <button onClick={handleSave} className="self-start p-1 rounded-md bg-primary text-white">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-display font-bold text-text-primary truncate">
                    {project.name}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-primary-light/40 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                {project.description && (
                  <p className="text-[13px] text-text-secondary mt-1">{project.description}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-8 pb-5">
        <ProjectProgress projectId={projectId} size="lg" />
      </div>

      {/* Stats */}
      <div className="px-8 pb-6 grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-text-primary' },
          { label: 'Completadas', value: stats.completed, color: 'text-accent-dark' },
          { label: 'En proceso', value: stats.inProgress, color: 'text-primary' },
          { label: 'Vencidas', value: stats.overdue, color: 'text-danger' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 text-center"
          >
            <div className={`text-lg font-bold font-mono tabular-nums ${s.color}`}>{s.value}</div>
            <div className="section-label mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-8 pb-5">
        <button
          onClick={onNavigateKanban}
          className="w-full py-3 rounded-xl bg-primary-light/35 text-primary text-[13px] font-semibold hover:bg-primary-light/55 transition-colors"
        >
          Ver tablero Kanban →
        </button>
      </div>

      {/* Subprojects */}
      {children.length > 0 && (
        <div className="px-8 pb-8">
          <h4 className="section-label mb-3">
            Subproyectos ({children.length})
          </h4>
          <div className="grid gap-2.5">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -1 }}
                className="flex items-center gap-3 glass rounded-xl text-left hover:shadow-sm transition-all"
                style={{ padding: '12px 16px' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: child.color ?? '#01A7C2' }}
                />
                <span className="text-[13px] font-medium text-text-primary truncate">{child.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
