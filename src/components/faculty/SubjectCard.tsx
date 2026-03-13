import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, MoreVertical, User } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import type { Subject, ScheduleEntry } from '../../types'

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const STATUS_LABELS: Record<string, string> = {
  en_curso: 'En curso',
  aprobada: 'Aprobada',
  desaprobada: 'Desaprobada',
  libre: 'Libre',
}

interface SubjectCardProps {
  subject: Subject
  onClick: () => void
  onEdit: () => void
}

export function SubjectCard({ subject, onClick, onEdit }: SubjectCardProps) {
  const { getAttendanceStats, getWeightedAverage } = useFacultyStore()

  const stats = getAttendanceStats(subject.id)
  const gradeResult = getWeightedAverage(subject.id)

  const scheduleEntries: ScheduleEntry[] = useMemo(() => {
    if (!subject.schedule) return []
    try { return JSON.parse(subject.schedule) } catch { return [] }
  }, [subject.schedule])

  const scheduleText = scheduleEntries
    .map((e) => `${DAY_SHORT[e.day]} ${e.start}`)
    .join(' · ')

  const hasAttendance = stats.total > 0
  const attendancePct = hasAttendance ? Math.round(stats.percentage) : null

  const gradeDisplay = gradeResult?.overall !== null && gradeResult?.overall !== undefined
    ? (gradeResult.overall * 10).toFixed(1)
    : null

  return (
    <motion.div
      className="subject-card"
      onClick={onClick}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="subject-card-accent" style={{ background: subject.color ?? '#01A7C2' }} />
      <div className="subject-card-body">
        <div className="subject-card-header">
          <span className="subject-card-name">{subject.name}</span>
          <span className={`subject-card-status subject-card-status--${subject.final_status}`}>
            {STATUS_LABELS[subject.final_status]}
          </span>
        </div>

        {subject.professor && (
          <div className="subject-card-professor">
            <User size={12} />
            {subject.professor}
          </div>
        )}

        <div className="subject-card-stats">
          <div className="subject-card-stat">
            <div className="subject-card-stat-label">Asistencia</div>
            {attendancePct !== null ? (
              <div className={`subject-card-stat-value ${stats.atRisk ? 'subject-card-stat-value--risk' : 'subject-card-stat-value--ok'}`}>
                {attendancePct}%
              </div>
            ) : (
              <div className="subject-card-stat-value subject-card-stat-value--none">Sin datos</div>
            )}
          </div>
          <div className="subject-card-stat">
            <div className="subject-card-stat-label">Promedio</div>
            {gradeDisplay !== null ? (
              <div className={`subject-card-stat-value ${gradeResult?.meetsThreshold ? 'subject-card-stat-value--ok' : 'subject-card-stat-value--risk'}`}>
                {gradeDisplay}
              </div>
            ) : (
              <div className="subject-card-stat-value subject-card-stat-value--none">Sin notas</div>
            )}
          </div>
        </div>

        {scheduleText && (
          <div className="subject-card-schedule">
            <Clock size={12} />
            {scheduleText}
          </div>
        )}
      </div>

      <button
        className="subject-card-menu-btn"
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        title="Editar materia"
      >
        <MoreVertical size={15} />
      </button>
    </motion.div>
  )
}
