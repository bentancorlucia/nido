import { motion } from 'framer-motion'
import type { CalendarEvent } from '../../types'

interface EventChipProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: (event: CalendarEvent) => void
}

export function EventChip({ event, compact = false, onClick }: EventChipProps) {
  const bgColor = event.color || 'var(--color-primary)'
  const isAllDay = event.is_all_day === 1

  const startTime = !isAllDay && event.start_datetime.includes('T')
    ? event.start_datetime.split('T')[1].slice(0, 5)
    : null

  return (
    <motion.button
      whileHover={{ y: -1, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick?.(event)}
      className={`
        w-full text-left rounded-md cursor-pointer
        transition-shadow duration-150 hover:shadow-md
        ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}
      `}
      style={{
        backgroundColor: `${bgColor}20`,
        borderLeft: `3px solid ${bgColor}`,
        color: bgColor,
      }}
      title={event.title}
    >
      <span className="flex items-center gap-1 truncate font-medium">
        {startTime && !compact && (
          <span className="opacity-70 font-mono text-[10px] flex-shrink-0">{startTime}</span>
        )}
        <span className="truncate">{event.title}</span>
      </span>
    </motion.button>
  )
}
