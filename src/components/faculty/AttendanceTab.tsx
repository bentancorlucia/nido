import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, Trash2, ChevronDown, Calendar } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { AttendanceProgressBar } from './AttendanceProgressBar'
import type { ClassInstance, ClassStatus } from '../../types'

const STATUS_BTNS: { status: ClassStatus; label: string }[] = [
  { status: 'asisti', label: 'Asistí' },
  { status: 'falte', label: 'Falté' },
  { status: 'cancelada', label: 'Cancelada' },
]

interface AttendanceTabProps {
  subjectId: string
}

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(d: string) {
  const date = new Date(d + 'T12:00:00')
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' })
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month}`
}

function formatMonthLabel(monthKey: string): string {
  const date = new Date(monthKey + '-15T12:00:00')
  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

type GroupedMonth = { key: string; label: string; items: ClassInstance[] }

function groupByMonth(instances: ClassInstance[]): GroupedMonth[] {
  const groups = new Map<string, ClassInstance[]>()
  for (const inst of instances) {
    const monthKey = inst.date.slice(0, 7)
    if (!groups.has(monthKey)) groups.set(monthKey, [])
    groups.get(monthKey)!.push(inst)
  }
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: formatMonthLabel(key),
    items,
  }))
}

export function AttendanceTab({ subjectId }: AttendanceTabProps) {
  const {
    classInstances, getAttendanceStats, updateClassStatus,
    generateClassInstances, addManualClass, deleteClassInstance,
  } = useFacultyStore()

  const instances = classInstances.filter((c) => c.subject_id === subjectId)
  const stats = getAttendanceStats(subjectId)
  const today = getToday()
  const todayRef = useRef<HTMLDivElement>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [showFuture, setShowFuture] = useState(false)

  useEffect(() => {
    if (instances.length === 0) {
      generateClassInstances(subjectId)
    }
  }, [subjectId])

  // Scroll to today on first load
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [instances.length])

  const { pastAndToday, future } = useMemo(() => {
    const past: ClassInstance[] = []
    const fut: ClassInstance[] = []
    for (const inst of instances) {
      if (inst.date <= today) {
        past.push(inst)
      } else {
        fut.push(inst)
      }
    }
    // Chronological within each group
    past.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    fut.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    return { pastAndToday: past, future: fut }
  }, [instances, today])

  const pastMonthGroups = useMemo(() => {
    return groupByMonth(pastAndToday)
  }, [pastAndToday])

  const futureMonthGroups = useMemo(() => {
    return groupByMonth(future)
  }, [future])

  async function handleAddManual() {
    if (!newDate) return
    await addManualClass(subjectId, {
      date: newDate,
      start_time: newStart || undefined,
      end_time: newEnd || undefined,
    })
    setNewDate('')
    setNewStart('')
    setNewEnd('')
    setShowAddForm(false)
  }

  async function handleRegenerate() {
    await generateClassInstances(subjectId)
  }

  function renderStatusButtons(inst: ClassInstance) {
    return (
      <div className="attendance-row-status">
        {STATUS_BTNS.map(({ status, label }) => (
          <button
            key={status}
            className={`attendance-status-btn${inst.status === status ? ` attendance-status-btn--${status}` : ''}`}
            onClick={() => updateClassStatus(inst.id, inst.status === status ? 'pendiente' : status)}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  function renderRow(inst: ClassInstance, isFuture: boolean) {
    const isToday = inst.date === today

    return (
      <div
        key={inst.id}
        ref={isToday ? todayRef : undefined}
        className={`attendance-row${isToday ? ' attendance-row--today' : ''}${isFuture ? ' attendance-row--future' : ''}`}
      >
        <div className="attendance-row-left">
          {isToday && <div className="attendance-row-today-dot" />}
          <span className={`attendance-row-date${isToday ? ' attendance-row-date--today' : ''}`}>
            {isToday ? `Hoy — ${formatDate(inst.date)}` : formatDate(inst.date)}
          </span>
          <span className="attendance-row-time">
            {inst.start_time && inst.end_time ? `${inst.start_time} – ${inst.end_time}` : ''}
          </span>
        </div>
        <div className="attendance-row-right">
          {!isFuture ? (
            renderStatusButtons(inst)
          ) : (
            <span className="attendance-row-future-label">Próxima</span>
          )}
          {inst.is_manual === 1 && (
            <button
              className="attendance-row-delete"
              onClick={() => deleteClassInstance(inst.id)}
              title="Eliminar clase manual"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="attendance-header">
        <div className="attendance-header-left">
          <button
            className="faculty-btn faculty-btn--ghost faculty-btn--sm"
            onClick={handleRegenerate}
            title="Regenerar clases desde horario"
          >
            <RefreshCw size={13} />
            Regenerar
          </button>
          <button
            className="faculty-btn faculty-btn--ghost faculty-btn--sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={13} />
            Clase manual
          </button>
        </div>
      </div>

      <AttendanceProgressBar stats={stats} />

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="attendance-add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="attendance-add-form-field">
              <label>Fecha</label>
              <input type="date" className="faculty-input" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ fontSize: 12, padding: '6px 8px' }} />
            </div>
            <div className="attendance-add-form-field">
              <label>Inicio</label>
              <input type="time" className="faculty-input" value={newStart} onChange={(e) => setNewStart(e.target.value)} style={{ fontSize: 12, padding: '6px 8px' }} />
            </div>
            <div className="attendance-add-form-field">
              <label>Fin</label>
              <input type="time" className="faculty-input" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} style={{ fontSize: 12, padding: '6px 8px' }} />
            </div>
            <button
              className="faculty-btn faculty-btn--primary faculty-btn--sm"
              onClick={handleAddManual}
              disabled={!newDate}
              style={{ marginBottom: 2 }}
            >
              Agregar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past + Today: all markable, chronological, grouped by month */}
      {pastMonthGroups.length > 0 && (
        <div className="attendance-list">
          {pastMonthGroups.map((group) => (
            <div key={group.key} className="attendance-month-group">
              <div className="attendance-month-label">{group.label}</div>
              {group.items.map((inst) => renderRow(inst, false))}
            </div>
          ))}
        </div>
      )}

      {/* Future classes: collapsible */}
      {future.length > 0 && (
        <div className="attendance-future-section">
          <button
            className="attendance-future-toggle"
            onClick={() => setShowFuture(!showFuture)}
          >
            <Calendar size={13} />
            <span>Próximas clases ({future.length})</span>
            <ChevronDown
              size={13}
              style={{
                transition: 'transform 200ms',
                transform: showFuture ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          <AnimatePresence>
            {showFuture && (
              <motion.div
                className="attendance-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                {futureMonthGroups.map((group) => (
                  <div key={group.key} className="attendance-month-group">
                    <div className="attendance-month-label">{group.label}</div>
                    {group.items.map((inst) => renderRow(inst, true))}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {instances.length === 0 && (
        <div className="faculty-empty-state" style={{ padding: '40px 20px' }}>
          <div className="faculty-empty-title">Sin clases registradas</div>
          <div className="faculty-empty-desc">
            Definí un horario semanal en la materia o agregá clases manuales.
          </div>
        </div>
      )}
    </div>
  )
}
