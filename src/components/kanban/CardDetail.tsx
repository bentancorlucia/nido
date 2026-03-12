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

const priorityColors: Record<string, string> = {
  alta: 'var(--color-priority-alta)',
  media: 'var(--color-priority-media)',
  baja: 'var(--color-priority-baja)',
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
  const [titleFocused, setTitleFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)
  const [subtaskFocused, setSubtaskFocused] = useState(false)
  const [hoverArchive, setHoverArchive] = useState(false)
  const [hoverDelete, setHoverDelete] = useState(false)
  const [hoverStar, setHoverStar] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)

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
    setTitleFocused(false)
    if (title.trim() && title !== task.title) {
      save({ title: title.trim() })
    }
  }

  const handleDescBlur = () => {
    setDescFocused(false)
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
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
  ]

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Shared styles
  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-muted)',
    margin: 0,
    marginBottom: 10,
    fontFamily: 'var(--font-display)',
  }

  const inputField: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--color-border)',
    backgroundColor: 'rgba(0,0,0,0.015)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'var(--shadow-inner)',
  }

  const inputFieldFocused: React.CSSProperties = {
    ...inputField,
    borderColor: 'var(--color-primary)',
    backgroundColor: 'var(--color-surface-alt)',
    boxShadow: 'var(--shadow-glow)',
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'transparent',
    outline: 'none',
    border: 'none',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <motion.div
        variants={overlayVariants}
        initial="hidden" animate="visible" exit="exit"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className="glass-strong"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          margin: '0 24px',
          maxHeight: '85vh',
          borderRadius: 22,
          boxShadow: 'var(--shadow-lift)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* ─── Header ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '28px 28px 0',
        }}>
          <div style={{ marginTop: 4 }}>
            <Checkbox
              checked={task.is_completed === 1}
              onChange={(checked) => {
                completeTask(task.id, checked)
                setTask((prev) => ({ ...prev, is_completed: checked ? 1 : 0 }))
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titleFocused ? inputFieldFocused : {
              ...inputField,
              border: '1.5px solid transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setTitleFocused(true)}
                onBlur={handleTitleBlur}
                style={{
                  ...inputBase,
                  fontSize: 18,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => save({ is_important: task.is_important === 1 ? 0 : 1 })}
            onMouseEnter={() => setHoverStar(true)}
            onMouseLeave={() => setHoverStar(false)}
            style={{
              padding: 8,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: hoverStar ? 'var(--color-surface-alt)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
            }}
          >
            <Star
              size={18}
              style={{
                color: task.is_important === 1 ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
                fill: task.is_important === 1 ? 'var(--color-accent)' : 'none',
              }}
            />
          </button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            onMouseEnter={() => setHoverClose(true)}
            onMouseLeave={() => setHoverClose(false)}
            style={{
              padding: 8,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: hoverClose ? 'var(--color-surface-alt)' : 'transparent',
              color: hoverClose ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* ─── Content ─── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          {/* Description */}
          <div style={descFocused ? inputFieldFocused : {
            ...inputField,
            border: '1.5px solid transparent',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          }}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setDescFocused(true)}
              onBlur={handleDescBlur}
              placeholder="Agregar descripci\u00f3n..."
              rows={3}
              style={{
                ...inputBase,
                fontSize: 13.5,
                lineHeight: 1.6,
                resize: 'none',
                minHeight: 60,
                color: description ? 'var(--color-text-secondary)' : undefined,
              }}
            />
          </div>

          {/* ─── Properties Grid ─── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}>
            {/* Priority */}
            <div>
              <p style={sectionLabel}>Prioridad</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {priorityOptions.map((p) => {
                  const isActive = task.priority === p.value
                  return (
                    <PriorityButton
                      key={p.value}
                      label={p.label}
                      color={priorityColors[p.value]}
                      isActive={isActive}
                      onClick={() => save({ priority: p.value as Task['priority'] })}
                    />
                  )
                })}
              </div>
            </div>

            {/* Column/Status */}
            <div style={{ position: 'relative' }}>
              <p style={sectionLabel}>Estado</p>
              <StatusDropdown
                value={columns.find((c) => c.id === task.column_id)?.name ?? 'Sin columna'}
                isOpen={showColumnPicker}
                onToggle={() => setShowColumnPicker(!showColumnPicker)}
                onClose={() => setShowColumnPicker(false)}
              >
                {columns.map((col) => (
                  <DropdownItem
                    key={col.id}
                    label={col.name}
                    isActive={col.id === task.column_id}
                    onClick={() => {
                      save({ column_id: col.id })
                      setShowColumnPicker(false)
                    }}
                  />
                ))}
              </StatusDropdown>
            </div>

            {/* Due date */}
            <div>
              <p style={sectionLabel}>Fecha l\u00edmite</p>
              <div style={{
                ...inputField,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
              }}>
                <Calendar size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={task.due_date ?? ''}
                  onChange={(e) => save({ due_date: e.target.value || null })}
                  style={{
                    ...inputBase,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <p style={sectionLabel}>Hora</p>
              <div style={{
                ...inputField,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
              }}>
                <Clock size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <input
                  type="time"
                  value={task.due_time ?? ''}
                  onChange={(e) => save({ due_time: e.target.value || null })}
                  style={{
                    ...inputBase,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Estimated time */}
            <div>
              <p style={sectionLabel}>Tiempo estimado</p>
              <div style={{
                ...inputField,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
              }}>
                <Clock size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <input
                  type="number"
                  value={task.estimated_minutes ?? ''}
                  onChange={(e) => save({ estimated_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="min"
                  min={0}
                  style={{
                    ...inputBase,
                    fontSize: 12.5,
                    fontWeight: 500,
                    width: 50,
                  }}
                />
                <span style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}>minutos</span>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div style={{
            padding: '16px 18px',
            borderRadius: 14,
            backgroundColor: 'var(--color-surface-solid)',
            border: '1px solid var(--color-border)',
          }}>
            <RecurrenceConfig task={task} onSave={save} />
          </div>

          {/* ─── Tags ─── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <p style={{ ...sectionLabel, marginBottom: 0 }}>Etiquetas</p>
              <TagAddButton onClick={() => setShowTagPicker(!showTagPicker)} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {currentTags.map((tag) => (
                <motion.button
                  key={tag.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => removeTagFromTask(task.id, tag.id)}
                  title="Click para quitar"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: tag.color + '25',
                    color: tag.color,
                    transition: 'opacity 150ms ease',
                    fontFamily: 'var(--font-sans)',
                  }}
                  whileHover={{ opacity: 0.7 }}
                >
                  {tag.name}
                  <X size={10} />
                </motion.button>
              ))}
              {currentTags.length === 0 && !showTagPicker && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.5, fontStyle: 'italic' }}>
                  Sin etiquetas
                </span>
              )}
            </div>
            <AnimatePresence>
              {showTagPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', overflow: 'hidden' }}
                >
                  {tags
                    .filter((t) => !currentTags.some((ct) => ct.id === t.id))
                    .map((tag) => (
                      <TagPickerItem
                        key={tag.id}
                        tag={tag}
                        onClick={() => addTagToTask(task.id, tag.id)}
                      />
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Subtasks ─── */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <p style={sectionLabel}>
                Subtareas {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
              </p>
            </div>
            {subtasks.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <ProgressBar value={subtaskProgress} size="sm" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {subtasks.map((sub) => (
                <div key={sub.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--color-surface-solid)',
                  border: '1px solid var(--color-border)',
                  transition: 'border-color 150ms ease',
                }}>
                  <Checkbox
                    checked={sub.is_completed === 1}
                    onChange={() => handleToggleSubtask(sub)}
                  />
                  <span style={{
                    fontSize: 13,
                    color: sub.is_completed === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    textDecoration: sub.is_completed === 1 ? 'line-through' : 'none',
                    fontWeight: 450,
                  }}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
            {/* Add subtask input */}
            <div style={{
              ...(subtaskFocused ? inputFieldFocused : inputField),
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
              padding: '8px 12px',
            }}>
              <Plus size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onFocus={() => setSubtaskFocused(true)}
                onBlur={() => setSubtaskFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask() }}
                placeholder="Agregar subtarea..."
                style={{
                  ...inputBase,
                  fontSize: 13,
                  fontWeight: 450,
                }}
              />
            </div>
          </div>

          {/* ─── Timestamps ─── */}
          <div style={{
            display: 'flex',
            gap: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Creada: {new Date(task.created_at).toLocaleDateString('es-AR')}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Modificada: {new Date(task.updated_at).toLocaleDateString('es-AR')}
            </span>
            {task.completed_at && (
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Completada: {new Date(task.completed_at).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderTop: '1px solid var(--color-border)',
          padding: '14px 28px',
        }}>
          <button
            onClick={() => save({ is_archived: 1 }).then(onClose)}
            onMouseEnter={() => setHoverArchive(true)}
            onMouseLeave={() => setHoverArchive(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              backgroundColor: hoverArchive ? 'var(--color-surface-alt)' : 'transparent',
              color: hoverArchive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              transition: 'all 150ms ease',
            }}
          >
            <Archive size={13} />
            Archivar
          </button>
          <div style={{ flex: 1 }} />
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>\u00bfSegura?</span>
              <button
                onClick={handleDelete}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-text-on-danger)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 150ms ease',
                }}
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 150ms ease',
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              onMouseEnter={() => setHoverDelete(true)}
              onMouseLeave={() => setHoverDelete(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                backgroundColor: hoverDelete ? 'var(--color-danger-light)' : 'transparent',
                color: 'var(--color-danger)',
                transition: 'all 150ms ease',
              }}
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

/* ═══════════════════════════════════════
   Sub-components (local, inline styles)
   ═══════════════════════════════════════ */

function PriorityButton({ label, color, isActive, onClick }: {
  label: string; color: string; isActive: boolean; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 10,
        border: isActive ? `2px solid ${color}` : '1.5px solid var(--color-border)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: isActive ? 600 : 500,
        fontFamily: 'var(--font-sans)',
        backgroundColor: isActive ? color + '15' : (hover ? 'var(--color-surface-alt)' : 'var(--color-surface-solid)'),
        color: isActive ? color : 'var(--color-text-secondary)',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isActive ? 'scale(1.02)' : 'none',
        boxShadow: isActive ? `0 2px 8px ${color}20` : 'none',
      }}
    >
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: isActive ? `0 0 6px ${color}40` : 'none',
        transition: 'box-shadow 180ms ease',
      }} />
      {label}
    </button>
  )
}

function StatusDropdown({ value, isOpen, onToggle, onClose, children }: {
  value: string; isOpen: boolean; onToggle: () => void; onClose: () => void; children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          border: '1.5px solid var(--color-border)',
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          width: '100%',
          backgroundColor: hover ? 'var(--color-surface-alt)' : 'var(--color-surface-solid)',
          color: 'var(--color-text-primary)',
          transition: 'all 150ms ease',
          boxShadow: 'var(--shadow-inner)',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        <ChevronDown size={12} style={{
          color: 'var(--color-text-muted)',
          transition: 'transform 200ms ease',
          transform: isOpen ? 'rotate(180deg)' : 'none',
        }} />
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
          <div className="glass-strong" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            marginTop: 6,
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
            minWidth: 180,
          }}>
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function DropdownItem({ label, isActive, onClick }: {
  label: string; isActive: boolean; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontSize: 12.5,
        fontWeight: isActive ? 600 : 450,
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
        backgroundColor: isActive ? 'var(--color-primary-light)' : (hover ? 'var(--color-surface-alt)' : 'transparent'),
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
        transition: 'all 120ms ease',
      }}
    >
      {label}
    </button>
  )
}

function TagAddButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 5,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hover ? 'var(--color-primary-light)' : 'transparent',
        color: hover ? 'var(--color-primary)' : 'var(--color-text-muted)',
        transition: 'all 150ms ease',
      }}
    >
      <Plus size={14} />
    </button>
  )
}

function TagPickerItem({ tag, onClick }: { tag: TagType; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 9999,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: tag.color + '25',
        color: tag.color,
        opacity: hover ? 1 : 0.6,
        transition: 'opacity 150ms ease',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Plus size={10} />
      {tag.name}
    </button>
  )
}
