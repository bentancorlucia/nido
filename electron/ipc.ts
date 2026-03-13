import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import {
  connectGoogle, disconnectGoogle, isGoogleConnected,
  getGoogleCalendars, setSelectedCalendarIds, getSelectedCalendarIds,
  syncNow, startAutoSync, stopAutoSync,
} from './google-calendar'
import { exportData, importData, resetData } from './export-import'
import { sendPomodoroNotification, startNotificationChecker } from './notifications'

const ALLOWED_TABLES = [
  'projects', 'kanban_columns', 'tasks', 'tags', 'task_tags',
  'events', 'post_its', 'pomodoro_sessions', 'dashboard_layout',
  'settings', 'templates',
  'semesters', 'subjects', 'subject_projects', 'class_instances',
  'grade_categories', 'grades',
]

function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not allowed`)
  }
}

export function registerIpcHandlers(db: Database.Database) {
  // --- Database CRUD ---
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  })

  ipcMain.handle('db:run', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    const result = params ? stmt.run(...params) : stmt.run()
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('db:get', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    return params ? stmt.get(...params) : stmt.get()
  })

  ipcMain.handle('db:getAll', (_event, table: string) => {
    validateTable(table)
    return db.prepare(`SELECT * FROM ${table}`).all()
  })

  ipcMain.handle('db:insert', (_event, table: string, data: Record<string, unknown>) => {
    validateTable(table)
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = db.prepare(sql).run(...Object.values(data))
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('db:update', (_event, table: string, id: string, data: Record<string, unknown>) => {
    validateTable(table)
    const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const sql = `UPDATE ${table} SET ${sets} WHERE id = ?`
    const result = db.prepare(sql).run(...Object.values(data), id)
    return { changes: result.changes }
  })

  ipcMain.handle('db:delete', (_event, table: string, id: string) => {
    validateTable(table)
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
  })

  // --- Settings shortcuts ---
  ipcMain.handle('settings:get', (_event, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  })

  // --- Google Calendar ---
  ipcMain.handle('google:connect', async () => {
    const result = await connectGoogle(db)
    if (result) startAutoSync(db)
    return result
  })

  ipcMain.handle('google:disconnect', async () => {
    stopAutoSync()
    await disconnectGoogle(db)
  })

  ipcMain.handle('google:isConnected', () => {
    return isGoogleConnected(db)
  })

  ipcMain.handle('google:getCalendars', async () => {
    return getGoogleCalendars(db)
  })

  ipcMain.handle('google:setCalendars', (_event, ids: string[]) => {
    setSelectedCalendarIds(db, ids)
  })

  ipcMain.handle('google:getSelectedCalendars', () => {
    return getSelectedCalendarIds(db)
  })

  ipcMain.handle('google:syncNow', async () => {
    return syncNow(db)
  })

  ipcMain.handle('google:getLastSync', () => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('google_last_sync') as { value: string } | undefined
    return row?.value ?? null
  })

  // --- Export / Import ---
  ipcMain.handle('data:export', async () => {
    return exportData(db)
  })

  ipcMain.handle('data:import', async () => {
    return importData(db)
  })

  ipcMain.handle('data:reset', async () => {
    return resetData(db)
  })

  // --- Notifications ---
  ipcMain.handle('notifications:pomodoro', (_event, phase: 'work' | 'break' | 'long_break') => {
    sendPomodoroNotification(phase)
  })

  // Start background services
  startNotificationChecker(db)
  if (isGoogleConnected(db)) {
    startAutoSync(db)
  }
}
