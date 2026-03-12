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
        className={`sidebar-nav-item-collapsed${isActive ? ' is-active' : ''}`}
        style={{ width: 44, height: 44 }}
        title={item.label}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-fill"
            className="sidebar-nav-active-fill nav-active-indicator"
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        )}
        {!isActive && (
          <div className="sidebar-nav-hover-fill" />
        )}
        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} className="sidebar-nav-icon-z" />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`sidebar-nav-item-expanded${isActive ? ' is-active' : ''}`}
      style={{ padding: '10px 0', gap: 14 }}
    >
      {isActive && (
        <motion.div
          layoutId="nav-accent-bar"
          className="sidebar-nav-accent-bar"
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
        className="sidebar-nav-icon-shrink"
      />
      <span style={{ fontSize: 14 }} className={isActive ? 'sidebar-nav-label-active' : 'sidebar-nav-label-inactive'}>
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
      className="sidebar-root"
    >
      {/* Spacer for macOS traffic lights */}
      <div className="titlebar-drag sidebar-titlebar-spacer" style={{ height: 48 }} />

      {/* Main navigation */}
      <nav
        className="sidebar-nav titlebar-no-drag"
        style={{ padding: collapsed ? '0 12px' : '0 24px' }}
      >
        <div className="sidebar-nav-list">
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
              className="sidebar-projects-header"
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
                  className="sidebar-projects-collapse"
                >
                  {rootProjects.length === 0 ? (
                    <p className="sidebar-projects-empty" style={{ padding: '12px 0', fontSize: 12 }}>
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
                          className="sidebar-project-btn"
                          style={{ gap: 10, padding: '7px 0', fontSize: 12.5 }}
                        >
                          <Folder size={13} style={{ color: project.color ?? undefined }} />
                          <span className="sidebar-project-name">{project.name}</span>
                        </button>
                      ))}
                      {rootProjects.length > 8 && (
                        <button
                          onClick={() => setCurrentPage('projects')}
                          className="sidebar-projects-more"
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
        <div className="sidebar-spacer" style={{ minHeight: 20 }} />
      </nav>

      {/* Bottom section */}
      <div
        className="titlebar-no-drag"
        style={{
          padding: collapsed ? '12px 12px 20px' : '12px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="sidebar-nav-list">
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
          className={`sidebar-bottom-btn${collapsed ? ' is-collapsed' : ''}`}
          style={collapsed ? { width: 44, height: 44 } : { gap: 14, paddingTop: 8, paddingBottom: 8 }}
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {collapsed && (
            <div className="sidebar-bottom-hover-fill" />
          )}
          <span className="sidebar-bottom-inner" style={collapsed ? {} : { gap: 14 }}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {theme === 'light' ? <Moon size={19} strokeWidth={1.6} /> : <Sun size={19} strokeWidth={1.6} />}
            </motion.div>
            {!collapsed && (
              <span className="sidebar-bottom-label" style={{ fontSize: 14 }}>
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </span>
            )}
          </span>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`sidebar-bottom-btn${collapsed ? ' is-collapsed' : ''}`}
          style={collapsed ? { width: 44, height: 44 } : { gap: 14, paddingTop: 8, paddingBottom: 8 }}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed && (
            <div className="sidebar-bottom-hover-fill" />
          )}
          <span className="sidebar-bottom-inner" style={collapsed ? {} : { gap: 14 }}>
            {collapsed ? <PanelLeft size={19} strokeWidth={1.6} /> : <PanelLeftClose size={19} strokeWidth={1.6} />}
            {!collapsed && (
              <span className="sidebar-bottom-label" style={{ fontSize: 14 }}>Colapsar</span>
            )}
          </span>
        </button>
      </div>
    </motion.aside>
  )
}
