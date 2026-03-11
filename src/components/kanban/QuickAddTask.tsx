import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative glass-strong rounded-2xl shadow-lift w-full max-w-md"
        style={{ padding: '18px 22px' }}
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Nombre de la tarea..."
            className="flex-1 text-[14px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/45"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-alt/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-border">
          <span className="text-[11px] text-text-muted">Enter para crear, Esc para cancelar</span>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-[12px] font-semibold disabled:opacity-40 transition-opacity"
          >
            Crear
          </button>
        </div>
      </motion.div>
    </div>
  )
}
