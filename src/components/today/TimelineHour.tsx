import { motion } from 'framer-motion'
import type { CalendarEvent } from '../../types'

interface TimelineHourProps {
  hour: number
  events: CalendarEvent[]
  isCurrentHour: boolean
}

export function TimelineHour({ hour, events, isCurrentHour }: TimelineHourProps) {
  const label = `${hour.toString().padStart(2, '0')}:00`

  const eventsInHour = events.filter((e) => {
    const startHour = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    const endHour = parseInt(e.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return startHour <= hour && endHour > hour
  })

  return (
    <div className={`flex gap-4 min-h-[64px] group ${isCurrentHour ? 'relative' : ''}`}>
      {/* Hour label */}
      <div className="w-11 flex-shrink-0 pt-0 text-right">
        <span className={`text-[11px] font-mono tabular-nums transition-colors ${
          isCurrentHour ? 'text-primary font-semibold' : 'text-text-muted/70'
        }`}>
          {label}
        </span>
      </div>

      {/* Timeline line + content */}
      <div className="flex-1 border-t border-border/30 pt-2 pb-3 relative group-hover:border-border/50 transition-colors">
        {eventsInHour.map((event) => {
          const startMin = parseInt(event.start_datetime.split('T')[1]?.split(':')[1] ?? '0')
          const startH = parseInt(event.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
          const endH = parseInt(event.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
          const endMin = parseInt(event.end_datetime.split('T')[1]?.split(':')[1] ?? '0')

          // Only render in the start hour to avoid duplicates
          if (startH !== hour) return null

          const durationMinutes = (endH - startH) * 60 + (endMin - startMin)
          const heightBlocks = Math.max(1, Math.ceil(durationMinutes / 60))

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-1.5 px-3 py-2.5 rounded-xl text-[12px] font-medium shadow-sm transition-shadow hover:shadow-md"
              style={{
                backgroundColor: event.color ? `${event.color}20` : 'var(--color-primary-light)',
                borderLeft: `3px solid ${event.color || 'var(--color-primary)'}`,
                minHeight: `${heightBlocks * 52}px`,
              }}
            >
              <p className="text-text-primary font-medium">{event.title}</p>
              <p className="text-text-muted text-[10px] mt-1 font-mono tabular-nums">
                {event.start_datetime.split('T')[1]?.slice(0, 5)} — {event.end_datetime.split('T')[1]?.slice(0, 5)}
              </p>
              {event.location && (
                <p className="text-text-muted text-[10px] mt-0.5">{event.location}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
