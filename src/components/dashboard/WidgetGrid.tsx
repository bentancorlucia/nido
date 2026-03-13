import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  StickyNote,
  Calendar,
  MoreHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react'
import { useDashboardStore, WIDGET_LABELS } from '../../stores/useDashboardStore'
import type { WidgetType } from '../../stores/useDashboardStore'
import type { DashboardWidget } from '../../types'
import { TodayWidget } from './TodayWidget'
import { DeadlinesWidget } from './DeadlinesWidget'
import { UpcomingEventsWidget } from './UpcomingEventsWidget'
import { PostItMiniBoard } from './PostItMiniBoard'
import { MiniCalendarWidget } from './MiniCalendarWidget'

const WIDGET_ICONS: Record<WidgetType, typeof CalendarCheck> = {
  today: CalendarCheck,
  deadlines: CalendarClock,
  upcoming_events: CalendarRange,
  postits: StickyNote,
  mini_calendar: Calendar,
}

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  today: TodayWidget,
  deadlines: DeadlinesWidget,
  upcoming_events: UpcomingEventsWidget,
  postits: PostItMiniBoard,
  mini_calendar: MiniCalendarWidget,
}

const BENTO_CLASSES: Record<WidgetType, string> = {
  today: 'bento-today',
  deadlines: 'bento-deadlines',
  upcoming_events: 'bento-upcevents',
  postits: 'bento-postits',
  mini_calendar: 'bento-calendar',
}

const ICON_CLASSES: Record<WidgetType, string> = {
  today: 'today',
  deadlines: 'deadlines',
  upcoming_events: 'upcevents',
  postits: 'postits',
  mini_calendar: 'calendar',
}

function WidgetCard({ widget, index }: { widget: DashboardWidget; index: number }) {
  const { toggleVisibility } = useDashboardStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const type = widget.widget_type as WidgetType
  const Icon = WIDGET_ICONS[type] ?? CalendarCheck
  const Component = WIDGET_COMPONENTS[type]
  const label = WIDGET_LABELS[type] ?? widget.widget_type
  const bentoClass = BENTO_CLASSES[type] ?? ''
  const iconClass = ICON_CLASSES[type] ?? 'today'

  // Close menu on outside click (document-level, avoids position:fixed inside transforms)
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const handleHide = useCallback(() => {
    setShowMenu(false)
    toggleVisibility(widget.id)
  }, [toggleVisibility, widget.id])

  if (!Component) return null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -12 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        delay: index * 0.05,
      }}
      className={`widget-card ${bentoClass}`}
    >
      <div className="widgetgrid-card-inner">
        {/* Widget header */}
        <div className="widget-header">
          <div className="widget-header-left">
            <div className={`widget-icon-wrap ${iconClass}`}>
              <Icon size={15} />
            </div>
            <span className="widget-title">{label}</span>
          </div>

          <div className="widgetgrid-menu-zone" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="widgetgrid-menu-btn"
              style={{ opacity: showMenu ? 1 : undefined }}
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="widgetgrid-menu-dropdown"
                >
                  <button
                    onClick={handleHide}
                    className="widgetgrid-menu-item"
                  >
                    <EyeOff size={13} /> Ocultar widget
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Widget body */}
        <div className="widget-body">
          <Component />
        </div>
      </div>
    </motion.div>
  )
}

export function WidgetGrid() {
  const { widgets, loading, loadWidgets, resetLayout, toggleVisibility } = useDashboardStore()
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    loadWidgets()
  }, [])

  const visibleWidgets = widgets.filter((w) => w.is_visible === 1)
  const hiddenWidgets = widgets.filter((w) => w.is_visible === 0)

  if (loading) {
    return (
      <div className="dashboard-bento animate-pulse">
        {[
          'bento-today', 'bento-deadlines', 'bento-upcevents',
          'bento-postits', 'bento-calendar',
        ].map((cls, i) => (
          <div
            key={i}
            className={`${cls} widgetgrid-skeleton`}
            style={{ minHeight: 200 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="widgetgrid-outer">
      <div className="dashboard-bento">
        <AnimatePresence mode="popLayout">
          {visibleWidgets.map((widget, i) => (
            <WidgetCard key={widget.id} widget={widget} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {hiddenWidgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden-widgets-panel"
          style={{ marginLeft: 4, marginRight: 4 }}
        >
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="widgetgrid-hidden-toggle"
          >
            <Eye size={13} />
            {hiddenWidgets.length} widget{hiddenWidgets.length > 1 ? 's' : ''} oculto{hiddenWidgets.length > 1 ? 's' : ''}
          </button>

          <AnimatePresence>
            {showHidden && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="widgetgrid-hidden-chips"
              >
                {hiddenWidgets.map((w) => {
                  const type = w.widget_type as WidgetType
                  const Icon = WIDGET_ICONS[type] ?? CalendarCheck
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleVisibility(w.id)}
                      className="hidden-widget-chip"
                    >
                      <Icon size={13} />
                      {WIDGET_LABELS[type]}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="widgetgrid-reset-row">
        <button
          onClick={resetLayout}
          className="widgetgrid-reset-btn"
        >
          <RotateCcw size={11} /> Restaurar layout
        </button>
      </div>
    </div>
  )
}
