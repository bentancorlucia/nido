import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CalendarDays, CalendarRange, Grid3x3, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useCalendarStore, type CalendarViewType } from '../../stores/useCalendarStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { YearView } from './YearView'
import { SemesterView } from './SemesterView'
import { EventModal } from './EventModal'
import { QuickEventPopover } from './QuickEventPopover'
import { FadeIn } from '../../lib/animations'
import type { CalendarEvent, EventType } from '../../types'

const VIEW_TABS: { id: CalendarViewType; label: string; icon: typeof Calendar }[] = [
  { id: 'month', label: 'Mes', icon: CalendarDays },
  { id: 'week', label: 'Semana', icon: Calendar },
  { id: 'semester', label: 'Semestre', icon: CalendarRange },
  { id: 'year', label: 'Año', icon: Grid3x3 },
]

export function CalendarPage() {
  const { view, setView, loadEvents, setCurrentDate } = useCalendarStore()
  const { loadProjects } = useProjectStore()
  const { loadTasks } = useTaskStore()

  // Full modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [defaultHour, setDefaultHour] = useState<number | null>(null)
  const [defaultEndHour, setDefaultEndHour] = useState<number | null>(null)
  const [defaultTitle, setDefaultTitle] = useState<string | undefined>(undefined)
  const [defaultEventType, setDefaultEventType] = useState<EventType | undefined>(undefined)

  // Quick popover state
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [popoverDate, setPopoverDate] = useState<Date | null>(null)
  const [popoverHour, setPopoverHour] = useState<number | null>(null)
  const [popoverEndHour, setPopoverEndHour] = useState<number | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    loadEvents()
    loadProjects()
    loadTasks()
  }, [loadEvents, loadProjects, loadTasks])

  const handleClickEvent = useCallback((event: CalendarEvent) => {
    setPopoverOpen(false)
    setEditingEvent(event)
    setDefaultDate(null)
    setDefaultHour(null)
    setDefaultEndHour(null)
    setDefaultTitle(undefined)
    setDefaultEventType(undefined)
    setModalOpen(true)
  }, [])

  // Month/Semester day click → open full modal directly
  const handleClickDay = useCallback((date: Date) => {
    setPopoverOpen(false)
    setEditingEvent(null)
    setDefaultDate(date)
    setDefaultHour(null)
    setDefaultEndHour(null)
    setDefaultTitle(undefined)
    setDefaultEventType(undefined)
    setModalOpen(true)
  }, [])

  // Week view single slot click → open quick popover
  const handleSlotClick = useCallback((date: Date, hour: number, anchorPos: { top: number; left: number }) => {
    setPopoverDate(date)
    setPopoverHour(hour)
    setPopoverEndHour(hour + 1)
    setPopoverAnchor(anchorPos)
    setPopoverOpen(true)
  }, [])

  // Week view drag-create → open quick popover with range
  const handleDragCreateSlot = useCallback((date: Date, startHour: number, endHour: number) => {
    setPopoverDate(date)
    setPopoverHour(startHour)
    setPopoverEndHour(endHour)
    // Center the popover roughly
    setPopoverAnchor({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 })
    setPopoverOpen(true)
  }, [])

  // Fallback for legacy onClickSlot (opens full modal)
  const handleClickSlot = useCallback((date: Date, hour: number) => {
    setPopoverOpen(false)
    setEditingEvent(null)
    setDefaultDate(date)
    setDefaultHour(hour)
    setDefaultEndHour(null)
    setDefaultTitle(undefined)
    setDefaultEventType(undefined)
    setModalOpen(true)
  }, [])

  const handleClickMonth = useCallback((date: Date) => {
    setCurrentDate(date)
    setView('month')
  }, [setCurrentDate, setView])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditingEvent(null)
    setDefaultDate(null)
    setDefaultHour(null)
    setDefaultEndHour(null)
    setDefaultTitle(undefined)
    setDefaultEventType(undefined)
  }, [])

  const handleClosePopover = useCallback(() => {
    setPopoverOpen(false)
  }, [])

  // Open full modal from popover (transfer context)
  const handlePopoverToModal = useCallback(() => {
    setPopoverOpen(false)
    setEditingEvent(null)
    setDefaultDate(popoverDate)
    setDefaultHour(popoverHour)
    setDefaultEndHour(popoverEndHour)
    setDefaultTitle(undefined)
    setDefaultEventType(undefined)
    setModalOpen(true)
  }, [popoverDate, popoverHour, popoverEndHour])

  return (
    <div className="cal-root">
      {/* Top bar with tabs */}
      <FadeIn>
        <div className="cal-topbar" style={{ padding: '20px 28px 10px' }}>
          {/* View tabs */}
          <div className="cal-tabs glass">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon
              const active = view === tab.id
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: active ? 1 : 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(tab.id)}
                  className={`cal-tab ${active ? 'cal-tab-active' : 'cal-tab-inactive'}`}
                >
                  {active && (
                    <motion.div
                      layoutId="calendar-tab-bg"
                      className="cal-tab-bg"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="cal-tab-label">
                    <Icon size={15} />
                    {tab.label}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* New event button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPopoverOpen(false)
              setEditingEvent(null)
              setDefaultDate(new Date())
              setDefaultHour(null)
              setDefaultEndHour(null)
              setDefaultTitle(undefined)
              setDefaultEventType(undefined)
              setModalOpen(true)
            }}
            className="cal-new-event-btn"
          >
            <Plus size={16} />
            Nuevo evento
          </motion.button>
        </div>
      </FadeIn>

      {/* View content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="cal-view-content"
        >
          {view === 'month' && (
            <MonthView onClickEvent={handleClickEvent} onClickDay={handleClickDay} />
          )}
          {view === 'week' && (
            <WeekView
              onClickEvent={handleClickEvent}
              onClickSlot={handleClickSlot}
              onSlotClick={handleSlotClick}
              onDragCreateSlot={handleDragCreateSlot}
            />
          )}
          {view === 'year' && (
            <YearView onClickMonth={handleClickMonth} />
          )}
          {view === 'semester' && (
            <SemesterView onClickDay={handleClickDay} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick event popover */}
      <QuickEventPopover
        isOpen={popoverOpen}
        onClose={handleClosePopover}
        onOpenFullModal={handlePopoverToModal}
        date={popoverDate}
        hour={popoverHour}
        endHour={popoverEndHour}
        anchorPosition={popoverAnchor}
      />

      {/* Full event modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        editingEvent={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        defaultEndHour={defaultEndHour}
        defaultTitle={defaultTitle}
        defaultEventType={defaultEventType}
      />
    </div>
  )
}
