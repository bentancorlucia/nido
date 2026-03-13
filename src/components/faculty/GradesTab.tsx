import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { GradesSummary } from './GradesSummary'
import { Modal } from '../ui/Modal'

interface GradesTabProps {
  subjectId: string
  approvalThreshold: number
}

export function GradesTab({ subjectId, approvalThreshold }: GradesTabProps) {
  const {
    gradeCategories, grades, getWeightedAverage,
    createGradeCategory, updateGradeCategory, deleteGradeCategory,
    createGrade, updateGrade, deleteGrade,
  } = useFacultyStore()

  const cats = gradeCategories.filter((c) => c.subject_id === subjectId)
  const allGrades = grades.filter((g) => g.subject_id === subjectId)
  const result = getWeightedAverage(subjectId)

  // Category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catWeight, setCatWeight] = useState(0)

  // Grade form
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [editingGrade, setEditingGrade] = useState<string | null>(null)
  const [gradeCatId, setGradeCatId] = useState('')
  const [gradeName, setGradeName] = useState('')
  const [gradeScore, setGradeScore] = useState('')
  const [gradeMaxScore, setGradeMaxScore] = useState('10')
  const [gradeDate, setGradeDate] = useState('')

  function openCatForm(catId?: string) {
    if (catId) {
      const cat = cats.find((c) => c.id === catId)
      if (cat) {
        setCatName(cat.name)
        setCatWeight(cat.weight)
        setEditingCat(catId)
      }
    } else {
      setCatName('')
      setCatWeight(0)
      setEditingCat(null)
    }
    setShowCatForm(true)
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim() || catWeight <= 0) return
    if (editingCat) {
      await updateGradeCategory(editingCat, { name: catName.trim(), weight: catWeight })
    } else {
      await createGradeCategory(subjectId, { name: catName.trim(), weight: catWeight })
    }
    setShowCatForm(false)
  }

  function openGradeForm(categoryId: string, gradeId?: string) {
    if (gradeId) {
      const grade = allGrades.find((g) => g.id === gradeId)
      if (grade) {
        setGradeName(grade.name)
        setGradeScore(grade.score !== null ? String(grade.score) : '')
        setGradeMaxScore(String(grade.max_score))
        setGradeDate(grade.date ?? '')
        setGradeCatId(grade.category_id)
        setEditingGrade(gradeId)
      }
    } else {
      setGradeName('')
      setGradeScore('')
      setGradeMaxScore('10')
      setGradeDate('')
      setGradeCatId(categoryId)
      setEditingGrade(null)
    }
    setShowGradeForm(true)
  }

  async function handleGradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gradeName.trim()) return
    const data = {
      name: gradeName.trim(),
      score: gradeScore ? Number(gradeScore) : undefined,
      max_score: Number(gradeMaxScore) || 10,
      date: gradeDate || undefined,
    }
    if (editingGrade) {
      await updateGrade(editingGrade, data)
    } else {
      await createGrade({ ...data, category_id: gradeCatId, subject_id: subjectId })
    }
    setShowGradeForm(false)
  }

  return (
    <div>
      <div className="grades-header">
        <button
          className="faculty-btn faculty-btn--primary faculty-btn--sm"
          onClick={() => openCatForm()}
        >
          <Plus size={13} />
          Categoría
        </button>
      </div>

      <GradesSummary result={result} approvalThreshold={approvalThreshold} />

      {cats.length === 0 && (
        <div className="faculty-empty-state" style={{ padding: '40px 20px' }}>
          <div className="faculty-empty-title">Configurá las categorías de notas</div>
          <div className="faculty-empty-desc">
            Creá categorías como Parciales, TPs, etc. con su peso porcentual para calcular el promedio ponderado.
          </div>
        </div>
      )}

      <AnimatePresence>
        {cats.map((cat) => {
          const catGrades = allGrades.filter((g) => g.category_id === cat.id)
          return (
            <motion.div key={cat.id} className="grade-category" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grade-category-header">
                <div className="grade-category-header-left">
                  <span className="grade-category-name">{cat.name}</span>
                  <span className="grade-category-weight">{cat.weight}%</span>
                </div>
                <div className="grade-category-actions">
                  <button
                    className="grade-category-action-btn"
                    onClick={() => openGradeForm(cat.id)}
                    title="Agregar nota"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="grade-category-action-btn"
                    onClick={() => openCatForm(cat.id)}
                    title="Editar categoría"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="grade-category-action-btn grade-category-action-btn--danger"
                    onClick={() => deleteGradeCategory(cat.id)}
                    title="Eliminar categoría"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {catGrades.map((grade) => (
                <div key={grade.id} className="grade-row">
                  <span className="grade-row-name">{grade.name}</span>
                  <span className="grade-row-date">
                    {grade.date
                      ? new Date(grade.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                      : '—'}
                  </span>
                  {grade.score !== null ? (
                    <span className="grade-row-score">{grade.score}/{grade.max_score}</span>
                  ) : (
                    <span className="grade-row-score grade-row-score--pending">Pendiente</span>
                  )}
                  <span className="grade-row-percent">
                    {grade.score !== null ? `${Math.round((grade.score / grade.max_score) * 100)}%` : '—'}
                  </span>
                  <div className="grade-row-actions">
                    <button
                      className="grade-row-action-btn"
                      onClick={() => openGradeForm(cat.id, grade.id)}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="grade-row-action-btn grade-row-action-btn--danger"
                      onClick={() => deleteGrade(grade.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {catGrades.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Sin evaluaciones en esta categoría
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Category Modal */}
      <Modal isOpen={showCatForm} onClose={() => setShowCatForm(false)} title={editingCat ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <form onSubmit={handleCatSubmit} className="subject-form">
          <div>
            <label className="faculty-label">Nombre</label>
            <input className="faculty-input" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ej: Parciales" autoFocus />
          </div>
          <div>
            <label className="faculty-label">Peso (%)</label>
            <input type="number" className="faculty-input" value={catWeight || ''} onChange={(e) => setCatWeight(Number(e.target.value))} min={1} max={100} placeholder="Ej: 60" />
          </div>
          <div className="faculty-modal-actions">
            <button type="button" className="faculty-btn faculty-btn--ghost faculty-btn--sm" onClick={() => setShowCatForm(false)}>Cancelar</button>
            <button type="submit" className="faculty-btn faculty-btn--primary faculty-btn--sm" disabled={!catName.trim() || catWeight <= 0}>
              {editingCat ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={showGradeForm} onClose={() => setShowGradeForm(false)} title={editingGrade ? 'Editar nota' : 'Nueva nota'} size="sm">
        <form onSubmit={handleGradeSubmit} className="subject-form">
          <div>
            <label className="faculty-label">Nombre</label>
            <input className="faculty-input" value={gradeName} onChange={(e) => setGradeName(e.target.value)} placeholder="Ej: Parcial 1" autoFocus />
          </div>
          <div className="semester-form-row">
            <div>
              <label className="faculty-label">Nota (dejar vacío si pendiente)</label>
              <input type="number" step="0.1" className="faculty-input" value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} placeholder="Ej: 7.5" min={0} />
            </div>
            <div>
              <label className="faculty-label">Nota máxima</label>
              <input type="number" step="0.1" className="faculty-input" value={gradeMaxScore} onChange={(e) => setGradeMaxScore(e.target.value)} min={1} />
            </div>
          </div>
          <div>
            <label className="faculty-label">Fecha (opcional)</label>
            <input type="date" className="faculty-input" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} />
          </div>
          <div className="faculty-modal-actions">
            <button type="button" className="faculty-btn faculty-btn--ghost faculty-btn--sm" onClick={() => setShowGradeForm(false)}>Cancelar</button>
            <button type="submit" className="faculty-btn faculty-btn--primary faculty-btn--sm" disabled={!gradeName.trim()}>
              {editingGrade ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
