import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Moon, Sun, Palette, Timer, Repeat, Trash2,
  Calendar, Download, Upload, RotateCcw, Bell, BellOff,
  RefreshCw, Unplug, CloudOff, Database,
} from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { useNotificationStore } from '../../stores/useNotificationStore'
import { TagManager } from './TagManager'
import { Toggle } from '../ui/Toggle'
import { FadeIn } from '../../lib/animations'
import { recurrenceLabel } from '../../lib/recurrence'
import { dbQuery, dbUpdate, getSetting, setSetting } from '../../lib/ipc'
import type { Task, GoogleCalendarInfo } from '../../types'

// ─── Recurrence Manager ───
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

// ─── Google Calendar Section ───
function GoogleCalendarSection() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const { addToast } = useNotificationStore()

  useEffect(() => {
    loadState()
  }, [])

  async function loadState() {
    const isConn = await window.nido.google.isConnected()
    setConnected(isConn)
    setLastSync(await window.nido.google.getLastSync())

    const cid = await getSetting('google_client_id')
    const csec = await getSetting('google_client_secret')
    if (cid) setClientId(cid)
    if (csec) setClientSecret(csec)

    if (isConn) {
      try {
        const cals = await window.nido.google.getCalendars()
        setCalendars(cals)
        const sel = await window.nido.google.getSelectedCalendars()
        setSelectedIds(sel)
      } catch {
        // Tokens may be expired
      }
    }
  }

  async function saveCredentials() {
    await setSetting('google_client_id', clientId.trim())
    await setSetting('google_client_secret', clientSecret.trim())
    addToast('Credenciales guardadas', 'success')
  }

  async function handleConnect() {
    if (!clientId.trim() || !clientSecret.trim()) {
      addToast('Ingresá Client ID y Client Secret primero', 'warning')
      return
    }
    await saveCredentials()
    setLoading(true)
    try {
      await window.nido.google.connect()
      setConnected(true)
      addToast('Conectado a Google Calendar', 'success')
      const cals = await window.nido.google.getCalendars()
      setCalendars(cals)
    } catch (err) {
      addToast(`Error: ${(err as Error).message}`, 'error')
    }
    setLoading(false)
  }

  async function handleDisconnect() {
    await window.nido.google.disconnect()
    setConnected(false)
    setCalendars([])
    setSelectedIds([])
    setLastSync(null)
    addToast('Desconectado de Google Calendar', 'info')
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await window.nido.google.syncNow()
      setLastSync(new Date().toISOString())
      addToast(`Sincronizado: ${result.imported} importados, ${result.exported} exportados`, 'success')
      if (result.errors.length > 0) {
        addToast(`${result.errors.length} error(es) durante sync`, 'warning')
      }
    } catch (err) {
      addToast(`Error de sincronización: ${(err as Error).message}`, 'error')
    }
    setSyncing(false)
  }

  async function toggleCalendar(calId: string) {
    const next = selectedIds.includes(calId)
      ? selectedIds.filter((id) => id !== calId)
      : [...selectedIds, calId]
    setSelectedIds(next)
    await window.nido.google.setCalendars(next)
  }

  return (
    <div>
      <div className="settings-section-header">
        <Calendar size={15} className="settings-section-icon" />
        <h2 className="settings-section-title">Google Calendar</h2>
      </div>

      {/* Connection status */}
      <div className="settings-google-status">
        <span className={`settings-google-dot ${connected ? 'settings-google-dot--connected' : 'settings-google-dot--disconnected'}`} />
        <span className="settings-google-status-text">
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {lastSync && (
        <p className="settings-google-last-sync">
          Última sincronización: {new Date(lastSync).toLocaleString('es-AR')}
        </p>
      )}

      {/* Credentials */}
      {!connected && (
        <div className="settings-google-creds">
          <label className="settings-google-creds-label">Client ID (Google Cloud Console)</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="settings-google-creds-input"
            placeholder="xxxx.apps.googleusercontent.com"
          />
          <label className="settings-google-creds-label">Client Secret</label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="settings-google-creds-input"
            placeholder="GOCSPX-..."
          />
        </div>
      )}

      {/* Actions */}
      <div className="settings-google-actions">
        {!connected ? (
          <button
            className="settings-google-btn settings-google-btn--connect"
            onClick={handleConnect}
            disabled={loading}
          >
            <Calendar size={14} />
            {loading ? 'Conectando...' : 'Conectar Google Calendar'}
          </button>
        ) : (
          <>
            <button
              className="settings-google-btn settings-google-btn--sync"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
            <button
              className="settings-google-btn settings-google-btn--disconnect"
              onClick={handleDisconnect}
            >
              <Unplug size={14} />
              Desconectar
            </button>
          </>
        )}
      </div>

      {/* Calendar list */}
      {connected && calendars.length > 0 && (
        <div className="settings-calendars-list">
          {calendars.map((cal) => (
            <label key={cal.id} className="settings-calendar-item">
              <input
                type="checkbox"
                checked={selectedIds.includes(cal.id)}
                onChange={() => toggleCalendar(cal.id)}
              />
              <span className="settings-calendar-color" style={{ backgroundColor: cal.backgroundColor }} />
              <span className="settings-calendar-name">{cal.summary}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notifications Section ───
function NotificationsSection() {
  const [enabled, setEnabled] = useState(true)
  const [dnd, setDnd] = useState(false)

  useEffect(() => {
    loadState()
  }, [])

  async function loadState() {
    const en = await getSetting('notifications_enabled')
    setEnabled(en !== '0')
    const d = await getSetting('notifications_dnd')
    setDnd(d === '1')
  }

  async function toggleEnabled(val: boolean) {
    setEnabled(val)
    await setSetting('notifications_enabled', val ? '1' : '0')
  }

  async function toggleDnd(val: boolean) {
    setDnd(val)
    await setSetting('notifications_dnd', val ? '1' : '0')
  }

  return (
    <div>
      <div className="settings-section-header">
        <Bell size={15} className="settings-section-icon" />
        <h2 className="settings-section-title">Notificaciones</h2>
      </div>

      <div className="settings-notif-options">
        <div className="settings-row">
          <div>
            <p className="settings-row-label">Notificaciones activas</p>
            <p className="settings-row-desc">Alertas de deadlines, eventos próximos y pomodoro</p>
          </div>
          <Toggle checked={enabled} onChange={toggleEnabled} />
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-row-label">No molestar</p>
            <p className="settings-row-desc">Silenciar todas las notificaciones temporalmente</p>
          </div>
          <div className="settings-row-control">
            <BellOff size={14} className="settings-row-control-icon" />
            <Toggle checked={dnd} onChange={toggleDnd} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Data Section ───
function DataSection() {
  const { addToast } = useNotificationStore()
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    const result = await window.nido.data.export()
    if (result.success) {
      addToast('Datos exportados correctamente', 'success')
    } else if (result.error !== 'Cancelado') {
      addToast(`Error: ${result.error}`, 'error')
    }
    setBusy(false)
  }

  async function handleImport() {
    setBusy(true)
    const result = await window.nido.data.import()
    if (result.success) {
      addToast('Datos importados. Reiniciá la app para ver los cambios.', 'success')
    } else if (result.error !== 'Cancelado') {
      addToast(`Error: ${result.error}`, 'error')
    }
    setBusy(false)
  }

  async function handleReset() {
    setBusy(true)
    const result = await window.nido.data.reset()
    if (result.success) {
      addToast('Todos los datos fueron eliminados', 'warning')
    } else if (result.error !== 'Cancelado') {
      addToast(`Error: ${result.error}`, 'error')
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="settings-section-header">
        <Database size={15} className="settings-section-icon" />
        <h2 className="settings-section-title">Datos</h2>
      </div>

      <div className="settings-data-actions">
        <button className="settings-data-btn settings-data-btn--export" onClick={handleExport} disabled={busy}>
          <Download size={18} className="settings-data-btn-icon" />
          <div className="settings-data-btn-text">
            <span className="settings-data-btn-label">Exportar datos</span>
            <span className="settings-data-btn-desc">Guardar toda la información como archivo JSON</span>
          </div>
        </button>

        <button className="settings-data-btn settings-data-btn--import" onClick={handleImport} disabled={busy}>
          <Upload size={18} className="settings-data-btn-icon" />
          <div className="settings-data-btn-text">
            <span className="settings-data-btn-label">Importar datos</span>
            <span className="settings-data-btn-desc">Restaurar desde un archivo de backup</span>
          </div>
        </button>

        <button className="settings-data-btn settings-data-btn--reset" onClick={handleReset} disabled={busy}>
          <RotateCcw size={18} className="settings-data-btn-icon" />
          <div className="settings-data-btn-text">
            <span className="settings-data-btn-label">Resetear datos</span>
            <span className="settings-data-btn-desc">Eliminar toda la información permanentemente</span>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Main Settings Page ───
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

      {/* Notifications */}
      <FadeIn delay={0.15}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <NotificationsSection />
        </section>
      </FadeIn>

      {/* Google Calendar */}
      <FadeIn delay={0.2}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <GoogleCalendarSection />
        </section>
      </FadeIn>

      {/* Tags */}
      <FadeIn delay={0.25}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <TagManager />
        </section>
      </FadeIn>

      {/* Recurring Tasks */}
      <FadeIn delay={0.3}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <RecurrenceManager />
        </section>
      </FadeIn>

      {/* Data Management */}
      <FadeIn delay={0.35}>
        <section className="glass settings-section" style={{ padding: '20px 24px' }}>
          <DataSection />
        </section>
      </FadeIn>
    </div>
  )
}
