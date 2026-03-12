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
    <div className="projects-page">
      {/* Left panel: tree */}
      <div className="projects-left-panel" style={{ width: 280 }}>
        <ProjectTree
          selectedId={selectedProjectId}
          onSelect={selectProject}
        />
      </div>

      {/* Right panel: detail */}
      <div className="projects-right-panel">
        {selectedProjectId ? (
          <motion.div
            key={selectedProjectId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="projects-right-animated"
          >
            <ProjectDetail
              projectId={selectedProjectId}
              onNavigateKanban={() => {
                setCurrentPage('kanban')
              }}
            />
          </motion.div>
        ) : (
          <div className="projects-empty-state">
            <div className="projects-empty-inner">
              <p className="projects-empty-title">Seleccioná un proyecto para ver sus detalles</p>
              <p className="projects-empty-subtitle">O creá uno nuevo con el botón +</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
