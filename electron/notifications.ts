import { Notification, BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'

interface UpcomingItem {
  id: string
  title: string
  type: 'task' | 'event'
  datetime: string
}

let checkInterval: ReturnType<typeof setInterval> | null = null
const notifiedIds = new Set<string>()

function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

function isNotificationsEnabled(db: Database.Database): boolean {
  const val = getSetting(db, 'notifications_enabled')
  return val !== '0' // enabled by default
}

function isDoNotDisturb(db: Database.Database): boolean {
  const val = getSetting(db, 'notifications_dnd')
  return val === '1'
}

function sendNativeNotification(title: string, body: string) {
  if (!Notification.isSupported()) return
  const notif = new Notification({ title, body, silent: false })
  notif.show()
}

function sendToRenderer(type: string, data: Record<string, unknown>) {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send('nido:notification', { type, ...data })
  }
}

export function sendToast(message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') {
  sendToRenderer('toast', { message, variant })
}

function checkUpcoming(db: Database.Database) {
  if (!isNotificationsEnabled(db) || isDoNotDisturb(db)) return

  const now = new Date()
  const in15min = new Date(now.getTime() + 15 * 60 * 1000)
  const in1hour = new Date(now.getTime() + 60 * 60 * 1000)
  const nowStr = now.toISOString()
  const in15Str = in15min.toISOString()
  const in1hStr = in1hour.toISOString()

  // Events starting in the next 15 minutes
  const upcomingEvents = db.prepare(
    `SELECT id, title, start_datetime as datetime FROM events
     WHERE start_datetime > ? AND start_datetime <= ?
     ORDER BY start_datetime ASC`
  ).all(nowStr, in15Str) as UpcomingItem[]

  for (const event of upcomingEvents) {
    const key = `event-${event.id}-15min`
    if (!notifiedIds.has(key)) {
      notifiedIds.add(key)
      const mins = Math.round((new Date(event.datetime).getTime() - now.getTime()) / 60000)
      sendNativeNotification(
        'Evento próximo',
        `"${event.title}" comienza en ${mins} minutos`
      )
      sendToRenderer('event_upcoming', { id: event.id, title: event.title, minutes: mins })
    }
  }

  // Tasks with deadlines in the next hour
  const upcomingTasks = db.prepare(
    `SELECT id, title, due_date, due_time FROM tasks
     WHERE is_completed = 0 AND due_date IS NOT NULL AND due_time IS NOT NULL
     ORDER BY due_date ASC, due_time ASC`
  ).all() as Array<{ id: string; title: string; due_date: string; due_time: string }>

  for (const task of upcomingTasks) {
    const taskDt = new Date(`${task.due_date}T${task.due_time}`)
    if (taskDt > now && taskDt <= in1hour) {
      const key = `task-${task.id}-1h`
      if (!notifiedIds.has(key)) {
        notifiedIds.add(key)
        const mins = Math.round((taskDt.getTime() - now.getTime()) / 60000)
        sendNativeNotification(
          'Deadline próximo',
          `"${task.title}" vence en ${mins} minutos`
        )
        sendToRenderer('task_deadline', { id: task.id, title: task.title, minutes: mins })
      }
    }
  }

  // Overdue tasks (check once per session)
  const overdueTasks = db.prepare(
    `SELECT id, title, due_date FROM tasks
     WHERE is_completed = 0 AND due_date IS NOT NULL AND due_date < date('now')
     ORDER BY due_date ASC LIMIT 5`
  ).all() as Array<{ id: string; title: string; due_date: string }>

  for (const task of overdueTasks) {
    const key = `overdue-${task.id}-${task.due_date}`
    if (!notifiedIds.has(key)) {
      notifiedIds.add(key)
      sendNativeNotification(
        'Tarea vencida',
        `"${task.title}" tenía deadline el ${task.due_date}`
      )
      sendToRenderer('task_overdue', { id: task.id, title: task.title, dueDate: task.due_date })
    }
  }

  // Clean old notification IDs (keep last 500)
  if (notifiedIds.size > 500) {
    const arr = Array.from(notifiedIds)
    arr.splice(0, arr.length - 200)
    notifiedIds.clear()
    arr.forEach((id) => notifiedIds.add(id))
  }
}

export function startNotificationChecker(db: Database.Database) {
  stopNotificationChecker()
  // Check every 60 seconds
  checkInterval = setInterval(() => checkUpcoming(db), 60 * 1000)
  // Also check immediately
  checkUpcoming(db)
}

export function stopNotificationChecker() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

export function sendPomodoroNotification(phase: 'work' | 'break' | 'long_break') {
  const messages: Record<string, { title: string; body: string }> = {
    work: { title: 'Pomodoro completado', body: 'Buen trabajo. Hora de un descanso.' },
    break: { title: 'Descanso terminado', body: 'Volvé al trabajo.' },
    long_break: { title: 'Descanso largo terminado', body: 'Listo para otra ronda.' },
  }
  const msg = messages[phase]
  if (msg) {
    sendNativeNotification(msg.title, msg.body)
    sendToRenderer('pomodoro', { phase, ...msg })
  }
}
