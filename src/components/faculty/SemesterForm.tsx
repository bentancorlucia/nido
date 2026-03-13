import { useState, useEffect } from 'react'
import { useFacultyStore } from '../../stores/useFacultyStore'
import { Modal } from '../ui/Modal'
import type { Semester } from '../../types'

interface SemesterFormProps {
  isOpen: boolean
  onClose: () => void
  semester?: Semester | null
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i)

export function SemesterForm({ isOpen, onClose, semester }: SemesterFormProps) {
  const { createSemester, updateSemester, deleteSemester } = useFacultyStore()
  const [period, setPeriod] = useState<'1' | '2'>('1')
  const [year, setYear] = useState(currentYear)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (semester) {
      // Parse existing semester name to extract period/year
      const match = semester.name.match(/^(Primer|Segundo) Semestre (\d{4})$/)
      if (match) {
        setPeriod(match[1] === 'Primer' ? '1' : '2')
        setYear(parseInt(match[2]))
      } else {
        // Fallback: try to detect from name
        setPeriod(semester.name.toLowerCase().includes('segundo') || semester.name.includes('2') ? '2' : '1')
        const yearMatch = semester.name.match(/\d{4}/)
        setYear(yearMatch ? parseInt(yearMatch[0]) : currentYear)
      }
      setStartDate(semester.start_date)
      setEndDate(semester.end_date)
    } else {
      setPeriod('1')
      setYear(currentYear)
      // Auto-fill dates based on period
      updateDates('1', currentYear)
    }
  }, [semester, isOpen])

  function updateDates(p: '1' | '2', y: number) {
    if (p === '1') {
      setStartDate(`${y}-03-01`)
      setEndDate(`${y}-07-15`)
    } else {
      setStartDate(`${y}-08-01`)
      setEndDate(`${y}-12-15`)
    }
  }

  function handlePeriodChange(p: '1' | '2') {
    setPeriod(p)
    if (!semester) updateDates(p, year)
  }

  function handleYearChange(y: number) {
    setYear(y)
    if (!semester) updateDates(period, y)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate || submitting) return

    const name = `${period === '1' ? 'Primer' : 'Segundo'} Semestre ${year}`
    setSubmitting(true)
    try {
      if (semester) {
        await updateSemester(semester.id, { name, start_date: startDate, end_date: endDate })
      } else {
        await createSemester({ name, start_date: startDate, end_date: endDate })
      }
      onClose()
    } catch (err) {
      console.error('Error al guardar semestre:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!semester) return
    try {
      await deleteSemester(semester.id)
      onClose()
    } catch (err) {
      console.error('Error al eliminar semestre:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={semester ? 'Editar semestre' : 'Nuevo semestre'} size="sm">
      <form onSubmit={handleSubmit} className="semester-form">
        <div className="semester-form-row">
          <div>
            <label className="faculty-label">Semestre</label>
            <select
              className="faculty-input"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as '1' | '2')}
            >
              <option value="1">Primer Semestre</option>
              <option value="2">Segundo Semestre</option>
            </select>
          </div>
          <div>
            <label className="faculty-label">Año</label>
            <select
              className="faculty-input"
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="semester-form-row">
          <div>
            <label className="faculty-label">Fecha inicio</label>
            <input
              type="date"
              className="faculty-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="faculty-label">Fecha fin</label>
            <input
              type="date"
              className="faculty-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="faculty-modal-actions">
          {semester && (
            <button type="button" className="faculty-btn faculty-btn--danger faculty-btn--sm" onClick={handleDelete}>
              Eliminar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="faculty-btn faculty-btn--ghost faculty-btn--sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="faculty-btn faculty-btn--primary faculty-btn--sm"
            disabled={!startDate || !endDate || submitting}
          >
            {submitting ? 'Guardando...' : semester ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
