import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, Kanban, Calendar } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { AddColumn } from './AddColumn'
import { KanbanFilters } from './KanbanFilters'
import { ProjectPicker } from './ProjectPicker'
import { ProjectEventsPanel } from './ProjectEventsPanel'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { dbQuery } from '../../lib/ipc'
import type { Task } from '../../types'

interface KanbanBoardProps {
  onCardClick: (task: Task) => void
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const { projects, columns, selectedProjectId, selectProject, createColumn, updateColumn, deleteColumn, loadColumns } = useProjectStore()
  const { tasks, taskTags, loadTasks, getFilteredTasks, moveTaskLocal, reorderTasks, createTask, completeTask } = useTaskStore()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showEventsPanel, setShowEventsPanel] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [subtaskCounts, setSubtaskCounts] = useState<Record<string, { total: number; completed: number }>>({})

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // Refs to avoid recreating drag callbacks when tasks/columns change
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  const selectedProjectIdRef = useRef(selectedProjectId)
  selectedProjectIdRef.current = selectedProjectId
  // Track last dragOver target to avoid redundant state updates
  const lastOverColumnRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const measuring = useMemo(() => ({
    droppable: { strategy: MeasuringStrategy.WhileDragging },
  }), [])

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      // Within a column, use closestCenter for precise card ordering
      const cols = columnsRef.current
      const columnHit = pointerCollisions.find((c) => cols.some((col) => col.id === c.id))
      if (!columnHit) {
        return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => pointerCollisions.some((p) => p.id === c.id)) })
      }
      return pointerCollisions
    }
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

  // Stable drag handlers — use refs to read current state without recreating callbacks
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasksRef.current.find((t) => t.id === event.active.id)
    if (task) {
      lastOverColumnRef.current = task.column_id
      setActiveTask(task)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !selectedProjectIdRef.current) return

    const activeId = active.id as string
    const overId = over.id as string

    const currentTasks = tasksRef.current
    const currentColumns = columnsRef.current

    const overColumn = currentColumns.find((c) => c.id === overId)
    const overTask = currentTasks.find((t) => t.id === overId)
    const targetColumnId = overColumn?.id ?? overTask?.column_id

    // Skip if same column as last time — avoids redundant state updates
    if (!targetColumnId || targetColumnId === lastOverColumnRef.current) return
    lastOverColumnRef.current = targetColumnId

    // Only optimistic local state update during drag — no DB write
    moveTaskLocal(activeId, targetColumnId, currentTasks.filter((t) => t.column_id === targetColumnId).length)
  }, [moveTaskLocal])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    lastOverColumnRef.current = null

    const projectId = selectedProjectIdRef.current
    if (!over || !projectId) return

    const activeId = active.id as string
    const overId = over.id as string

    const currentTasks = tasksRef.current
    const currentColumns = columnsRef.current

    const overColumn = currentColumns.find((c) => c.id === overId)
    const overTask = currentTasks.find((t) => t.id === overId)
    const targetColumnId = overColumn?.id ?? overTask?.column_id

    if (!targetColumnId) return

    const activeTaskItem = currentTasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    const targetTasks = currentTasks
      .filter((t) => t.column_id === targetColumnId && t.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order)

    if (activeTaskItem.column_id === targetColumnId) {
      const colTasks = currentTasks
        .filter((t) => t.column_id === targetColumnId)
        .sort((a, b) => a.sort_order - b.sort_order)
      const oldIndex = colTasks.findIndex((t) => t.id === activeId)
      const newIndex = colTasks.findIndex((t) => t.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(colTasks, oldIndex, newIndex)
        await reorderTasks(targetColumnId, reordered.map((t) => t.id))
      }
    } else {
      let insertIndex = targetTasks.findIndex((t) => t.id === overId)
      if (insertIndex === -1) insertIndex = targetTasks.length

      const newOrder = [...targetTasks]
      newOrder.splice(insertIndex, 0, activeTaskItem)
      await reorderTasks(targetColumnId, newOrder.map((t) => t.id))
    }

    // Auto-complete: if moved to a column named "Realizado" (case-insensitive), mark as completed
    const targetCol = currentColumns.find((c) => c.id === targetColumnId)
    const sourceCol = currentColumns.find((c) => c.id === activeTaskItem.column_id)
    if (targetCol && targetCol.name.toLowerCase().includes('realizado') && activeTaskItem.is_completed === 0) {
      await completeTask(activeId, true)
    } else if (sourceCol && sourceCol.name.toLowerCase().includes('realizado') && targetCol && !targetCol.name.toLowerCase().includes('realizado') && activeTaskItem.is_completed === 1) {
      // If moved FROM "Realizado" to another column, uncomplete
      await completeTask(activeId, false)
    }
  }, [reorderTasks, completeTask])

  const handleAddColumn = useCallback(async (name: string) => {
    if (selectedProjectIdRef.current) {
      await createColumn(selectedProjectIdRef.current, name)
    }
  }, [createColumn])

  const handleRenameColumn = useCallback(async (id: string, name: string) => {
    await updateColumn(id, { name } as Partial<import('../../types').KanbanColumn>)
  }, [updateColumn])

  const handleQuickAdd = useCallback(async (columnId: string, title: string, priority?: import('../../types').Priority, dueDate?: string) => {
    const projectId = selectedProjectIdRef.current
    if (!projectId) return
    const task = await createTask({
      title,
      project_id: projectId,
      column_id: columnId,
      priority: priority ?? undefined,
    })
    if (dueDate && task) {
      await useTaskStore.getState().updateTask(task.id, { due_date: dueDate })
    }
  }, [createTask])

  // Memoize filtered tasks per column to avoid recalc on every render
  const columnTasks = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const col of columns) {
      map[col.id] = getFilteredTasks(col.id)
    }
    return map
  }, [columns, tasks, getFilteredTasks])

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
            <ProjectPicker
              open={showProjectPicker}
              onClose={() => setShowProjectPicker(false)}
              selectedProjectId={selectedProjectId}
              onSelect={(id) => selectProject(id)}
            />
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

        {/* Events panel toggle */}
        {selectedProjectId && (
          <button
            onClick={() => setShowEventsPanel(!showEventsPanel)}
            className={`kboard__filter-btn${showEventsPanel ? ' kboard__filter-btn--active' : ''}`}
          >
            <Calendar size={15} />
            Eventos
          </button>
        )}

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
          <div className="kboard__columns-area">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            measuring={measuring}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="kboard__columns">
              {columns.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: i * 0.08,
                    type: 'spring',
                    stiffness: 300,
                    damping: 26,
                    mass: 0.8,
                  }}
                  className="kboard__col-wrap"
                >
                  <KanbanColumn
                    column={col}
                    tasks={columnTasks[col.id] ?? []}
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
                duration: 250,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: { opacity: '0.2' },
                  },
                }),
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
          <ProjectEventsPanel
            projectId={selectedProjectId}
            projectColor={selectedProject?.color}
            isOpen={showEventsPanel}
            onToggle={() => setShowEventsPanel(!showEventsPanel)}
          />
        </div>
      )}
    </div>
  )
}
