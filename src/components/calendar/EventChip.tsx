import { motion } from 'framer-motion'
import type { CalendarEvent } from '../../types'
import { EventTypeIcon } from '../../lib/eventTypes'

interface EventChipProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: (event: CalendarEvent) => void
  projectColor?: string | null
}

export function EventChip({ event, compact = false, onClick, projectColor }: EventChipProps) {
  const bgColor = event.color || projectColor || '#01A7C2'
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
        background: `linear-gradient(135deg, ${bgColor}28, ${bgColor}48)`,
        borderLeft: `3px solid ${bgColor}`,
        color: 'var(--color-text-primary)',
      }}
      title={event.title}
    >
      <span className="event-chip-inner">
        <EventTypeIcon type={event.event_type} size={11} className="event-chip-type-icon" />
        {startTime && !compact && (
          <span className="event-chip-time">{startTime}</span>
        )}
        <span className="event-chip-title">{event.title}</span>
        {event.google_event_id && (
          <span className="event-chip-google-badge" title="Google Calendar">G</span>
        )}
      </span>
    </motion.button>
  )
}
