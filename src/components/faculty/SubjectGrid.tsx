import { GraduationCap, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { SubjectCard } from './SubjectCard'
import type { Subject } from '../../types'

interface SubjectGridProps {
  onCreateSubject: () => void
  onEditSubject: (subject: Subject) => void
}

export function SubjectGrid({ onCreateSubject, onEditSubject }: SubjectGridProps) {
  const { subjects, selectSubject, activeSemesterId } = useFacultyStore()

  if (!activeSemesterId) {
    return (
      <div className="faculty-empty-state">
        <div className="faculty-empty-icon">
          <GraduationCap size={26} />
        </div>
        <div className="faculty-empty-title">Creá tu primer semestre</div>
        <div className="faculty-empty-desc">
          Usá el selector de arriba para crear un semestre y empezar a agregar materias.
        </div>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="faculty-empty-state">
        <div className="faculty-empty-icon">
          <GraduationCap size={26} />
        </div>
        <div className="faculty-empty-title">Sin materias en este semestre</div>
        <div className="faculty-empty-desc">
          Agregá tu primera materia para empezar a registrar asistencias y notas.
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="faculty-btn faculty-btn--primary"
          onClick={onCreateSubject}
        >
          <Plus size={15} />
          Nueva materia
        </motion.button>
      </div>
    )
  }

  return (
    <div className="subject-grid">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onClick={() => selectSubject(subject.id)}
          onEdit={() => onEditSubject(subject)}
        />
      ))}
    </div>
  )
}
