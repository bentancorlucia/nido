import { motion } from 'framer-motion'
import { EventTypeIcon } from '../../lib/eventTypes'
import type { CalendarEvent } from '../../types'

export const HOUR_HEIGHT = 56

interface TimelineHourProps {
  hour: number
  events: CalendarEvent[]
  isCurrentHour: boolean
  currentMinute?: number
  projectColorMap?: Record<string, string>
}

export function TimelineHour({ hour, events, isCurrentHour, currentMinute = 0, projectColorMap = {} }: TimelineHourProps) {
  const label = `${hour.toString().padStart(2, '0')}:00`

  // Only render events that START in this hour
  const eventsStartingHere = events.filter((e) => {
    const startHour = parseInt(e.start_datetime.split('T')[1]?.split(':')[0] ?? '0')
    return startHour === hour
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

        {eventsStartingHere.map((event) => {
          const startMin = parseInt(event.start_datetime.split('T')[1]?.split(':')[1] ?? '0')
          const endH = parseInt(event.end_datetime.split('T')[1]?.split(':')[0] ?? '0')
          const endMin = parseInt(event.end_datetime.split('T')[1]?.split(':')[1] ?? '0')

          const durationMinutes = (endH - hour) * 60 + (endMin - startMin)
          const heightPx = Math.max(28, (durationMinutes / 60) * HOUR_HEIGHT - 6)
          const topPx = (startMin / 60) * HOUR_HEIGHT

          const bgColor = event.color || (event.project_id ? projectColorMap[event.project_id] : '') || '#01A7C2'

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, zIndex: 20 }}
              whileTap={{ scale: 0.98 }}
              className="timeline-hour-event"
              style={{
                background: `linear-gradient(135deg, ${bgColor}30, ${bgColor}50)`,
                borderLeft: `3.5px solid ${bgColor}`,
                color: 'var(--color-text-primary)',
                boxShadow: `0 1px 4px ${bgColor}18`,
                height: `${heightPx}px`,
                top: `${topPx}px`,
              }}
            >
              <p className="timeline-hour-event-title">
                <EventTypeIcon type={event.event_type} size={11} className="timeline-hour-event-icon" />
                {event.title}
              </p>
              {heightPx > 36 && (
                <p className="timeline-hour-event-time">
                  {event.start_datetime.split('T')[1]?.slice(0, 5)} — {event.end_datetime.split('T')[1]?.slice(0, 5)}
                </p>
              )}
              {event.location && heightPx > 50 && (
                <p className="timeline-hour-event-location">{event.location}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
