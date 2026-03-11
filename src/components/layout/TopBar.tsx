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

export function TopBar() {
  const currentPage = useUIStore((s) => s.currentPage)
  const config = pageConfig[currentPage]

  return (
    <header
      className="titlebar-drag flex items-center justify-between glass-subtle flex-shrink-0 border-b border-border"
      style={{ height: 52, paddingLeft: 32, paddingRight: 32 }}
    >
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-baseline gap-3"
      >
        <h1 className="font-display font-semibold text-text-primary tracking-tight" style={{ fontSize: 15 }}>
          {currentPage === 'dashboard' ? getGreeting() : config.title}
        </h1>
        <div className="w-px h-3.5 bg-border-strong" />
        <span className="text-text-muted font-medium" style={{ fontSize: 12 }}>
          {config.subtitle}
        </span>
      </motion.div>

      <div className="flex items-center gap-2 titlebar-no-drag">
        <button
          className="group flex items-center gap-2 rounded-xl glass hover:shadow-sm text-text-muted hover:text-text-secondary transition-all duration-200"
          style={{ fontSize: 13, padding: '6px 14px' }}
          title="Buscar (⌘K)"
        >
          <Search size={14} strokeWidth={2} />
          <span className="font-medium">Buscar...</span>
          <kbd
            className="ml-1 bg-surface-alt/60 px-1.5 py-0.5 rounded-md border border-border font-mono text-text-muted"
            style={{ fontSize: 10, lineHeight: '14px' }}
          >
            ⌘K
          </kbd>
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl glass hover:shadow-sm text-text-muted hover:text-primary transition-all duration-200"
          title="Acciones rápidas"
        >
          <Sparkles size={15} strokeWidth={2} />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </motion.button>
      </div>
    </header>
  )
}
