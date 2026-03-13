import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Palette,
  Trash2,
  Cloud,
  Repeat,
  X,
  Tag,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Toggle } from '../ui/Toggle'
import { ProjectPicker } from '../kanban/ProjectPicker'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useProjectStore } from '../../stores/useProjectStore'
import type { CalendarEvent, EventType } from '../../types'
import { EVENT_TYPES, EventTypeIcon } from '../../lib/eventTypes'

const EVENT_COLORS = [
  { value: '#01A7C2', label: 'Pacific Blue' },
  { value: '#DDF45B', label: 'Lemon Lime' },
  { value: '#7E1946', label: 'Raspberry' },
  { value: '#5B8A72', label: 'Forest' },
  { value: '#E8A830', label: 'Ámbar' },
  { value: '#6B3A80', label: 'Lavanda' },
  { value: '#A04030', label: 'Coral' },
]

const DURATION_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
]

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom'

const WEEK_DAYS = [
  { label: 'D', value: 0, name: 'Dom' },
  { label: 'L', value: 1, name: 'Lun' },
  { label: 'M', value: 2, name: 'Mar' },
  { label: 'X', value: 3, name: 'Mié' },
  { label: 'J', value: 4, name: 'Jue' },
  { label: 'V', value: 5, name: 'Vie' },
  { label: 'S', value: 6, name: 'Sáb' },
]

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  editingEvent?: CalendarEvent | null
  defaultDate?: Date | null
  defaultHour?: number | null
  defaultEndHour?: number | null
  /** Pre-filled title from quick popover */
  defaultTitle?: string
  /** Pre-filled event type from quick popover */
  defaultEventType?: EventType
}

function parseRecurrenceRule(rule: string | null): {
  type: RecurrenceType
  weekDays: number[]
  monthDay: number
  customInterval: number
  customUnit: 'days' | 'weeks' | 'months'
} {
  const defaults = {
    type: 'none' as RecurrenceType,
    weekDays: [] as number[],
    monthDay: 1,
    customInterval: 2,
    customUnit: 'days' as const,
  }
  if (!rule) return defaults

  const [t, param] = rule.split(':')
  switch (t) {
    case 'daily': return { ...defaults, type: 'daily' }
    case 'weekdays': return { ...defaults, type: 'weekdays' }
    case 'weekly':
      if (param) return { ...defaults, type: 'weekly', weekDays: param.split(',').map(Number) }
      return { ...defaults, type: 'weekly' }
    case 'biweekly':
      return { ...defaults, type: 'biweekly', weekDays: param ? param.split(',').map(Number) : [] }
    case 'monthly':
      return { ...defaults, type: 'monthly', monthDay: param ? parseInt(param) : 1 }
    case 'yearly': return { ...defaults, type: 'yearly' }
    case 'custom': {
      const match = param?.match(/every_(\d+)_(days|weeks|months)/)
      return {
        ...defaults,
        type: 'custom',
        customInterval: match ? parseInt(match[1]) : 2,
        customUnit: (match?.[2] as 'days' | 'weeks' | 'months') ?? 'days',
      }
    }
    default: return defaults
  }
}

function buildEventRecurrenceRule(
  type: RecurrenceType,
  opts: { weekDays: number[]; monthDay: number; customInterval: number; customUnit: string }
): string | null {
  switch (type) {
    case 'none': return null
    case 'daily': return 'daily'
    case 'weekdays': return 'weekdays'
    case 'weekly':
      return opts.weekDays.length ? `weekly:${opts.weekDays.join(',')}` : 'weekly'
    case 'biweekly':
      return opts.weekDays.length ? `biweekly:${opts.weekDays.join(',')}` : 'biweekly'
    case 'monthly': return `monthly:${opts.monthDay}`
    case 'yearly': return 'yearly'
    case 'custom':
      return `custom:every_${opts.customInterval}_${opts.customUnit}`
    default: return null
  }
}

