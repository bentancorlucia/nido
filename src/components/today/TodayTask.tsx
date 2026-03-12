import { motion } from 'framer-motion'
import { Star, Clock, AlertTriangle, Timer } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import type { Task } from '../../types'

interface TodayTaskProps {
  task: Task
  onComplete: (id: string, completed: boolean) => void
  onClick?: () => void
  rotation?: number
}

const POSTIT_COLORS: Record<string, { bg: string; tape: string; border: string }> = {
  alta: {
    bg: 'linear-gradient(165deg, #FFE2EA 0%, #FFD0DE 50%, #FFC8D8 100%)',
    tape: '#F0B1C6',
    border: 'rgba(226, 160, 182, 0.7)',
  },
  media: {
    bg: 'linear-gradient(165deg, #FFF4D2 0%, #FFECC0 50%, #FFE4A8 100%)',
    tape: '#F2D48B',
    border: 'rgba(229, 204, 141, 0.7)',
  },
  baja: {
    bg: 'linear-gradient(165deg, #E8F7EE 0%, #DFF1E6 50%, #D2EBD8 100%)',
    tape: '#B8DDBF',
    border: 'rgba(183, 210, 189, 0.7)',
  },
  default: {
    bg: 'linear-gradient(165deg, #F5F8D8 0%, #EEF4C6 50%, #E6EEB2 100%)',
    tape: '#DFE89B',
    border: 'rgba(214, 223, 163, 0.7)',
  },
}

export function TodayTask({ task, onComplete, onClick, rotation = 0 }: TodayTaskProps) {
  const priorityKey = task.priority ?? 'default'
  const priority = priorityKey === 'alta' || priorityKey === 'media' || priorityKey === 'baja'
    ? priorityKey
    : 'default'
  const colors = POSTIT_COLORS[priority]

  const isOverdue =
    task.due_date &&
    task.due_date < new Date().toISOString().split('T')[0] &&
    !task.is_completed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, rotate: rotation * 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      whileHover={{ y: -4, rotate: 0, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`today-postit${task.is_completed ? ' today-postit-done' : ''}`}
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
            <motion.div
              className="today-postit-star"
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            >
              <Star size={14} fill="#F2DE66" color="#D2B100" />
            </motion.div>
          )}
        </div>

        <p className={`today-postit-title${task.is_completed ? ' today-postit-title-done' : ''}`}>
          {task.title}
        </p>

        <div className="today-postit-meta">
          {task.due_time && (
            <span className="today-postit-chip">
              <Clock size={10} />
              {task.due_time}
            </span>
          )}
          {isOverdue && (
            <motion.span
              className="today-postit-chip today-postit-chip-overdue"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle size={10} />
              Vencida
            </motion.span>
          )}
          {task.estimated_minutes && (
            <span className="today-postit-chip today-postit-chip-estimate">
              <Timer size={10} />
              {task.estimated_minutes} min
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
