import { useState, useEffect } from 'react'
import { dbQuery } from '../../lib/ipc'
import { ProgressBar } from '../ui/ProgressBar'

interface ProjectProgressProps {
  projectId: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

interface Stats {
  total: number
  completed: number
}

export function ProjectProgress({ projectId, size = 'md', showLabel = true, className = '' }: ProjectProgressProps) {
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0 })

  useEffect(() => {
    loadStats()
  }, [projectId])

  async function loadStats() {
    // Count all tasks (including in subprojects recursively)
    const rows = await dbQuery<{ total: number; completed: number }>(
      `WITH RECURSIVE project_tree AS (
        SELECT id FROM projects WHERE id = ?
        UNION ALL
        SELECT p.id FROM projects p JOIN project_tree pt ON p.parent_id = pt.id
      )
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE project_id IN (SELECT id FROM project_tree) AND is_archived = 0`,
      [projectId]
    )
    if (rows.length > 0) {
      setStats({ total: rows[0].total, completed: rows[0].completed })
    }
  }

  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className={`pprogress-root ${className}`}>
      <ProgressBar value={percentage} size={size} showLabel={showLabel} />
      {showLabel && (
        <span className="pprogress-label">
          {stats.completed}/{stats.total} tareas completadas
        </span>
      )}
    </div>
  )
}
