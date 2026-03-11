import { useEffect } from 'react'
import {
  Home,
  CalendarCheck,
  Kanban,
  Calendar,
  FolderTree,
  Timer,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Folder,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/useUIStore'
import { useProjectStore } from '../../stores/useProjectStore'
import type { Page } from '../../types'

interface NavItemType {
  id: Page
  label: string
  icon: typeof Home
}

const mainNav: NavItemType[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'today', label: 'Hoy', icon: CalendarCheck },
  { id: 'kanban', label: 'Tareas', icon: Kanban },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'projects', label: 'Proyectos', icon: FolderTree },
]

const bottomNav: NavItemType[] = [
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'settings', label: 'Configuración', icon: Settings },
]

function NidoLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-[#20C4DB] to-[#38CFEA] opacity-25 blur-lg scale-110" />
        <div
          className="relative rounded-xl bg-gradient-to-br from-primary via-[#15B5CF] to-[#38CFEA] flex items-center justify-center"
          style={{ width: 36, height: 36, boxShadow: '0 2px 10px rgba(1, 167, 194, 0.35)' }}
        >
          <span className="text-white font-display font-bold" style={{ fontSize: 15 }}>N</span>
        </div>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col"
          >
            <span className="text-sidebar-text font-display font-bold leading-none" style={{ fontSize: 17 }}>
              Nido
            </span>
            <span className="text-sidebar-text/25 font-semibold uppercase" style={{ fontSize: 9.5, letterSpacing: '0.14em', marginTop: 4 }}>
              Organizer
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItemType
  isActive: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={`
          group relative flex items-center justify-center mx-auto rounded-xl transition-all duration-200
          ${isActive ? 'text-white' : 'text-sidebar-text/45 hover:text-sidebar-text/90'}
        `}
        style={{ width: 44, height: 44 }}
        title={item.label}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-fill"
            className="absolute inset-0 rounded-xl nav-active-indicator"
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        )}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-200" />
        )}
        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} className="relative z-10" />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full flex items-center rounded-lg transition-all duration-200
        ${isActive ? 'text-sidebar-text' : 'text-sidebar-text/45 hover:text-sidebar-text/85'}
      `}
      style={{ padding: '10px 0', gap: 14 }}
    >
      {isActive && (
        <motion.div
          layoutId="nav-accent-bar"
          className="absolute rounded-r-full bg-primary"
          style={{
            left: -24,
            top: 8,
            bottom: 8,
            width: 3,
            boxShadow: '0 0 12px rgba(1, 167, 194, 0.45), 0 0 5px rgba(1, 167, 194, 0.25)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />
      )}
      <Icon
        size={19}
        strokeWidth={isActive ? 2.2 : 1.6}
        className="flex-shrink-0"
      />
      <span style={{ fontSize: 14 }} className={isActive ? 'font-semibold' : 'font-medium'}>
        {item.label}
      </span>
    </button>
  )
}

export function Sidebar() {
  const {
    currentPage,
    setCurrentPage,
    theme,
    toggleTheme,
    sidebarCollapsed,
    toggleSidebar,
    sidebarProjectsExpanded,
    toggleSidebarProjects,
  } = useUIStore()

  const { projects, loadProjects, selectProject } = useProjectStore()
  const rootProjects = projects.filter((p) => p.parent_id === null && p.is_archived === 0 && p.is_template === 0)

  useEffect(() => {
    loadProjects()
  }, [])

  const collapsed = sidebarCollapsed

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col bg-sidebar-bg select-none overflow-hidden flex-shrink-0 border-r border-white/[0.06]"
    >
      {/* Spacer for macOS traffic lights */}
      <div className="titlebar-drag flex-shrink-0" style={{ height: 48 }} />

      {/* Logo */}
      <div className="titlebar-no-drag" style={{ padding: collapsed ? '4px 16px 20px' : '4px 24px 24px' }}>
        <NidoLogo collapsed={collapsed} />
      </div>

      {/* Main navigation */}
      <nav
        className="flex-1 overflow-y-auto titlebar-no-drag flex flex-col"
        style={{ padding: collapsed ? '0 12px' : '0 24px' }}
      >
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => setCurrentPage(item.id)}
            />
          ))}
        </div>

        {/* Projects quick tree */}
        {!collapsed && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={toggleSidebarProjects}
              className="w-full flex items-center text-sidebar-text/30 hover:text-sidebar-text/50 transition-colors font-semibold uppercase"
              style={{ gap: 8, padding: '8px 0', fontSize: 10, letterSpacing: '0.12em' }}
            >
              <motion.div
                animate={{ rotate: sidebarProjectsExpanded ? 0 : -90 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronDown size={10} />
              </motion.div>
              Proyectos
            </button>
            <AnimatePresence>
              {sidebarProjectsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {rootProjects.length === 0 ? (
                    <p className="text-sidebar-text/20 italic" style={{ padding: '12px 0', fontSize: 12 }}>
                      Sin proyectos aún
                    </p>
                  ) : (
                    <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                      {rootProjects.slice(0, 8).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            selectProject(project.id)
                            setCurrentPage('projects')
                          }}
                          className="w-full flex items-center rounded-lg text-sidebar-text/40 hover:text-sidebar-text/75 transition-all text-left"
                          style={{ gap: 10, padding: '7px 0', fontSize: 12.5 }}
                        >
                          <Folder size={13} style={{ color: project.color ?? undefined }} />
                          <span className="font-medium truncate">{project.name}</span>
                        </button>
                      ))}
                      {rootProjects.length > 8 && (
                        <button
                          onClick={() => setCurrentPage('projects')}
                          className="w-full text-sidebar-text/25 hover:text-sidebar-text/45 transition-colors"
                          style={{ padding: '5px 0', fontSize: 10 }}
                        >
                          +{rootProjects.length - 8} más...
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" style={{ minHeight: 20 }} />
      </nav>

      {/* Bottom section */}
      <div
        className="titlebar-no-drag"
        style={{
          padding: collapsed ? '12px 12px 20px' : '12px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="space-y-0.5">
          {bottomNav.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => setCurrentPage(item.id)}
            />
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: collapsed ? '8px 0' : '10px 0' }} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`
            group relative w-full flex items-center transition-all duration-200
            text-sidebar-text/40 hover:text-sidebar-text/80
            ${collapsed ? 'justify-center mx-auto rounded-xl' : 'rounded-lg'}
          `}
          style={collapsed ? { width: 44, height: 44 } : { gap: 14, paddingTop: 8, paddingBottom: 8 }}
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {collapsed && (
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-200" />
          )}
          <span className="relative z-10 flex items-center" style={collapsed ? {} : { gap: 14 }}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {theme === 'light' ? <Moon size={19} strokeWidth={1.6} /> : <Sun size={19} strokeWidth={1.6} />}
            </motion.div>
            {!collapsed && (
              <span className="font-medium" style={{ fontSize: 14 }}>
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </span>
            )}
          </span>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`
            group relative w-full flex items-center transition-all duration-200
            text-sidebar-text/40 hover:text-sidebar-text/80
            ${collapsed ? 'justify-center mx-auto rounded-xl' : 'rounded-lg'}
          `}
          style={collapsed ? { width: 44, height: 44 } : { gap: 14, paddingTop: 8, paddingBottom: 8 }}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed && (
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-200" />
          )}
          <span className="relative z-10 flex items-center" style={collapsed ? {} : { gap: 14 }}>
            {collapsed ? <PanelLeft size={19} strokeWidth={1.6} /> : <PanelLeftClose size={19} strokeWidth={1.6} />}
            {!collapsed && (
              <span className="font-medium" style={{ fontSize: 14 }}>Colapsar</span>
            )}
          </span>
        </button>
      </div>
    </motion.aside>
  )
}
