import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, ChevronRight, MapPin } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { EVENT_TYPES, EventTypeIcon } from '../../lib/eventTypes'
import type { EventType } from '../../types'

interface QuickEventPopoverProps {
  isOpen: boolean
  onClose: () => void
  onOpenFullModal: () => void
  date: Date | null
  hour: number | null
  /** Optional end hour when drag-creating */
  endHour?: number | null
  /** Pixel position for anchoring the popover */
  anchorPosition?: { top: number; left: number } | null
}

export function QuickEventPopover({
  isOpen,
  onClose,
  onOpenFullModal,
  date,
  hour,
  endHour,
  anchorPosition,
}: QuickEventPopoverProps) {
  const { createEvent } = useCalendarStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<EventType>('evento')
  const [location, setLocation] = useState('')
  const [showLocation, setShowLocation] = useState(false)

  const startHour = hour ?? 9
  const computedEndHour = endHour ?? startHour + 1

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setEventType('evento')
      setLocation('')
      setShowLocation(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  const handleQuickSave = useCallback(async () => {
    if (!title.trim() || !date) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const startTime = `${startHour.toString().padStart(2, '0')}:00`
    const endTime = `${computedEndHour.toString().padStart(2, '0')}:00`

    await createEvent({
      title: title.trim(),
      start_datetime: `${dateStr}T${startTime}:00`,
      end_datetime: `${dateStr}T${endTime}:00`,
      is_all_day: false,
      color: '#01A7C2',
      event_type: eventType,
      location: location.trim() || undefined,
    })
    onClose()
  }, [title, date, startHour, computedEndHour, eventType, location, createEvent, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl+Enter → open full modal with pre-filled data
          onOpenFullModal()
        } else {
          handleQuickSave()
        }
      }
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [handleQuickSave, onClose, onOpenFullModal]
  )

  const dateLabel = date
    ? format(date, "EEEE d 'de' MMMM", { locale: es })
    : ''

  const timeLabel = `${startHour.toString().padStart(2, '0')}:00 – ${computedEndHour.toString().padStart(2, '0')}:00`

  // Duration in human-readable form
  const durationHours = computedEndHour - startHour
  const durationLabel =
    durationHours === 1
      ? '1 hora'
      : durationHours < 1
        ? `${durationHours * 60} min`
        : `${durationHours} horas`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="quick-event-popover glass-strong"
          style={
            anchorPosition
              ? { position: 'fixed', top: anchorPosition.top, left: anchorPosition.left, zIndex: 1000 }
              : {}
          }
          onKeyDown={handleKeyDown}
        >
          {/* Date + time header */}
          <div className="quick-event-header">
            <span className="quick-event-date">{dateLabel}</span>
            <div className="quick-event-time-row">
              <Clock size={12} />
              <span className="quick-event-time">{timeLabel}</span>
              <span className="quick-event-duration">{durationLabel}</span>
            </div>
          </div>

          {/* Title input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del evento..."
            className="quick-event-input"
            autoComplete="off"
          />

          {/* Event type quick selector */}
          <div className="quick-event-types">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.type}
                onClick={() => setEventType(et.type)}
                className={`quick-event-type-chip${eventType === et.type ? ' quick-event-type-chip--active' : ''}`}
                title={et.label}
              >
                <EventTypeIcon type={et.type} size={12} />
                <span className="quick-event-type-label">{et.label}</span>
              </button>
            ))}
          </div>

          {/* Optional location (toggleable) */}
          <AnimatePresence>
            {showLocation ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="quick-event-location-row"
              >
                <MapPin size={12} className="quick-event-location-icon" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ubicación..."
                  className="quick-event-location-input"
                />
              </motion.div>
            ) : (
              <button
                className="quick-event-add-location"
                onClick={() => setShowLocation(true)}
              >
                <MapPin size={11} />
                Agregar ubicación
              </button>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="quick-event-actions">
            <button
              className="quick-event-more-btn"
              onClick={onOpenFullModal}
            >
              Más opciones
              <ChevronRight size={13} />
            </button>
            <div className="quick-event-actions-right">
              <button className="quick-event-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="quick-event-save"
                onClick={handleQuickSave}
                disabled={!title.trim()}
              >
                Crear
              </button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="quick-event-hints">
            <span><kbd>Enter</kbd> crear</span>
            <span><kbd>⌘Enter</kbd> más opciones</span>
            <span><kbd>Esc</kbd> cancelar</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
