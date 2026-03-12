import { useEffect, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CheckSquare,
  FolderTree,
  Calendar,
  StickyNote,
  Tag,
  Plus,
  Moon,
  Sun,
  Kanban,
  Timer,
} from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'
import type { SearchResultType } from '../../hooks/useSearch'
import { useUIStore } from '../../stores/useUIStore'
import { overlayVariants, modalVariants } from '../../lib/animations'

const TYPE_ICONS: Record<SearchResultType, typeof CheckSquare> = {
  task: CheckSquare,
  project: FolderTree,
  event: Calendar,
  postit: StickyNote,
  tag: Tag,
}

const TYPE_LABELS: Record<SearchResultType, string> = {
  task: 'Tarea',
  project: 'Proyecto',
  event: 'Evento',
  postit: 'Post-it',
  tag: 'Tag',
}

const TYPE_ICON_CLASSES: Record<SearchResultType, string> = {
  task: 'cmdpal-item-icon--task',
  project: 'cmdpal-item-icon--project',
  event: 'cmdpal-item-icon--event',
  postit: 'cmdpal-item-icon--postit',
  tag: 'cmdpal-item-icon--tag',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { results, search, refresh } = useSearch()
  const { setCurrentPage, toggleTheme, theme } = useUIStore()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      refresh()
      setInputValue('')
      search('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, refresh, search])

  const handleValueChange = (value: string) => {
    setInputValue(value)
    search(value)
  }

  const handleSelect = (action: string) => {
    onClose()

    // Quick actions
    if (action === 'action:new-task') {
      setCurrentPage('kanban')
      return
    }
    if (action === 'action:new-event') {
      setCurrentPage('calendar')
      return
    }
    if (action === 'action:new-project') {
      setCurrentPage('projects')
      return
    }
    if (action === 'action:new-postit') {
      setCurrentPage('dashboard')
      return
    }
    if (action === 'action:toggle-theme') {
      toggleTheme()
      return
    }
    if (action === 'action:pomodoro') {
      setCurrentPage('pomodoro')
      return
    }

    // Navigate to result
    const [type] = action.split(':')
    switch (type) {
      case 'task':
        setCurrentPage('kanban')
        break
      case 'project':
        setCurrentPage('projects')
        break
      case 'event':
        setCurrentPage('calendar')
        break
      case 'postit':
        setCurrentPage('dashboard')
        break
      case 'tag':
        setCurrentPage('kanban')
        break
    }
  }

  // Group results by type
  const grouped: Record<string, typeof results> = {}
  for (const r of results) {
    const type = r.item.type
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(r)
  }

  const showActions = !inputValue.trim() || inputValue.length <= 2

  return (
    <AnimatePresence>
      {open && (
        <div className="cmdpal-overlay">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="cmdpal-backdrop"
          />

          {/* Palette */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="cmdpal-container"
          >
            <Command
              className="cmdpal-root"
              shouldFilter={false}
              loop
            >
              {/* Input */}
              <div className="cmdpal-input-wrap">
                <Search size={16} className="cmdpal-search-icon" />
                <Command.Input
                  ref={inputRef}
                  value={inputValue}
                  onValueChange={handleValueChange}
                  placeholder="Buscar tareas, proyectos, eventos..."
                  className="cmdpal-input"
                />
                <kbd className="cmdpal-kbd-esc">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="cmdpal-list">
                <Command.Empty className="cmdpal-empty">
                  Sin resultados para &ldquo;{inputValue}&rdquo;
                </Command.Empty>

                {/* Quick actions */}
                {showActions && (
                  <Command.Group heading={
                    <span className="cmdpal-group-heading">
                      Acciones rápidas
                    </span>
                  }>
                    <Command.Item
                      value="action:new-task"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      <Plus size={14} className="cmdpal-item-icon--new-task" />
                      <span>Nueva tarea</span>
                      <kbd className="cmdpal-item-kbd">⌘N</kbd>
                    </Command.Item>
                    <Command.Item
                      value="action:new-event"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      <Calendar size={14} className="cmdpal-item-icon--new-event" />
                      <span>Nuevo evento</span>
                      <kbd className="cmdpal-item-kbd">⌘⇧N</kbd>
                    </Command.Item>
                    <Command.Item
                      value="action:new-project"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      <FolderTree size={14} className="cmdpal-item-icon--new-project" />
                      <span>Nuevo proyecto</span>
                    </Command.Item>
                    <Command.Item
                      value="action:new-postit"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      <StickyNote size={14} className="cmdpal-item-icon--new-postit" />
                      <span>Nuevo post-it</span>
                      <kbd className="cmdpal-item-kbd">⌘E</kbd>
                    </Command.Item>
                    <Command.Item
                      value="action:toggle-theme"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      {theme === 'dark' ? <Sun size={14} className="cmdpal-item-icon--theme-dark" /> : <Moon size={14} className="cmdpal-item-icon--theme-light" />}
                      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                      <kbd className="cmdpal-item-kbd">⌘D</kbd>
                    </Command.Item>
                    <Command.Item
                      value="action:pomodoro"
                      onSelect={handleSelect}
                      className="cmdpal-item"
                    >
                      <Timer size={14} className="cmdpal-item-icon--pomodoro" />
                      <span>Pomodoro</span>
                      <kbd className="cmdpal-item-kbd">⌘P</kbd>
                    </Command.Item>
                  </Command.Group>
                )}

                {/* Search results grouped by type */}
                {Object.entries(grouped).map(([type, items]) => (
                  <Command.Group
                    key={type}
                    heading={
                      <span className="cmdpal-group-heading">
                        {TYPE_LABELS[type as SearchResultType]}s
                      </span>
                    }
                  >
                    {items.map((result) => {
                      const resultType = result.item.type as SearchResultType
                      const Icon = TYPE_ICONS[resultType]
                      const iconClass = TYPE_ICON_CLASSES[resultType]
                      return (
                        <Command.Item
                          key={`${result.item.type}:${result.item.id}`}
                          value={`${result.item.type}:${result.item.id}`}
                          onSelect={handleSelect}
                          className="cmdpal-item"
                        >
                          <Icon size={14} className={iconClass} />
                          <div className="cmdpal-item-info">
                            <p className="cmdpal-item-title">{result.item.title}</p>
                            {result.item.description && (
                              <p className="cmdpal-item-desc">
                                {result.item.description.slice(0, 80)}
                              </p>
                            )}
                          </div>
                          {result.score !== undefined && (
                            <span className="cmdpal-item-score">
                              {Math.round((1 - result.score) * 100)}%
                            </span>
                          )}
                        </Command.Item>
                      )
                    })}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="cmdpal-footer">
                <span className="cmdpal-footer-hint">
                  <kbd className="cmdpal-footer-kbd">↑↓</kbd>
                  Navegar
                </span>
                <span className="cmdpal-footer-hint">
                  <kbd className="cmdpal-footer-kbd">↵</kbd>
                  Seleccionar
                </span>
                <span className="cmdpal-footer-hint">
                  <kbd className="cmdpal-footer-kbd">esc</kbd>
                  Cerrar
                </span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
