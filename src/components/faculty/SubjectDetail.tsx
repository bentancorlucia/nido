import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { AttendanceTab } from './AttendanceTab'
import { GradesTab } from './GradesTab'
import { SubjectInfoTab } from './SubjectInfoTab'
import type { Subject } from '../../types'

type TabId = 'asistencia' | 'notas' | 'info'

const TABS: { id: TabId; label: string }[] = [
  { id: 'asistencia', label: 'Asistencia' },
  { id: 'notas', label: 'Notas' },
  { id: 'info', label: 'Info' },
]

interface SubjectDetailProps {
  subject: Subject
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function SubjectDetail({ subject, onBack, onEdit, onDelete }: SubjectDetailProps) {
  const { selectedTab, setSelectedTab } = useFacultyStore()

  return (
    <div className="subject-detail">
      <div className="subject-detail-header">
        <button className="subject-detail-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div
          className="subject-detail-avatar"
          style={{ backgroundColor: subject.color ?? '#01A7C2' }}
        >
          {subject.name.charAt(0).toUpperCase()}
        </div>
        <div className="subject-detail-info">
          <div className="subject-detail-name">{subject.name}</div>
          {subject.professor && (
            <div className="subject-detail-professor">{subject.professor}</div>
          )}
        </div>
        <div className="subject-detail-actions">
          <button className="subject-detail-action-btn" onClick={onEdit} title="Editar">
            <Pencil size={16} />
          </button>
          <button className="subject-detail-action-btn" onClick={onDelete} title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="subject-detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`subject-detail-tab${selectedTab === tab.id ? ' subject-detail-tab--active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
            {selectedTab === tab.id && (
              <motion.div
                className="subject-detail-tab-indicator"
                layoutId="faculty-tab-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="subject-detail-tab-content">
        {selectedTab === 'asistencia' && <AttendanceTab subjectId={subject.id} />}
        {selectedTab === 'notas' && (
          <GradesTab subjectId={subject.id} approvalThreshold={subject.approval_threshold} />
        )}
        {selectedTab === 'info' && <SubjectInfoTab subject={subject} />}
      </div>
    </div>
  )
}
