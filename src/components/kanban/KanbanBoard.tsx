import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { ChevronDown, Filter, ArrowUpDown } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { AddColumn } from './AddColumn'
import { QuickAddTask } from './QuickAddTask'
import { KanbanFilters } from './KanbanFilters'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { dbQuery } from '../../lib/ipc'
import type { Task, Tag } from '../../types'

interface KanbanBoardProps {
  onCardClick: (task: Task) => void
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const { projects, columns, selectedProjectId, selectProject, createColumn, updateColumn, deleteColumn, loadColumns } = useProjectStore()
  const { tasks, taskTags, loadTasks, getFilteredTasks, moveTask, reorderTasks } = useTaskStore()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [subtaskCounts, setSubtaskCounts] = useState<Record<string, { total: number; completed: number }>>({})

  const activeProjects = projects.filter((p) => p.is_archived === 0 && p.is_template === 0)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId)
      loadColumns(selectedProjectId)
    }
  }, [selectedProjectId])

  useEffect(() => {
    loadSubtaskCounts()
  }, [tasks])

  async function loadSubtaskCounts() {
    if (tasks.length === 0) return
    const ids = tasks.map((t) => t.id)
    const placeholders = ids.map(() => '?').join(',')
    const rows = await dbQuery<{ parent_task_id: string; total: number; completed: number }>(
      `SELECT parent_task_id,
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
       FROM tasks WHERE parent_task_id IN (${placeholders}) GROUP BY parent_task_id`,
      ids
    )
    const map: Record<string, { total: number; completed: number }> = {}
    for (const row of rows) {
      map[row.parent_task_id] = { total: row.total, completed: row.completed }
    }
    setSubtaskCounts(map)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled in dragEnd
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !selectedProjectId) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which column the task was dropped on
    const overColumn = columns.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)
    const targetColumnId = overColumn?.id ?? overTask?.column_id

    if (!targetColumnId) return

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const targetTasks = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order)

    if (activeTask.column_id === targetColumnId) {
      // Reorder within same column
      const currentTasks = tasks
        .filter((t) => t.column_id === targetColumnId)
        .sort((a, b) => a.sort_order - b.sort_order)
      const oldIndex = currentTasks.findIndex((t) => t.id === activeId)
      const newIndex = currentTasks.findIndex((t) => t.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentTasks, oldIndex, newIndex)
        await reorderTasks(targetColumnId, reordered.map((t) => t.id))
      }
    } else {
      // Move to different column
      let insertIndex = targetTasks.findIndex((t) => t.id === overId)
      if (insertIndex === -1) insertIndex = targetTasks.length
      await moveTask(activeId, targetColumnId, insertIndex)

      // Reorder target column
      const newOrder = [...targetTasks]
      newOrder.splice(insertIndex, 0, activeTask)
      await reorderTasks(targetColumnId, newOrder.map((t) => t.id))
    }

    // Reload tasks
    await loadTasks(selectedProjectId)
  }, [columns, tasks, selectedProjectId])

  const handleAddColumn = async (name: string) => {
    if (selectedProjectId) {
      await createColumn(selectedProjectId, name)
    }
  }

  const handleRenameColumn = async (id: string, name: string) => {
    await updateColumn(id, { name } as Partial<import('../../types').KanbanColumn>)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border flex-shrink-0" style={{ height: 48, padding: '0 24px' }}>
        {/* Project selector */}
        <div className="relative">
          <button
            onClick={() => setShowProjectPicker(!showProjectPicker)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass hover:shadow-sm transition-all font-medium" style={{ fontSize: 13 }}
          >
            {selectedProject && (
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedProject.color ?? '#01A7C2' }} />
            )}
            <span className="text-text-primary">
              {selectedProject?.name ?? 'Seleccionar proyecto'}
            </span>
            <ChevronDown size={13} className="text-text-muted ml-1" />
          </button>

          {showProjectPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProjectPicker(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 top-full mt-1.5 z-50 glass-strong rounded-xl shadow-lg p-1.5 min-w-[220px] max-h-64 overflow-y-auto"
              >
                {activeProjects.length === 0 ? (
                  <p className="px-3 py-2 text-[12px] text-text-muted italic">Sin proyectos</p>
                ) : (
                  activeProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { selectProject(p.id); setShowProjectPicker(false) }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] rounded-lg transition-colors ${
                        p.id === selectedProjectId
                          ? 'bg-primary-light/50 text-primary font-medium'
                          : 'text-text-primary hover:bg-surface-alt/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color ?? '#01A7C2' }} />
                      {p.name}
                    </button>
                  ))
                )}
              </motion.div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Filter & sort */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all ${
            showFilters ? 'bg-primary-light/50 text-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-alt/50'
          }`}
        >
          <Filter size={13} />
          Filtros
        </button>
      </div>

      {/* Filters bar */}
      {showFilters && <KanbanFilters />}

      {/* Board */}
      {!selectedProjectId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted text-sm">Seleccioná un proyecto para ver el tablero</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden py-5" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 h-full">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={getFilteredTasks(col.id)}
                  taskTags={taskTags}
                  subtaskCounts={subtaskCounts}
                  onCardClick={onCardClick}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={deleteColumn}
                  onQuickAdd={setQuickAddColumnId}
                />
              ))}
              <AddColumn onAdd={handleAddColumn} />
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="w-72 opacity-90">
                  <KanbanCard
                    task={activeTask}
                    tags={taskTags[activeTask.id] ?? []}
                    subtaskCount={subtaskCounts[activeTask.id]}
                    onClick={() => {}}
                    onComplete={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Quick add modal */}
      {quickAddColumnId && selectedProjectId && (
        <QuickAddTask
          columnId={quickAddColumnId}
          projectId={selectedProjectId}
          onClose={() => setQuickAddColumnId(null)}
        />
      )}
    </div>
  )
}
