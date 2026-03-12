import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { KanbanBoard } from './KanbanBoard'
import { CardDetail } from './CardDetail'
import { useProjectStore } from '../../stores/useProjectStore'
import type { Task } from '../../types'

export function KanbanPage() {
  const { loadProjects } = useProjectStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="kanban-page">
      <KanbanBoard onCardClick={(task) => setSelectedTask(task)} />

      <AnimatePresence>
        {selectedTask && (
          <CardDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
