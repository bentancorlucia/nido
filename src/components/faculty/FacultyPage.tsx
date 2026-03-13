import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { SemesterSelector } from './SemesterSelector'
import { SemesterForm } from './SemesterForm'
import { SubjectGrid } from './SubjectGrid'
import { SubjectForm } from './SubjectForm'
import { SubjectDetail } from './SubjectDetail'
import type { Semester, Subject } from '../../types'

export function FacultyPage() {
  const {
    semesters, activeSemesterId, subjects, selectedSubjectId,
    loadSemesters, loadSubjects, selectSubject, deleteSubject,
  } = useFacultyStore()
  const { loadProjects } = useProjectStore()

  const [semesterFormOpen, setSemesterFormOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [subjectFormOpen, setSubjectFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  useEffect(() => {
    loadSemesters()
    loadProjects()
  }, [])

  useEffect(() => {
    if (activeSemesterId) {
      loadSubjects(activeSemesterId)
    }
  }, [activeSemesterId])

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null

  function handleCreateSemester() {
    setEditingSemester(null)
    setSemesterFormOpen(true)
  }

  function handleEditSemester(semester: Semester) {
    setEditingSemester(semester)
    setSemesterFormOpen(true)
  }

  function handleCreateSubject() {
    setEditingSubject(null)
    setSubjectFormOpen(true)
  }

  function handleEditSubject(subject: Subject) {
    setEditingSubject(subject)
    setSubjectFormOpen(true)
  }

  async function handleDeleteSubject() {
    if (!selectedSubjectId) return
    await deleteSubject(selectedSubjectId)
  }

  return (
    <div className="faculty-page">
      <AnimatePresence mode="wait">
        {selectedSubject ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <SubjectDetail
              subject={selectedSubject}
              onBack={() => selectSubject(null)}
              onEdit={() => handleEditSubject(selectedSubject)}
              onDelete={handleDeleteSubject}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="faculty-toolbar">
              <div className="faculty-toolbar-left">
                <h1 className="faculty-toolbar-title">Facultad</h1>
                <SemesterSelector
                  onCreateNew={handleCreateSemester}
                  onEdit={handleEditSemester}
                />
              </div>
              {activeSemesterId && subjects.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="faculty-btn faculty-btn--primary"
                  onClick={handleCreateSubject}
                >
                  <Plus size={15} />
                  Nueva materia
                </motion.button>
              )}
            </div>
            <div className="faculty-content">
              <SubjectGrid
                onCreateSubject={handleCreateSubject}
                onEditSubject={handleEditSubject}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SemesterForm
        isOpen={semesterFormOpen}
        onClose={() => setSemesterFormOpen(false)}
        semester={editingSemester}
      />

      <SubjectForm
        isOpen={subjectFormOpen}
        onClose={() => setSubjectFormOpen(false)}
        subject={editingSubject}
      />
    </div>
  )
}
