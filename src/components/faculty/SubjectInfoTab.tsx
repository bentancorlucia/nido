import { useState } from 'react'
import { Folder, Link2, Unlink, Plus, Award } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { Modal } from '../ui/Modal'
import type { Subject, ScheduleEntry } from '../../types'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface SubjectInfoTabProps {
  subject: Subject
}

export function SubjectInfoTab({ subject }: SubjectInfoTabProps) {
  const { linkedProjects, linkProject, unlinkProject, setFinalGrade } = useFacultyStore()
  const { projects } = useProjectStore()

  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [finalGradeInput, setFinalGradeInput] = useState(subject.final_grade?.toString() ?? '')
  const [finalStatus, setFinalStatus] = useState(subject.final_status)

  const schedule: ScheduleEntry[] = subject.schedule ? JSON.parse(subject.schedule) : []

  const linkedIds = new Set(linkedProjects.map((p) => p.id))
  const availableProjects = projects.filter(
    (p) => !linkedIds.has(p.id) && p.is_archived === 0 && p.is_template === 0
  )

  async function handleSaveFinal() {
    const grade = Number(finalGradeInput)
    if (isNaN(grade)) return
    await setFinalGrade(subject.id, grade, finalStatus)
    setShowFinalModal(false)
  }

  return (
    <div>
      {/* Schedule */}
      {schedule.length > 0 && (
        <div className="subject-info-section">
          <div className="subject-info-section-title">Horario semanal</div>
          <div className="subject-info-schedule-grid">
            {schedule.map((entry, i) => (
              <div key={i} className="subject-info-schedule-row">
                <span className="subject-info-schedule-day">{DAY_LABELS[entry.day]}</span>
                <span className="subject-info-schedule-time">{entry.start} – {entry.end}</span>
                {entry.room && <span className="subject-info-schedule-room">{entry.room}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {subject.description && (
        <div className="subject-info-section">
          <div className="subject-info-section-title">Descripción</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {subject.description}
          </p>
        </div>
      )}

      {/* Linked Projects */}
      <div className="subject-info-section">
        <div className="subject-info-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Proyectos vinculados</span>
          <button
            className="faculty-btn faculty-btn--ghost faculty-btn--sm"
            onClick={() => setShowLinkModal(true)}
          >
            <Link2 size={12} />
            Vincular
          </button>
        </div>
        {linkedProjects.length > 0 ? (
          <div className="subject-info-projects-list">
            {linkedProjects.map((p) => (
              <div key={p.id} className="subject-info-project-row">
                <span className="subject-info-project-dot" style={{ backgroundColor: p.color ?? 'var(--color-primary)' }} />
                <Folder size={14} style={{ color: p.color ?? 'var(--color-text-muted)' }} />
                <span className="subject-info-project-name">{p.name}</span>
                <button
                  className="subject-info-unlink-btn"
                  onClick={() => unlinkProject(subject.id, p.id)}
                  title="Desvincular"
                >
                  <Unlink size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Sin proyectos vinculados
          </p>
        )}
      </div>

      {/* Final Grade */}
      <div className="subject-info-section">
        <div className="subject-info-section-title">Nota final</div>
        <div className="subject-info-final">
          <div className="subject-info-final-header">
            {subject.final_grade !== null ? (
              <span className="subject-info-final-grade">{subject.final_grade}</span>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Sin nota final registrada</span>
            )}
            <button
              className="faculty-btn faculty-btn--ghost faculty-btn--sm"
              onClick={() => setShowFinalModal(true)}
            >
              <Award size={13} />
              {subject.final_grade !== null ? 'Editar' : 'Registrar nota'}
            </button>
          </div>
        </div>
      </div>

      {/* Link Project Modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Vincular proyecto" size="sm">
        {availableProjects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
            {availableProjects.map((p) => (
              <button
                key={p.id}
                className="semester-dropdown-item"
                onClick={async () => { await linkProject(subject.id, p.id); setShowLinkModal(false) }}
              >
                <Folder size={14} style={{ color: p.color ?? 'var(--color-text-muted)' }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No hay proyectos disponibles para vincular
          </p>
        )}
      </Modal>

      {/* Final Grade Modal */}
      <Modal isOpen={showFinalModal} onClose={() => setShowFinalModal(false)} title="Nota final" size="sm">
        <div className="subject-form">
          <div>
            <label className="faculty-label">Nota</label>
            <input
              type="number"
              step="0.1"
              className="faculty-input"
              value={finalGradeInput}
              onChange={(e) => setFinalGradeInput(e.target.value)}
              placeholder="Ej: 8.0"
              min={0}
              autoFocus
            />
          </div>
          <div>
            <label className="faculty-label">Estado</label>
            <select
              className="faculty-input"
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value as Subject['final_status'])}
            >
              <option value="en_curso">En curso</option>
              <option value="aprobada">Aprobada</option>
              <option value="desaprobada">Desaprobada</option>
              <option value="libre">Libre</option>
            </select>
          </div>
          <div className="faculty-modal-actions">
            <button type="button" className="faculty-btn faculty-btn--ghost faculty-btn--sm" onClick={() => setShowFinalModal(false)}>Cancelar</button>
            <button
              type="button"
              className="faculty-btn faculty-btn--primary faculty-btn--sm"
              onClick={handleSaveFinal}
              disabled={!finalGradeInput}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
