import { motion } from 'framer-motion'
import type { CalendarEvent } from '../../types'

interface TimelineHourProps {
  hour: number
  events: CalendarEvent[]
  isCurrentHour: boolean
  currentMinute?: number
}

export function TimelineHour({ hour, events, isCurrentHour, currentMinute = 0 }: TimelineHourProps) {
  const label = `${hour.toString().padStart(2, '0')}:00`

  const eventsInHour = events.filter((e) => {
    const startHour = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    const endHour = parseInt(e.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return startHour <= hour && endHour > hour
  })

  const nowPct = isCurrentHour ? (currentMinute / 60) * 100 : 0

  return (
    <div className={`timeline-hour ${isCurrentHour ? 'timeline-hour-current' : ''}`}>
      <div className="timeline-hour-label">
        <span className={`timeline-hour-label-text ${
          isCurrentHour ? 'timeline-hour-label-active' : 'timeline-hour-label-inactive'
        }`}>
          {label}
        </span>
      </div>

      <div className="timeline-hour-content">
        {/* Now line inside the current hour */}
        {isCurrentHour && (
          <div className="timeline-now-line" style={{ top: `${nowPct}%` }}>
            <div className="timeline-now-dot" />
            <div className="timeline-now-bar" />
          </div>
        )}

        {eventsInHour.map((event) => {
          const startH = parseInt(event.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
          const endH = parseInt(event.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
          const endMin = parseInt(event.end_datetime.split('T')[1]?.split(':')[1] ?? '0')

          if (startH !== hour) return null

          const durationMinutes = (endH - startH) * 60 + (endMin - parseInt(event.start_datetime.split('T')[1]?.split(':')[1] ?? '0'))
          const heightBlocks = Math.max(1, Math.ceil(durationMinutes / 60))

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="timeline-hour-event"
              style={{
                backgroundColor: event.color ? `${event.color}20` : 'var(--color-primary-light)',
                borderLeft: `3px solid ${event.color || 'var(--color-primary)'}`,
              }}
            >
              <p className="timeline-hour-event-title">{event.title}</p>
              <p className="timeline-hour-event-time">
                {event.start_datetime.split('T')[1]?.slice(0, 5)} — {event.end_datetime.split('T')[1]?.slice(0, 5)}
              </p>
              {event.location && (
                <p className="timeline-hour-event-location">{event.location}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
