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

  const bgClass = phase === 'work' ? 'pomo-bg-gradient--work' : phase === 'break' ? 'pomo-bg-gradient--break' : 'pomo-bg-gradient--long-break'

  return (
    <div className="pomo-page">
      <div className={`pomo-bg-gradient ${bgClass}`} />

      <div className="pomo-container" style={{ padding: '24px 32px' }}>
        <FadeIn>
          <div className="pomo-header">
            <h1 className="pomo-title">Pomodoro</h1>
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
              className="pomo-settings"
            >
              <div className="glass pomo-settings-inner">
                <p className="section-label">Configuración</p>
                <div className="pomo-settings-grid">
                  <div>
                    <label className="pomo-settings-label">Trabajo (min)</label>
                    <input
                      type="number"
                      value={workMinutes}
                      onChange={(e) => updateSetting('pomodoro_work_minutes', parseInt(e.target.value) || 25)}
                      className="glass pomo-settings-input"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="pomo-settings-label">Descanso (min)</label>
                    <input
                      type="number"
                      value={breakMinutes}
                      onChange={(e) => updateSetting('pomodoro_break_minutes', parseInt(e.target.value) || 5)}
                      className="glass pomo-settings-input"
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <label className="pomo-settings-label">Descanso largo (min)</label>
                    <input
                      type="number"
                      value={longBreakMinutes}
                      onChange={(e) => updateSetting('pomodoro_long_break_minutes', parseInt(e.target.value) || 15)}
                      className="glass pomo-settings-input"
                      min={1}
                      max={60}
                    />
                  </div>
                </div>
                <div className="pomo-settings-row">
                  <label className="pomo-settings-checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoStart}
                      onChange={(e) => updateSetting('pomodoro_auto_start', e.target.checked)}
                      className="pomo-settings-checkbox"
                    />
                    <span className="pomo-settings-checkbox-text">Auto-iniciar siguiente</span>
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

        <div className="pomo-main">
          {/* Timer section */}
          <FadeIn delay={0.05} className="pomo-timer-section">
            <PomodoroTimer size={280} />

            {/* Controls */}
            <div className="pomo-controls">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="pomo-control-btn glass"
                title="Reiniciar"
              >
                <RotateCcw size={16} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={isRunning ? pause : start}
                className="pomo-play-btn"
              >
                {isRunning ? <Pause size={22} /> : <Play size={22} className="pomo-play-icon-offset" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={skip}
                className="pomo-control-btn glass"
                title="Saltar"
              >
                <SkipForward size={16} />
              </motion.button>
            </div>

            {/* Task selector */}
            <div className="pomo-task-picker">
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="pomo-task-btn glass"
              >
                <div className="pomo-task-dot" style={{
                  background: selectedTask ? 'var(--color-primary)' : 'var(--color-border-strong)',
                }} />
                <span className={`pomo-task-label ${selectedTask ? 'pomo-task-label--active' : 'pomo-task-label--empty'}`}>
                  {selectedTask?.title ?? 'Vincular tarea...'}
                </span>
                <ChevronDown size={13} className="pomo-task-chevron" />
              </button>

              <AnimatePresence>
                {showTaskPicker && (
                  <>
                    <div className="pomo-task-overlay" onClick={() => setShowTaskPicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="pomo-task-dropdown glass-strong"
                    >
                      <div className="pomo-task-search-wrap">
                        <div className="pomo-task-search-inner">
                          <Search size={13} className="pomo-task-search-icon" />
                          <input
                            value={taskSearch}
                            onChange={(e) => setTaskSearch(e.target.value)}
                            placeholder="Buscar tarea..."
                            className="pomo-task-search-input"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="pomo-task-list">
                        <button
                          onClick={() => {
                            selectTask(null)
                            setShowTaskPicker(false)
                          }}
                          className="pomo-task-option pomo-task-option--none"
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
                            className={`pomo-task-option pomo-task-option--item ${
                              selectedTask?.id === task.id ? 'pomo-task-option--selected' : ''
                            }`}
                          >
                            <span className={`pomo-task-option-dot bg-priority-${task.priority}`} />
                            <span className="pomo-task-option-name">{task.title}</span>
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
          <FadeIn delay={0.15} className="pomo-stats-section">
            <PomodoroStats />
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
