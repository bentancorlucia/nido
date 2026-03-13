import { Plus, X } from 'lucide-react'
import type { ScheduleEntry } from '../../types'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface ScheduleEditorProps {
  value: ScheduleEntry[]
  onChange: (entries: ScheduleEntry[]) => void
}

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  function addEntry() {
    onChange([...value, { day: 1, start: '08:00', end: '10:00' }])
  }

  function updateEntry(index: number, updates: Partial<ScheduleEntry>) {
    const next = value.map((e, i) => (i === index ? { ...e, ...updates } : e))
    onChange(next)
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="faculty-label">Horario semanal</label>
      <div className="schedule-editor-list">
        {value.map((entry, i) => (
          <div key={i} className="schedule-editor-row">
            <select
              className="faculty-input"
              value={entry.day}
              onChange={(e) => updateEntry(i, { day: Number(e.target.value) })}
              style={{ padding: '7px 8px', fontSize: 12 }}
            >
              {DAY_LABELS.map((label, idx) => (
                <option key={idx} value={idx}>{label}</option>
              ))}
            </select>
            <input
              type="time"
              className="faculty-input"
              value={entry.start}
              onChange={(e) => updateEntry(i, { start: e.target.value })}
              style={{ padding: '7px 8px', fontSize: 12 }}
            />
            <input
              type="time"
              className="faculty-input"
              value={entry.end}
              onChange={(e) => updateEntry(i, { end: e.target.value })}
              style={{ padding: '7px 8px', fontSize: 12 }}
            />
            <input
              className="faculty-input"
              value={entry.room ?? ''}
              onChange={(e) => updateEntry(i, { room: e.target.value || undefined })}
              placeholder="Aula"
              style={{ padding: '7px 8px', fontSize: 12 }}
            />
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="grade-category-action-btn grade-category-action-btn--danger"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={addEntry} className="schedule-editor-add">
          <Plus size={14} />
          Agregar horario
        </button>
      </div>
    </div>
  )
}
