import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil, Check, Calendar, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, MapPin,
} from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { ProjectProgress } from './ProjectProgress'
import { Checkbox } from '../ui/Checkbox'
import { dbQuery } from '../../lib/ipc'
import { localDateStr } from '../../lib/dates'
import { EventTypeIcon, getEventTypeInfo } from '../../lib/eventTypes'
import type { Project, Task, CalendarEvent } from '../../types'

interface ProjectDetailProps {
  projectId: string
  onNavigateKanban: () => void
  onSelectProject?: (id: string) => void
}

interface ProjectStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
}

export function ProjectDetail({ projectId, onNavigateKanban, onSelectProject }: ProjectDetailProps) {
  const { projects, updateProject, selectProject } = useProjectStore()
  const project = projects.find((p) => p.id === projectId)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stats, setStats] = useState<ProjectStats>({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 })
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [projectEvents, setProjectEvents] = useState<CalendarEvent[]>([])
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  const children = projects.filter((p) => p.parent_id === projectId && p.is_archived === 0)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
      loadStats()
      loadPendingTasks()
      loadProjectEvents()
    }
  }, [projectId, project])

  async function loadStats() {
    const now = localDateStr()
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

  async function loadPendingTasks() {
    const rows = await dbQuery<Task>(
      `SELECT * FROM tasks
       WHERE project_id = ? AND is_completed = 0 AND is_archived = 0 AND parent_task_id IS NULL
       ORDER BY
         CASE WHEN due_date IS NOT NULL AND due_date < date('now') THEN 0 ELSE 1 END,
         due_date ASC,
         sort_order ASC
       LIMIT 20`,
      [projectId]
    )
    setPendingTasks(rows)
  }

  async function loadProjectEvents() {
    const rows = await dbQuery<CalendarEvent>(
      `SELECT * FROM events
       WHERE project_id = ? AND end_datetime >= datetime('now')
       ORDER BY start_datetime ASC
       LIMIT 10`,
      [projectId]
    )
    setProjectEvents(rows)
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    await dbQuery(
      'UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      [completed ? 1 : 0, completed ? new Date().toISOString() : null, new Date().toISOString(), taskId]
    )
    await loadPendingTasks()
    await loadStats()
  }

  const handleSave = async () => {
    if (!project) return
    await updateProject(project.id, { name, description: description || null } as Partial<Project>)
    setEditing(false)
  }

  const handleSelectChild = (childId: string) => {
    if (onSelectProject) {
      onSelectProject(childId)
    } else {
      selectProject(childId)
    }
  }

  if (!project) return null

  const statItems = [
    { label: 'Total', value: stats.total, colorClass: 'pdetail-stat-value--primary' },
    { label: 'Completadas', value: stats.completed, colorClass: 'pdetail-stat-value--accent' },
    { label: 'En proceso', value: stats.inProgress, colorClass: 'pdetail-stat-value--info' },
    { label: 'Vencidas', value: stats.overdue, colorClass: 'pdetail-stat-value--danger' },
  ]

  const now = localDateStr()
  const visibleTasks = showAllTasks ? pendingTasks : pendingTasks.slice(0, 5)
  const visibleEvents = showAllEvents ? projectEvents : projectEvents.slice(0, 4)

  return (
    <div className="pdetail-root">
      {/* Header */}
      <div style={{ padding: '24px 28px 16px' }}>
        <div className="pdetail-header">
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
                  <h2 className="pdetail-name">{project.name}</h2>
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
        <button onClick={onNavigateKanban} className="pdetail-kanban-btn">
          Ver tablero Kanban →
        </button>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="pdetail-section">
          <h4 className="section-label pdetail-section-title">
            <CheckCircle2 size={13} />
            Tareas pendientes ({pendingTasks.length})
          </h4>
          <div className="pdetail-task-list">
            <AnimatePresence initial={false}>
              {visibleTasks.map((task) => {
                const overdue = task.due_date !== null && task.due_date < now
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    className={`pdetail-task-row${task.is_completed === 1 ? ' pdetail-task-row--done' : ''}`}
                  >
                    <Checkbox
                      checked={task.is_completed === 1}
                      onChange={(checked) => handleToggleTask(task.id, checked)}
                    />
                    <span className={`pdetail-task-title${task.is_completed === 1 ? ' pdetail-task-title--done' : ''}`}>
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className={`pdetail-task-date${overdue ? ' pdetail-task-date--overdue' : ''}`}>
                        {overdue && <AlertTriangle size={10} />}
                        <Calendar size={10} />
                        {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.estimated_minutes && (
                      <span className="pdetail-task-time">
                        <Clock size={10} />
                        {task.estimated_minutes}m
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          {pendingTasks.length > 5 && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="pdetail-show-more"
            >
              {showAllTasks ? 'Ver menos' : `Ver todas (${pendingTasks.length})`}
            </button>
          )}
        </div>
      )}

      {/* Events */}
      {projectEvents.length > 0 && (
        <div className="pdetail-section">
          <h4 className="section-label pdetail-section-title">
            <Calendar size={13} />
            Próximos eventos ({projectEvents.length})
          </h4>
          <div className="pdetail-event-list">
            {visibleEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="pdetail-event-card"
              >
                <div
                  className="pdetail-event-accent"
                  style={{ backgroundColor: event.color ?? project.color ?? '#01A7C2' }}
                />
                <div className="pdetail-event-content">
                  <div className="pdetail-event-title-row">
                    <EventTypeIcon type={event.event_type} size={13} className="pdetail-event-type-icon" />
                    <span className="pdetail-event-title">{event.title}</span>
                    <span className="pdetail-event-type-badge">{getEventTypeInfo(event.event_type).label}</span>
                  </div>
                  <div className="pdetail-event-meta">
                    <span className="pdetail-event-date">
                      <Calendar size={10} />
                      {formatEventDate(event.start_datetime)}
                    </span>
                    {!event.is_all_day && (
                      <span className="pdetail-event-time">
                        <Clock size={10} />
                        {event.start_datetime.split('T')[1]?.slice(0, 5)}
                      </span>
                    )}
                    {event.location && (
                      <span className="pdetail-event-location">
                        <MapPin size={10} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {projectEvents.length > 4 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="pdetail-show-more"
            >
              {showAllEvents ? 'Ver menos' : `Ver todos (${projectEvents.length})`}
            </button>
          )}
        </div>
      )}

      {/* Subprojects */}
      {children.length > 0 && (
        <div className="pdetail-section">
          <h4 className="section-label pdetail-section-title">
            Subproyectos ({children.length})
          </h4>
          <div className="pdetail-subprojects-grid">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -1, x: 2 }}
                className="glass pdetail-subproject-btn"
                onClick={() => handleSelectChild(child.id)}
              >
                <span
                  className="pdetail-subproject-dot"
                  style={{ backgroundColor: child.color ?? '#01A7C2' }}
                />
                <span className="pdetail-subproject-name">{child.name}</span>
                <ChevronRight size={14} className="pdetail-subproject-arrow" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === localDateStr(today)) return 'Hoy'
  if (dateStr === localDateStr(tomorrow)) return 'Mañana'
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function formatEventDate(datetime: string): string {
  const dateStr = datetime.split('T')[0]
  return formatDate(dateStr)
}
