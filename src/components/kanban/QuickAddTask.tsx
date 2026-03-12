import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, CornerDownLeft } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'

interface QuickAddTaskProps {
  columnId: string
  projectId: string
  onClose: () => void
}

export function QuickAddTask({ columnId, projectId, onClose }: QuickAddTaskProps) {
  const { createTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleCreate = async () => {
    if (!title.trim()) return
    await createTask({
      title: title.trim(),
      project_id: projectId,
      column_id: columnId,
    })
    setTitle('')
    inputRef.current?.focus()
  }

  return (
    <div className="quickadd-overlay">
      <motion.div
        className="quickadd-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="quickadd-modal glass-strong"
      >
        <div className="quickadd-input-wrap">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Nombre de la tarea..."
            className="quickadd-input"
          />
          <button onClick={onClose} className="quickadd-close icon-button">
            <X size={14} />
          </button>
        </div>
        <div className="quickadd-footer">
          <span className="quickadd-hint">
            <CornerDownLeft size={10} />
            Enter para crear
          </span>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="quickadd-submit"
          >
            Crear tarea
          </button>
        </div>
      </motion.div>
    </div>
  )
}
