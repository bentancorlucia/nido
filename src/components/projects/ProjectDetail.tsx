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

  const statItems = [
    { label: 'Total', value: stats.total, colorClass: 'pdetail-stat-value--primary' },
    { label: 'Completadas', value: stats.completed, colorClass: 'pdetail-stat-value--accent' },
    { label: 'En proceso', value: stats.inProgress, colorClass: 'pdetail-stat-value--info' },
    { label: 'Vencidas', value: stats.overdue, colorClass: 'pdetail-stat-value--danger' },
  ]

  return (
    <div className="pdetail-root">
      {/* Header */}
      <div style={{ padding: '24px 28px 16px' }}>
        <div className="pdetail-header">
          {/* Color + icon */}
          <div
            className="pdetail-avatar"
            style={{ backgroundColor: project.color ?? '#01A7C2' }}
          >
            {project.icon || project.name.charAt(0)}
          </div>

          <div className="pdetail-info">
            {editing ? (
              <div className="pdetail-edit-form">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pdetail-edit-name"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del proyecto..."
                  className="pdetail-edit-desc"
                  rows={2}
                />
                <button onClick={handleSave} className="pdetail-edit-save">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="pdetail-name-row">
                  <h2 className="pdetail-name">
                    {project.name}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="pdetail-edit-btn"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                {project.description && (
                  <p className="pdetail-description">{project.description}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="pdetail-progress">
        <ProjectProgress projectId={projectId} size="lg" />
      </div>

      {/* Stats */}
      <div className="pdetail-stats">
        {statItems.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass pdetail-stat-card"
          >
            <div className={`pdetail-stat-value ${s.colorClass}`}>{s.value}</div>
            <div className="section-label pdetail-stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="pdetail-actions">
        <button
          onClick={onNavigateKanban}
          className="pdetail-kanban-btn"
        >
          Ver tablero Kanban →
        </button>
      </div>

      {/* Subprojects */}
      {children.length > 0 && (
        <div className="pdetail-subprojects">
          <h4 className="section-label pdetail-subprojects-title">
            Subproyectos ({children.length})
          </h4>
          <div className="pdetail-subprojects-grid">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -1 }}
                className="glass pdetail-subproject-btn"
                style={{ padding: '12px 16px' }}
              >
                <span
                  className="pdetail-subproject-dot"
                  style={{ backgroundColor: child.color ?? '#01A7C2' }}
                />
                <span className="pdetail-subproject-name">{child.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
