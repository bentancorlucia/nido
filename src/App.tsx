import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  CalendarCheck,
  Kanban,
  Calendar,
  FolderTree,
  Timer,
  Settings as SettingsIcon,
} from 'lucide-react'
import { MainLayout } from './components/layout/MainLayout'
import { PageTransition } from './lib/animations'
import { KanbanPage } from './components/kanban/KanbanPage'
import { ProjectsPage } from './components/projects/ProjectsPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { CalendarPage } from './components/calendar/CalendarView'
import { TodayView } from './components/today/TodayView'
import { PomodoroFull } from './components/pomodoro/PomodoroFull'
import { Dashboard } from './components/dashboard/Dashboard'
import { CommandPalette } from './components/search/CommandPalette'
import { useUIStore } from './stores/useUIStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { Page } from './types'

const pageData: Record<Page, {
  title: string
  description: string
  icon: typeof Home
}> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Tu centro de control personal con widgets personalizables',
    icon: Home,
  },
  today: {
    title: 'Hoy',
    description: 'Timeline de tu día con eventos y tareas pendientes',
    icon: CalendarCheck,
  },
  kanban: {
    title: 'Tareas',
    description: 'Gestión visual con columnas arrastrables y filtros',
    icon: Kanban,
  },
  calendar: {
    title: 'Calendario',
    description: 'Vistas mensual, semanal, anual y semestral',
    icon: Calendar,
  },
  projects: {
    title: 'Proyectos',
    description: 'Organización jerárquica ilimitada con sub-proyectos',
    icon: FolderTree,
  },
  pomodoro: {
    title: 'Pomodoro',
    description: 'Timer circular con estadísticas y tracking de tiempo',
    icon: Timer,
  },
  settings: {
    title: 'Configuración',
    description: 'Personalizá colores, tags, atajos y más',
    icon: SettingsIcon,
  },
}

function PlaceholderPage({ page }: { page: Page }) {
  const data = pageData[page]
  const Icon = data.icon

  return (
    <div className="placeholder-page">
      <div className={`placeholder-bg placeholder-bg--${page}`} />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        className="placeholder-content"
      >
        <div className="placeholder-icon-wrapper">
          <div className={`placeholder-icon-glow placeholder-accent--${page}`} />
          <div className={`placeholder-icon-box placeholder-accent--${page}`}>
            <Icon size={32} strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        <h2 className="placeholder-title">{data.title}</h2>
        <p className="placeholder-desc">{data.description}</p>
      </motion.div>
    </div>
  )
}

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard':
      return <Dashboard />
    case 'today':
      return <TodayView />
    case 'kanban':
      return <KanbanPage />
    case 'calendar':
      return <CalendarPage />
    case 'projects':
      return <ProjectsPage />
    case 'pomodoro':
      return <PomodoroFull />
    case 'settings':
      return <SettingsPage />
    default:
      return <PlaceholderPage page={page} />
  }
}

export function App() {
  const { currentPage, loadTheme } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const shortcutHandlers = useMemo(() => ({
    onOpenSearch: openSearch,
  }), [openSearch])

  useKeyboardShortcuts(shortcutHandlers)

  return (
    <>
      <MainLayout>
        <PageTransition page={currentPage}>
          <PageContent page={currentPage} />
        </PageTransition>
      </MainLayout>
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </>
  )
}
