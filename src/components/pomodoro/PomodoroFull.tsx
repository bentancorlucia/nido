import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipForward, RotateCcw,
  ChevronDown, Search, Volume2, VolumeX,
} from 'lucide-react'
import { FadeIn } from '../../lib/animations'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { dbQuery } from '../../lib/ipc'
import { PomodoroTimer } from './PomodoroTimer'
import { PomodoroStats } from './PomodoroStats'
import type { Task } from '../../types'

export function PomodoroFull() {
  const store = usePomodoroStore()
  const {
    isRunning, phase, selectedTask, soundEnabled,
    workMinutes, breakMinutes, longBreakMinutes, autoStart,
    start, pause, reset, skip, tick,
    loadSettings, loadStats, loadWeeklyData,
    selectTask, updateSetting,
  } = store

  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadSettings()
    loadStats()
    loadWeeklyData()
  }, [])

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, tick])

  // Load tasks for picker
  useEffect(() => {
    if (showTaskPicker) {
      loadAvailableTasks()
    }
  }, [showTaskPicker])

  async function loadAvailableTasks() {
    const tasks = await dbQuery<Task>(
      'SELECT * FROM tasks WHERE is_archived = 0 AND is_completed = 0 AND parent_task_id IS NULL ORDER BY updated_at DESC LIMIT 50'
    )
    setAvailableTasks(tasks)
  }

  const filteredTasks = taskSearch
    ? availableTasks.filter((t) => t.title.toLowerCase().includes(taskSearch.toLowerCase()))
    : availableTasks

  const phaseColors = {
    work: 'from-primary/10 to-transparent',
    break: 'from-accent/10 to-transparent',
    long_break: 'from-accent/15 to-transparent',
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className={`absolute inset-0 bg-gradient-radial ${phaseColors[phase]} opacity-60 pointer-events-none`} />

      <div className="relative max-w-3xl mx-auto" style={{ padding: '24px 32px' }}>
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-display font-bold text-text-primary tracking-tight">Pomodoro</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="icon-button"
            >
              <motion.div animate={{ rotate: showSettings ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </button>
          </div>
        </FadeIn>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass rounded-2xl p-4 space-y-3">
                <p className="section-label">Configuración</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-text-muted block mb-1">Trabajo (min)</label>
                    <input
                      type="number"
                      value={workMinutes}
                      onChange={(e) => updateSetting('pomodoro_work_minutes', parseInt(e.target.value) || 25)}
                      className="w-full px-3 py-1.5 text-[13px] rounded-lg glass text-text-primary outline-none font-mono"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted block mb-1">Descanso (min)</label>
                    <input
                      type="number"
                      value={breakMinutes}
                      onChange={(e) => updateSetting('pomodoro_break_minutes', parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-1.5 text-[13px] rounded-lg glass text-text-primary outline-none font-mono"
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted block mb-1">Descanso largo (min)</label>
                    <input
                      type="number"
                      value={longBreakMinutes}
                      onChange={(e) => updateSetting('pomodoro_long_break_minutes', parseInt(e.target.value) || 15)}
                      className="w-full px-3 py-1.5 text-[13px] rounded-lg glass text-text-primary outline-none font-mono"
                      min={1}
                      max={60}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoStart}
                      onChange={(e) => updateSetting('pomodoro_auto_start', e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[12px] text-text-secondary">Auto-iniciar siguiente</span>
                  </label>
                  <button
                    onClick={() => updateSetting('pomodoro_sound', !soundEnabled)}
                    className="icon-button"
                    title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-8 items-start">
          {/* Timer section */}
          <FadeIn delay={0.05} className="flex-1 flex flex-col items-center">
            <PomodoroTimer size={280} />

            {/* Controls */}
            <div className="flex items-center gap-3 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                title="Reiniciar"
              >
                <RotateCcw size={16} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={isRunning ? pause : start}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center shadow-lg shadow-primary/20"
              >
                {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={skip}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                title="Saltar"
              >
                <SkipForward size={16} />
              </motion.button>
            </div>

            {/* Task selector */}
            <div className="mt-6 w-full max-w-[280px] relative">
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="w-full px-4 py-2.5 rounded-xl glass text-left flex items-center gap-2 hover:shadow-sm transition-shadow"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: selectedTask ? 'var(--color-primary)' : 'var(--color-border-strong)',
                }} />
                <span className={`text-[13px] truncate ${selectedTask ? 'text-text-primary' : 'text-text-muted'}`}>
                  {selectedTask?.title ?? 'Vincular tarea...'}
                </span>
                <ChevronDown size={13} className="text-text-muted ml-auto flex-shrink-0" />
              </button>

              <AnimatePresence>
                {showTaskPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTaskPicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="absolute top-full mt-1 left-0 right-0 z-50 glass-strong rounded-xl shadow-lg overflow-hidden"
                    >
                      <div className="p-2 border-b border-border/50">
                        <div className="flex items-center gap-2 px-2">
                          <Search size={13} className="text-text-muted" />
                          <input
                            value={taskSearch}
                            onChange={(e) => setTaskSearch(e.target.value)}
                            placeholder="Buscar tarea..."
                            className="flex-1 text-[12px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/50"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        <button
                          onClick={() => {
                            selectTask(null)
                            setShowTaskPicker(false)
                          }}
                          className="w-full px-3 py-2 text-[12px] text-left text-text-muted hover:bg-surface-alt/60 transition-colors"
                        >
                          Sin tarea
                        </button>
                        {filteredTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              selectTask(task)
                              setShowTaskPicker(false)
                              setTaskSearch('')
                            }}
                            className={`w-full px-3 py-2 text-[12px] text-left transition-colors flex items-center gap-2 ${
                              selectedTask?.id === task.id
                                ? 'bg-primary-light/60 text-primary font-medium'
                                : 'text-text-primary hover:bg-surface-alt/60'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-priority-${task.priority}`} />
                            <span className="truncate">{task.title}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* Stats section */}
          <FadeIn delay={0.15} className="w-[280px] flex-shrink-0">
            <PomodoroStats />
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