function recurrenceLabel(type: RecurrenceType, opts: {
  weekDays: number[]; monthDay: number; customInterval: number; customUnit: string
}): string {
  switch (type) {
    case 'none': return ''
    case 'daily': return 'Todos los días'
    case 'weekdays': return 'Días hábiles (Lun-Vie)'
    case 'weekly':
      if (opts.weekDays.length) {
        return `Semanal: ${opts.weekDays.map((d) => WEEK_DAYS[d]?.name).join(', ')}`
      }
      return 'Cada semana'
    case 'biweekly':
      if (opts.weekDays.length) {
        return `Cada 2 semanas: ${opts.weekDays.map((d) => WEEK_DAYS[d]?.name).join(', ')}`
      }
      return 'Cada 2 semanas'
    case 'monthly': return `Mensual (día ${opts.monthDay})`
    case 'yearly': return 'Anual'
    case 'custom': {
      const unitLabels: Record<string, string> = { days: 'días', weeks: 'semanas', months: 'meses' }
      return `Cada ${opts.customInterval} ${unitLabels[opts.customUnit] ?? opts.customUnit}`
    }
    default: return ''
  }
}

/** Compute end time from start time + duration in minutes */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m + minutes
  const newH = Math.min(23, Math.floor(totalMin / 60))
  const newM = totalMin % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}

