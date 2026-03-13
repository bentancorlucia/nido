import { motion } from 'framer-motion'
import { Star, Clock, AlertTriangle, Timer, CalendarDays, FolderOpen } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import { localDateStr } from '../../lib/dates'
import type { Task } from '../../types'

export type TaskVariant = 'today' | 'overdue' | 'upcoming' | 'nodate'

export interface ProjectInfo {
  name: string
  color: string
}

interface TodayTaskProps {
  task: Task
  onComplete: (id: string, completed: boolean) => void
  onClick?: () => void
  rotation?: number
  variant?: TaskVariant
  dateLabel?: string
  project?: ProjectInfo | null
}

// Default post-it colors when no project is assigned
const DEFAULT_POSTIT = {
  bg: 'linear-gradient(165deg, #FFF9E8 0%, #FFF4D2 50%, #FFEFC0 100%)',
  tape: '#F2D48B',
  border: 'rgba(229, 204, 141, 0.5)',
}

function projectToPostit(hex: string, vivid = false) {
  const opacity = vivid ? 28 : 18
  const opacityEnd = vivid ? 38 : 28
  return {
    bg: `linear-gradient(165deg, color-mix(in srgb, ${hex} ${opacity}%, #FFFFFF) 0%, color-mix(in srgb, ${hex} ${opacityEnd}%, #FFFFFF) 100%)`,
    tape: `color-mix(in srgb, ${hex} 45%, #E0D8C0)`,
    border: `color-mix(in srgb, ${hex} 30%, rgba(200, 200, 200, 0.5))`,
  }
}

export function TodayTask({ task, onComplete, onClick, rotation = 0, variant, dateLabel, project }: TodayTaskProps) {
  const colors = project
    ? projectToPostit(project.color, variant === 'today')
    : DEFAULT_POSTIT

  const isOverdue =
    task.due_date &&
    task.due_date < localDateStr() &&
    !task.is_completed

  const variantClass = variant ? ` today-postit-${variant}` : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, rotate: rotation * 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      whileHover={{ y: -3, rotate: 0, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`today-postit${variantClass}`}
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
      onClick={onClick}
    >
      {/* Tape at top */}
      <div className="today-postit-tape" style={{ background: colors.tape }} />

      {/* Corner fold */}
      <div className="today-postit-fold" />

      {/* Today glow indicator */}
      {variant === 'today' && <div className="today-postit-glow" />}

      {/* Content */}
      <div className="today-postit-inner">
        <div className="today-postit-top">
          <div className="today-postit-check" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={task.is_completed === 1}
              onChange={(checked) => onComplete(task.id, checked)}
            />
          </div>
          {task.is_important === 1 && (
            <Star size={12} fill="#F2DE66" color="#D2B100" className="today-postit-star-icon" />
          )}
        </div>

        <p className="today-postit-title">
          {task.title}
        </p>

        <div className="today-postit-meta">
          {project && (
            <span
              className="today-postit-chip today-postit-chip-project"
              style={{
                background: `color-mix(in srgb, ${project.color} 15%, rgba(255,255,255,0.6))`,
                color: `color-mix(in srgb, ${project.color} 75%, #1E2B26)`,
                borderColor: `color-mix(in srgb, ${project.color} 25%, transparent)`,
              }}
            >
              <span
                className="today-postit-project-dot"
                style={{ background: project.color }}
              />
              {project.name}
            </span>
          )}
          {task.due_time && (
            <span className="today-postit-chip">
              <Clock size={9} />
              {task.due_time}
            </span>
          )}
          {isOverdue && (
            <motion.span
              className="today-postit-chip today-postit-chip-overdue"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle size={9} />
              Vencida
            </motion.span>
          )}
          {dateLabel && (
            <span className="today-postit-chip today-postit-chip-date">
              <CalendarDays size={9} />
              {dateLabel}
            </span>
          )}
          {task.estimated_minutes && (
            <span className="today-postit-chip today-postit-chip-estimate">
              <Timer size={9} />
              {task.estimated_minutes}m
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
