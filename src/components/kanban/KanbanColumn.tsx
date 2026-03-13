import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MoreHorizontal, Plus, Pencil, Trash2, CornerDownLeft, Calendar, Flag } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import { useTaskStore } from '../../stores/useTaskStore'
import type { Task, Tag, Priority, KanbanColumn as KanbanColumnType } from '../../types'

interface KanbanColumnProps {
  column: KanbanColumnType
  tasks: Task[]
  taskTags: Record<string, Tag[]>
  subtaskCounts: Record<string, { total: number; completed: number }>
  onCardClick: (task: Task) => void
  onRenameColumn: (id: string, name: string) => void
  onDeleteColumn: (id: string) => void
  onQuickAdd: (columnId: string, title: string, priority?: Priority, dueDate?: string) => void
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  tasks,
  taskTags,
  subtaskCounts,
  onCardClick,
  onRenameColumn,
  onDeleteColumn,
  onQuickAdd,
}: KanbanColumnProps) {
  const { completeTask } = useTaskStore()
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(column.name)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddText, setQuickAddText] = useState('')
  const [quickAddPriority, setQuickAddPriority] = useState<Priority>('media')
  const [quickAddDate, setQuickAddDate] = useState('')
  const [showQuickExtras, setShowQuickExtras] = useState(false)
  const quickAddRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const colColor = column.color ?? 'var(--color-primary)'

  const handleRename = () => {
    if (editName.trim() && editName !== column.name) {
      onRenameColumn(column.id, editName.trim())
    }
    setEditing(false)
  }

  const handleQuickAdd = () => {
    if (!quickAddText.trim()) return
    onQuickAdd(column.id, quickAddText.trim(), quickAddPriority, quickAddDate || undefined)
    setQuickAddText('')
    setQuickAddPriority('media')
    setQuickAddDate('')
    setShowQuickExtras(false)
    quickAddRef.current?.focus()
  }

  useEffect(() => {
    if (quickAddOpen) {
      setTimeout(() => quickAddRef.current?.focus(), 50)
    }
  }, [quickAddOpen])

  const completedCount = tasks.filter((t) => t.is_completed === 1).length

  return (
    <div className={`kcol${isOver ? ' kcol--over' : ''}`}>
      {/* Column header */}
      <div className="kcol__header">
        <div className="kcol__accent" style={{ backgroundColor: colColor }} />

        {editing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            className="kcol__name-input"
          />
        ) : (
          <h3 className="kcol__name">{column.name}</h3>
        )}

        {/* Count badges */}
        <div className="kcol__counts">
          <span className="kcol__count">{tasks.length}</span>
          {completedCount > 0 && (
            <span className="kcol__count kcol__count--done">{completedCount}</span>
          )}
        </div>

        {/* Column menu */}
        <div className="kcol__menu-wrap">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="kcol__menu-btn icon-button"
          >
            <MoreHorizontal size={14} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="kcol__menu-overlay" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="kcol__menu glass-strong floating-menu"
                >
                  <button onClick={() => { setEditing(true); setShowMenu(false) }}>
                    <Pencil size={13} /> Renombrar
                  </button>
                  {column.is_default === 0 && (
                    <button
                      className="danger"
                      onClick={() => { onDeleteColumn(column.id); setShowMenu(false) }}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Droppable card area */}
      <div ref={setNodeRef} className="kcol__cards">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                layoutId={task.id}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{
                  layout: { type: 'spring', stiffness: 350, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
              >
                <KanbanCard
                  task={task}
                  tags={taskTags[task.id] ?? []}
                  subtaskCount={subtaskCounts[task.id]}
                  onClick={() => onCardClick(task)}
                  onComplete={(completed) => completeTask(task.id, completed)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && !isOver && (
          <div className="kcol__empty">
            <p>Sin tareas</p>
          </div>
        )}

        {/* Drop indicator */}
        <AnimatePresence>
          {isOver && tasks.length === 0 && (
            <motion.div
              className="kcol__drop-zone"
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <span>Soltar aquí</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline quick-add */}
      <div className="kcol__footer">
        <AnimatePresence mode="wait">
          {quickAddOpen ? (
            <motion.div
              key="input"
              className="kcol__quickadd"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <div className="kcol__quickadd-top">
                <input
                  ref={quickAddRef}
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAdd()
                    if (e.key === 'Escape') { setQuickAddOpen(false); setQuickAddText(''); setShowQuickExtras(false) }
                  }}
                  placeholder="Nueva tarea..."
                  className="kcol__quickadd-input"
                />
              </div>
              <div className="kcol__quickadd-toolbar">
                {/* Priority selector */}
                <div className="kcol__quickadd-priorities">
                  {(['baja', 'media', 'alta'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setQuickAddPriority(p)}
                      className={`kcol__quickadd-priority${quickAddPriority === p ? ' kcol__quickadd-priority--active' : ''}`}
                      data-priority={p}
                      title={p.charAt(0).toUpperCase() + p.slice(1)}
                    >
                      <Flag size={11} />
                    </button>
                  ))}
                </div>
                {/* Date */}
                <label className="kcol__quickadd-date-btn" title="Fecha límite">
                  <Calendar size={12} />
                  <input
                    type="date"
                    value={quickAddDate}
                    onChange={(e) => setQuickAddDate(e.target.value)}
                    className="kcol__quickadd-date-input"
                  />
                  {quickAddDate && (
                    <span className="kcol__quickadd-date-label">
                      {new Date(quickAddDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </label>
                <div className="kcol__quickadd-spacer" />
                <span className="kcol__quickadd-hint">
                  <CornerDownLeft size={10} />
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              className="kcol__add-btn"
              onClick={() => setQuickAddOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Nueva tarea</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
