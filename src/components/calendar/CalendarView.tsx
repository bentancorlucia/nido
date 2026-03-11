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
import { FadeIn } from '../../lib/animations'
import type { CalendarEvent } from '../../types'

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

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [defaultHour, setDefaultHour] = useState<number | null>(null)

  useEffect(() => {
    loadEvents()
    loadProjects()
    loadTasks()
  }, [loadEvents, loadProjects, loadTasks])

  const handleClickEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setDefaultDate(null)
    setDefaultHour(null)
    setModalOpen(true)
  }, [])

  const handleClickDay = useCallback((date: Date) => {
    setEditingEvent(null)
    setDefaultDate(date)
    setDefaultHour(null)
    setModalOpen(true)
  }, [])

  const handleClickSlot = useCallback((date: Date, hour: number) => {
    setEditingEvent(null)
    setDefaultDate(date)
    setDefaultHour(hour)
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
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with tabs */}
      <FadeIn>
        <div className="flex items-center justify-between" style={{ padding: '20px 28px 10px' }}>
          {/* View tabs */}
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon
              const active = view === tab.id
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: active ? 1 : 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(tab.id)}
                  className={`
                    relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium
                    transition-colors duration-150 cursor-pointer
                    ${active
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                    }
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="calendar-tab-bg"
                      className="absolute inset-0 bg-primary-light/50 rounded-lg"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
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
              setEditingEvent(null)
              setDefaultDate(new Date())
              setDefaultHour(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-gradient-to-r from-primary to-primary-hover
                       text-text-on-primary text-[13px] font-medium
                       shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
          className="flex-1 min-h-0"
        >
          {view === 'month' && (
            <MonthView onClickEvent={handleClickEvent} onClickDay={handleClickDay} />
          )}
          {view === 'week' && (
            <WeekView onClickEvent={handleClickEvent} onClickSlot={handleClickSlot} />
          )}
          {view === 'year' && (
            <YearView onClickMonth={handleClickMonth} />
          )}
          {view === 'semester' && (
            <SemesterView onClickDay={handleClickDay} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Event modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        editingEvent={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
      />
    </div>
  )
}
