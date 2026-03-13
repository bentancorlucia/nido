import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, FolderOpen, Hash } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { dbQuery } from '../../lib/ipc'
import type { Project } from '../../types'

interface ProjectPickerProps {
  open: boolean
  onClose: () => void
  selectedProjectId: string | null
  onSelect: (id: string) => void
}

interface TreeNode {
  project: Project
  children: TreeNode[]
  taskCount: number
}

export function ProjectPicker({ open, onClose, selectedProjectId, onSelect }: ProjectPickerProps) {
  const { projects } = useProjectStore()
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [focusIndex, setFocusIndex] = useState(-1)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const activeProjects = useMemo(
    () => projects.filter((p) => p.is_archived === 0 && p.is_template === 0),
    [projects]
  )

  // Load task counts per project
  useEffect(() => {
    if (!open) return
    async function loadCounts() {
      const rows = await dbQuery<{ project_id: string; cnt: number }>(
        `SELECT project_id, COUNT(*) as cnt FROM tasks
         WHERE project_id IS NOT NULL AND is_completed = 0 AND is_archived = 0
         GROUP BY project_id`
      )
      const map: Record<string, number> = {}
      for (const r of rows) map[r.project_id] = r.cnt
      setTaskCounts(map)
    }
    loadCounts()
  }, [open])

  // Build tree
  const tree = useMemo((): TreeNode[] => {
    const map = new Map<string | null, Project[]>()
    for (const p of activeProjects) {
      const key = p.parent_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    const build = (parentId: string | null): TreeNode[] => {
      const children = map.get(parentId) ?? []
      return children
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({
          project: p,
          children: build(p.id),
          taskCount: taskCounts[p.id] ?? 0,
        }))
    }
    return build(null)
  }, [activeProjects, taskCounts])

  // Flatten visible nodes for keyboard nav and rendering
  const flatList = useMemo(() => {
    const result: { node: TreeNode; depth: number }[] = []
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        const matchesSearch =
          !search || node.project.name.toLowerCase().includes(search.toLowerCase())
        const childrenMatch =
          !search ||
          node.children.some((c) =>
            c.project.name.toLowerCase().includes(search.toLowerCase())
          )

        if (matchesSearch || childrenMatch) {
          result.push({ node, depth })
          // When searching, always show children; otherwise respect expand state
          if (search || expandedIds.has(node.project.id)) {
            walk(node.children, depth + 1)
          }
        }
      }
    }
    walk(tree, 0)
    return result
  }, [tree, expandedIds, search])

  // Auto-expand parent of selected project on open
  useEffect(() => {
    if (!open || !selectedProjectId) return
    const ids = new Set<string>()
    const findPath = (nodes: TreeNode[], path: string[]): boolean => {
      for (const n of nodes) {
        if (n.project.id === selectedProjectId) {
          path.forEach((id) => ids.add(id))
          return true
        }
        if (findPath(n.children, [...path, n.project.id])) return true
      }
      return false
    }
    findPath(tree, [])
    if (ids.size > 0) setExpandedIds((prev) => new Set([...prev, ...ids]))
  }, [open, selectedProjectId, tree])

  // Focus search on open
  useEffect(() => {
    if (open) {
      setSearch('')
      setFocusIndex(-1)
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
      onClose()
    },
    [onSelect, onClose]
  )

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => Math.min(i + 1, flatList.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < flatList.length) {
        e.preventDefault()
        handleSelect(flatList[focusIndex].node.project.id)
      } else if (e.key === 'ArrowRight' && focusIndex >= 0) {
        e.preventDefault()
        const item = flatList[focusIndex]
        if (item.node.children.length > 0) {
          setExpandedIds((prev) => new Set([...prev, item.node.project.id]))
        }
      } else if (e.key === 'ArrowLeft' && focusIndex >= 0) {
        e.preventDefault()
        const item = flatList[focusIndex]
        setExpandedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.node.project.id)
          return next
        })
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [flatList, focusIndex, handleSelect, onClose]
  )

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-picker-item]')
    items[focusIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusIndex])

  // Count total tasks recursively for a node
  const getTotalTasks = useCallback(
    (node: TreeNode): number => {
      let total = node.taskCount
      for (const child of node.children) total += getTotalTasks(child)
      return total
    },
    []
  )

  if (!open) return null

  return (
    <>
      <div className="ppicker-overlay" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
        className="ppicker"
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className="ppicker__search">
          <Search size={14} className="ppicker__search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setFocusIndex(-1)
            }}
            className="ppicker__search-input"
          />
          {search && (
            <button
              className="ppicker__search-clear"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        {/* List */}
        <div className="ppicker__list" ref={listRef} role="listbox">
          {flatList.length === 0 ? (
            <div className="ppicker__empty">
              {search ? (
                <>
                  <span className="ppicker__empty-icon">🔍</span>
                  <span>Sin resultados para "{search}"</span>
                </>
              ) : (
                <>
                  <FolderOpen size={20} />
                  <span>Sin proyectos</span>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {flatList.map(({ node, depth }, index) => {
                const p = node.project
                const isSelected = p.id === selectedProjectId
                const isFocused = index === focusIndex
                const hasChildren = node.children.length > 0
                const isExpanded = expandedIds.has(p.id)
                const totalTasks = getTotalTasks(node)

                return (
                  <motion.button
                    key={p.id}
                    data-picker-item
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12, delay: index * 0.015 }}
                    className={`ppicker__item${isSelected ? ' ppicker__item--selected' : ''}${isFocused ? ' ppicker__item--focused' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 20}px` }}
                    onClick={() => handleSelect(p.id)}
                    onMouseEnter={() => setFocusIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Expand toggle */}
                    {hasChildren ? (
                      <span
                        className={`ppicker__expand${isExpanded ? ' ppicker__expand--open' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(p.id)
                        }}
                        role="button"
                        aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                      >
                        <ChevronRight size={12} />
                      </span>
                    ) : (
                      <span className="ppicker__expand-spacer" />
                    )}

                    {/* Color indicator */}
                    <span
                      className="ppicker__color"
                      style={{
                        backgroundColor: p.color ?? '#01A7C2',
                        boxShadow: `0 0 0 3px ${(p.color ?? '#01A7C2')}18`,
                      }}
                    />

                    {/* Tree connector line for children */}
                    {depth > 0 && (
                      <span
                        className="ppicker__connector"
                        style={{ left: `${4 + (depth - 1) * 20 + 17}px` }}
                      />
                    )}

                    {/* Name */}
                    <span className={`ppicker__name${depth > 0 ? ' ppicker__name--child' : ''}`}>
                      {p.name}
                    </span>

                    {/* Task count badge */}
                    {totalTasks > 0 && (
                      <span className="ppicker__badge">
                        <Hash size={9} />
                        {totalTasks}
                      </span>
                    )}

                    {/* Selected check */}
                    {isSelected && (
                      <motion.span
                        className="ppicker__check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer hint */}
        <div className="ppicker__footer">
          <span className="ppicker__hint">
            <kbd>↑↓</kbd> navegar
            <kbd>→←</kbd> expandir
            <kbd>↵</kbd> seleccionar
          </span>
        </div>
      </motion.div>
    </>
  )
}
