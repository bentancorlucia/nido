import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Star, Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import type { Task, Tag } from '../../types'

interface KanbanCardProps {
  task: Task
  tags: Tag[]
  subtaskCount?: { total: number; completed: number }
  onClick: () => void
  onComplete: (completed: boolean) => void
}

// Post-it color palette — soft, warm tones derived from the design system
const postitColors = [
  { bg: '#FFF9E6', border: '#F0E4C0', shadow: 'rgba(200, 180, 120, 0.10)' },  // warm cream
  { bg: '#FFF5EC', border: '#F0DCC8', shadow: 'rgba(200, 160, 120, 0.10)' },  // soft peach
  { bg: '#F0F9F4', border: '#C8E4D4', shadow: 'rgba(120, 180, 150, 0.10)' },  // mint
  { bg: '#F2F5FF', border: '#D4DCF0', shadow: 'rgba(140, 155, 200, 0.10)' },  // lavender
  { bg: '#FFF4F8', border: '#F0D4E0', shadow: 'rgba(200, 140, 170, 0.10)' },  // rose
  { bg: '#FAFFF0', border: '#E4F0C8', shadow: 'rgba(170, 200, 120, 0.10)' },  // lime
]

// Stable color assignment based on task id
function getPostitColor(taskId: string) {
  let hash = 0
  for (let i = 0; i < taskId.length; i++) {
    hash = ((hash << 5) - hash) + taskId.charCodeAt(i)
    hash |= 0
  }
  return postitColors[Math.abs(hash) % postitColors.length]
}

// Stable slight rotation based on task id for organic feel
function getPostitRotation(taskId: string): number {
  let hash = 0
  for (let i = 0; i < taskId.length; i++) {
    hash = ((hash << 3) - hash) + taskId.charCodeAt(i)
    hash |= 0
  }
  return ((Math.abs(hash) % 5) - 2) * 0.4 // -0.8 to +0.8 degrees
}

function isOverdue(date: string | null): boolean {
  if (!date) return false
  return date < new Date().toISOString().split('T')[0]
}

function isToday(date: string | null): boolean {
  if (!date) return false
  return date === new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Hoy'
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Mañana'

  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function KanbanCard({ task, tags, subtaskCount, onClick, onComplete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue = isOverdue(task.due_date) && task.is_completed === 0
  const today = isToday(task.due_date)
  const postit = getPostitColor(task.id)
  const rotation = getPostitRotation(task.id)

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout
      whileHover={{ y: -2, rotate: 0, scale: 1.01 }}
      className={`
        group relative cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragging ? 'z-50 scale-[1.03]' : ''}
        ${task.is_completed === 1 ? 'opacity-50 saturate-50' : ''}
      `}
      style={{
        ...style,
        rotate: isDragging ? 0 : rotation,
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return
        onClick()
      }}
    >
      {/* Post-it card body */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          backgroundColor: postit.bg,
          border: `1px solid ${postit.border}`,
          boxShadow: isDragging
            ? `0 12px 28px ${postit.shadow}, 0 4px 10px rgba(0,0,0,0.06)`
            : `0 1px 3px ${postit.shadow}, 0 1px 2px rgba(0,0,0,0.03)`,
          padding: '11px 13px 10px',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        {/* Tape strip at the top — subtle decorative element */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px]"
          style={{
            width: 32,
            height: 5,
            borderRadius: '0 0 3px 3px',
            background: `linear-gradient(180deg, ${postit.border}88, ${postit.border}44)`,
          }}
        />

        {/* Priority indicator — left edge stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2.5px] rounded-l-lg"
          style={{
            backgroundColor: task.priority === 'alta'
              ? 'var(--color-priority-alta)'
              : task.priority === 'media'
              ? 'var(--color-priority-media)'
              : 'var(--color-priority-baja)',
          }}
        />

        <div className="flex items-start gap-2.5 pl-1">
          {/* Checkbox */}
          <div className="mt-px" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={task.is_completed === 1}
              onChange={(checked) => onComplete(checked)}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start gap-2">
              <span
                className={`text-[13px] font-medium leading-snug flex-1 ${
                  task.is_completed === 1
                    ? 'line-through text-text-muted'
                    : ''
                }`}
                style={{
                  color: task.is_completed === 1 ? undefined : '#3A3A3A',
                }}
              >
                {task.title}
              </span>
              {task.is_important === 1 && (
                <Star size={12} className="text-accent fill-accent flex-shrink-0 mt-0.5" />
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex px-2 py-px text-[10px] font-semibold rounded-full tracking-wide"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Meta row */}
            {(task.due_date || task.estimated_minutes || (subtaskCount && subtaskCount.total > 0)) && (
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {task.due_date && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10.5px] font-semibold rounded-full px-1.5 py-px ${
                      overdue
                        ? 'bg-danger-light/60 text-danger'
                        : today
                        ? 'bg-warning-light/60 text-warning'
                        : 'text-text-muted'
                    }`}
                  >
                    {overdue && <AlertTriangle size={9} />}
                    <Calendar size={9} />
                    {formatDate(task.due_date)}
                  </span>
                )}
                {task.estimated_minutes && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-text-muted font-mono">
                    <Clock size={9} />
                    {task.estimated_minutes}m
                  </span>
                )}
                {subtaskCount && subtaskCount.total > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-text-muted font-mono">
                    <CheckCircle2 size={9} />
                    {subtaskCount.completed}/{subtaskCount.total}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
