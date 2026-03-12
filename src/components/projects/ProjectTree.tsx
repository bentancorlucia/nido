import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Archive as ArchiveIcon, BookTemplate } from 'lucide-react'
import { ProjectNode } from './ProjectNode'
import { useProjectStore } from '../../stores/useProjectStore'
import { TemplateSelector } from './TemplateSelector'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const PROJECT_COLORS = [
  '#01A7C2', '#DDF45B', '#7E1946', '#304B42', '#E8A830',
  '#6B3A80', '#A04030', '#5B8A72', '#3A5048', '#8A6410',
]

interface ProjectTreeProps {
  onSelect: (id: string) => void
  selectedId: string | null
}

export function ProjectTree({ onSelect, selectedId }: ProjectTreeProps) {
  const { projects, createProject, updateProject, deleteProject, archiveProject } = useProjectStore()
  const [showCreate, setShowCreate] = useState(false)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#01A7C2')

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')

  const [colorId, setColorId] = useState<string | null>(null)
  const [colorValue, setColorValue] = useState('#01A7C2')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const activeProjects = projects.filter((p) => p.is_archived === 0)
  const rootProjects = activeProjects.filter((p) => p.parent_id === null)
  const archivedProjects = projects.filter((p) => p.is_archived === 1)

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createProject({ name: newName.trim(), parent_id: createParentId ?? undefined, color: newColor })
    setNewName('')
    setNewColor('#01A7C2')
    setCreateParentId(null)
    setShowCreate(false)
  }

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return
    await updateProject(renameId, { name: renameName.trim() } as Partial<import('../../types').Project>)
    setRenameId(null)
    setRenameName('')
  }

  const handleColorChange = async () => {
    if (!colorId) return
    await updateProject(colorId, { color: colorValue } as Partial<import('../../types').Project>)
    setColorId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteProject(deleteId)
    setDeleteId(null)
  }

  const openRename = (id: string) => {
    const p = projects.find((p) => p.id === id)
    if (p) {
      setRenameId(id)
      setRenameName(p.name)
    }
  }

  const openColor = (id: string) => {
    const p = projects.find((p) => p.id === id)
    if (p) {
      setColorId(id)
      setColorValue(p.color ?? '#01A7C2')
    }
  }

  return (
    <div className="ptree-root">
      {/* Header */}
      <div className="ptree-header" style={{ height: 48, padding: '0 20px' }}>
        <h3 className="ptree-title">Proyectos</h3>
        <div className="ptree-actions">
          <button
            onClick={() => setShowTemplates(true)}
            className="ptree-action-btn"
            title="Crear desde template"
          >
            <BookTemplate size={14} />
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`ptree-action-btn ${showArchived ? 'ptree-action-btn--active' : ''}`}
            title="Ver archivados"
          >
            <ArchiveIcon size={14} />
          </button>
          <button
            onClick={() => { setCreateParentId(null); setShowCreate(true) }}
            className="ptree-action-btn"
            title="Nuevo proyecto"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="ptree-list">
        {rootProjects.length === 0 && !showArchived && (
          <p className="ptree-empty">
            Sin proyectos aún
          </p>
        )}
        {rootProjects
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((project) => (
            <ProjectNode
              key={project.id}
              project={project}
              allProjects={activeProjects}
              selectedId={selectedId}
              depth={0}
              onSelect={onSelect}
              onCreateChild={(parentId) => { setCreateParentId(parentId); setShowCreate(true) }}
              onRename={openRename}
              onDelete={(id) => setDeleteId(id)}
              onArchive={(id) => archiveProject(id)}
              onChangeColor={openColor}
            />
          ))}

        {/* Archived */}
        <AnimatePresence>
          {showArchived && archivedProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ptree-archived"
            >
              <p className="ptree-archived-label">
                Archivados
              </p>
              {archivedProjects.map((p) => (
                <div
                  key={p.id}
                  className="ptree-archived-item"
                >
                  <span className="ptree-archived-dot" style={{ backgroundColor: p.color ?? '#94A09A' }} />
                  <span className="ptree-archived-name">{p.name}</span>
                  <button
                    onClick={() => updateProject(p.id, { is_archived: 0 } as Partial<import('../../types').Project>)}
                    className="ptree-restore-btn"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo proyecto" size="sm">
        <div className="ptree-modal-form">
          {/* Color preview banner */}
          <div className="ptree-create-preview" style={{ background: `linear-gradient(135deg, ${newColor}, ${newColor}88)` }}>
            <div className="ptree-create-preview-icon">
              {newName.trim() ? newName.trim().charAt(0).toUpperCase() : '?'}
            </div>
            <span className="ptree-create-preview-name">
              {newName.trim() || 'Mi proyecto'}
            </span>
          </div>

          <Input
            label="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="¿Cómo se llama tu proyecto?"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {createParentId && (
            <p className="ptree-subproject-hint">
              Subproyecto de: <span className="ptree-subproject-hint-name">{projects.find((p) => p.id === createParentId)?.name}</span>
            </p>
          )}
          <div>
            <label className="ptree-color-label">Color</label>
            <div className="ptree-color-grid">
              {PROJECT_COLORS.map((c) => (
                <motion.button
                  key={c}
                  onClick={() => setNewColor(c)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`ptree-color-swatch ${newColor === c ? 'ptree-color-swatch--selected' : ''}`}
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="ptree-modal-actions">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Crear proyecto</Button>
          </div>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal isOpen={renameId !== null} onClose={() => setRenameId(null)} title="Renombrar proyecto" size="sm">
        <div className="ptree-modal-form">
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <div className="ptree-modal-actions--no-mt">
            <Button variant="ghost" size="sm" onClick={() => setRenameId(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleRename}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Color modal */}
      <Modal isOpen={colorId !== null} onClose={() => setColorId(null)} title="Cambiar color" size="sm">
        <div className="ptree-modal-form">
          <div className="ptree-color-grid">
            {PROJECT_COLORS.map((c) => (
              <motion.button
                key={c}
                onClick={() => setColorValue(c)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={`ptree-color-swatch-lg ${colorValue === c ? 'ptree-color-swatch-lg--selected' : ''}`}
                style={{ backgroundColor: c }}
              >
                {colorValue === c && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                )}
              </motion.button>
            ))}
          </div>
          <div className="ptree-modal-actions--no-mt">
            <Button variant="ghost" size="sm" onClick={() => setColorId(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleColorChange}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Eliminar proyecto" size="sm">
        <div className="ptree-modal-form">
          <p className="ptree-delete-text">
            ¿Estás segura de que querés eliminar este proyecto? Se eliminarán todas las tareas y subproyectos asociados.
          </p>
          <div className="ptree-modal-actions--no-mt">
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Template selector */}
      <TemplateSelector open={showTemplates} onClose={() => setShowTemplates(false)} />
    </div>
  )
}
