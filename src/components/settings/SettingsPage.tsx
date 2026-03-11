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
      <div className="flex items-center gap-2.5 mb-5">
        <Repeat size={16} className="text-primary" />
        <h2 className="text-[14px] font-display font-semibold text-text-primary">Tareas recurrentes</h2>
      </div>

      {loading ? (
        <p className="text-[13px] text-text-muted">Cargando...</p>
      ) : recurringTasks.length === 0 ? (
        <p className="text-[13px] text-text-muted">No hay tareas recurrentes activas.</p>
      ) : (
        <div className="space-y-2">
          {recurringTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-surface-alt/25 hover:bg-surface-alt/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">{task.title}</p>
                <p className="text-[11px] text-primary mt-0.5">
                  {recurrenceLabel(task.recurrence_rule)}
                  {task.recurrence_end && (
                    <span className="text-text-muted"> — hasta {new Date(task.recurrence_end).toLocaleDateString('es-AR')}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => toggleRecurrence(task)}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/40 transition-colors opacity-0 group-hover:opacity-100"
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
    <div className="max-w-2xl mx-auto overflow-y-auto h-full" style={{ padding: '24px 32px' }}>
      <FadeIn>
        <h1 className="text-xl font-display font-bold text-text-primary mb-6 tracking-tight">Configuración</h1>
      </FadeIn>

      {/* Appearance */}
      <FadeIn delay={0.05}>
        <section className="glass rounded-2xl mb-5" style={{ padding: '20px 24px' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Palette size={15} className="text-primary" />
            <h2 className="text-[14px] font-display font-semibold text-text-primary">Apariencia</h2>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[13.5px] font-medium text-text-primary">Tema</p>
              <p className="text-[12px] text-text-muted mt-0.5">
                {theme === 'light' ? 'Modo claro activo' : 'Modo oscuro activo'}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Sun size={14} className="text-text-muted" />
              <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              <Moon size={14} className="text-text-muted" />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Pomodoro */}
      <FadeIn delay={0.1}>
        <section className="glass rounded-2xl mb-5" style={{ padding: '20px 24px' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Timer size={15} className="text-primary" />
            <h2 className="text-[14px] font-display font-semibold text-text-primary">Pomodoro</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-text-muted block mb-1.5">Trabajo (min)</label>
              <input
                type="number"
                value={workMinutes}
                onChange={(e) => updateSetting('pomodoro_work_minutes', parseInt(e.target.value) || 25)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-surface-alt/30 text-text-primary outline-none font-mono border border-border focus:border-primary transition-colors"
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="text-[12px] text-text-muted block mb-1.5">Descanso (min)</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => updateSetting('pomodoro_break_minutes', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-surface-alt/30 text-text-primary outline-none font-mono border border-border focus:border-primary transition-colors"
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="text-[12px] text-text-muted block mb-1.5">Descanso largo (min)</label>
              <input
                type="number"
                value={longBreakMinutes}
                onChange={(e) => updateSetting('pomodoro_long_break_minutes', parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-surface-alt/30 text-text-primary outline-none font-mono border border-border focus:border-primary transition-colors"
                min={1}
                max={60}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-text-primary">Auto-iniciar siguiente</p>
                <p className="text-[12px] text-text-muted mt-0.5">Continuar automáticamente después de cada fase</p>
              </div>
              <Toggle
                checked={autoStart}
                onChange={(v) => updateSetting('pomodoro_auto_start', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-text-primary">Sonido</p>
                <p className="text-[12px] text-text-muted mt-0.5">Notificación sonora al completar sesión</p>
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
        <section className="glass rounded-2xl mb-5" style={{ padding: '20px 24px' }}>
          <TagManager />
        </section>
      </FadeIn>

      {/* Recurring Tasks */}
      <FadeIn delay={0.2}>
        <section className="glass rounded-2xl mb-5" style={{ padding: '20px 24px' }}>
          <RecurrenceManager />
        </section>
      </FadeIn>
    </div>
  )
}
