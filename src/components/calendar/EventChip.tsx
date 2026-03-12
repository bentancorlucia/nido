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
      className={`event-chip ${compact ? 'event-chip-compact' : 'event-chip-normal'}`}
      style={{
        backgroundColor: `${bgColor}20`,
        borderLeft: `3px solid ${bgColor}`,
        color: bgColor,
      }}
      title={event.title}
    >
      <span className="event-chip-inner">
        {startTime && !compact && (
          <span className="event-chip-time">{startTime}</span>
        )}
        <span className="event-chip-title">{event.title}</span>
      </span>
    </motion.button>
  )
}
