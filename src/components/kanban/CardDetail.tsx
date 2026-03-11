import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Star, Calendar, Clock, Tag, Trash2, Archive,
  Plus, CheckCircle2, AlertTriangle, ChevronDown,
} from 'lucide-react'
import { modalVariants, overlayVariants } from '../../lib/animations'
import { useTaskStore } from '../../stores/useTaskStore'
import { useTagStore } from '../../stores/useTagStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { Checkbox } from '../ui/Checkbox'
import { ProgressBar } from '../ui/ProgressBar'
import { RecurrenceConfig } from './RecurrenceConfig'
import { dbQuery } from '../../lib/ipc'
import type { Task, Tag as TagType } from '../../types'

interface CardDetailProps {
  task: Task
  onClose: () => void
}

export function CardDetail({ task: initialTask, onClose }: CardDetailProps) {
  const { updateTask, deleteTask, completeTask, addTagToTask, removeTagFromTask, taskTags } = useTaskStore()
  const { tags, loadTags } = useTagStore()
  const { columns } = useProjectStore()

  const [task, setTask] = useState(initialTask)
  const [title, setTitle] = useState(initialTask.title)
  const [description, setDescription] = useState(initialTask.description ?? '')
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const currentTags = taskTags[task.id] ?? []

  useEffect(() => {
    loadTags()
    loadSubtasks()
  }, [])

  async function loadSubtasks() {
    const rows = await dbQuery<Task>(
      'SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY sort_order ASC',
      [task.id]
    )
    setSubtasks(rows)
  }

  const save = async (data: Partial<Task>) => {
    await updateTask(task.id, data)
    setTask((prev) => ({ ...prev, ...data }))
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      save({ title: title.trim() })
    }
  }

  const handleDescBlur = () => {
    const desc = description.trim() || null
    if (desc !== task.description) {
      save({ description: desc })
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    const { createTask } = useTaskStore.getState()
    await createTask({
      title: newSubtask.trim(),
      project_id: task.project_id,
      column_id: task.column_id,
      parent_task_id: task.id,
    })
    setNewSubtask('')
    await loadSubtasks()
  }

  const handleToggleSubtask = async (subtask: Task) => {
    const { completeTask: complete } = useTaskStore.getState()
    await complete(subtask.id, subtask.is_completed === 0)
    await loadSubtasks()
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    onClose()
  }

  const completedSubtasks = subtasks.filter((s) => s.is_completed === 1).length
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  const priorityOptions = [
    { value: 'alta', label: 'Alta', color: 'bg-priority-alta' },
    { value: 'media', label: 'Media', color: 'bg-priority-media' },
    { value: 'baja', label: 'Baja', color: 'bg-priority-baja' },
  ]

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        variants={overlayVariants}
        initial="hidden" animate="visible" exit="exit"
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className="relative w-full max-w-2xl mx-6 max-h-[85vh] glass-strong rounded-2xl shadow-lift overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start gap-3" style={{ padding: '28px 28px 0' }}>
          <Checkbox
            checked={task.is_completed === 1}
            onChange={(checked) => {
              completeTask(task.id, checked)
              setTask((prev) => ({ ...prev, is_completed: checked ? 1 : 0 }))
            }}
          />
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-lg font-display font-bold bg-transparent outline-none text-text-primary"
            />
          </div>
          <button
            onClick={() => save({ is_important: task.is_important === 1 ? 0 : 1 })}
            className="p-1.5 rounded-lg hover:bg-surface-alt/60 transition-colors"
          >
            <Star
              size={18}
              className={task.is_important === 1 ? 'text-accent fill-accent' : 'text-text-muted'}
            />
          </button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-alt/60 transition-colors"
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6" style={{ padding: '20px 28px 28px' }}>
          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Agregar descripción..."
            className="w-full text-[13.5px] bg-transparent outline-none text-text-secondary placeholder:text-text-muted/40 resize-none min-h-[60px]"
            rows={3}
          />

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="section-label block mb-2">Prioridad</label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => save({ priority: p.value as Task['priority'] })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      task.priority === p.value
                        ? 'ring-2 ring-primary/25 bg-surface-alt/50'
                        : 'bg-surface-alt/25 hover:bg-surface-alt/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column/Status */}
            <div className="relative">
              <label className="section-label block mb-2">Estado</label>
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt/25 hover:bg-surface-alt/50 text-[12px] font-medium transition-colors w-full"
              >
                <span className="text-text-primary truncate">
                  {columns.find((c) => c.id === task.column_id)?.name ?? 'Sin columna'}
                </span>
                <ChevronDown size={12} className="text-text-muted ml-auto" />
              </button>
              {showColumnPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                  <div className="absolute top-full mt-1.5 left-0 z-50 glass-strong rounded-xl shadow-lg p-1.5 min-w-[170px]">
                    {columns.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => {
                          save({ column_id: col.id })
                          setShowColumnPicker(false)
                        }}
                        className={`w-full px-3 py-2 text-[12px] text-left rounded-lg transition-colors ${
                          col.id === task.column_id ? 'bg-primary-light/50 text-primary font-medium' : 'text-text-primary hover:bg-surface-alt/50'
                        }`}
                      >
                        {col.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Due date */}
            <div>
              <label className="section-label block mb-2">Fecha límite</label>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-text-muted" />
                <input
                  type="date"
                  value={task.due_date ?? ''}
                  onChange={(e) => save({ due_date: e.target.value || null })}
                  className="text-[12px] bg-transparent outline-none text-text-primary"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="section-label block mb-2">Hora</label>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-text-muted" />
                <input
                  type="time"
                  value={task.due_time ?? ''}
                  onChange={(e) => save({ due_time: e.target.value || null })}
                  className="text-[12px] bg-transparent outline-none text-text-primary"
                />
              </div>
            </div>

            {/* Estimated time */}
            <div>
              <label className="section-label block mb-2">Tiempo estimado</label>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-text-muted" />
                <input
                  type="number"
                  value={task.estimated_minutes ?? ''}
                  onChange={(e) => save({ estimated_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="min"
                  className="text-[12px] bg-transparent outline-none text-text-primary w-16"
                  min={0}
                />
                <span className="text-[11px] text-text-muted">minutos</span>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <RecurrenceConfig task={task} onSave={save} />

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="section-label">Etiquetas</label>
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="p-1 rounded text-text-muted hover:text-primary transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {currentTags.map((tag) => (
                <motion.button
                  key={tag.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => removeTagFromTask(task.id, tag.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full hover:opacity-70 transition-opacity"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                  title="Click para quitar"
                >
                  {tag.name}
                  <X size={10} />
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {showTagPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex gap-1.5 flex-wrap overflow-hidden"
                >
                  {tags
                    .filter((t) => !currentTags.some((ct) => ct.id === t.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTagToTask(task.id, tag.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full opacity-60 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: tag.color + '30', color: tag.color }}
                      >
                        <Plus size={10} />
                        {tag.name}
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="section-label">
                Subtareas {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
              </label>
            </div>
            {subtasks.length > 0 && (
              <ProgressBar value={subtaskProgress} size="sm" className="mb-3" />
            )}
            <div className="space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={sub.is_completed === 1}
                    onChange={() => handleToggleSubtask(sub)}
                  />
                  <span className={`text-[13px] ${sub.is_completed === 1 ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Plus size={14} className="text-text-muted" />
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask() }}
                placeholder="Agregar subtarea..."
                className="flex-1 text-[13px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/40"
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex gap-4 text-[10px] text-text-muted pt-4 border-t border-border">
            <span>Creada: {new Date(task.created_at).toLocaleDateString('es-AR')}</span>
            <span>Modificada: {new Date(task.updated_at).toLocaleDateString('es-AR')}</span>
            {task.completed_at && (
              <span>Completada: {new Date(task.completed_at).toLocaleDateString('es-AR')}</span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border" style={{ padding: '16px 28px' }}>
          <button
            onClick={() => save({ is_archived: 1 }).then(onClose)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:bg-surface-alt/60 transition-colors"
          >
            <Archive size={13} />
            Archivar
          </button>
          <div className="flex-1" />
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-danger">¿Segura?</span>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-danger text-white text-[12px] font-medium"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-[12px] text-text-muted hover:bg-surface-alt/60"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-danger hover:bg-danger-light/60 transition-colors"
            >
              <Trash2 size={13} />
              Eliminar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
