import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Archive as ArchiveIcon } from 'lucide-react'
import { ProjectNode } from './ProjectNode'
import { useProjectStore } from '../../stores/useProjectStore'
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border" style={{ height: 48, padding: '0 20px' }}>
        <h3 className="text-[13px] font-display font-semibold text-text-primary">Proyectos</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`p-1.5 rounded-lg transition-colors ${showArchived ? 'bg-primary-light/50 text-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-alt/50'}`}
            title="Ver archivados"
          >
            <ArchiveIcon size={14} />
          </button>
          <button
            onClick={() => { setCreateParentId(null); setShowCreate(true) }}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light/30 transition-colors"
            title="Nuevo proyecto"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2">
        {rootProjects.length === 0 && !showArchived && (
          <p className="text-center text-text-muted text-xs italic py-8">
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
              className="mt-4 pt-3 border-t border-border overflow-hidden"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted px-3 mb-2">
                Archivados
              </p>
              {archivedProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-text-muted opacity-60"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color ?? '#94A09A' }} />
                  <span className="truncate">{p.name}</span>
                  <button
                    onClick={() => updateProject(p.id, { is_archived: 0 } as Partial<import('../../types').Project>)}
                    className="ml-auto text-[10px] text-primary hover:underline"
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
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del proyecto"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {createParentId && (
            <p className="text-xs text-text-muted">
              Subproyecto de: <span className="font-medium text-text-secondary">{projects.find((p) => p.id === createParentId)?.name}</span>
            </p>
          )}
          <div>
            <label className="text-[13px] font-display font-medium text-text-secondary mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${newColor === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-solid scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Crear proyecto</Button>
          </div>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal isOpen={renameId !== null} onClose={() => setRenameId(null)} title="Renombrar proyecto" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRenameId(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleRename}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Color modal */}
      <Modal isOpen={colorId !== null} onClose={() => setColorId(null)} title="Cambiar color" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColorValue(c)}
                className={`w-8 h-8 rounded-full transition-all ${colorValue === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-solid scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setColorId(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleColorChange}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Eliminar proyecto" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-text-secondary">
            ¿Estás segura de que querés eliminar este proyecto? Se eliminarán todas las tareas y subproyectos asociados.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
