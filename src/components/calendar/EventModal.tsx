import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Palette,
  Trash2,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Toggle } from '../ui/Toggle'
import { Dropdown } from '../ui/Dropdown'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useProjectStore } from '../../stores/useProjectStore'
import type { CalendarEvent } from '../../types'

const EVENT_COLORS = [
  { value: '#01A7C2', label: 'Pacific Blue' },
  { value: '#DDF45B', label: 'Lemon Lime' },
  { value: '#7E1946', label: 'Raspberry' },
  { value: '#5B8A72', label: 'Forest' },
  { value: '#E8A830', label: 'Ámbar' },
  { value: '#6B3A80', label: 'Lavanda' },
  { value: '#A04030', label: 'Coral' },
]

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  editingEvent?: CalendarEvent | null
  defaultDate?: Date | null
  defaultHour?: number | null
}

export function EventModal({
  isOpen,
  onClose,
  editingEvent,
  defaultDate,
  defaultHour,
}: EventModalProps) {
  const { createEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { projects } = useProjectStore()

  const isEditing = !!editingEvent

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [color, setColor] = useState('#01A7C2')
  const [location, setLocation] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Populate form when editing or creating
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title)
      setDescription(editingEvent.description || '')
      setStartDate(editingEvent.start_datetime.split('T')[0])
      setStartTime(editingEvent.start_datetime.split('T')[1]?.slice(0, 5) || '09:00')
      setEndDate(editingEvent.end_datetime.split('T')[0])
      setEndTime(editingEvent.end_datetime.split('T')[1]?.slice(0, 5) || '10:00')
      setIsAllDay(editingEvent.is_all_day === 1)
      setColor(editingEvent.color || '#01A7C2')
      setLocation(editingEvent.location || '')
      setProjectId(editingEvent.project_id)
    } else {
      const date = defaultDate || new Date()
      const dateStr = format(date, 'yyyy-MM-dd')
      const hour = defaultHour ?? 9
      setTitle('')
      setDescription('')
      setStartDate(dateStr)
      setStartTime(`${hour.toString().padStart(2, '0')}:00`)
      setEndDate(dateStr)
      setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`)
      setIsAllDay(false)
      setColor('#01A7C2')
      setLocation('')
      setProjectId(null)
      setDeleting(false)
    }
  }, [editingEvent, defaultDate, defaultHour, isOpen])

  async function handleSave() {
    if (!title.trim()) return

    const startDatetime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`
    const endDatetime = isAllDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime}:00`

    if (isEditing && editingEvent) {
      await updateEvent(editingEvent.id, {
        title: title.trim(),
        description: description.trim() || null,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        is_all_day: isAllDay ? 1 : 0,
        color,
        location: location.trim() || null,
        project_id: projectId,
      })
    } else {
      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        is_all_day: isAllDay,
        color,
        location: location.trim() || undefined,
        project_id: projectId,
      })
    }
    onClose()
  }

  async function handleDelete() {
    if (!editingEvent) return
    if (!deleting) {
      setDeleting(true)
      return
    }
    await deleteEvent(editingEvent.id)
    onClose()
  }

  const projectOptions = [
    { value: '__none__', label: 'Sin proyecto' },
    ...projects
      .filter((p) => p.is_archived === 0 && p.is_template === 0)
      .map((p) => ({
        value: p.id,
        label: p.name,
        color: p.color || undefined,
      })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar evento' : 'Nuevo evento'}
      size="lg"
    >
      <div className="eventmodal-form">
        {/* Title */}
        <Input
          placeholder="Título del evento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="eventmodal-input-base"
        />

        {/* All day toggle */}
        <div className="eventmodal-allday-row">
          <span className="eventmodal-allday-label">Todo el día</span>
          <Toggle checked={isAllDay} onChange={setIsAllDay} />
        </div>

        {/* Date/Time row */}
        <div className="eventmodal-datetime-grid">
          <div className="eventmodal-field">
            <label className="eventmodal-label">
              <Calendar size={12} /> Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (e.target.value > endDate) setEndDate(e.target.value)
              }}
              className="eventmodal-input"
            />
          </div>
          {!isAllDay && (
            <div className="eventmodal-field">
              <label className="eventmodal-label">
                <Clock size={12} /> Hora inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="eventmodal-input eventmodal-input-mono"
              />
            </div>
          )}
          <div className="eventmodal-field">
            <label className="eventmodal-label">
              <Calendar size={12} /> Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="eventmodal-input"
            />
          </div>
          {!isAllDay && (
            <div className="eventmodal-field">
              <label className="eventmodal-label">
                <Clock size={12} /> Hora fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="eventmodal-input eventmodal-input-mono"
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div className="eventmodal-field">
          <label className="eventmodal-label">
            <MapPin size={12} /> Ubicación
          </label>
          <Input
            placeholder="Agregar ubicación..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="eventmodal-field">
          <label className="eventmodal-label">
            <AlignLeft size={12} /> Descripción
          </label>
          <textarea
            placeholder="Agregar descripción..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="eventmodal-textarea"
          />
        </div>

        {/* Color picker */}
        <div className="eventmodal-field">
          <label className="eventmodal-label">
            <Palette size={12} /> Color
          </label>
          <div className="eventmodal-colors">
            {EVENT_COLORS.map((c) => (
              <motion.button
                key={c.value}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c.value)}
                className={`eventmodal-color-swatch ${
                  color === c.value ? 'eventmodal-color-swatch-selected' : ''
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value ? { color: c.value } as React.CSSProperties : {}),
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Project */}
        <Dropdown
          label="Proyecto"
          options={projectOptions}
          value={projectId || '__none__'}
          onChange={(val) => setProjectId(val === '__none__' ? null : val)}
        />

        {/* Actions */}
        <div className="eventmodal-actions">
          {isEditing ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<Trash2 size={14} />}
            >
              {deleting ? 'Confirmar eliminación' : 'Eliminar'}
            </Button>
          ) : (
            <div />
          )}

          <div className="eventmodal-actions-right">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {isEditing ? 'Guardar' : 'Crear evento'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
