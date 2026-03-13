import { memo, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Star, Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import { localDateStr } from '../../lib/dates'
import type { Task, Tag } from '../../types'

interface KanbanCardProps {
  task: Task
  tags: Tag[]
  subtaskCount?: { total: number; completed: number }
  onClick: () => void
  onComplete: (completed: boolean) => void
  isDragOverlay?: boolean
}

/* Post-it palette — warm, papery tones */
const postitPalette = [
  { bg: '#FFF9E6', border: '#EDE0B8', tape: '#E8D49C' },   // warm cream
  { bg: '#FFF5EC', border: '#EEDCC4', tape: '#E2C9A4' },   // soft peach
  { bg: '#F0F9F4', border: '#C4E2D0', tape: '#A8D0B8' },   // mint
  { bg: '#F2F4FF', border: '#D0D8F0', tape: '#B8C4E4' },   // lavender
  { bg: '#FFF4F8', border: '#F0D0DE', tape: '#E4B8CC' },   // rose
  { bg: '#F8FFF0', border: '#DCF0C0', tape: '#C8E4A4' },   // lime
  { bg: '#FFF8F0', border: '#F0DCC8', tape: '#E4C8A8' },   // apricot
  { bg: '#F4F0FF', border: '#D8D0F0', tape: '#C0B8E4' },   // iris
] as const

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function isOverdue(date: string | null): boolean {
  if (!date) return false
  return date < localDateStr()
}

function isToday(date: string | null): boolean {
  if (!date) return false
  return date === localDateStr()
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

const priorityConfig: Record<string, { color: string }> = {
  alta: { color: 'var(--color-priority-alta)' },
  media: { color: 'var(--color-priority-media)' },
  baja: { color: 'var(--color-priority-baja)' },
}

export const KanbanCard = memo(function KanbanCard({ task, tags, subtaskCount, onClick, onComplete, isDragOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition ?? undefined,
  }

  const overdue = isOverdue(task.due_date) && task.is_completed === 0
  const today = isToday(task.due_date)
  const completed = task.is_completed === 1
  const priority = priorityConfig[task.priority] ?? priorityConfig.baja

  // Stable post-it color & rotation derived from task id
  const postit = useMemo(() => {
    const h = hashStr(task.id)
    const palette = postitPalette[h % postitPalette.length]
    const rotation = ((h % 7) - 3) * 0.4 // -1.2 to +1.2 degrees
    return { ...palette, rotation }
  }, [task.id])

  const subtaskPct = useMemo(() => {
    if (!subtaskCount || subtaskCount.total === 0) return null
    return Math.round((subtaskCount.completed / subtaskCount.total) * 100)
  }, [subtaskCount])

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`kcard${isDragging ? ' kcard--dragging' : ''}${completed ? ' kcard--completed' : ''}${isDragOverlay ? ' kcard--overlay' : ''}`}
      style={{
        ...style,
        '--postit-bg': postit.bg,
        '--postit-border': postit.border,
        '--postit-tape': postit.tape,
        '--postit-rotation': `${isDragging ? 0 : postit.rotation}deg`,
      } as React.CSSProperties}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return
        onClick()
      }}
    >
      {/* Tape strip at top */}
      <div className="kcard__tape" />

      {/* Priority accent — left edge, hidden for baja */}

      {/* Card body */}
      <div className="kcard__body">
        {/* Top row: checkbox + title + star */}
        <div className="kcard__header">
          <div className="kcard__check" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={completed}
              onChange={(checked) => onComplete(checked)}
            />
          </div>
          <span className={`kcard__title${completed ? ' kcard__title--done' : ''}`}>
            {task.title}
          </span>
          {task.is_important === 1 && (
            <Star size={12} className="kcard__star" />
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="kcard__tags">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="kcard__tag"
                style={{
                  '--tag-color': tag.color,
                  '--tag-bg': tag.color + '22',
                } as React.CSSProperties}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="kcard__tag kcard__tag--more">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Subtask progress */}
        {subtaskCount && subtaskCount.total > 0 && (
          <div className="kcard__subtasks">
            <div className="kcard__subtask-bar">
              <div
                className="kcard__subtask-fill"
                style={{ width: `${subtaskPct}%` }}
              />
            </div>
            <span className="kcard__subtask-label">
              <CheckCircle2 size={10} />
              {subtaskCount.completed}/{subtaskCount.total}
            </span>
          </div>
        )}

        {/* Meta row: date, time */}
        {(task.due_date || task.estimated_minutes) && (
          <div className="kcard__meta">
            {task.due_date && (
              <span className={`kcard__date${overdue ? ' kcard__date--overdue' : today ? ' kcard__date--today' : ''}`}>
                {overdue && <AlertTriangle size={10} />}
                <Calendar size={10} />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="kcard__time">
                <Clock size={10} />
                {task.estimated_minutes}m
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
