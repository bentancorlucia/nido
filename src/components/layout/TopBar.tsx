import { Search, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUIStore } from '../../stores/useUIStore'
import type { Page } from '../../types'

const pageConfig: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Tu espacio personal' },
  today: { title: 'Hoy', subtitle: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) },
  kanban: { title: 'Tareas', subtitle: 'Gestión visual' },
  calendar: { title: 'Calendario', subtitle: 'Planificá tu tiempo' },
  projects: { title: 'Proyectos', subtitle: 'Tu trabajo organizado' },
  pomodoro: { title: 'Pomodoro', subtitle: 'Enfocate y producí' },
  settings: { title: 'Configuración', subtitle: 'Personalizá tu experiencia' },
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function openCommandPalette() {
  // Simulate Cmd+K to trigger the keyboard shortcut handler
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))
}

export function TopBar() {
  const currentPage = useUIStore((s) => s.currentPage)
  const config = pageConfig[currentPage]

  return (
    <header
      className="titlebar-drag topbar-header glass-subtle"
      style={{ height: 52, paddingLeft: 32, paddingRight: 32 }}
    >
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="topbar-title-group"
      >
        <h1 className="topbar-title" style={{ fontSize: 15 }}>
          {currentPage === 'dashboard' ? getGreeting() : config.title}
        </h1>
        <div className="topbar-divider" />
        <span className="topbar-subtitle" style={{ fontSize: 12 }}>
          {config.subtitle}
        </span>
      </motion.div>

      <div className="topbar-actions titlebar-no-drag">
        <button
          onClick={openCommandPalette}
          className="topbar-search-btn glass"
          style={{ fontSize: 13, padding: '6px 14px' }}
          title="Buscar (⌘K)"
        >
          <Search size={14} strokeWidth={2} />
          <span className="topbar-search-label">Buscar...</span>
          <kbd
            className="topbar-kbd"
            style={{ fontSize: 10, lineHeight: '14px' }}
          >
            ⌘K
          </kbd>
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCommandPalette}
          className="topbar-sparkle-btn glass"
          title="Acciones rápidas"
        >
          <Sparkles size={15} strokeWidth={2} />
          <div className="topbar-sparkle-dot" />
        </motion.button>
      </div>
    </header>
  )
}
