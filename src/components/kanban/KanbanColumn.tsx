import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MoreHorizontal, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import { useTaskStore } from '../../stores/useTaskStore'
import type { Task, Tag, KanbanColumn as KanbanColumnType } from '../../types'

interface KanbanColumnProps {
  column: KanbanColumnType
  tasks: Task[]
  taskTags: Record<string, Tag[]>
  subtaskCounts: Record<string, { total: number; completed: number }>
  onCardClick: (task: Task) => void
  onRenameColumn: (id: string, name: string) => void
  onDeleteColumn: (id: string) => void
  onQuickAdd: (columnId: string) => void
}

export function KanbanColumn({
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

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const handleRename = () => {
    if (editName.trim() && editName !== column.name) {
      onRenameColumn(column.id, editName.trim())
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 280 }}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-3">
        <GripVertical size={12} className="text-text-muted/25 cursor-grab flex-shrink-0" />
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color ?? 'var(--color-primary)' }} />

        {editing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
            className="text-[13px] font-display font-semibold bg-transparent border-b border-primary outline-none text-text-primary flex-1"
            autoFocus
          />
        ) : (
          <h3 className="text-[13px] font-display font-semibold text-text-primary flex-1 truncate">
            {column.name}
          </h3>
        )}

        <span className="text-[10px] font-mono text-text-muted bg-surface-alt/40 px-1.5 py-0.5 rounded-md tabular-nums">
          {tasks.length}
        </span>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-text-muted/50 hover:text-text-primary hover:bg-surface-alt/50 transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full mt-1.5 z-50 glass-strong rounded-xl shadow-lg p-1.5 min-w-[160px]"
              >
                <button
                  onClick={() => { setEditing(true); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-text-primary hover:bg-surface-alt/50 transition-colors rounded-lg"
                >
                  <Pencil size={12} /> Renombrar
                </button>
                {column.is_default === 0 && (
                  <button
                    onClick={() => { onDeleteColumn(column.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-danger hover:bg-danger-light/50 transition-colors rounded-lg"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2 p-2 rounded-2xl min-h-[120px]
          transition-all duration-200
          ${isOver ? 'bg-primary-light/20 border-2 border-dashed border-primary/20' : 'bg-surface-alt/10'}
        `}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              tags={taskTags[task.id] ?? []}
              subtaskCount={subtaskCounts[task.id]}
              onClick={() => onCardClick(task)}
              onComplete={(completed) => completeTask(task.id, completed)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-[11px] text-text-muted/40 italic">Sin tareas</p>
          </div>
        )}
      </div>

      {/* Quick add */}
      <button
        onClick={() => onQuickAdd(column.id)}
        className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl text-[12px] font-medium text-text-muted hover:text-primary hover:bg-primary-light/20 transition-all"
      >
        <Plus size={14} />
        Nueva tarea
      </button>
    </div>
  )
}
