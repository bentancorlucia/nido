import { motion } from 'framer-motion'
import { Star, Clock } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import type { Task } from '../../types'

interface TodayTaskProps {
  task: Task
  onComplete: (id: string, completed: boolean) => void
  onClick?: () => void
}

export function TodayTask({ task, onComplete, onClick }: TodayTaskProps) {
  const priorityColors: Record<string, string> = {
    alta: 'border-l-priority-alta',
    media: 'border-l-priority-media',
    baja: 'border-l-priority-baja',
  }

  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && !task.is_completed

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      whileHover={{ x: 2 }}
      className={`
        group flex items-start gap-3 px-3.5 py-3 rounded-xl
        border-l-[3px] ${priorityColors[task.priority] ?? 'border-l-transparent'}
        glass-subtle hover:shadow-sm transition-all cursor-pointer
        ${task.is_completed ? 'opacity-45' : ''}
      `}
      onClick={onClick}
    >
      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.is_completed === 1}
          onChange={(checked) => onComplete(task.id, checked)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium leading-snug ${
          task.is_completed ? 'line-through text-text-muted' : 'text-text-primary'
        }`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1.5">
          {task.due_time && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted font-mono tabular-nums">
              <Clock size={10} />
              {task.due_time}
            </span>
          )}
          {isOverdue && (
            <span className="text-[10px] font-semibold text-danger px-1.5 py-0.5 rounded-full bg-danger-light animate-pulse-soft">
              Vencida
            </span>
          )}
          {task.estimated_minutes && (
            <span className="text-[10px] text-text-muted">
              {task.estimated_minutes} min
            </span>
          )}
        </div>
      </div>
      {task.is_important === 1 && (
        <Star size={14} className="text-accent fill-accent flex-shrink-0 mt-0.5" />
      )}
    </motion.div>
  )
}
