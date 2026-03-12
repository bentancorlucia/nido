import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Palette, Timer, Repeat, Trash2, Pause, Play } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { TagManager } from './TagManager'
import { Toggle } from '../ui/Toggle'
import { FadeIn } from '../../lib/animations'
import { recurrenceLabel } from '../../lib/recurrence'
import { dbQuery, dbUpdate } from '../../lib/ipc'
import type { Task } from '../../types'

function RecurrenceManager() {
  const [recurringTasks, setRecurringTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecurringTasks()
  }, [])

  async function loadRecurringTasks() {
    setLoading(true)
    const tasks = await dbQuery<Task>(
      'SELECT * FROM tasks WHERE is_recurring = 1 AND is_archived = 0 AND is_completed = 0 ORDER BY title ASC'
    )
    setRecurringTasks(tasks)
    setLoading(false)
  }

  async function toggleRecurrence(task: Task) {
    await dbUpdate('tasks', task.id, {
      is_recurring: 0,
      recurrence_rule: null,
      recurrence_end: null,
      updated_at: new Date().toISOString(),
    })
    await loadRecurringTasks()
  }

  return (
    <div>
      <div className="recurrence-header">
        <Repeat size={16} className="recurrence-icon" />
        <h2 className="recurrence-title">Tareas recurrentes</h2>
      </div>

      {loading ? (
        <p className="recurrence-msg">Cargando...</p>
      ) : recurringTasks.length === 0 ? (
        <p className="recurrence-msg">No hay tareas recurrentes activas.</p>
      ) : (
        <div className="recurrence-list">
          {recurringTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="recurrence-item"
            >
              <div className="recurrence-item-info">
                <p className="recurrence-item-title">{task.title}</p>
                <p className="recurrence-item-rule">
                  {recurrenceLabel(task.recurrence_rule)}
                  {task.recurrence_end && (
                    <span className="recurrence-item-end"> — hasta {new Date(task.recurrence_end).toLocaleDateString('es-AR')}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => toggleRecurrence(task)}
                className="recurrence-delete-btn"
                title="Desactivar recurrencia"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { theme, toggleTheme } = useUIStore()
  const {
    workMinutes, breakMinutes, longBreakMinutes,
    autoStart, soundEnabled, updateSetting, loadSettings,
  } = usePomodoroStore()

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <div className="settings-page" style={{ padding: '24px 32px' }}>
      <FadeIn>
        <h1 className="settings-title">Configuración</h1>
      </FadeIn>

      {/* Appearance */}
      <FadeIn delay={0.05}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <div className="settings-section-header">
            <Palette size={15} className="settings-section-icon" />
            <h2 className="settings-section-title">Apariencia</h2>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-label">Tema</p>
              <p className="settings-row-desc">
                {theme === 'light' ? 'Modo claro activo' : 'Modo oscuro activo'}
              </p>
            </div>
            <div className="settings-row-control">
              <Sun size={14} className="settings-row-control-icon" />
              <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              <Moon size={14} className="settings-row-control-icon" />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Pomodoro */}
      <FadeIn delay={0.1}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <div className="settings-section-header">
            <Timer size={15} className="settings-section-icon" />
            <h2 className="settings-section-title">Pomodoro</h2>
          </div>

          <div className="settings-pomo-grid">
            <div>
              <label className="settings-pomo-label">Trabajo (min)</label>
              <input
                type="number"
                value={workMinutes}
                onChange={(e) => updateSetting('pomodoro_work_minutes', parseInt(e.target.value) || 25)}
                className="settings-pomo-input"
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="settings-pomo-label">Descanso (min)</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => updateSetting('pomodoro_break_minutes', parseInt(e.target.value) || 5)}
                className="settings-pomo-input"
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="settings-pomo-label">Descanso largo (min)</label>
              <input
                type="number"
                value={longBreakMinutes}
                onChange={(e) => updateSetting('pomodoro_long_break_minutes', parseInt(e.target.value) || 15)}
                className="settings-pomo-input"
                min={1}
                max={60}
              />
            </div>
          </div>

          <div className="settings-toggles">
            <div className="settings-row">
              <div>
                <p className="settings-row-label">Auto-iniciar siguiente</p>
                <p className="settings-row-desc">Continuar automáticamente después de cada fase</p>
              </div>
              <Toggle
                checked={autoStart}
                onChange={(v) => updateSetting('pomodoro_auto_start', v)}
              />
            </div>
            <div className="settings-row">
              <div>
                <p className="settings-row-label">Sonido</p>
                <p className="settings-row-desc">Notificación sonora al completar sesión</p>
              </div>
              <Toggle
                checked={soundEnabled}
                onChange={(v) => updateSetting('pomodoro_sound', v)}
              />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Tags */}
      <FadeIn delay={0.15}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <TagManager />
        </section>
      </FadeIn>

      {/* Recurring Tasks */}
      <FadeIn delay={0.2}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <RecurrenceManager />
        </section>
      </FadeIn>
    </div>
  )
}
