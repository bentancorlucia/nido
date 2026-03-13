import { useState, useEffect } from 'react'
import {
  Search, Sparkles, Cloud, RefreshCw,
  X, Plus,
  Home, CalendarCheck, Kanban, Calendar,
  FolderTree, GraduationCap, Timer, Settings as SettingsIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore, type Tab } from '../../stores/useUIStore'
import type { Page } from '../../types'

const pageIcons: Record<Page, typeof Home> = {
  dashboard: Home,
  today: CalendarCheck,
  kanban: Kanban,
  calendar: Calendar,
  projects: FolderTree,
  faculty: GraduationCap,
  pomodoro: Timer,
  settings: SettingsIcon,
}

const pageConfig: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Tu espacio personal' },
  today: { title: 'Hoy', subtitle: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) },
  kanban: { title: 'Tareas', subtitle: 'Gestión visual' },
  calendar: { title: 'Calendario', subtitle: 'Planificá tu tiempo' },
  projects: { title: 'Proyectos', subtitle: 'Tu trabajo organizado' },
  faculty: { title: 'Facultad', subtitle: 'Materias, asistencias y notas' },
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
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))
}

function SyncIndicator() {
  const [connected, setConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    window.nido.google.isConnected().then(setConnected)
    const interval = setInterval(() => {
      window.nido.google.isConnected().then(setConnected)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!connected) return null

  async function handleSync() {
    setSyncing(true)
    try {
      await window.nido.google.syncNow()
    } catch { /* handled by notification system */ }
    setSyncing(false)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSync}
      className="topbar-sync-btn glass"
      title={syncing ? 'Sincronizando...' : 'Sincronizar Google Calendar'}
    >
      {syncing ? (
        <RefreshCw size={14} className="spin" />
      ) : (
        <Cloud size={14} />
      )}
    </motion.button>
  )
}

function TabItem({ tab, isActive, onSwitch, onClose, canClose }: {
  tab: Tab
  isActive: boolean
  onSwitch: () => void
  onClose: () => void
  canClose: boolean
}) {
  const Icon = pageIcons[tab.page]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: 'auto' }}
      exit={{ opacity: 0, scale: 0.92, width: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className={`topbar-tab${isActive ? ' topbar-tab--active' : ''}`}
      onClick={onSwitch}
    >
      <Icon size={13} strokeWidth={isActive ? 2 : 1.6} />
      <span className="topbar-tab-label">{tab.label}</span>
      {canClose && (
        <button
          className="topbar-tab-close"
          onClick={(e) => { e.stopPropagation(); onClose() }}
        >
          <X size={11} />
        </button>
      )}
    </motion.div>
  )
}

export function TopBar() {
  const { currentPage, tabs, activeTabId, switchTab, closeTab, addTab } = useUIStore()
  const config = pageConfig[currentPage]

  return (
    <header className="titlebar-drag topbar-header glass-subtle">
      {/* Tab bar */}
      <div className="topbar-tabs titlebar-no-drag">
        <AnimatePresence initial={false}>
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSwitch={() => switchTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              canClose={tabs.length > 1}
            />
          ))}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => addTab(currentPage)}
          className="topbar-tab-add"
          title="Nueva pestaña"
        >
          <Plus size={13} strokeWidth={2.5} />
        </motion.button>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions titlebar-no-drag">
        <button
          onClick={openCommandPalette}
          className="topbar-search-btn glass"
          title="Buscar (⌘K)"
        >
          <Search size={14} strokeWidth={2} />
          <span className="topbar-search-label">Buscar...</span>
          <kbd className="topbar-kbd">⌘K</kbd>
        </button>

        <SyncIndicator />

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
