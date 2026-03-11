import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ProjectTree } from './ProjectTree'
import { ProjectDetail } from './ProjectDetail'
import { useProjectStore } from '../../stores/useProjectStore'
import { useUIStore } from '../../stores/useUIStore'

export function ProjectsPage() {
  const { selectedProjectId, selectProject, loadProjects } = useProjectStore()
  const { setCurrentPage } = useUIStore()

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="flex h-full">
      {/* Left panel: tree */}
      <div className="flex-shrink-0 border-r border-border bg-surface/20" style={{ width: 280 }}>
        <ProjectTree
          selectedId={selectedProjectId}
          onSelect={selectProject}
        />
      </div>

      {/* Right panel: detail */}
      <div className="flex-1 min-w-0">
        {selectedProjectId ? (
          <motion.div
            key={selectedProjectId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <ProjectDetail
              projectId={selectedProjectId}
              onNavigateKanban={() => {
                setCurrentPage('kanban')
              }}
            />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            <div className="text-center">
              <p className="text-[14px] font-medium">Seleccioná un proyecto para ver sus detalles</p>
              <p className="text-[12px] mt-1.5 text-text-muted/50">O creá uno nuevo con el botón +</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
