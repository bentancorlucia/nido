import { useEffect } from 'react'
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
import { PostItBoard } from './components/dashboard/PostItBoard'
import { useUIStore } from './stores/useUIStore'
import type { Page } from './types'

const pageData: Record<Page, {
  title: string
  description: string
  icon: typeof Home
  gradient: string
  accent: string
}> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Tu centro de control personal con widgets personalizables',
    icon: Home,
    gradient: 'from-primary/20 via-primary/5 to-transparent',
    accent: 'from-primary to-[#38CFEA]',
  },
  today: {
    title: 'Hoy',
    description: 'Timeline de tu día con eventos y tareas pendientes',
    icon: CalendarCheck,
    gradient: 'from-accent/20 via-accent/5 to-transparent',
    accent: 'from-accent to-[#B8CC3A]',
  },
  kanban: {
    title: 'Tareas',
    description: 'Gestión visual con columnas arrastrables y filtros',
    icon: Kanban,
    gradient: 'from-[#E0D4EA]/40 via-[#E0D4EA]/10 to-transparent',
    accent: 'from-[#6B3A80] to-[#9B5CB0]',
  },
  calendar: {
    title: 'Calendario',
    description: 'Vistas mensual, semanal, anual y semestral',
    icon: Calendar,
    gradient: 'from-primary/15 via-accent/5 to-transparent',
    accent: 'from-primary to-accent',
  },
  projects: {
    title: 'Proyectos',
    description: 'Organización jerárquica ilimitada con sub-proyectos',
    icon: FolderTree,
    gradient: 'from-[#D0E4DA]/40 via-[#D0E4DA]/10 to-transparent',
    accent: 'from-[#304B42] to-[#5B8A72]',
  },
  pomodoro: {
    title: 'Pomodoro',
    description: 'Timer circular con estadísticas y tracking de tiempo',
    icon: Timer,
    gradient: 'from-danger-light/40 via-danger-light/10 to-transparent',
    accent: 'from-[#7E1946] to-[#A83265]',
  },
  settings: {
    title: 'Configuración',
    description: 'Personalizá colores, tags, atajos y más',
    icon: SettingsIcon,
    gradient: 'from-surface-alt/60 via-surface-alt/20 to-transparent',
    accent: 'from-text-muted to-text-secondary',
  },
}

function PlaceholderPage({ page }: { page: Page }) {
  const data = pageData[page]
  const Icon = data.icon

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className={`absolute inset-0 bg-gradient-radial ${data.gradient} opacity-60 pointer-events-none`} />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        className="relative"
      >
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${data.accent} opacity-20 blur-xl scale-150`} />
          <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${data.accent} flex items-center justify-center shadow-lg`}>
            <Icon size={32} strokeWidth={1.5} className="text-white" />
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        <h2 className="text-3xl font-display font-bold text-text-primary mb-3.5 tracking-tight">{data.title}</h2>
        <p className="text-text-secondary text-[14px] max-w-sm leading-relaxed">{data.description}</p>
      </motion.div>
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
        className="mt-8"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-text-muted text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
          Próximamente
        </span>
      </motion.div>
    </div>
  )
}

function PageContent({ page }: { page: Page }) {
  switch (page) {
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
    case 'dashboard':
      return <PostItBoard />
    default:
      return <PlaceholderPage page={page} />
  }
}

export function App() {
  const { currentPage, loadTheme } = useUIStore()

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  return (
    <MainLayout>
      <PageTransition page={currentPage}>
        <PageContent page={currentPage} />
      </PageTransition>
    </MainLayout>
  )
}
