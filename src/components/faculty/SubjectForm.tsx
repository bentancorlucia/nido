import { useState, useEffect } from 'react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { Modal } from '../ui/Modal'
import { ScheduleEditor } from './ScheduleEditor'
import type { Subject, ScheduleEntry } from '../../types'

const SUBJECT_COLORS = [
  '#01A7C2', '#DDF45B', '#7E1946', '#304B42', '#E8A830',
  '#5B8A72', '#A8E8F0', '#E8A0BC', '#6B3A80', '#A04030',
]

interface SubjectFormProps {
  isOpen: boolean
  onClose: () => void
  subject?: Subject | null
}

export function SubjectForm({ isOpen, onClose, subject }: SubjectFormProps) {
  const { createSubject, updateSubject, activeSemesterId } = useFacultyStore()
  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [description, setDescription] = useState('')
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [attendanceThreshold, setAttendanceThreshold] = useState(75)
  const [approvalThreshold, setApprovalThreshold] = useState(60)

  useEffect(() => {
    if (subject) {
      setName(subject.name)
      setProfessor(subject.professor ?? '')
      setColor(subject.color ?? SUBJECT_COLORS[0])
      setDescription(subject.description ?? '')
      setSchedule(subject.schedule ? JSON.parse(subject.schedule) : [])
      setAttendanceThreshold(subject.attendance_threshold)
      setApprovalThreshold(subject.approval_threshold)
    } else {
      setName('')
      setProfessor('')
      setColor(SUBJECT_COLORS[0])
      setDescription('')
      setSchedule([])
      setAttendanceThreshold(75)
      setApprovalThreshold(60)
    }
  }, [subject, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !activeSemesterId) return

    const data = {
      name: name.trim(),
      professor: professor.trim() || undefined,
      color,
      description: description.trim() || undefined,
      schedule: schedule.length > 0 ? JSON.stringify(schedule) : undefined,
      attendance_threshold: attendanceThreshold,
      approval_threshold: approvalThreshold,
    }

    if (subject) {
      await updateSubject(subject.id, data)
    } else {
      await createSubject({ ...data, semester_id: activeSemesterId })
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={subject ? 'Editar materia' : 'Nueva materia'} size="md">
      <form onSubmit={handleSubmit} className="subject-form">
        <div>
          <label className="faculty-label">Nombre de la materia</label>
          <input
            className="faculty-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Análisis Matemático II"
            autoFocus
          />
        </div>

        <div>
          <label className="faculty-label">Profesor/a</label>
          <input
            className="faculty-input"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            placeholder="Ej: Dra. García"
          />
        </div>

        <div>
          <label className="faculty-label">Color</label>
          <div className="subject-form-color-grid">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`subject-form-color-swatch${c === color ? ' subject-form-color-swatch--selected' : ''}`}
                style={{ backgroundColor: c, color: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <ScheduleEditor value={schedule} onChange={setSchedule} />

        <div className="semester-form-row">
          <div>
            <label className="faculty-label">Asistencia mínima (%)</label>
            <input
              type="number"
              className="faculty-input"
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="faculty-label">Aprobación mínima (%)</label>
            <input
              type="number"
              className="faculty-input"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </div>

        <div>
          <label className="faculty-label">Descripción (opcional)</label>
          <textarea
            className="faculty-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas sobre la materia..."
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="faculty-modal-actions">
          <button type="button" className="faculty-btn faculty-btn--ghost faculty-btn--sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="faculty-btn faculty-btn--primary faculty-btn--sm"
            disabled={!name.trim()}
          >
            {subject ? 'Guardar' : 'Crear materia'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
