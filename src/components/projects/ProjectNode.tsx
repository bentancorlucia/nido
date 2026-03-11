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
        className={`
          group flex items-center gap-2 py-2 px-2.5 rounded-xl cursor-pointer
          transition-all duration-150 relative
          ${isSelected
            ? 'bg-primary-light/50 text-primary'
            : 'text-text-primary hover:bg-surface-alt/40'
          }
        `}
        style={{ paddingLeft: `${depth * 18 + 10}px` }}
        onClick={() => onSelect(project.id)}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        >
          {hasChildren ? (
            <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={12} className="text-text-muted" />
            </motion.div>
          ) : (
            <span className="w-1 h-1 rounded-full bg-text-muted/30" />
          )}
        </button>

        {/* Icon */}
        <span className="flex-shrink-0">
          {project.icon ? (
            <span className="text-sm">{project.icon}</span>
          ) : expanded && hasChildren ? (
            <FolderOpen size={15} style={{ color: project.color ?? undefined }} />
          ) : (
            <Folder size={15} style={{ color: project.color ?? undefined }} />
          )}
        </span>

        {/* Name */}
        <span className="text-[13px] font-medium truncate flex-1">{project.name}</span>

        {/* Color dot */}
        {project.color && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 opacity-60"
            style={{ backgroundColor: project.color }}
          />
        )}

        {/* Actions menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-0.5 rounded hover:bg-surface-alt/80 transition-colors"
          >
            <MoreHorizontal size={14} className="text-text-muted" />
          </button>
        </div>
      </motion.div>

      {/* Inline dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="relative z-50 ml-8 glass-strong rounded-xl shadow-lg p-1.5 min-w-[180px]"
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
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium rounded-lg
                    transition-colors duration-120
                    ${item.danger
                      ? 'text-danger hover:bg-danger-light/50'
                      : 'text-text-primary hover:bg-surface-alt/50'
                    }
                  `}
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
            className="overflow-hidden"
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
