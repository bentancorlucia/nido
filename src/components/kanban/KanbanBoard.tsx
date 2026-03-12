import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, Kanban } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { AddColumn } from './AddColumn'
import { KanbanFilters } from './KanbanFilters'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { dbQuery } from '../../lib/ipc'
import type { Task } from '../../types'

interface KanbanBoardProps {
  onCardClick: (task: Task) => void
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const { projects, columns, selectedProjectId, selectProject, createColumn, updateColumn, deleteColumn, loadColumns } = useProjectStore()
  const { tasks, taskTags, loadTasks, getFilteredTasks, moveTask, reorderTasks, createTask } = useTaskStore()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [subtaskCounts, setSubtaskCounts] = useState<Record<string, { total: number; completed: number }>>({})

  const activeProjects = projects.filter((p) => p.is_archived === 0 && p.is_template === 0)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return rectIntersection(args)
  }, [])

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

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !selectedProjectId) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskData = tasks.find((t) => t.id === activeId)
    if (!activeTaskData) return

    const overColumn = columns.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)
    const targetColumnId = overColumn?.id ?? overTask?.column_id

    if (!targetColumnId || activeTaskData.column_id === targetColumnId) return

    moveTask(activeId, targetColumnId, tasks.filter((t) => t.column_id === targetColumnId).length)
  }, [columns, tasks, selectedProjectId, moveTask])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !selectedProjectId) return

    const activeId = active.id as string
    const overId = over.id as string

    const overColumn = columns.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)
    const targetColumnId = overColumn?.id ?? overTask?.column_id

    if (!targetColumnId) return

    const activeTaskItem = tasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    const targetTasks = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order)

    if (activeTaskItem.column_id === targetColumnId) {
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
      let insertIndex = targetTasks.findIndex((t) => t.id === overId)
      if (insertIndex === -1) insertIndex = targetTasks.length
      await moveTask(activeId, targetColumnId, insertIndex)

      const newOrder = [...targetTasks]
      newOrder.splice(insertIndex, 0, activeTaskItem)
      await reorderTasks(targetColumnId, newOrder.map((t) => t.id))
    }

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

  const handleQuickAdd = async (columnId: string, title: string) => {
    if (!selectedProjectId) return
    await createTask({
      title,
      project_id: selectedProjectId,
      column_id: columnId,
    })
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.is_completed === 1).length
  return (
    <div className="kboard">
      {/* Header */}
      <div className="kboard__header">
        {/* Project selector */}
        <div className="kboard__project-wrap">
          <button
            onClick={() => setShowProjectPicker(!showProjectPicker)}
            className={`kboard__project-btn${showProjectPicker ? ' kboard__project-btn--open' : ''}`}
          >
            {selectedProject && (
              <span
                className="kboard__project-dot"
                style={{ backgroundColor: selectedProject.color ?? '#01A7C2' }}
              />
            )}
            <span className="kboard__project-name">
              {selectedProject?.name ?? 'Seleccionar proyecto'}
            </span>
            <ChevronDown size={15} className={`kboard__chevron${showProjectPicker ? ' kboard__chevron--open' : ''}`} />
          </button>

          <AnimatePresence>
            {showProjectPicker && (
              <>
                <div className="kboard__picker-overlay" onClick={() => setShowProjectPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="kboard__picker glass-strong floating-menu"
                >
                  {activeProjects.length === 0 ? (
                    <p className="kboard__picker-empty">Sin proyectos</p>
                  ) : (
                    activeProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { selectProject(p.id); setShowProjectPicker(false) }}
                        className={p.id === selectedProjectId ? 'kboard__picker-item--active' : ''}
                      >
                        <span
                          className="kboard__picker-dot"
                          style={{ backgroundColor: p.color ?? '#01A7C2' }}
                        />
                        {p.name}
                      </button>
                    ))
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Task summary */}
        {selectedProject && (
          <div className="kboard__summary">
            <span className="kboard__summary-total">{totalTasks} tareas</span>
            {completedTasks > 0 && (
              <span className="kboard__summary-done">{completedTasks} hechas</span>
            )}
          </div>
        )}

        <div className="kboard__spacer" />

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`kboard__filter-btn${showFilters ? ' kboard__filter-btn--active' : ''}`}
        >
          <SlidersHorizontal size={15} />
          Filtros
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && <KanbanFilters />}
      </AnimatePresence>

      {/* Board content */}
      {!selectedProjectId ? (
        <div className="kboard__empty">
          <motion.div
            className="kboard__empty-inner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="kboard__empty-icon">
              <Kanban size={40} strokeWidth={1.5} />
            </div>
            <p className="kboard__empty-title">Tablero de tareas</p>
            <p className="kboard__empty-subtitle">Seleccioná un proyecto para empezar</p>
          </motion.div>
        </div>
      ) : (
        <div className="kboard__content">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="kboard__columns">
              {columns.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  className="kboard__col-wrap"
                >
                  <KanbanColumn
                    column={col}
                    tasks={getFilteredTasks(col.id)}
                    taskTags={taskTags}
                    subtaskCounts={subtaskCounts}
                    onCardClick={onCardClick}
                    onRenameColumn={handleRenameColumn}
                    onDeleteColumn={deleteColumn}
                    onQuickAdd={handleQuickAdd}
                  />
                </motion.div>
              ))}
              <AddColumn onAdd={handleAddColumn} />
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {activeTask && (
                <div className="kboard__drag-overlay">
                  <KanbanCard
                    task={activeTask}
                    tags={taskTags[activeTask.id] ?? []}
                    subtaskCount={subtaskCounts[activeTask.id]}
                    onClick={() => {}}
                    onComplete={() => {}}
                    isDragOverlay
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}
