import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFacultyStore } from '../../stores/useFacultyStore'
import type { Semester } from '../../types'

interface SemesterSelectorProps {
  onCreateNew: () => void
  onEdit: (semester: Semester) => void
}

function parseSemester(s: Semester): { period: 1 | 2; year: number } {
  const match = s.name.match(/(Primer|Segundo)\s+Semestre\s+(\d{4})/)
  if (match) {
    return { period: match[1] === 'Primer' ? 1 : 2, year: parseInt(match[2]) }
  }
  // Fallback: derive from dates
  const month = new Date(s.start_date + 'T12:00:00').getMonth()
  const year = new Date(s.start_date + 'T12:00:00').getFullYear()
  return { period: month < 6 ? 1 : 2, year }
}

export function SemesterSelector({ onCreateNew, onEdit }: SemesterSelectorProps) {
  const { semesters, activeSemesterId, setActiveSemester } = useFacultyStore()
  const ref = useRef<HTMLDivElement>(null)

  const active = semesters.find((s) => s.id === activeSemesterId)
  const activeParsed = active ? parseSemester(active) : null

  // Get available years from semesters
  const years = useMemo(() => {
    const ySet = new Set(semesters.map((s) => parseSemester(s).year))
    return Array.from(ySet).sort((a, b) => a - b)
  }, [semesters])

  const [viewYear, setViewYear] = useState(() => activeParsed?.year ?? new Date().getFullYear())

  useEffect(() => {
    if (activeParsed) setViewYear(activeParsed.year)
  }, [activeSemesterId])

  // Find semesters for the current viewYear
  const sem1 = semesters.find((s) => {
    const p = parseSemester(s)
    return p.year === viewYear && p.period === 1
  })
  const sem2 = semesters.find((s) => {
    const p = parseSemester(s)
    return p.year === viewYear && p.period === 2
  })

  function handleSelect(sem: Semester | undefined) {
    if (sem) {
      setActiveSemester(sem.id)
    }
  }

  const canGoLeft = viewYear > Math.min(...years, viewYear) - 1
  const canGoRight = true

  return (
    <div className="sem-selector" ref={ref}>
      {/* Year nav */}
      <div className="sem-selector-year">
        <button
          className="sem-selector-year-btn"
          onClick={() => setViewYear((y) => y - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="sem-selector-year-label">{viewYear}</span>
        <button
          className="sem-selector-year-btn"
          onClick={() => setViewYear((y) => y + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Period pills */}
      <div className="sem-selector-pills">
        <button
          className={`sem-selector-pill${sem1?.id === activeSemesterId ? ' sem-selector-pill--active' : ''}${!sem1 ? ' sem-selector-pill--empty' : ''}`}
          onClick={() => sem1 ? handleSelect(sem1) : onCreateNew()}
          title={sem1 ? `Primer Semestre ${viewYear}` : 'Crear primer semestre'}
        >
          <span className="sem-selector-pill-label">1° sem</span>
          {sem1 && (
            <button
              className="sem-selector-pill-edit"
              onClick={(e) => { e.stopPropagation(); onEdit(sem1) }}
              title="Editar"
            >
              <Pencil size={11} />
            </button>
          )}
          {!sem1 && <Plus size={12} className="sem-selector-pill-plus" />}
        </button>
        <button
          className={`sem-selector-pill${sem2?.id === activeSemesterId ? ' sem-selector-pill--active' : ''}${!sem2 ? ' sem-selector-pill--empty' : ''}`}
          onClick={() => sem2 ? handleSelect(sem2) : onCreateNew()}
          title={sem2 ? `Segundo Semestre ${viewYear}` : 'Crear segundo semestre'}
        >
          <span className="sem-selector-pill-label">2° sem</span>
          {sem2 && (
            <button
              className="sem-selector-pill-edit"
              onClick={(e) => { e.stopPropagation(); onEdit(sem2) }}
              title="Editar"
            >
              <Pencil size={11} />
            </button>
          )}
          {!sem2 && <Plus size={12} className="sem-selector-pill-plus" />}
        </button>
      </div>
    </div>
  )
}
