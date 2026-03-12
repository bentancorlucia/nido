import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  Plus,
  Palette,
} from 'lucide-react'
import type { Project } from '../../types'

interface ProjectNodeProps {
  project: Project
  allProjects: Project[]
  selectedId: string | null
  depth: number
  onSelect: (id: string) => void
  onCreateChild: (parentId: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onChangeColor: (id: string) => void
}

export function ProjectNode({
  project,
  allProjects,
  selectedId,
  depth,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  onArchive,
  onChangeColor,
}: ProjectNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const children = allProjects.filter((p) => p.parent_id === project.id && p.is_archived === 0)
  const hasChildren = children.length > 0
  const isSelected = selectedId === project.id

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className={`pnode-row ${isSelected ? 'pnode-row--selected' : 'pnode-row--default'}`}
        style={{ paddingLeft: `${depth * 18 + 10}px` }}
        onClick={() => onSelect(project.id)}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="pnode-expand-btn"
        >
          {hasChildren ? (
            <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={12} className="pnode-expand-icon" />
            </motion.div>
          ) : (
            <span className="pnode-no-children-dot" />
          )}
        </button>

        {/* Icon */}
        <span className="pnode-icon">
          {project.icon ? (
            <span className="pnode-icon-emoji">{project.icon}</span>
          ) : expanded && hasChildren ? (
            <FolderOpen size={15} style={{ color: project.color ?? undefined }} />
          ) : (
            <Folder size={15} style={{ color: project.color ?? undefined }} />
          )}
        </span>

        {/* Name */}
        <span className="pnode-name">{project.name}</span>

        {/* Color dot */}
        {project.color && (
          <span
            className="pnode-color-dot"
            style={{ backgroundColor: project.color }}
          />
        )}

        {/* Actions menu */}
        <div className="pnode-menu-trigger">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="pnode-menu-btn"
          >
            <MoreHorizontal size={14} className="pnode-menu-btn-icon" />
          </button>
        </div>
      </motion.div>

      {/* Inline dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="pnode-overlay" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="pnode-dropdown glass-strong"
              style={{ marginLeft: `${depth * 18 + 28}px` }}
            >
              {[
                { icon: <Plus size={13} />, label: 'Nuevo subproyecto', action: () => onCreateChild(project.id) },
                { icon: <Pencil size={13} />, label: 'Renombrar', action: () => onRename(project.id) },
                { icon: <Palette size={13} />, label: 'Cambiar color', action: () => onChangeColor(project.id) },
                { icon: <Archive size={13} />, label: 'Archivar', action: () => onArchive(project.id) },
                { icon: <Trash2 size={13} />, label: 'Eliminar', action: () => onDelete(project.id), danger: true },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    item.action()
                    setShowMenu(false)
                  }}
                  className={`pnode-dropdown-item ${item.danger ? 'pnode-dropdown-item--danger' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pnode-children"
          >
            {children
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((child) => (
                <ProjectNode
                  key={child.id}
                  project={child}
                  allProjects={allProjects}
                  selectedId={selectedId}
                  depth={depth + 1}
                  onSelect={onSelect}
                  onCreateChild={onCreateChild}
                  onRename={onRename}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  onChangeColor={onChangeColor}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