/** Compute duration in minutes between two times */
function getDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export function EventModal({
  isOpen,
  onClose,
  editingEvent,
  defaultDate,
  defaultHour,
  defaultEndHour,
  defaultTitle,
  defaultEventType,
}: EventModalProps) {
  const { createEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { projects } = useProjectStore()
  const titleRef = useRef<HTMLInputElement>(null)

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
  const [eventType, setEventType] = useState<EventType>('evento')
  const [deleting, setDeleting] = useState(false)
  const [syncToGoogle, setSyncToGoogle] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Collapsible section state
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none')
  const [weekDays, setWeekDays] = useState<number[]>([])
  const [monthDay, setMonthDay] = useState(1)
  const [customInterval, setCustomInterval] = useState(2)
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')

  useEffect(() => {
    window.nido.google.isConnected().then(setGoogleConnected)
  }, [isOpen])

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
      setEventType(editingEvent.event_type ?? 'evento')
      setSyncToGoogle(!!editingEvent.google_event_id)

      // Show advanced if event has recurrence, description, or location
      setShowAdvanced(
        !!editingEvent.recurrence_rule ||
        !!editingEvent.description ||
        !!editingEvent.location
      )

      // Parse recurrence
      const parsed = parseRecurrenceRule(editingEvent.recurrence_rule)
      setRecurrenceType(editingEvent.is_recurring === 1 ? parsed.type : 'none')
      setWeekDays(parsed.weekDays)
      setMonthDay(parsed.monthDay)
      setCustomInterval(parsed.customInterval)
      setCustomUnit(parsed.customUnit)
      setRecurrenceEnd(editingEvent.recurrence_end ?? '')
    } else {
      const date = defaultDate || new Date()
      const dateStr = format(date, 'yyyy-MM-dd')
      const hour = defaultHour ?? 9
      const endH = defaultEndHour ?? hour + 1
      setTitle(defaultTitle || '')
      setDescription('')
      setStartDate(dateStr)
      setStartTime(`${hour.toString().padStart(2, '0')}:00`)
      setEndDate(dateStr)
      setEndTime(`${endH.toString().padStart(2, '0')}:00`)
      setIsAllDay(false)
      setColor('#01A7C2')
      setLocation('')
      setProjectId(null)
      setEventType(defaultEventType || 'evento')
      setDeleting(false)
      setSyncToGoogle(false)
      setRecurrenceType('none')
      setWeekDays([])
      setMonthDay(1)
      setCustomInterval(2)
      setCustomUnit('days')
      setRecurrenceEnd('')
      setShowAdvanced(false)
    }
  }, [editingEvent, defaultDate, defaultHour, defaultEndHour, defaultTitle, defaultEventType, isOpen])

  const handleSave = useCallback(async () => {
    if (!title.trim()) return

    const startDatetime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`
    const endDatetime = isAllDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime}:00`

    const recurrenceOpts = { weekDays, monthDay, customInterval, customUnit }
    const rule = buildEventRecurrenceRule(recurrenceType, recurrenceOpts)

    if (isEditing && editingEvent) {
      await updateEvent(editingEvent.id, {
        title: title.trim(),
        description: description.trim() || null,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        is_all_day: isAllDay ? 1 : 0,
        color,
        location: location.trim() || null,
        event_type: eventType,
        project_id: projectId,
        is_recurring: rule ? 1 : 0,
        recurrence_rule: rule,
        recurrence_end: recurrenceEnd || null,
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
        event_type: eventType,
      })
      // Update recurrence if set
      if (rule) {
        const { events } = useCalendarStore.getState()
        const created = events.find((e) => e.title === title.trim())
        if (created) {
          await updateEvent(created.id, {
            is_recurring: 1,
            recurrence_rule: rule,
            recurrence_end: recurrenceEnd || null,
          })
        }
      }
    }
    onClose()
  }, [
    title, description, startDate, startTime, endDate, endTime, isAllDay,
    color, location, projectId, eventType, weekDays, monthDay, customInterval,
    customUnit, recurrenceType, recurrenceEnd, isEditing, editingEvent,
    createEvent, updateEvent, onClose,
  ])

  async function handleDelete() {
    if (!editingEvent) return
    if (!deleting) {
      setDeleting(true)
      return
    }
    await deleteEvent(editingEvent.id)
    onClose()
  }

  // Keyboard: Cmd/Ctrl+Enter to save
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleSave])

  const selectedProject = projectId
    ? projects.find((p) => p.id === projectId)
    : null

  const recurrenceOpts = { weekDays, monthDay, customInterval, customUnit }
  const recLabel = recurrenceLabel(recurrenceType, recurrenceOpts)

  // Current duration for highlighting presets
  const currentDuration = getDurationMinutes(startTime, endTime)

  const RECURRENCE_PRESETS: { value: RecurrenceType; label: string }[] = [
    { value: 'none', label: 'Sin repetición' },
    { value: 'daily', label: 'Todos los días' },
    { value: 'weekdays', label: 'Días hábiles' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Cada 2 semanas' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
    { value: 'custom', label: 'Personalizado...' },
  ]

  // Apply duration preset
  function applyDuration(minutes: number) {
    setEndTime(addMinutesToTime(startTime, minutes))
  }

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
          ref={titleRef}
          placeholder="Título del evento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="eventmodal-input-base"
        />

        {/* Event type */}
        <div className="eventmodal-field">
          <label className="eventmodal-label">
            <Tag size={12} /> Tipo de evento
          </label>
          <div className="eventmodal-type-chips">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.type}
                onClick={() => setEventType(et.type)}
                className={`eventmodal-type-chip${eventType === et.type ? ' eventmodal-type-chip--active' : ''}`}
              >
                <EventTypeIcon type={et.type} size={13} />
                {et.label}
              </button>
            ))}
          </div>
        </div>

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
                onChange={(e) => {
                  setStartTime(e.target.value)
                  // Auto-adjust end time to maintain duration
                  const dur = getDurationMinutes(startTime, endTime)
                  setEndTime(addMinutesToTime(e.target.value, Math.max(dur, 30)))
                }}
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

        {/* Duration presets — only shown when not all-day */}
        {!isAllDay && (
          <div className="eventmodal-duration-presets">
            <Zap size={11} className="eventmodal-duration-icon" />
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => applyDuration(preset.minutes)}
                className={`eventmodal-duration-chip${currentDuration === preset.minutes ? ' eventmodal-duration-chip--active' : ''}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Color + Project compact row */}
        <div className="eventmodal-color-project-row">
          <div className="eventmodal-field" style={{ flex: '0 0 auto' }}>
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

          <div className="eventmodal-field eventmodal-project-picker-wrapper" style={{ flex: 1, minWidth: 0 }}>
            <label className="eventmodal-label">
              <FolderTree size={12} /> Proyecto
            </label>
            <button
              type="button"
              className="eventmodal-project-trigger"
              onClick={() => setPickerOpen(true)}
            >
              {selectedProject ? (
                <span className="eventmodal-project-selected">
                  <span
                    className="eventmodal-project-dot"
                    style={{ backgroundColor: selectedProject.color ?? '#01A7C2' }}
                  />
                  {selectedProject.name}
                </span>
              ) : (
                <span className="eventmodal-project-placeholder">Sin proyecto</span>
              )}
              <ChevronDown size={14} className="eventmodal-project-chevron" />
            </button>
            {projectId && (
              <button
                type="button"
                className="eventmodal-project-clear"
                onClick={() => setProjectId(null)}
              >
                <X size={11} /> Quitar
              </button>
            )}
            <ProjectPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              selectedProjectId={projectId}
              onSelect={(id) => setProjectId(id)}
            />
          </div>
        </div>

        {/* Advanced section toggle */}
        <button
          className="eventmodal-advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="eventmodal-advanced-toggle-text">
            {showAdvanced ? 'Ocultar opciones' : 'Más opciones'}
          </span>
          <span className="eventmodal-advanced-toggle-badges">
            {location && !showAdvanced && (
              <span className="eventmodal-advanced-badge">
                <MapPin size={10} /> {location}
              </span>
            )}
            {recurrenceType !== 'none' && !showAdvanced && (
              <span className="eventmodal-advanced-badge">
                <Repeat size={10} /> {recLabel}
              </span>
            )}
            {description && !showAdvanced && (
              <span className="eventmodal-advanced-badge">
                <AlignLeft size={10} /> Descripción
              </span>
            )}
          </span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Advanced collapsible section */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="eventmodal-advanced-section"
            >
              {/* Location + Description */}
              <div className="eventmodal-extras-grid">
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
                <div className="eventmodal-field">
                  <label className="eventmodal-label">
                    <AlignLeft size={12} /> Descripción
                  </label>
                  <textarea
                    placeholder="Agregar descripción..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="eventmodal-textarea"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="eventmodal-recurrence">
                <div className="eventmodal-recurrence-header">
                  <label className="eventmodal-label">
                    <Repeat size={12} /> Repetición
                  </label>
                  {recLabel && (
                    <span className="eventmodal-recurrence-badge">{recLabel}</span>
                  )}
                </div>

                {/* Preset chips */}
                <div className="eventmodal-recurrence-presets">
                  {RECURRENCE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setRecurrenceType(preset.value)
                        if (preset.value === 'weekly' || preset.value === 'biweekly') {
                          const dayOfWeek = startDate ? new Date(startDate + 'T12:00:00').getDay() : 1
                          setWeekDays([dayOfWeek])
                        }
                        if (preset.value === 'monthly') {
                          const day = startDate ? parseInt(startDate.split('-')[2]) : 1
                          setMonthDay(day)
                        }
                      }}
                      className={`eventmodal-recurrence-chip${recurrenceType === preset.value ? ' eventmodal-recurrence-chip--active' : ''}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Weekly / biweekly day picker */}
                <AnimatePresence>
                  {(recurrenceType === 'weekly' || recurrenceType === 'biweekly') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="eventmodal-recurrence-days"
                    >
                      <span className="eventmodal-recurrence-days-label">Repetir los:</span>
                      <div className="eventmodal-recurrence-days-row">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            onClick={() => {
                              setWeekDays((prev) =>
                                prev.includes(day.value)
                                  ? prev.filter((d) => d !== day.value)
                                  : [...prev, day.value].sort()
                              )
                            }}
                            className={`eventmodal-day-chip${weekDays.includes(day.value) ? ' eventmodal-day-chip--active' : ''}`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Monthly day picker */}
                <AnimatePresence>
                  {recurrenceType === 'monthly' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="eventmodal-recurrence-monthly"
                    >
                      <span className="eventmodal-recurrence-days-label">Día del mes:</span>
                      <input
                        type="number"
                        value={monthDay}
                        onChange={(e) => setMonthDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={31}
                        className="eventmodal-recurrence-num-input"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom interval */}
                <AnimatePresence>
                  {recurrenceType === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="eventmodal-recurrence-custom"
                    >
                      <span className="eventmodal-recurrence-days-label">Cada</span>
                      <input
                        type="number"
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        className="eventmodal-recurrence-num-input"
                      />
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value as 'days' | 'weeks' | 'months')}
                        className="eventmodal-recurrence-select"
                      >
                        <option value="days">días</option>
                        <option value="weeks">semanas</option>
                        <option value="months">meses</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recurrence end date */}
                <AnimatePresence>
                  {recurrenceType !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="eventmodal-recurrence-end"
                    >
                      <span className="eventmodal-recurrence-days-label">Finaliza:</span>
                      <input
                        type="date"
                        value={recurrenceEnd}
                        onChange={(e) => setRecurrenceEnd(e.target.value)}
                        className="eventmodal-recurrence-date-input"
                        min={startDate}
                      />
                      {recurrenceEnd && (
                        <button
                          onClick={() => setRecurrenceEnd('')}
                          className="eventmodal-recurrence-clear"
                        >
                          <X size={11} />
                        </button>
                      )}
                      {!recurrenceEnd && (
                        <span className="eventmodal-recurrence-never">Sin fecha de fin</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Calendar Sync */}
        {googleConnected && (
          <div className="eventmodal-allday-row">
            <span className="eventmodal-allday-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cloud size={12} /> Sincronizar con Google Calendar
            </span>
            <Toggle checked={syncToGoogle} onChange={setSyncToGoogle} />
          </div>
        )}

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
            <span className="eventmodal-save-hint">⌘↵</span>
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
